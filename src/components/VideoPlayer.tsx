'use client';

import { useRef, useState, useEffect, TouchEvent } from 'react';
import { Video } from '@/lib/types';

interface VideoPlayerProps {
  videos: Video[];
  initialVideoIndex?: number;
}

export default function VideoPlayer({ videos, initialVideoIndex = 0 }: VideoPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialVideoIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [swipeInProgress, setSwipeInProgress] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);

  const currentVideo = videos[currentIndex];

  useEffect(() => {
    // Reset video when index changes
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      if (isPlaying) {
        videoRef.current.play();
      }
    }
  }, [currentIndex]);

  useEffect(() => {
    // Add keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'k') {
        prevVideo();
      } else if (e.key === 'ArrowDown' || e.key === 'j') {
        nextVideo();
      } else if (e.key === ' ' || e.key === 'k') {
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, videos.length]);

  // Format the time display (MM:SS)
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle video time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  // Handle play/pause toggle
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle seeking when user clicks on progress bar
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const progressBar = e.currentTarget;
      const clickPosition = e.clientX - progressBar.getBoundingClientRect().left;
      const percentClicked = (clickPosition / progressBar.offsetWidth) * 100;
      const seekTime = (percentClicked / 100) * videoRef.current.duration;
      
      videoRef.current.currentTime = seekTime;
    }
  };

  // Touch handlers for swipe navigation
  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart(e.touches[0].clientX); // Now tracking horizontal swipes
    setSwipeInProgress(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!touchStart) return;
    
    const touchX = e.touches[0].clientX;
    const diff = touchStart - touchX;
    
    if (Math.abs(diff) > 50) { // Slightly higher threshold for horizontal swipes
      if (diff > 0) {
        setSwipeDirection('down'); // Moving left to right (next)
      } else {
        setSwipeDirection('up'); // Moving right to left (previous)
      }
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !swipeDirection) {
      setSwipeInProgress(false);
      setTouchStart(null);
      setSwipeDirection(null);
      return;
    }
    
    if (swipeDirection === 'down' && currentIndex < videos.length - 1) {
      nextVideo();
    } else if (swipeDirection === 'up' && currentIndex > 0) {
      prevVideo();
    }
    
    setSwipeInProgress(false);
    setTouchStart(null);
    setSwipeDirection(null);
  };

  // Navigate to previous video
  const prevVideo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Navigate to next video
  const nextVideo = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Handle video end
  const handleVideoEnd = () => {
    setIsPlaying(false);
    if (currentIndex < videos.length - 1) {
      // Auto-advance to next video after a brief delay
      setTimeout(() => nextVideo(), 1500);
    }
  };

  // If there are no videos, display a message
  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-[80vh] bg-gray-100 text-gray-500">
        No videos available
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[90vh] bg-black relative">
      {/* Main video container with touch events */}
      <div 
        ref={containerRef}
        className="relative flex-grow flex items-center justify-center overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <video
          ref={videoRef}
          src={`http://localhost:8000${currentVideo.url}`}
          className="h-full max-h-[90vh] max-w-[90vw] mx-auto cursor-pointer object-contain"
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnd}
          playsInline
        />

        {/* Play/pause overlay button */}
        <div 
          className={`absolute inset-0 flex items-center justify-center cursor-pointer bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity ${isPlaying ? 'opacity-0' : 'opacity-100'}`}
          onClick={togglePlay}
        >
          {!isPlaying && (
            <div className="bg-primary bg-opacity-90 rounded-full p-4 transform transition-transform duration-300 hover:scale-110 shadow-lg">
              <svg 
                className="w-12 h-12 text-white" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
        </div>

        {/* Navigation controls - positioned at sides */}
        <div className="absolute inset-0 flex justify-between items-center px-4 pointer-events-none z-10">
          <button 
            onClick={prevVideo} 
            disabled={currentIndex === 0}
            className={`p-3 rounded-full bg-black/50 text-white pointer-events-auto transform transition-all duration-300 ${
              currentIndex === 0 
                ? 'opacity-30 cursor-not-allowed scale-75' 
                : 'opacity-70 hover:opacity-100 hover:scale-110 hover:bg-primary/90'
            }`}
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            onClick={nextVideo} 
            disabled={currentIndex === videos.length - 1}
            className={`p-3 rounded-full bg-black/50 text-white pointer-events-auto transform transition-all duration-300 ${
              currentIndex === videos.length - 1 
                ? 'opacity-30 cursor-not-allowed scale-75' 
                : 'opacity-70 hover:opacity-100 hover:scale-110 hover:bg-primary/90'
            }`}
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Video progress indicator (thin line at top) */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-900/50 z-20">
          <div 
            className="h-full bg-primary"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* Swipe indicators */}
        {swipeInProgress && swipeDirection === 'up' && (
          <div className="absolute left-10 top-1/2 transform -translate-y-1/2 bg-primary text-white px-4 py-2 rounded-full z-30 flex items-center gap-2 animate-pulse">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Previous Video</span>
          </div>
        )}
        
        {swipeInProgress && swipeDirection === 'down' && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2 bg-primary text-white px-4 py-2 rounded-full z-30 flex items-center gap-2 animate-pulse">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>Next Video</span>
          </div>
        )}
      </div>
      
      {/* Video info and controls */}
      <div className="bg-black text-white p-4 border-t border-gray-800">
        <div className="flex flex-col sm:flex-row justify-between mb-3 gap-2">
          <div className="flex-1">
            <h2 className="text-xl font-bold">{currentVideo.title}</h2>
            <p className="text-gray-300 text-sm mt-1 line-clamp-2">{currentVideo.description}</p>
          </div>
          <div className="flex items-start sm:items-center gap-2 text-gray-300">
            <div className="flex items-center justify-center rounded-full bg-primary/20 px-3 py-1 text-sm">
              {currentIndex + 1} / {videos.length}
            </div>
            
            {/* Play/Pause button */}
            <button 
              onClick={togglePlay}
              className="p-2 rounded-full bg-primary hover:bg-primary/90 text-white transition-colors"
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M10 18V6a1 1 0 00-1-1H7a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1zm7 0V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M10 18l8-6-8-6v12z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div 
          className="h-2 bg-gray-800 rounded-full mt-2 cursor-pointer overflow-hidden group"
          onClick={handleSeek}
        >
          <div 
            className="h-full bg-primary group-hover:bg-primary/90 relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
        </div>
        
        {/* Time display */}
        <div className="flex justify-between text-sm text-gray-400 mt-2">
          <div>{videoRef.current ? formatTime(videoRef.current.currentTime) : '0:00'}</div>
          <div>{formatTime(currentVideo.duration)}</div>
        </div>
      </div>
    </div>
  );
}