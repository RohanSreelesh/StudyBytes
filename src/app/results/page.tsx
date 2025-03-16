'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Video } from '@/lib/types';
import VideoGrid from '@/components/VideoGrid';

export default function Results() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to fetch videos from session storage, fall back to API
    const fetchVideos = async () => {
      try {
        // First try to get from session storage for faster load
        const storedVideos = sessionStorage.getItem('generatedVideos');
        
        if (storedVideos) {
          const parsedVideos = JSON.parse(storedVideos);
          if (Array.isArray(parsedVideos) && parsedVideos.length > 0) {
            setVideos(parsedVideos);
            setLoading(false);
            return;
          }
        }
        
        // If no videos in session storage, fetch from API
        const response = await fetch('http://localhost:8000/api/videos');
        
        if (response.ok) {
          const data = await response.json();
          setVideos(data);
          sessionStorage.setItem('generatedVideos', JSON.stringify(data));
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideos();
  }, []);

  // If no videos were found, provide a message
  if (!loading && videos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-16 px-4">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden p-8 text-center">
          <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">No Videos Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            We couldn't find any generated videos. Please try uploading your learning materials to get personalized educational content.
          </p>
          <Link
            href="/upload-materials"
            className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-full font-medium shadow-md hover:bg-opacity-90 hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Learning Materials
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-10 pb-20 px-4 sm:px-6">
      {loading ? (
        <div className="flex flex-col justify-center items-center py-32">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary border-opacity-80"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading your personalized videos...</p>
        </div>
      ) : (
        <>
          <div className="max-w-6xl mx-auto mb-10">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-center">
                <div className="mb-4 sm:mb-0">
                  <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Your Learning Videos</h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">
                    {videos.length} personalized educational {videos.length === 1 ? 'video' : 'videos'} based on your materials
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/upload-materials"
                    className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-all text-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Upload New Materials
                  </Link>
                  {videos.length > 0 && (
                    <Link
                      href="/video-player"
                      className="flex items-center px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-md hover:bg-opacity-90 transition-all text-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Play All
                    </Link>
                  )}
                </div>
              </div>
            </div>
            
            {/* Helpful tips section */}
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-5 mb-8 border border-blue-100 dark:border-blue-800">
              <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tips for using your videos
              </h3>
              <ul className="mt-2 text-sm text-blue-700 dark:text-blue-200 space-y-1">
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Hover over a video card to preview the content</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Watch in short-form mode to navigate between videos easily</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Click "Full Video" to open the video in a new tab</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Videos grid */}
          <div className="max-w-6xl mx-auto">
            <VideoGrid videos={videos} />
            
            <div className="mt-12 flex justify-center">
              <Link
                href="/"
                className="flex items-center px-5 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full shadow-md hover:shadow-lg transition-all"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}