'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Video } from '@/lib/types';
import VideoGrid from '@/components/VideoGrid';

export default function Results() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get videos from session storage
    const storedVideos = sessionStorage.getItem('generatedVideos');
    
    if (storedVideos) {
      try {
        const parsedVideos = JSON.parse(storedVideos);
        setVideos(parsedVideos);
      } catch (error) {
        console.error('Error parsing videos from session storage:', error);
      }
    }
    
    setLoading(false);
  }, []);

  // If no videos were found in session storage, provide a message
  if (!loading && videos.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <h1 className="text-3xl font-bold mb-8">No Videos Found</h1>
        <p className="text-gray-600 mb-8">
          We couldn't find any generated videos. Please try uploading your assignment again.
        </p>
        <Link
          href="/upload-assignment"
          className="px-6 py-3 bg-primary text-white rounded-md hover:bg-opacity-90 transition-all"
        >
          Start Over
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-4 text-center">Your Generated Videos</h1>
      <p className="text-center text-gray-600 mb-10">
        We've analyzed your assignment and created these personalized educational videos for you.
      </p>
      
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <VideoGrid videos={videos} />
          
          <div className="mt-12 text-center">
            <Link
              href="/upload-assignment"
              className="px-6 py-3 bg-primary text-white rounded-md hover:bg-opacity-90 transition-all"
            >
              Generate More Videos
            </Link>
          </div>
        </>
      )}
    </div>
  );
}