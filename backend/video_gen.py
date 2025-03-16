from moviepy import VideoFileClip, TextClip, CompositeVideoClip, AudioFileClip
import os
from openai import OpenAI
import re
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

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
            output_filename = f"{name}_tiktok.mp4"
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
        # Process all combinations
        total_combinations = len(audio_files) * len(video_files)
        
        for audio_path in audio_files:
            audio_name = os.path.splitext(os.path.basename(audio_path))[0]
            
            for video_path in video_files:
                video_name = os.path.splitext(os.path.basename(video_path))[0]
                
                output_filename = f"{audio_name}_{video_name}_tiktok.mp4"
                output_path = os.path.join(output_dir, output_filename)
                
                try:
                    print(f"\nProcessing: Audio '{audio_name}' with Video '{video_name}'")
                    
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
                    print(f"Processed {processed}/{total_combinations} combinations")
                    
                except Exception as e:
                    print(f"Error processing {audio_name} with {video_name}: {str(e)}")
    
    print(f"\nDone! {processed} TikTok-style videos were created in {output_dir}")
    return processed


# Example usage if run directly
if __name__ == "__main__":
    create_videos()
