# YOLOv8 Object Detection: End-to-End Portfolio Project

This project demonstrates a complete end-to-end object detection system using YOLOv8. It serves as a portfolio project, showcasing data preparation, model training, a FastAPI backend, and a Streamlit frontend.

## Project Structure

```text
yolov8_project/
├── data/                   # Dataset directory (images and labels in YOLO format)
│   ├── dataset.yaml        # Configuration for training
│   └── README.md           # Instructions on dataset formatting
├── models/                 # Saved trained model weights (.pt files)
├── scripts/                # Standalone scripts
│   ├── train.py            # Script to train and evaluate the YOLOv8 model
│   └── webcam_inference.py # Real-time inference using OpenCV
├── backend/                # FastAPI application
│   └── main.py             # Inference API
├── frontend/               # Streamlit application
│   └── app.py              # User Interface
└── requirements.txt        # Master requirements file
```

## Setup Instructions

1. **Environment Setup**
   It's highly recommended to use a virtual environment.
   ```bash
   # Create a virtual environment
   python -m venv venv
   
   # Activate it
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

2. **Dataset Preparation**
   Instead of downloading a dataset manually, I have provided a script that generates a perfect synthetic dataset (detecting circles and rectangles) so you can run the pipeline immediately.
   ```bash
   python scripts/generate_synthetic_data.py
   ```
   *This creates 100 images with random shapes and auto-generates the YOLO annotations in the `data/` folder.*

3. **Model Training**
   Run the training script to train the model on the synthetic dataset.
   ```bash
   python scripts/train.py
   ```
   *The best model will be saved automatically in `models/synthetic_shapes_run/weights/best.pt`.*

4. **Real-time Local Inference**
   Test your trained model using your local webcam:
   ```bash
   python scripts/webcam_inference.py
   ```

## Running the Applications

**1. Start the FastAPI Backend**
The backend provides a `/detect` endpoint for object detection.
```bash
python backend/main.py
```
- Test it interactively via the Swagger UI: `http://localhost:8000/docs`

**2. Start the Streamlit Frontend**
The frontend provides a user interface to upload images and view webcam streams.
```bash
streamlit run frontend/app.py
```

## Extra Tips
- **Accuracy**: To improve accuracy, collect more varied data, train for more epochs (e.g., `epochs=100` in `train.py`), or use a larger base model like `yolov8s.pt` instead of `yolov8n.pt`.
- **Deployment**: 
  - The FastAPI backend can be containerized with Docker and deployed to services like Render, Heroku, AWS Elastic Beanstalk, or Google Cloud Run.
  - The Streamlit frontend can be deployed easily and for free on Streamlit Community Cloud (connected directly to your GitHub repo).
