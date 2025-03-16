'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkProcessingStatus } from '@/lib/api';

export default function ProcessingPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Starting processing...');
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    // Get processing ID from session storage
    const id = sessionStorage.getItem('processingId');
    if (!id) {
      router.push('/upload-materials');
      return;
    }
    
    setProcessingId(id);
    
    // Set up polling for status updates
    const intervalId = setInterval(async () => {
      try {
        const statusData = await checkProcessingStatus(id);
        setProgress(statusData.progress);
        setStatus(statusData.status);
        
        // If processing is complete, navigate to results
        if (statusData.complete) {
          clearInterval(intervalId);
          sessionStorage.setItem('generatedVideos', JSON.stringify(statusData.videos || []));
          router.push('/results');
        }
      } catch (err) {
        console.error('Error checking processing status:', err);
        setError('Failed to get processing updates. Please try again.');
      }
    }, 1500);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [router]);

  return (
    <div className="mx-auto py-12 px-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md max-w-xl w-full">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">Processing Your Materials</h1>
        
        {error ? (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-700 dark:text-red-300 mb-6">
            <p className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
            <button 
              onClick={() => router.push('/upload-materials')}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300 text-center mb-2">{status}</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-2">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-blue-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-right text-gray-500 dark:text-gray-400">{progress}% complete</p>
            </div>
            
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-100 dark:border-blue-800">
                <h3 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Creating your educational videos</h3>
                <ul className="text-sm text-blue-600 dark:text-blue-200 space-y-2">
                  <li className="flex items-start">
                    <svg className={`w-4 h-4 mr-2 mt-0.5 ${progress >= 10 ? 'text-green-500' : 'text-blue-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {progress >= 10 ? 
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> :
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      }
                    </svg>
                    Analyzing your learning materials
                  </li>
                  <li className="flex items-start">
                    <svg className={`w-4 h-4 mr-2 mt-0.5 ${progress >= 20 ? 'text-green-500' : 'text-blue-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {progress >= 20 ? 
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> :
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      }
                    </svg>
                    Extracting key concepts
                  </li>
                  <li className="flex items-start">
                    <svg className={`w-4 h-4 mr-2 mt-0.5 ${progress >= 30 ? 'text-green-500' : 'text-blue-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {progress >= 30 ? 
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> :
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      }
                    </svg>
                    Generating educational content
                  </li>
                  <li className="flex flex-col items-start">
                    <div className="flex items-center">
                      <svg className={`w-4 h-4 mr-2 mt-0.5 ${progress >= 50 ? 'text-green-500' : 'text-blue-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {progress >= 50 ? 
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> :
                          progress >= 30 ? 
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 8l-7 7-7-7" /> :
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        }
                      </svg>
                      <span>Creating audio narration</span>
                    </div>
                    
                    {/* Show audio creation progress details when in this stage */}
                    {progress >= 30 && progress < 50 && (
                      <div className="pl-6 mt-2 w-full space-y-1.5">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div 
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, ((progress - 30) / 20) * 100)}%` }}
                          ></div>
                        </div>
                        
                        {/* Extract audio count from status if possible */}
                        {status.includes("Creating audio narration") && (
                          <p className="text-xs text-blue-600 dark:text-blue-300">
                            {status.replace("Creating audio narration", "Audio").replace(":", " -")}
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                  <li className="flex flex-col items-start">
                    <div className="flex items-center">
                      <svg className={`w-4 h-4 mr-2 mt-0.5 ${progress >= 50 ? 'text-green-500' : 'text-blue-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {progress >= 95 ? 
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> :
                          progress >= 50 ? 
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 8l-7 7-7-7" /> :
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        }
                      </svg>
                      <span>Building videos with background visuals</span>
                    </div>
                    
                    {/* Show video creation progress details when in this stage */}
                    {progress >= 50 && progress < 95 && (
                      <div className="pl-6 mt-2 w-full space-y-1.5">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div 
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, ((progress - 50) / 45) * 100)}%` }}
                          ></div>
                        </div>
                        
                        {/* Extract video count and current video from status if possible */}
                        {status.includes("Creating video") && (
                          <p className="text-xs text-blue-600 dark:text-blue-300">
                            {status.replace("Creating video ", "Video ").replace(":", " -")}
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                  <li className="flex items-start">
                    <svg className={`w-4 h-4 mr-2 mt-0.5 ${progress >= 95 ? 'text-green-500' : 'text-blue-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {progress >= 95 ? 
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> :
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      }
                    </svg>
                    Finalizing your videos
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}