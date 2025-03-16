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

from fastapi.responses import StreamingResponse
from elevenlabs.client import ElevenLabs
from elevenlabs import play
import io
# from .video_gen import create_videos

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="CU Brainrot Assistant API")

# Set ElevenLabs API key
api_key = os.getenv("ELEVENLABS_API_KEY")
voice_id = os.getenv("VOICE_ID")

if not api_key:
    raise ValueError("Missing ELEVENLABS_API_KEY in .env file")
    
if not voice_id:
    raise ValueError("Missing VOICE_ID in .env file")

# Initialize ElevenLabs client
client_eleven = ElevenLabs(api_key=api_key)

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

# Directory to save mp3 files
MP3_DIR = "backend/mp3s"
os.makedirs(MP3_DIR, exist_ok=True)

# Directory for processed videos
PROCESSED_VIDEOS_DIR = "output_videos"
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

def process_files_with_gemini(upload_dir, max_retries=3):
    """
    Process all files in the upload directory using a single Gemini API call
    and generate easy-to-understand transcripts in JSON format.
    Will retry on JSON parsing failures.
    
    Args:
        upload_dir (str): Path to the directory containing uploaded files
        max_retries (int): Maximum number of retry attempts for JSON parsing failures
        
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
    
    # Initialize model
    model = genai.GenerativeModel('gemini-1.5-pro')
    
    # Retry loop for handling JSON parsing failures
    for attempt in range(max_retries + 1):  # +1 to include the initial attempt
        try:
            # Adjust prompt based on retry attempt to emphasize JSON requirements
            if attempt == 0:
                # Initial prompt
                prompt = f"""
                Please analyze all the following files and provide transcripts that explain 
                the material in each file in an easy-to-understand way. You should create as many videos as required to explain the important concepts in the material.
                You are expected to usually create multiple video transcripts per file as there will be many concepts to explain.
                Each video should focus on a specific concept or topic, being concise and clear. The transcripts are for short form video content.

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
            else:
                # Modified prompt for retry attempts - emphasizing JSON formatting more strongly
                prompt = f"""
                IMPORTANT: Your response MUST be a valid JSON object and NOTHING ELSE. No markdown, no explanations, no code blocks.
                
                Please analyze these files and create transcripts explaining the material in an easy-to-understand way.
                Create multiple video transcripts focusing on specific concepts from the material.
                
                Your response must EXACTLY follow this JSON structure:
                
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
                    ],
                }}
                
                DO NOT include any explanations, comments, or text outside of this exact JSON structure.
                DO NOT use markdown code blocks or any other formatting.

                Files to analyze:{files_content}
                """
            
            print(f"Attempt {attempt+1}/{max_retries+1}: Sending files to Gemini API...")
            response = model.generate_content(prompt)
            response_text = response.text
            
            # Extract JSON content with improved handling
            json_content = response_text
            
            # Try to extract if it's in a code block
            if "```json" in response_text:
                json_content = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                json_content = response_text.split("```")[1].strip()
            
            # Remove any leading/trailing characters that might invalidate JSON
            json_content = json_content.strip()
            if json_content.startswith('`') and json_content.endswith('`'):
                json_content = json_content[1:-1].strip()
                
            # Try to parse the JSON
            results = json.loads(json_content)
            
            # If we got here, JSON parsing succeeded
            # Convert array to dictionary with file_name as key for easier access
            formatted_results = {}
            if "transcripts" in results:
                for transcript in results["transcripts"]:
                    if "Video name" in transcript:
                        formatted_results[transcript["Video name"]] = transcript
            
            # Add the overall theme if it exists
            if "overall_theme" in results:
                formatted_results["overall_theme"] = results["overall_theme"]
            
            print(f"Successfully processed all files on attempt {attempt+1}")
            
            # Save results to a JSON file
            output_path = os.path.join(upload_dir, "gemini_transcripts.json")
            with open(output_path, 'w') as f:
                json.dump(formatted_results, f, indent=2)
            
            print(f"Transcripts saved to {output_path}")
            return formatted_results
            
        except json.JSONDecodeError as e:
            # JSON parsing failed
            print(f"Attempt {attempt+1}/{max_retries+1}: JSON parse error: {str(e)}")
            
            # Save the problematic response for debugging
            error_path = os.path.join(upload_dir, f"gemini_error_response_attempt_{attempt+1}.txt")
            with open(error_path, 'w') as f:
                f.write(response_text)
            
            print(f"Raw response saved to {error_path}")
            
            # If this was our last attempt, return an error
            if attempt == max_retries:
                print("All retry attempts failed")
                return {"error": "Failed to parse response after multiple attempts"}
            
            # Otherwise, continue to the next retry attempt
            print(f"Retrying... (Attempt {attempt+2}/{max_retries+1})")
        
        except Exception as e:
            # For other exceptions (network issues, API errors, etc.)
            print(f"Attempt {attempt+1}/{max_retries+1}: Error calling Gemini API: {str(e)}")
            
            if attempt == max_retries:
                print("All retry attempts failed")
                return {"error": f"API Error: {str(e)}"}
            
            print(f"Retrying... (Attempt {attempt+2}/{max_retries+1})")
    
    return {"error": "Failed to process files after multiple attempts"}

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
    print("Transcripts:", transcripts)

    audio_files = []
    print("Generating audio files...")
    for concept_key, concept_data in transcripts.items():
        # Create a TextToSpeechRequest object
        request = TextToSpeechRequest(text=concept_data["transcript"])
        print(f"Generating audio for concept: {concept_key}")
        # Set save_to_file=True to get a file path back
        audio_file_path = text_to_speech(request, save_to_file=True)
        
        print(f"Audio file saved to: {audio_file_path}")
        # Rename the file to match the concept key if needed
        final_path = os.path.join(MP3_DIR, f"{concept_key}.mp3")
        os.rename(audio_file_path, final_path)
        audio_files.append(final_path)
    
    # Generate videos from audio and material files
    print("Creating videos...")
    create_videos("./backend/mp3s", "./video_files", "./output_videos", False)

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

