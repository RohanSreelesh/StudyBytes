# [https://devpost.com/software/studybytes](Devpost)

# StudyBytes

An AI-powered platform that transforms learning materials into engaging, short-form educational videos.

## Features

- Upload learning materials (PDF, TXT)
- AI processing to generate personalized educational videos
- Short-form video player
- Video preview on hover and intuitive controls
- Dark mode support
- Modern, intuitive user interface

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm or yarn
- Python 3.8+ (for backend)

# How to run the project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/RohanSreelesh/StudyBytes.git
cd StudyBytes
```

2. Setup a python virtual environment with Python 3.12

Ideally it is named as ".venv"

3. Setup and rename "backend/example.env" to "backend/.env"

4. Install dependencies:

### Frontend

```bash
npm i
```

### Backend

```bash
cd backend

pip install -r requirements.txt
```

5. Run the Application

#### Run Frontend

```bash
npm run dev
```

#### Run Backend

```bash
cd backend

py main.py
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

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
  - `uploads`: Directory where uploaded files are stored (created automatically)

## API Endpoints

- `GET /api/health`: Health check endpoint
- `POST /api/process`: Process uploaded files and generate videos
  - Accepts assignment files and optional learning materials
  - Returns an array of generated videos
- `GET /api/videos`: Get list of all available processed videos
- `/videos/*`: Static file serving for processed video files
