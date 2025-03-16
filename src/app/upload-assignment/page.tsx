'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from '@/components/FileUpload';
import Link from 'next/link';

export default function UploadAssignment() {
  const router = useRouter();
  const [assignmentFiles, setAssignmentFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Clear any existing stored files on component mount
  useEffect(() => {
    sessionStorage.removeItem('assignmentFiles');
    sessionStorage.removeItem('generatedVideos');
  }, []);

  const handleFileAccepted = (files: File[]) => {
    setAssignmentFiles(files);
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (assignmentFiles.length === 0) {
      setErrorMessage('Please upload at least one assignment file');
      return;
    }

    setIsUploading(true);
    
    try {
      // Store files in session storage for later use
      // Since we can't store File objects directly, store metadata
      const fileInfoArray = assignmentFiles.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
      }));
      
      
      
      // Simulate a brief delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navigate to the learning materials upload page
      router.push('/upload-materials');
    } catch (error) {
      console.error('Error storing assignment files:', error);
      setErrorMessage('Failed to process files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className=" mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Upload Your Assignment</h1>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <FileUpload
          onFilesAccepted={handleFileAccepted}
          label="Upload Assignment"
          acceptedFileTypes=".pdf,.doc,.docx,.txt"
        />
        
        {assignmentFiles.length > 0 && (
          <div className="bg-green-50 p-4 rounded-md">
            <p className="text-green-800 font-medium">Files selected:</p>
            <ul className="list-disc pl-5 mt-2">
              {assignmentFiles.map((file, index) => (
                <li key={index} className="text-green-700">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {errorMessage && (
          <div className="bg-red-50 p-4 rounded-md text-red-700">
            {errorMessage}
          </div>
        )}
        
        <div className="flex items-center justify-between pt-4">
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to Home
          </Link>
          
          <button
            type="submit"
            disabled={isUploading}
            className={`px-6 py-3 bg-primary text-white rounded-md transition-all ${isUploading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-opacity-90'}`}
          >
            {isUploading ? 'Uploading...' : 'Continue to Learning Materials'}
          </button>
        </div>
      </form>
    </div>
  );
}