# voicetts.py

class TextToSpeechRequest(BaseModel):
    text: str

def text_to_speech(request: TextToSpeechRequest, save_to_file: bool = False):
    try:
        # Generate audio from text
        print(f"Converting text to speech: {request.text}")
        print(f"Voice ID: {voice_id}")
        audio_generator = client_eleven.text_to_speech.convert(
            text=request.text,
            voice_id=voice_id,
            model_id="eleven_flash_v2_5",
            output_format="mp3_22050_32",
            voice_settings={"speed": 0.9, "stability": 0.45, "similarity_boost": 0.5}
        )
        
        # Convert generator to bytes
        audio_bytes = b"".join(chunk for chunk in audio_generator)
        
        if save_to_file:
            # Generate a unique filename
            file_path = f"{uuid.uuid4()}.mp3"
            
            # Save the audio to a file
            with open(file_path, "wb") as f:
                f.write(audio_bytes)
                
            # Return the file path
            return file_path
        else:
            # Create a file-like object from the audio bytes
            audio_stream = io.BytesIO(audio_bytes)
            
            # Return the audio as a streaming response
            return StreamingResponse(
                audio_stream, 
                media_type="audio/mpeg",
                headers={"Content-Disposition": "attachment; filename=speech.mp3"}
            )
    except Exception as e:
        print(f"Error converting text to speech: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


from moviepy import VideoFileClip, TextClip, CompositeVideoClip, AudioFileClip
import os
from openai import OpenAI
import re
from dotenv import load_dotenv
import random

# Load environment variables from .env file
# load_dotenv()

# Default directories (can be overridden when calling process_files)
DEFAULT_AUDIO_DIR = "./backend/mp3s"     # Directory containing MP3 files
DEFAULT_VIDEO_DIR = "./video_files"      # Directory containing video files
DEFAULT_OUTPUT_DIR = "./output_videos"   # Directory for output videos
DEFAULT_PROCESS_MATCHING_ONLY = False    # Set to True to only process files with matching names

# Initialize OpenAI client
client = OpenAI(
    api_key=(os.getenv("OPEN_AI_KEY"))
)

def transcribe_video(video_path):
    """Transcribe video using OpenAI Whisper"""
    print(f"Transcribing video from: {video_path}")
    with open(video_path, "rb") as video_file:
        response = client.audio.transcriptions.create(
            model="whisper-1",
            file=video_file
        )
    transcription = response.text
    print(f"Transcription: {transcription}")
    return transcription

def add_tiktok_emphasis(text):
    """Add TikTok-style emphasis to certain words"""
    emphasis_patterns = [
        (r'\b(never|always|every|all|none)\b', r'NEVER'),
        (r'\b(amazing|awesome|incredible|terrible|horrible)\b', r'AMAZING'),
        (r'\b(best|worst|most|least)\b', r'BEST'),
        (r'\b(literally|actually|seriously|absolutely)\b', r'LITERALLY'),
        (r'\b(wait|omg|wow|what|why|how|who)\b', r'WAIT')
    ]
    
    # Randomly capitalize about 20% of emphasis candidates
    import random
    for pattern, replacement in emphasis_patterns:
        if random.random() < 0.2:  # 20% chance to apply emphasis
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                text = re.sub(r'\b' + re.escape(match) + r'\b', match.upper(), text, flags=re.IGNORECASE)
    
    return text

def convert_transcription_to_subtitles(transcription, video_duration, words_per_chunk=3):
    """Convert transcription text into timed subtitles based on video duration"""
    # Clean up transcription
    cleaned_text = re.sub(r'\s+', ' ', transcription).strip()
    words = cleaned_text.split()
    
    # Skip if no words
    if not words:
        return []
    
    total_words = len(words)
    subtitles = []
    
    # Calculate estimated time per word based on video duration
    # This assumes that speech is relatively evenly distributed
    time_per_word = video_duration / total_words
    
    # Create subtitle chunks with better timing estimates
    for i in range(0, total_words, words_per_chunk):
        chunk_words = words[i:i + words_per_chunk]
        chunk_text = " ".join(chunk_words)
        
        # Calculate timing based on word position
        start_time = i * time_per_word
        end_time = min((i + len(chunk_words)) * time_per_word, video_duration)
        
        # Add emphasis to make it more TikTok-like
        chunk_text = add_tiktok_emphasis(chunk_text)
        
        subtitles.append([start_time, end_time, chunk_text])
    
    return subtitles

def transcribe_audio(audio_path):
    """Transcribe audio file using OpenAI Whisper"""
    print(f"Transcribing audio from: {audio_path}")
    with open(audio_path, "rb") as audio_file:
        response = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file
        )
    transcription = response.text
    print(f"Transcription: {transcription}")
    return transcription

