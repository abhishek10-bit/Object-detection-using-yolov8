import streamlit as st
import requests
import cv2
import numpy as np
from PIL import Image
import os
import torch

# Fix for PyTorch 2.6+ where weights_only=True is the default in torch.load
_original_load = torch.load
def _patched_load(*args, **kwargs):
    kwargs.setdefault('weights_only', False)
    return _original_load(*args, **kwargs)
torch.load = _patched_load

from ultralytics import YOLO

# Set page config
st.set_page_config(page_title="YOLOv8 Detection App", layout="wide")

st.title("YOLOv8 Object Detection 🚀")
st.write("Upload an image to detect objects (Circles/Rectangles) using our custom YOLOv8 model, or use the live webcam.")

# Sidebar for options
st.sidebar.title("Settings")
detection_mode = st.sidebar.radio("Detection Mode", ["Upload Image (FastAPI Backend)", "Live Webcam (Local Inference)"])

# Backend API URL (Ensure your FastAPI server is running!)
API_URL = "http://localhost:8000/detect"

def load_local_model():
    # Helper to load model for local inference (like webcam)
    # Using the highly accurate pre-trained YOLOv8n model for the best experience.
    return YOLO('yolov8n.pt')

if detection_mode == "Upload Image (FastAPI Backend)":
    st.header("Image Detection")
    st.write("This mode sends the image to the FastAPI backend (`backend/main.py`) and displays the JSON response.")
    
    uploaded_file = st.file_uploader("Choose an image...", type=["jpg", "jpeg", "png"])
    
    if uploaded_file is not None:
        # Display uploaded image
        image = Image.open(uploaded_file)
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.image(image, caption='Uploaded Image', use_column_width=True)
        
        with col2:
            if st.button("Detect Objects via API"):
                with st.spinner("Processing..."):
                    # Reset file pointer
                    uploaded_file.seek(0)
                    files = {"file": (uploaded_file.name, uploaded_file, uploaded_file.type)}
                    
                    try:
                        response = requests.post(API_URL, files=files)
                        
                        if response.status_code == 200:
                            results = response.json()
                            detections = results.get("objects", [])
                            
                            if len(detections) > 0:
                                st.success(f"Found {len(detections)} objects!")
                            else:
                                st.info("No objects detected.")
                                
                            # Display JSON results
                            st.json(results)
                        else:
                            st.error(f"Error from API: {response.text}")
                    except requests.exceptions.ConnectionError:
                        st.error("Could not connect to backend. Is the FastAPI server running on localhost:8000?")

elif detection_mode == "Live Webcam (Local Inference)":
    st.header("Live Webcam Detection")
    st.write("This uses your local webcam and processes frames directly using the Ultralytics Python API.")
    
    run = st.checkbox("Start Webcam")
    FRAME_WINDOW = st.image([])
    
    # Load model once
    model = load_local_model()
    
    if run:
        cap = cv2.VideoCapture(0)
        while run:
            ret, frame = cap.read()
            if not ret:
                st.error("Failed to capture frame from webcam. Please check permissions.")
                break
                
            # OpenCV uses BGR, Streamlit expects RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Run inference
            results = model(frame_rgb, verbose=False)
            
            # Plot results (draws bounding boxes directly on the image array)
            annotated_frame = results[0].plot()
            
            # Display annotated frame
            FRAME_WINDOW.image(annotated_frame)
            
        cap.release()
    else:
        st.write("Click 'Start Webcam' to begin real-time detection.")
