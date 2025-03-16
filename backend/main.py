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
from moviepy import VideoFileClip, TextClip, CompositeVideoClip
import google.generativeai as genai
import json
from dotenv import load_dotenv
from PyPDF2 import PdfReader


# Load environment variables from .env file
load_dotenv()

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

# Get absolute path for the processed videos directory
ABSOLUTE_PROCESSED_VIDEOS_DIR = os.path.abspath(PROCESSED_VIDEOS_DIR)
print(f"Mounting videos from: {ABSOLUTE_PROCESSED_VIDEOS_DIR}")

# Mount static files directory
app.mount("/videos", StaticFiles(directory=ABSOLUTE_PROCESSED_VIDEOS_DIR), name="videos")

# Video data model
class Video(BaseModel):
    id: str
    title: str
    url: str
    thumbnail: str
    duration: int  # in seconds
    description: str = ""

genai.configure(api_key=os.getenv("GEMENI_API_KEY"))

def process_files_with_gemini(upload_dir):
    """
    Process all files in the upload directory using a single Gemini API call
    and generate easy-to-understand transcripts in JSON format.
    
    Args:
        upload_dir (str): Path to the directory containing uploaded files
        
    Returns:
        dict: JSON response containing simplified transcripts
    """
    # Check if upload directory exists
    if not os.path.exists(upload_dir):
        print(f"Error: Upload directory not found at {upload_dir}")
        return None
    
    # Get list of files in the upload directory
    files = [f for f in os.listdir(upload_dir) if os.path.isfile(os.path.join(upload_dir, f))]
    
    if not files:
        print(f"No files found in {upload_dir}")
        return None
    
    print(f"Found {len(files)} files in upload directory")
    
    # Collect content from all files
    file_contents = {}
    
    for file_name in files:
        file_path = os.path.join(upload_dir, file_name)
        print(f"Reading file: {file_name}")
        
        # Check if file is a PDF
        if file_name.lower().endswith('.pdf'):
            try:
                # Extract text from PDF using PyPDF2
                text_content = ""
                with open(file_path, 'rb') as pdf_file:
                    pdf_reader = PdfReader(pdf_file)
                    for page_num in range(len(pdf_reader.pages)):
                        page = pdf_reader.pages[page_num]
                        text_content += page.extract_text() + "\n"
                
                if text_content.strip():
                    file_contents[file_name] = text_content
                else:
                    print(f"Warning: No text content extracted from PDF {file_name}")
                    file_contents[file_name] = f"[PDF file: {file_name} - No extractable text content]"
            except Exception as e:
                print(f"Error extracting text from PDF {file_name}: {str(e)}")
                file_contents[file_name] = f"[PDF file: {file_name} - Error: {str(e)}]"
        else:
            # Handle text files
            try:
                with open(file_path, 'r', errors='replace') as file:
                    file_contents[file_name] = file.read()
            except Exception as e:
                print(f"Warning: Could not read {file_name}: {str(e)}")
                file_contents[file_name] = f"[File: {file_name} - Error: {str(e)}]"
    
    # Create a single prompt with all file contents
    files_content = ""
    print(f"Processing {len(file_contents)} files")
    for file_name, content in file_contents.items():
        files_content += f"\n\n--- FILE: {file_name} ---\n{content}\n--- END OF FILE: {file_name} ---"
    
    # Create prompt for Gemini with explicit JSON structure for multiple files
    prompt = f"""
    Please analyze all the following files and provide transcripts that explain 
    the material in each file in an easy-to-understand way. You should create as many videos as required to explain the material.
    You are expected to usually create multiple video transcripts per file as there will be many concepts to explain.
    Each video should focus on a specific concept or topic from the material end to end with detailed examples.

    Return ONLY a valid JSON object with the following structure - do not include any markdown formatting, explanations, or code blocks, follow the exact structure:

    {{
        "transcripts": [
            {{
                "Video name": "name_of_video_1",
                "transcript": "your transcript here...",
            }},
            {{
                "Video name": "name_of_video_2",
                "transcript": "your transcript here...",
            }}
            // Include entries for as many transcripts required to explain the content
        ],
    }}

    Files to analyze:{files_content}
    """
    
    # Call Gemini API once for all files
    try:
        print("Sending all files to Gemini API...")
        model = genai.GenerativeModel('gemini-1.5-pro')
        response = model.generate_content(prompt)
        
        # Parse JSON response
        try:
            response_text = response.text
            # Extract JSON if it's embedded in markdown code block
            if "```json" in response_text:
                json_content = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                json_content = response_text.split("```")[1].strip()
            else:
                json_content = response_text
            
            results = json.loads(json_content)
            
            # Convert array to dictionary with file_name as key for easier access
            formatted_results = {}
            if "transcripts" in results:
                for transcript in results["transcripts"]:
                    if "Video name" in transcript:
                        formatted_results[transcript["Video name"]] = transcript
            
            # Add the overall theme if it exists
            if "overall_theme" in results:
                formatted_results["overall_theme"] = results["overall_theme"]
                
            print("Successfully processed all files")
            
            # Save results to a JSON file
            output_path = os.path.join(upload_dir, "gemini_transcripts.json")
            with open(output_path, 'w') as f:
                json.dump(formatted_results, f, indent=2)
            
            print(f"Transcripts saved to {output_path}")
            return formatted_results
            
        except json.JSONDecodeError as e:
            print(f"Error: Could not parse JSON response: {str(e)}")
            print(f"Raw response: {response.text}")
            
            # Save the raw response for debugging
            error_path = os.path.join(upload_dir, "gemini_error_response.txt")
            with open(error_path, 'w') as f:
                f.write(response.text)
            
            print(f"Raw response saved to {error_path}")
            return {"error": "Failed to parse response"}
    
    except Exception as e:
        print(f"Error processing files with Gemini API: {str(e)}")
        return {"error": str(e)}

# Processing function to return real videos from processed_videos folder
def process_files(assignment_files, material_files):
    """
    Process files and return links to processed videos
    """
    
    # In a real implementation, this would process the files and generate videos
    # For now, we'll return the existing videos in the processed_videos directory
    
    videos = []
    video_files = glob.glob(os.path.join(PROCESSED_VIDEOS_DIR, "*.mp4"))
    
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
                thumbnail=f"https://picsum.photos/id/{i+40}/400/225",
                duration=get_video_duration(video_path),    
                description=f"This video explains {title.lower()} from your learning with detailed examples."
            )
        )
    
    return videos

@app.post("/api/process-materials", response_model=List[Video])
async def process_materials(
    material_files: List[UploadFile] = File(...)
):
    # Save material files
    saved_material_files = []
    for file in material_files:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        saved_material_files.append(file_path)
    
    # Process the files
    transcripts = process_files_with_gemini(UPLOAD_DIR)
    print(transcripts)
    videos = process_files([], saved_material_files)
    
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


def get_video_duration(video_path):
    """Extract the actual duration of a video file in seconds"""
    try:
        clip = VideoFileClip(video_path)
        duration = int(clip.duration)
        clip.close()
        return duration
    except Exception as e:
        print(f"Error getting duration for {video_path}: {e}")
        return 60  # fallback duration

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)