def create_tiktok_style_video(video_path, audio_path, subtitles, output_path):
    print(f"Loading video from: {video_path}")
    print(f"Loading audio from: {audio_path}")
    
    # Load video and audio
    video = VideoFileClip(video_path)
    audio = AudioFileClip(audio_path)
    
    # Make video loop if it's shorter than audio
    if video.duration < audio.duration:
        print(f"Video duration ({video.duration}s) is shorter than audio ({audio.duration}s). Creating looped video.")
        # Calculate how many times we need to loop the video
        repeat_count = int(audio.duration / video.duration) + 1
        # Create a list of repeated video clips
        video_clips = [video] * repeat_count
        # Concatenate the clips
        from moviepy import concatenate_videoclips
        looped_video = concatenate_videoclips(video_clips)
        # Now use the looped video
        video = looped_video.subclipped(0, audio.duration)
    else:
        # If video is longer, just cut it to audio length
        video = video.subclipped(0, audio.duration)
     
    # Set video audio to the provided audio file
    video = video.with_audio(audio)
    
    # Create text clips with TikTok style
    txt_clips = []
    
    for sub in subtitles:
        start_time, end_time, text = sub
        
        # Skip if the subtitles go beyond video duration
        if start_time >= video.duration:
            continue
            
        # Adjust end_time if it exceeds video duration
        end_time = min(end_time, video.duration)
        
        txt_clip = TextClip(
            text=text,
            font="Arial",
            font_size=70,
            color='white',
            stroke_color='black',
            stroke_width=2,
            method='caption',
            size=(int(video.w*0.9), None),
            bg_color=None,
            horizontal_align='center',
            vertical_align='center'
        )
        
        txt_clip = txt_clip.with_position(('center', 'center'))
        txt_clip = txt_clip.with_start(start_time).with_end(end_time)
        txt_clips.append(txt_clip)
    
    # Combine everything
    print("Creating final video with subtitles and audio...")
    final_video = CompositeVideoClip([video] + txt_clips)
    
    # Write the output file
    print(f"Rendering video to: {output_path}")
    final_video.write_videofile(
        output_path, 
        fps=24, 
        codec="libx264",
        audio_codec="aac",
        threads=4
    )
    
    print(f"Video successfully saved to: {output_path}")
    final_video.close()
    video.close()
    return output_path

def get_supported_files(directory, extensions):
    """Get list of files with specified extensions in a directory"""
    files = []
    for file in os.listdir(directory):
        for ext in extensions:
            if file.lower().endswith(ext.lower()):
                files.append(os.path.join(directory, file))
                break
    return files

