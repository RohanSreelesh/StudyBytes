# CU Brainrot Assistant

An AI-powered platform that converts complex academic assignments into engaging, short-form educational videos tailored to each student's learning needs.

## Features

- Upload academic assignments in various formats (PDF, DOC, DOCX, TXT)
- Upload supplementary learning materials (slides, notes, textbook pages)
- AI processing to generate personalized educational videos
- User-friendly interface with responsive design

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

## License

This project is licensed under the MIT License - see the LICENSE file for details.