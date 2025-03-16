import requests

# Text to convert to speech
text = "Hello this is a test of the text to speech API"

# Make POST request to the TTS endpoint
response = requests.post(
    "http://localhost:8000/tts",
    json={"text": text}
)

# Check if request was successful
if response.status_code == 200:
    # Save the audio file
    with open("output.mp3", "wb") as f:
        f.write(response.content)
    print("Audio file saved as output.mp3")
else:
    print(f"Error: {response.status_code}")
    print(response.text)
