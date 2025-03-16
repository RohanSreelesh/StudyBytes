import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from elevenlabs.client import ElevenLabs
from elevenlabs import play
from pydantic import BaseModel
from dotenv import load_dotenv
import io

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

@app.post("/tts")
async def text_to_speech(request: TextToSpeechRequest):
    try:
        # Generate audio from text
        audio_generator = client.text_to_speech.convert(
            text=request.text,
            voice_id=voice_id,
            model_id="eleven_flash_v2_5",
            output_format="mp3_44100_128",
            voice_settings={"speed": 0.7, "stability": 0.45, "similarity_boost": 0.5}
        )
        
        # Convert generator to bytes
        audio_bytes = b"".join(chunk for chunk in audio_generator)
        
        # Create a file-like object from the audio bytes
        audio_stream = io.BytesIO(audio_bytes)
        
        # Return the audio as a streaming response
        return StreamingResponse(
            audio_stream, 
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment; filename=speech.mp3"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models")
async def get_models():
    try:
        # Get available TTS models
        models = client.models.get_all()
        return {"models": [{"model_id": model.model_id, "name": model.name} for model in models]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
