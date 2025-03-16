import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from elevenlabs.client import ElevenLabs
from elevenlabs import play
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set ElevenLabs API key
api_key = os.getenv("ELEVENLABS_API_KEY")
voice_id = os.getenv("VOICE_ID")

if not api_key:
    raise ValueError("Missing ELEVENLABS_API_KEY in .env file")
    
if not voice_id:
    raise ValueError("Missing VOICE_ID in .env file")

# Initialize ElevenLabs client
client = ElevenLabs(api_key=api_key)

app = FastAPI(title="Mark's AI Voice API")

class TextToSpeechRequest(BaseModel):
    text: str

@app.get("/")
async def root():
    return {"message": "Welcome to Mark's AI Voice API"}

# @app.post("/tts")

@app.get("/models")
async def get_models():
    try:
        # Get available TTS models
        models = client.models.get_all()
        return {"models": [{"model_id": model.model_id, "name": model.name} for model in models]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
