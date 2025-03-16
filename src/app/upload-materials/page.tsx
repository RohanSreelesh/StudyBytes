'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from '@/components/FileUpload';
import Link from 'next/link';
import { processFiles, checkAPIHealth, cleanupDirectories } from '@/lib/api';

export default function UploadMaterials() {
  const router = useRouter();
  const [materialFiles, setMaterialFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [apiAvailable, setApiAvailable] = useState(true);

  useEffect(() => {
    // Clear any previous videos from session storage
    sessionStorage.removeItem('generatedVideos');
    
    // Run cleanup to delete temp directories
    const runCleanup = async () => {
      try {
        const cleanupSuccess = await cleanupDirectories();
        if (!cleanupSuccess) {
          console.warn('Directory cleanup failed, but continuing anyway');
        }
      } catch (error) {
        console.error('Error during cleanup:', error);
        // Continue execution even if cleanup fails
      }
    };
    
    // Check if API is available
    const checkAPI = async () => {
      const isHealthy = await checkAPIHealth();
      setApiAvailable(isHealthy);
      if (!isHealthy) {
        setErrorMessage('Backend API is not available. Please try again later or contact support.');
      }
    };
    
    // Run both operations when component mounts
    runCleanup();
    checkAPI();
  }, []);

  const handleFileAccepted = (files: File[]) => {
    setMaterialFiles(prev => [...prev, ...files]);
    setErrorMessage('');
  };

  const removeFile = (index: number) => {
    setMaterialFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiAvailable) {
      setErrorMessage('Backend API is not available. Please try again later or contact support.');
      return;
    }
    
    if (materialFiles.length === 0) {
      setErrorMessage('Please upload at least one learning material.');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Start the processing task and get a processing ID
      const result = await processFiles([], materialFiles);
      
      // Store the processing ID in session storage
      sessionStorage.setItem('processingId', result.processingId);
      
      // Navigate to processing page to show progress
      router.push('/processing');
    } catch (error) {
      console.error('Error processing files:', error);
      setErrorMessage('Failed to process files. Please try again or contact support.');
      setIsUploading(false);
    }
  };

  return (
    <div className="mx-auto py-12 px-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md">
        <h1 className="text-3xl font-bold mb-4 text-center text-gray-800 dark:text-white">Upload Your Learning Materials</h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
          Upload lecture slides, notes, textbooks, or any other educational content to have them transformed into engaging, short-form educational videos.
        </p>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 mb-8">
          <h3 className="font-medium text-blue-700 dark:text-blue-300 flex items-center mb-2">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Tips for best results
          </h3>
          <ul className="text-sm text-blue-600 dark:text-blue-200 space-y-1">
            <li className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Upload PDF files of lecture slides or presentations
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Include textbook chapters or reading materials for more context
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Add personal notes to help tailor content to your learning style
            </li>
          </ul>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <FileUpload
            onFilesAccepted={handleFileAccepted}
            label="Upload Learning Materials"
            acceptedFileTypes=".pdf,.ppt,.pptx,.doc,.docx,.txt,.jpg,.png"
            maxFiles={5}
          />
          
          {materialFiles.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-lg border border-blue-100 dark:border-blue-800">
              <p className="font-medium text-blue-800 dark:text-blue-300 mb-3">Materials selected:</p>
              <ul className="pl-0 mt-2 space-y-2 max-h-60 overflow-y-auto">
                {materialFiles.map((file, index) => (
                  <li key={index} className="flex justify-between items-center border-b border-blue-100 dark:border-blue-800 pb-2">
                    <span className="text-blue-700 dark:text-blue-300 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {errorMessage && (
            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errorMessage}
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-4">
            <Link
              href="/"
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
            
            <button
              type="submit"
              disabled={isUploading || !apiAvailable || materialFiles.length === 0}
              className={`px-6 py-3 bg-primary text-white rounded-lg shadow-md transition-all ${
                (isUploading || !apiAvailable || materialFiles.length === 0) 
                ? 'opacity-70 cursor-not-allowed' 
                : 'hover:bg-opacity-90 hover:shadow-lg transform hover:scale-105'
              }`}
            >
              {isUploading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : 'Generate My Videos'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
