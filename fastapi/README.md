# Mark's AI Voice API

This is a FastAPI backend that integrates with ElevenLabs' text-to-speech service to generate audio using Mark's voice.

## Setup

1. Clone this repository
2. Activate the virtual environment:
   ```
   .\venv\Scripts\Activate.ps1   # Windows PowerShell
   source venv/bin/activate      # Linux/Mac
   ```
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
4. Update the `.env` file with your ElevenLabs API key:
   ```
   ELEVENLABS_API_KEY=your_api_key_here
   VOICE_ID=UgBBYS2sOqTuMpoF3BR0  # Mark's Voice ID
   ```

## Running the API

```
python main.py
```

The API will be available at http://localhost:8000

## API Endpoints

### GET /

Returns a welcome message.

### POST /tts

Converts text to speech using Mark's voice.

Request body:
```json
{
  "text": "Text to convert to speech",
  "model_id": "eleven_turbo_v2"  // Optional, defaults to "eleven_turbo_v2"
}
```

Returns:
- Audio file (MP3) with the synthesized speech

### GET /models

Returns a list of available text-to-speech models from ElevenLabs.

## Example Usage

Using curl:
```bash
curl -X POST "http://localhost:8000/tts" \
     -H "Content-Type: application/json" \
     -d '{"text": "Hello, this is Mark speaking."}' \
     --output speech.mp3
```

Using Python:
```python
import requests

response = requests.post(
    "http://localhost:8000/tts",
    json={"text": "Hello, this is Mark speaking."}
)

with open("speech.mp3", "wb") as f:
    f.write(response.content)
``` 