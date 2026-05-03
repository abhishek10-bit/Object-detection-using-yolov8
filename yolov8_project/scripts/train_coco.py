import os
from ultralytics import YOLO
import torch

# Fix for PyTorch 2.6+ where weights_only=True is the default in torch.load
_original_load = torch.load
def _patched_load(*args, **kwargs):
    kwargs.setdefault('weights_only', False)
    return _original_load(*args, **kwargs)
torch.load = _patched_load

def main():
    # 1. Load a pretrained YOLOv8 model (using the 'nano' version for speed)
    print("Loading pretrained YOLOv8n model...")
    model = YOLO('yolov8n.pt')
    
    # 2. Train the model
    # By specifying data='coco8.yaml', Ultralytics will automatically download 
    # the coco8 dataset (a tiny subset of COCO for quick testing) if it doesn't exist.
    # To train on the full COCO dataset, change 'coco8.yaml' to 'coco.yaml'.
    data_yaml = 'coco8.yaml'
    print(f"Starting training on the dataset defined in: {data_yaml}")
    
    results = model.train(
        data=data_yaml,
        epochs=2,            # Short run for testing
        imgsz=640,           # Standard image size for YOLOv8
        batch=4,             # Small batch for testing
        project='models',    # Directory to save training runs
        name='coco8_run',    # Name of the current run folder
        device='cpu'         # Change to 'cuda' (or 0) if you have an NVIDIA GPU, or 'mps' for Mac
    )

    print("\nTraining complete! Best weights are saved in models/coco8_run/weights/best.pt")

if __name__ == "__main__":
    main()
