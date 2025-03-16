# How to run the project

fastpi:

cd fastapi

python install -r requirements.txt

python main.py

python test.py

backend:

cd fastapi

python install -r requirements.txt

python main.py

src:

cd src

npm i

npm run

# CU Brainrot Assistant

An AI-powered platform that transforms learning materials into engaging, short-form educational videos tailored to each student's learning style.

## Features

- Upload learning materials in various formats (PDF, PPT, PPTX, DOC, DOCX, TXT, JPG, PNG)
- AI processing to generate personalized educational videos
- Short-form video player with swipe navigation (optimized for 3:4 aspect ratio)
- Video preview on hover and intuitive touch controls
- Responsive design optimized for both desktop and mobile
- Dark mode support
- Modern, intuitive user interface

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm or yarn
- Python 3.8+ (for backend)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cu-brainrot-assistant.git
cd cu-brainrot-assistant
```

2. Install frontend dependencies:
```bash
npm install
# or
yarn install
```

3. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
cd ..
```

### Running the Application

#### Run Frontend and Backend Together (Recommended)

```bash
npm run dev:full
# or
yarn dev:full
```

This will start both the Next.js frontend and the FastAPI backend concurrently.

#### Run Frontend Only

```bash
npm run dev
# or
yarn dev
```

#### Run Backend Only

```bash
npm run backend
# or
yarn backend
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Adding Sample Videos

To test the video player functionality:

1. Obtain sample MP4 video files
2. Place them in the `backend/processed_videos` directory
3. Start the backend server
4. The videos will be automatically detected and available in the application

Sample videos can be obtained from:
- https://samplelib.com/sample-mp4.html
- https://sample-videos.com/

Example command to download a sample video:
```bash
# Download a sample video to the processed_videos directory
curl -o backend/processed_videos/sample_video.mp4 https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4
```

## Tech Stack

- **Frontend**:
  - Next.js with React
  - Tailwind CSS for styling
  - TypeScript for type safety
  - react-dropzone for file uploads

- **Backend**:
  - FastAPI (Python)
  - Pydantic for data validation

## Project Structure

- `/src`: Frontend code
  - `/app`: Next.js app router pages
  - `/components`: Reusable React components
  - `/lib`: Utility functions and shared logic
- `/backend`: Python FastAPI server
  - `main.py`: Main API implementation
  - `requirements.txt`: Python dependencies
- `/uploads`: Directory where uploaded files are stored (created automatically)

## API Endpoints

- `GET /api/health`: Health check endpoint
- `POST /api/process`: Process uploaded files and generate videos
  - Accepts assignment files and optional learning materials
  - Returns an array of generated videos
- `GET /api/videos`: Get list of all available processed videos
- `/videos/*`: Static file serving for processed video files

## License

This project is licensed under the MIT License - see the LICENSE file for details.