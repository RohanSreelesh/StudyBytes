'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import VideoPlayer from '@/components/VideoPlayer';
import { Video } from '@/lib/types';

export default function VideoPlayerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Get the initial video index from the query parameters
  const initialVideoIndex = parseInt(searchParams.get('index') || '0', 10);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        // Try to get videos from session storage first
        const storedVideos = sessionStorage.getItem('generatedVideos');
        
        if (storedVideos) {
          // If we have videos in session storage, use those
          setVideos(JSON.parse(storedVideos));
        } else {
          // Otherwise, fetch videos from the API
          const response = await fetch('http://localhost:8000/api/videos');
          
          if (!response.ok) {
            throw new Error('Failed to fetch videos');
          }
          
          const data = await response.json();
          setVideos(data);
          
          // Store videos in session storage for future use
          sessionStorage.setItem('generatedVideos', JSON.stringify(data));
        }
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError('Failed to load videos. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideos();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-4">
        <p className="text-xl mb-4">{error}</p>
        <Link 
          href="/results"
          className="px-6 py-3 bg-primary text-white rounded-md hover:bg-opacity-90 transition-all"
        >
          Back to Results
        </Link>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-4">
        <p className="text-xl mb-4">No videos available.</p>
        <Link 
          href="/upload-assignment"
          className="px-6 py-3 bg-primary text-white rounded-md hover:bg-opacity-90 transition-all"
        >
          Upload Assignment
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white z-10 shadow-md">
        <Link
          href="/results"
          className="text-white hover:text-primary transition-colors p-1"
        >
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Results</span>
          </div>
        </Link>
        
        <h1 className="text-lg font-semibold flex items-center">
          <svg className="w-5 h-5 mr-2 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          <span>CU Brainrot Videos</span>
        </h1>
        
        <div className="flex items-center">
          <div className="bg-primary/20 rounded-full px-3 py-1 text-xs font-medium text-primary">
            Short-Form Mode
          </div>
        </div>
      </div>
      
      {/* Video Player */}
      <div className="flex-grow overflow-hidden">
        <VideoPlayer videos={videos} initialVideoIndex={initialVideoIndex} />
      </div>
      
      {/* Swipe instruction for horizontal navigation - shows on initial load */}
      {videos.length > 1 && (
        <div className="absolute bottom-[15%] left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 animate-pulse pointer-events-none">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <span>Swipe left/right or use buttons to navigate</span>
        </div>
      )}
    </div>
  );
}