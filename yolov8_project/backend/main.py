from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import uvicorn
import cv2
import numpy as np
import os
import torch
import hashlib
import json

# Fix for PyTorch 2.6+
_original_load = torch.load
def _patched_load(*args, **kwargs):
    kwargs.setdefault('weights_only', False)
    return _original_load(*args, **kwargs)
torch.load = _patched_load

app = FastAPI(title="VisionAI Object Detection & Active Learning")

# Allow React app to talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
user_dataset_dir = os.path.join(project_root, 'user_dataset')
images_dir = os.path.join(user_dataset_dir, 'images')
db_path = os.path.join(user_dataset_dir, 'database.json')

os.makedirs(images_dir, exist_ok=True)

def load_db():
    if os.path.exists(db_path):
        with open(db_path, 'r') as f:
            return json.load(f)
    return {}

def save_db(db):
    with open(db_path, 'w') as f:
        json.dump(db, f, indent=4)

model = YOLO('yolov8n.pt')

def get_image_hash(img_bytes):
    return hashlib.md5(img_bytes).hexdigest()

@app.post("/detect")
async def detect_objects(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Not an image.")

    try:
        contents = await file.read()
        img_hash = get_image_hash(contents)
        
        # 1. Check Memory Database
        db = load_db()
        if img_hash in db:
            return JSONResponse(content={
                "status": "success",
                "source": "memory",
                "image_size": {"width": 0, "height": 0},
                "objects": [{
                    "class": db[img_hash]["label"],
                    "confidence": 1.0,
                    "bbox": {"xmin": 0, "ymin": 0, "xmax": 0, "ymax": 0}
                }]
            })

        # 2. YOLO Prediction
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image.")

        results = model(img)
        detections = []
        height, width, _ = img.shape

        for result in results:
            boxes = result.boxes
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                confidence = float(box.conf[0])
                class_id = int(box.cls[0])
                class_name = model.names[class_id]
                detections.append({
                    "class": class_name,
                    "confidence": round(confidence, 4),
                    "bbox": {"xmin": x1, "ymin": y1, "xmax": x2, "ymax": y2}
                })

        if len(detections) == 0:
            return JSONResponse(content={
                "status": "needs_label",
                "hash": img_hash,
                "objects": []
            })

        return JSONResponse(content={
            "status": "success",
            "source": "yolo",
            "image_size": {"width": width, "height": height},
            "objects": detections
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/learn")
async def learn_object(file: UploadFile = File(...), label: str = Form(...)):
    try:
        contents = await file.read()
        img_hash = get_image_hash(contents)
        
        img_filename = f"{img_hash}.jpg"
        img_path = os.path.join(images_dir, img_filename)
        with open(img_path, "wb") as f:
            f.write(contents)
            
        db = load_db()
        db[img_hash] = {"label": label, "image_file": img_filename}
        save_db(db)
        
        return JSONResponse(content={"status": "success"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
