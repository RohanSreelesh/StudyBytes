import { Video } from '@/lib/types';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';

interface VideoCardProps {
  video: Video;
  index: number;
}

export default function VideoCard({ video, index }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);

  // Format the duration to MM:SS
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Pause video when not hovering
    if (!isHovering && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isHovering]);

  const handleMouseEnter = () => {
    setIsHovering(true);
    // Play video on hover, but muted
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = true;
      videoRef.current.play().catch(err => console.error('Failed to play video:', err));
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <Link href={`/video-player?index=${index}`}>
        <div 
          className="relative cursor-pointer group aspect-[3/4] overflow-hidden" 
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {!thumbnailLoaded && (
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}

          <video 
            ref={videoRef}
            src={`http://localhost:8000${video.url}`} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            preload="metadata"
            muted
            playsInline
            onLoadedData={() => setThumbnailLoaded(true)}
            onError={() => {
              // If video fails to load, use a placeholder
              console.error('Video failed to load:', video.url);
            }}
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="p-3 bg-primary/90 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-300">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent py-2 px-3">
            <h3 className="font-bold text-white text-lg tracking-tight truncate">{video.title}</h3>
          </div>
          
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
            {formatDuration(video.duration)}
          </div>
        </div>
      </Link>
      
      <div className="p-4 dark:text-gray-200">
        {video.description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">{video.description}</p>
        )}
        
        <div className="flex flex-wrap gap-2">
          <Link 
            href={`/video-player?index=${index}`}
            className="flex-1 text-center px-3 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90 transition-all"
          >
            <span className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Short-Form
            </span>
          </Link>
          
          <a 
            href={`http://localhost:8000${video.url}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 text-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
          >
            <span className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Full Video
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}