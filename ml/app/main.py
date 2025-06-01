import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
import torchvision.transforms as transforms
from PIL import Image
import io
import requests
import uuid
from datetime import datetime
from torchvision import models

MODEL_PATH = "best_model-7.pth"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("api.log"), logging.StreamHandler()]
)
logger = logging.getLogger("whale-detector")

device = "cpu"

model = models.efficientnet_b4(pretrained=False)
model.classifier[1] = torch.nn.Linear(model.classifier[1].in_features, 2)
model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model.eval()
model.to(device)

transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

app = FastAPI(title="Whale Detection API")

class PredictionRequest(BaseModel):
    url: str

def download_image(url: str) -> Image.Image:
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return Image.open(io.BytesIO(response.content))
    except Exception as e:
        logger.error(f"Error downloading image: {str(e)}")
        raise HTTPException(status_code=400, detail="Image download failed")

def predict(image: Image.Image) -> tuple:
    try:
        image_tensor = transform(image).unsqueeze(0).to(device)
        with torch.no_grad():
            outputs = model(image_tensor)
            probabilities = torch.softmax(outputs, dim=1)[0]
        return probabilities[1].item(), probabilities[0].item()
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail="Prediction failed")

@app.post("/api/v1/recognize")
async def recognize_whale(request: PredictionRequest):
    start_time = datetime.now()
    request_id = str(uuid.uuid4())
    
    logger.info(f"[{request_id}] Processing request for URL: {request.url}")
    
    try:
        image = download_image(request.url)

        prob_humpback, prob_other = predict(image)
        result = "OK" if prob_humpback > 0.5 else "NOT_WHALE"

        log_data = {
            "request_id": request_id,
            "prob_humpback": round(prob_humpback, 4),
            "prob_other": round(prob_other, 4),
            "result": result,
            "processing_time": str(datetime.now() - start_time)
        }
        logger.info(f"Prediction results: {log_data}")
        
        return {
            "result": result,
        }
    
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"[{request_id}] Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)