def create_videos(audio_dir=DEFAULT_AUDIO_DIR, video_dir=DEFAULT_VIDEO_DIR, 
                 output_dir=DEFAULT_OUTPUT_DIR, process_matching_only=DEFAULT_PROCESS_MATCHING_ONLY):
    """
    Process audio and video files to create TikTok-style videos with subtitles.
    
    Parameters:
        audio_dir (str): Directory containing audio files
        video_dir (str): Directory containing video files
        output_dir (str): Directory to save output videos
        process_matching_only (bool): If True, only process files with matching names
    
    Returns:
        int: Number of videos processed
    """
    # Check if directories exist
    if not os.path.isdir(audio_dir):
        print(f"Error: Audio directory '{audio_dir}' does not exist")
        return 0
    
    if not os.path.isdir(video_dir):
        print(f"Error: Video directory '{video_dir}' does not exist")
        return 0
    
    # Create output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created output directory: {output_dir}")
    
    # Get audio and video files
    audio_files = get_supported_files(audio_dir, ['.mp3', '.wav', '.m4a', '.flac', '.aac'])
    video_files = get_supported_files(video_dir, ['.mp4', '.mov', '.avi', '.mkv', '.webm'])
    
    if not audio_files:
        print(f"No audio files found in {audio_dir}")
        return 0
        
    if not video_files:
        print(f"No video files found in {video_dir}")
        return 0
    
    print(f"Found {len(audio_files)} audio files and {len(video_files)} video files")
    
    # Process files
    processed = 0
    
    if process_matching_only:
        # Match files by filename (without extension)
        audio_dict = {os.path.splitext(os.path.basename(f))[0]: f for f in audio_files}
        video_dict = {os.path.splitext(os.path.basename(f))[0]: f for f in video_files}
        
        # Find common keys
        common_names = set(audio_dict.keys()).intersection(video_dict.keys())
        
        if not common_names:
            print("No matching filenames found between audio and video directories")
            return 0
            
        for name in common_names:
            audio_path = audio_dict[name]
            video_path = video_dict[name]
            output_filename = f"{name}.mp4"
            output_path = os.path.join(output_dir, output_filename)
            
            try:
                print(f"\nProcessing matching pair: {name}")
                
                # Transcribe audio and create subtitles
                audio = AudioFileClip(audio_path)
                audio_duration = audio.duration
                
                transcription = transcribe_audio(audio_path)
                subtitles = convert_transcription_to_subtitles(transcription, audio_duration, words_per_chunk=3)
                
                # Create the TikTok-style video
                create_tiktok_style_video(video_path, audio_path, subtitles, output_path)
                
                # Clean up
                audio.close()
                
                processed += 1
                print(f"Processed {processed}/{len(common_names)} matching pairs")
                
            except Exception as e:
                print(f"Error processing {name}: {str(e)}")
    else:
        # Process each audio file with a random video
        for audio_path in audio_files:
            audio_name = os.path.splitext(os.path.basename(audio_path))[0]
            
            # Select a random video file
            random_video_path = random.choice(video_files)
            video_name = os.path.splitext(os.path.basename(random_video_path))[0]
            
            output_filename = f"{audio_name}.mp4"
            output_path = os.path.join(output_dir, output_filename)
            
            try:
                print(f"\nProcessing: Audio '{audio_name}' with randomly selected Video '{video_name}'")
                
                # Transcribe audio and create subtitles
                audio = AudioFileClip(audio_path)
                audio_duration = audio.duration
                
                transcription = transcribe_audio(audio_path)
                subtitles = convert_transcription_to_subtitles(transcription, audio_duration, words_per_chunk=3)
                
                # Create the TikTok-style video
                create_tiktok_style_video(random_video_path, audio_path, subtitles, output_path)
                
                # Clean up
                audio.close()
                
                processed += 1
                print(f"Processed {processed}/{len(audio_files)} audio files")
                
            except Exception as e:
                print(f"Error processing {audio_name} with {video_name}: {str(e)}")
    
    print(f"\nDone! {processed} TikTok-style videos were created in {output_dir}")
    return processed

@app.post("/api/cleanup")
async def cleanup_directories():
    """Clean up temporary directories: uploads, mp3s, and output_videos"""
    print("Cleaning up directories...")
    try:
        # Get directories to clean up
        directories = [
            "./backend/uploads",
            "./backend/mp3s",
            "output_videos"
        ]
        
        # Delete all files in each directory
        for directory in directories:
            if os.path.exists(directory):
                files = glob.glob(f"{directory}/*")
                for file in files:
                    try:
                        if os.path.isfile(file):
                            os.remove(file)
                        elif os.path.isdir(file):
                            import shutil
                            shutil.rmtree(file)
                    except Exception as e:
                        print(f"Error removing {file}: {e}")
        
        return {"status": "success", "message": "Directories cleaned up successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clean up directories: {str(e)}")
    
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)