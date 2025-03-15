from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List
import uvicorn
import time
import os
import uuid
import glob
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

# Directory for processed videos
PROCESSED_VIDEOS_DIR = "backend/processed_videos"
os.makedirs(PROCESSED_VIDEOS_DIR, exist_ok=True)

# Mount static files directory
app.mount("/videos", StaticFiles(directory=PROCESSED_VIDEOS_DIR), name="videos")

# Video data model
class Video(BaseModel):
    id: str
    title: str
    url: str
    thumbnail: str
    duration: int  # in seconds
    description: str = ""

# Processing function to return real videos from processed_videos folder
def process_files(assignment_files, material_files):
    """
    Process files and return links to processed videos
    """
    # Simulate processing time
    time.sleep(2)
    
    # In a real implementation, this would process the files and generate videos
    # For now, we'll return the existing videos in the processed_videos directory
    
    videos = []
    video_files = glob.glob(os.path.join(PROCESSED_VIDEOS_DIR, "*.mp4"))
    
    # If no processed videos found, create sample data
    if not video_files:
        # Generate mock videos - in a real app these would be actual file paths
        return [
            Video(
                id=str(uuid.uuid4()),
                title=f"Concept Explanation: {i+1}",
                url=f"/videos/sample-{i+1}.mp4",  # This would be a valid path in a real app
                thumbnail=f"https://picsum.photos/id/{i+40}/400/225",
                duration=60 + (i * 30),  # Random duration
                description=f"This video explains key concept {i+1} from your assignment, with examples and visual aids to help you understand."
            )
            for i in range(3)  # Generate 3 videos
        ]
    
    # Process real video files
    for i, video_path in enumerate(video_files):
        filename = os.path.basename(video_path)
        video_id = str(uuid.uuid4())
        
        # Extract title from filename (remove extension)
        title = os.path.splitext(filename)[0].replace("-", " ").replace("_", " ").title()
        
        # Create video object with relative URL path for the frontend
        videos.append(
            Video(
                id=video_id,
                title=title,
                url=f"/videos/{filename}",  # Relative URL - will be served by our static files mount
                thumbnail=f"https://picsum.photos/id/{i+40}/400/225",  # In a real app, generate thumbnails
                duration=90 + (i * 20),  # In a real app, extract actual duration
                description=f"This video explains {title.lower()} from your assignment with detailed examples."
            )
        )
    
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

@app.get("/api/videos", response_model=List[Video])
async def list_videos():
    """
    List all available processed videos
    """
    return process_files([], [])

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)