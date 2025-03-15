from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uvicorn
import time
import os
import uuid
from pydantic import BaseModel

app = FastAPI(title="CU Brainrot Assistant API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory to save uploaded files
UPLOAD_DIR = "backend/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mock video data
class Video(BaseModel):
    id: str
    title: str
    url: str
    thumbnail: str
    duration: int  # in seconds

# Mock processing function
def process_files(assignment_files, material_files):
    """
    Simulate processing of files to generate videos
    In a real app, this would call your AI model
    """
    # Simulate processing time
    time.sleep(2)
    
    # Generate mock videos
    videos = [
        Video(
            id=str(uuid.uuid4()),
            title=f"Concept Explanation: {i+1}",
            url=f"https://example.com/videos/sample-{i+1}.mp4",
            thumbnail=f"https://picsum.photos/id/{i+40}/400/225",
            duration=60 + (i * 30)  # Random duration
        )
        for i in range(3)  # Generate 3 videos
    ]
    
    return videos

@app.post("/api/process", response_model=List[Video])
async def process_uploaded_files(
    assignment_files: List[UploadFile] = File(...),
    material_files: List[UploadFile] = File([]) 
):
    # Save assignment files
    saved_assignment_files = []
    for file in assignment_files:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        saved_assignment_files.append(file_path)
    
    # Save material files if any
    saved_material_files = []
    for file in material_files:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        saved_material_files.append(file_path)
    
    # Process the files (in a real app, this would be done asynchronously)
    videos = process_files(saved_assignment_files, saved_material_files)
    
    return videos

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)