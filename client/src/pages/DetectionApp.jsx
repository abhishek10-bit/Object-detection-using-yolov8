import React, { useState, useRef, useEffect } from 'react';
import './DetectionApp.css';

export default function DetectionApp() {
  const [mode, setMode] = useState('upload'); // 'upload' or 'webcam'
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [results, setResults] = useState(null);
  const [customLabel, setCustomLabel] = useState('');
  const [logMsg, setLogMsg] = useState('System Standby...');
  const [logType, setLogType] = useState(''); // 'alert', 'ok', ''
  
  // Webcam Specific State & Refs
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLiveScanning, setIsLiveScanning] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Cleanup webcam if component unmounts or mode changes
    return () => stopCamera();
  }, [mode]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setIsCameraActive(true);
      setPreview(true); // Treat as preview active to hide dropzone text
      logMessage("SYS: Neural optics initialized.", "");
    } catch (err) {
      logMessage("ERR: Camera access denied.", "alert");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    setIsCameraActive(false);
    setIsLiveScanning(false);
    setPreview(null);
    setResults(null);
    logMessage("SYS: Optics disconnected.", "");
  };

  const toggleLiveScan = () => {
    if (isLiveScanning) {
      clearInterval(scanIntervalRef.current);
      setIsLiveScanning(false);
      logMessage("SYS: Live scan paused.", "");
    } else {
      setIsLiveScanning(true);
      logMessage("SYS: Live tracking active.", "ok");
      // Detect every 1 second
      scanIntervalRef.current = setInterval(captureAndDetectFrame, 1000);
    }
  };

  const captureAndDetectFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('file', blob, 'webcam.jpg');

      try {
        const res = await fetch('http://localhost:8000/detect', { method: 'POST', body: formData });
        const data = await res.json();
        
        if (data.status !== 'needs_label') {
          setResults(data);
        } else {
          // If live scan finds nothing, we don't annoy with memory module, just clear results
          setResults({ objects: [], image_size: { width: canvas.width, height: canvas.height } });
        }
      } catch (err) {
        console.error(err);
      }
    }, 'image/jpeg', 0.8);
  };

  // Upload Handlers
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const processFile = (file) => {
    if (!file.type.startsWith('image/')) {
      logMessage("ERR: Invalid file format. Image required.", "alert");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      setImage(file);
      setShowMemory(false);
      setResults(null);
      setCustomLabel(file.name.split('.')[0].toUpperCase());
      logMessage("SYS: Image loaded into memory. Ready.", "");
    };
    reader.readAsDataURL(file);
  };

  const resetSystem = (e) => {
    if (e) e.stopPropagation();
    if (mode === 'webcam') {
      stopCamera();
    } else {
      setPreview(null);
      setImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
    setShowMemory(false);
    setResults(null);
    setIsScanning(false);
    logMessage("SYS: System Standby...", "");
  };

  const detectObjects = async () => {
    if (!image) return;
    setIsScanning(true);
    setShowMemory(false);
    logMessage("SYS: Running neural inference...", "");

    const formData = new FormData();
    formData.append('file', image);

    try {
      const res = await fetch('http://localhost:8000/detect', { method: 'POST', body: formData });
      const data = await res.json();
      setIsScanning(false);

      if (data.status === 'needs_label') {
        logMessage("WARN: Object not found in current dataset.", "alert");
        setShowMemory(true);
      } else {
        setResults(data);
        const objNames = data.objects.map(o => o.class).join(', ');
        logMessage(`SYS: Entities found: ${objNames}`, "ok");
      }
    } catch (err) {
      setIsScanning(false);
      logMessage("ERR: Backend neural link failed.", "alert");
    }
  };

  const saveToMemory = async () => {
    const name = customLabel.trim();
    if (!name) return;
    const formData = new FormData();
    formData.append('file', image);
    formData.append('label', name);

    try {
      await fetch('http://localhost:8000/learn', { method: 'POST', body: formData });
      logMessage(`SYS: Entity [${name}] successfully saved to memory bank.`, "ok");
      setTimeout(() => resetSystem(), 2000);
    } catch (err) {
      logMessage("ERR: Failed to write to memory bank.", "alert");
    }
  };

  const logMessage = (msg, type) => {
    setLogMsg(msg);
    setLogType(type);
  };

  const getBoxStyle = (box, imgSize) => {
    if (!imgSize || !imgSize.width) return {};
    const left = (box.xmin / imgSize.width) * 100;
    const top = (box.ymin / imgSize.height) * 100;
    const width = ((box.xmax - box.xmin) / imgSize.width) * 100;
    const height = ((box.ymax - box.ymin) / imgSize.height) * 100;
    return {
      left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`,
      position: 'absolute', border: '2px solid var(--accent-cyan)',
      backgroundColor: 'rgba(0, 255, 170, 0.15)', boxShadow: '0 0 15px rgba(0, 255, 170, 0.4)',
      pointerEvents: 'none',
    };
  };

  return (
    <div className="vision-page-container">
      <div className="vision-container">
        <div className="header">
          <h1>YOLOv8 <span style={{fontWeight: 300}}>Core</span></h1>
          <p>Neural Image Classification System</p>
          <div className="mode-toggle">
            <button className={`mode-btn ${mode === 'upload' ? 'active' : ''}`} onClick={() => { setMode('upload'); resetSystem(); }}>
              <i className="fa-solid fa-cloud-arrow-up"></i> Upload
            </button>
            <button className={`mode-btn ${mode === 'webcam' ? 'active' : ''}`} onClick={() => { setMode('webcam'); resetSystem(); }}>
              <i className="fa-solid fa-camera"></i> Live Feed
            </button>
          </div>
        </div>

        <div 
          className={`drop-zone ${isScanning ? 'scanning' : ''}`}
          onClick={() => !preview && mode === 'upload' && fileInputRef.current?.click()}
          onDragOver={(e) => { if(mode==='upload') { e.preventDefault(); e.currentTarget.classList.add('dragover'); } }}
          onDragLeave={(e) => { e.currentTarget.classList.remove('dragover'); }}
          onDrop={(e) => {
            if(mode==='upload') {
              e.preventDefault();
              e.currentTarget.classList.remove('dragover');
              if (e.dataTransfer.files.length) processFile(e.dataTransfer.files[0]);
            }
          }}
        >
          {/* Default Upload State */}
          {!preview && mode === 'upload' && (
            <div className="drop-content">
              <i className="fa-solid fa-expand"></i>
              <span>Drag & Drop Visual Data</span>
            </div>
          )}

          {/* Default Webcam State */}
          {!isCameraActive && mode === 'webcam' && (
            <div className="drop-content" onClick={startCamera}>
              <i className="fa-solid fa-power-off"></i>
              <span>Click to Initialize Optics</span>
            </div>
          )}

          {/* Image OR Video Display */}
          {preview && (
            <div className={`image-wrapper ${isScanning ? 'scanning' : ''}`} style={{ display: 'flex' }}>
              <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', maxHeight: '100%' }}>
                
                {mode === 'upload' ? (
                  <img src={preview} className="image-preview" alt="Vision Data" />
                ) : (
                  <video ref={videoRef} autoPlay playsInline className="image-preview" style={{ transform: 'scaleX(-1)' }} />
                )}
                
                {/* Bounding Boxes */}
                {(!isScanning || isLiveScanning) && results?.objects?.map((obj, idx) => {
                  if(obj.bbox.xmax === 0) return null; 
                  return (
                    <div key={idx} style={getBoxStyle(obj.bbox, results.image_size)}>
                      <span style={{
                        position: 'absolute', top: '-25px', left: '-2px', background: 'var(--accent-cyan)', color: '#000',
                        fontWeight: 'bold', padding: '2px 8px', fontSize: '12px', borderRadius: '4px 4px 0 0', whiteSpace: 'nowrap'
                      }}>
                        {obj.class.toUpperCase()} {Math.round(obj.confidence * 100)}%
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Only show animated line if doing single scan */}
              {isScanning && !isLiveScanning && <div className="scanner-line"></div>}
            </div>
          )}
          
          {/* Remove Button */}
          {preview && (
            <div className="remove-img" onClick={resetSystem}>
              <i className="fa-solid fa-xmark"></i>
            </div>
          )}
        </div>
        
        <input type="file" id="file-input" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileChange} />
        
        {/* Hidden canvas for extracting webcam frames */}
        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

        {mode === 'upload' ? (
          <button className="btn-detect" onClick={detectObjects} disabled={isScanning || !preview}>
            <i className="fa-solid fa-crosshairs"></i> 
            <span>{isScanning ? 'YOLOv8 Processing...' : (results ? 'Scan Complete' : 'Initialize Detection')}</span>
          </button>
        ) : (
          <button className="btn-detect" onClick={toggleLiveScan} disabled={!isCameraActive}>
            <i className={`fa-solid ${isLiveScanning ? 'fa-stop' : 'fa-satellite-dish'}`}></i> 
            <span>{isLiveScanning ? 'Pause Tracking' : 'Engage Live Tracking'}</span>
          </button>
        )}

        {/* Memory Module is only available in Upload Mode (live scan goes too fast to ask for labels) */}
        {mode === 'upload' && (
          <div className={`memory-module ${showMemory ? 'active' : ''}`}>
            <label><i className="fa-solid fa-triangle-exclamation"></i> Entity Unidentified. Add to Memory:</label>
            <div className="input-group">
              <input type="text" placeholder="Assign entity name..." value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} />
              <i className="fa-solid fa-tag"></i>
            </div>
            <button className="btn-save" onClick={saveToMemory}>
              <i className="fa-solid fa-microchip"></i> Save to Memory Bank
            </button>
          </div>
        )}

        <div className={`status-log ${logType === 'alert' ? 'status-alert' : (logType === 'ok' ? 'status-ok' : '')}`}>
          {logMsg}
        </div>
      </div>
    </div>
  );
}
