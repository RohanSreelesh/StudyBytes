from moviepy import VideoFileClip, TextClip, CompositeVideoClip, AudioFileClip
import os
from openai import OpenAI
import re
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize OpenAI client
client = OpenAI(
    api_key=(os.getenv("OPEN_AI_KEY"))  # redacted for security
)

audio_path = "./audio.mp3"
video_path = "./subwaysurfer.mp4"

# Function to transcribe video using OpenAI Whisper
def transcribe_video(video_path):
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

def create_tiktok_style_video(video_path, audio_path, subtitles, output_path="tiktok_style_output.mp4"):
    print(f"Loading video from: {video_path}")
    print(f"Loading audio from: {audio_path}")
    
    # Load video and audio
    video = VideoFileClip(video_path)
    audio = AudioFileClip(audio_path)
     
    # Set video audio to the provided audio file
    video = video.subclipped(0, audio.duration)    
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

if __name__ == "__main__":
    if not os.path.exists(video_path) or not os.path.exists(audio_path):
        print(f"Error: Video or audio file not found")
    else:
        audio = AudioFileClip(audio_path)
        audio_duration = audio.duration
        
        transcription = transcribe_audio(audio_path)
        subtitles = convert_transcription_to_subtitles(transcription, audio_duration, words_per_chunk=3)
        
        output_video = create_tiktok_style_video(video_path, audio_path, subtitles)
        print(f"Done! Your TikTok style video is ready at: {output_video}")
        
        # Clean up
        audio.close()