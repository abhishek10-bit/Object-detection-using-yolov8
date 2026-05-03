# VisionAI - Neural Object Classification System

![VisionAI](https://img.shields.io/badge/Status-Active-brightgreen) ![YOLOv8](https://img.shields.io/badge/Model-YOLOv8n-blue) ![React](https://img.shields.io/badge/Frontend-React%20Vite-61DAFB) ![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)

A futuristic, full-stack object detection web application powered by Ultralytics YOLOv8, FastAPI, and React. The system features a stunning dark-mode glassmorphism interface, real-time live webcam inference, and an innovative "Neural Memory" pipeline for continuous learning.

---

## ✨ Features

- **Real-Time Object Detection**: Upload any image or drag-and-drop to get instant bounding boxes and confidence scores.
- **Live Webcam Inference**: Toggle to the "Live Feed" mode to stream your webcam directly through the neural network pipeline.
- **Neural Memory (Active Learning)**: If the AI fails to detect an object, you can manually label it. The system computes a mathematical fingerprint (MD5 Hash) of the image pixels. If you ever upload that exact image again, the system instantly recalls your custom label without needing to run the heavy AI model.
- **Futuristic UI/UX**: Built natively in React with Tailwind CSS, featuring smooth animations, custom glowing bounding boxes, and a cyberpunk-inspired aesthetic.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite), Tailwind CSS, Vanilla CSS for custom animations.
- **Backend**: FastAPI, Uvicorn, Python.
- **Computer Vision**: Ultralytics YOLOv8 (PyTorch), OpenCV, Numpy.

---

## 🚀 Setup & Installation

Ensure you have **Python 3.10+** and **Node.js** installed on your system.

### 1. Clone the Repository
```bash
git clone https://github.com/abhishek10-bit/Object-detection-using-yolov8.git
cd sonic-perigee
```

### 2. Quick Start (Windows Only)
The absolute easiest way to start the app is to double-click the **`launch_vision_ai.bat`** file located in the root directory. 
This script will automatically install missing NPM packages, start the FastAPI backend, and launch the React frontend.

### 3. Manual Installation

**Backend Setup:**
```bash
cd yolov8_project
pip install -r requirements.txt
```

**Frontend Setup:**
```bash
cd client
npm install
```

---

## 💻 How to Run (Manually)

You need to run both the frontend and backend servers simultaneously in two separate terminal windows.

**Terminal 1: Start the Neural Backend**
```bash
cd yolov8_project
python backend/main.py
```
*The backend will run on `http://localhost:8000`*

**Terminal 2: Start the React Frontend**
```bash
cd client
npm run dev
```
*The frontend will run on `http://localhost:5173`*

---

## 🧠 How It Works (Under the Hood)

### The Detection Pipeline
1. **Frontend**: When an image is uploaded or a webcam frame is captured, the React client converts it to a blob and sends it via an HTTP `POST` request to the FastAPI `/detect` endpoint.
2. **Memory Check**: The backend calculates an MD5 hash of the raw image bytes. It checks `yolov8_project/user_dataset/database.json`. If a match is found, it returns the saved user label instantly, bypassing the neural net.
3. **Inference**: If no memory match is found, the image bytes are decoded into an OpenCV `numpy` array and fed into the `yolov8n.pt` model. 
4. **Response**: The model predicts bounding boxes `[x1, y1, x2, y2]`, class IDs, and confidence scores. FastAPI packages this into a clean JSON response.
5. **Rendering**: React parses the JSON, calculates relative percentages for responsive design, and draws glowing CSS bounding boxes over the image.

### The Memory Pipeline
If YOLO detects 0 objects, the `/detect` endpoint returns a special `needs_label` status. The React UI intercepts this and displays an input box asking the user to identify the object.
When the user submits a label, it is sent to the `/learn` endpoint, where the image hash and label are permanently saved to `database.json`.

---

## 📁 Project Structure

```text
sonic-perigee/
├── launch_vision_ai.bat         # Master launch script
├── README.md                    # Project documentation
│
├── client/                      # React Vite Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── DetectionApp.jsx # Main Interface Logic
│   │   │   └── DetectionApp.css # Custom Animations & Layouts
│   │   └── App.jsx              # React Router
│   ├── package.json
│   └── tailwind.config.js
│
└── yolov8_project/              # FastAPI Backend & AI Models
    ├── backend/
    │   └── main.py              # API Endpoints & YOLO inference
    ├── models/                  # Optional: Folder for custom trained weights
    ├── user_dataset/            # Saved images and database.json for memory
    ├── requirements.txt         # Python dependencies
    └── yolov8n.pt               # Pre-trained YOLOv8 Nano weights
```
