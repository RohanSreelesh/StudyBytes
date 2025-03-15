'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from '@/components/FileUpload';
import Link from 'next/link';

export default function UploadMaterials() {
  const router = useRouter();
  const [materialFiles, setMaterialFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileAccepted = (files: File[]) => {
    setMaterialFiles(prev => [...prev, ...files]);
    setErrorMessage('');
  };

  const removeFile = (index: number) => {
    setMaterialFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Materials are optional, so we don't need to check if files were uploaded
    
    setIsUploading(true);
    
    try {
      // In a real app, you would upload the files to your backend here
      // For now, we'll just simulate a delay and redirect to a success page
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, you would call your backend API to process the files here
      // For now, we'll just simulate a success and show a processing message
      alert('Your materials have been uploaded successfully! Your personalized video will be generated soon.');
      
      // Navigate back to home
      router.push('/');
    } catch (error) {
      console.error('Error uploading materials:', error);
      setErrorMessage('Failed to upload materials. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Upload Learning Materials</h1>
      <p className="text-center text-gray-600 mb-8">
        Upload any learning materials like lecture slides, notes, or textbook pages to help create a more personalized video.
        <span className="block mt-2 italic">This step is optional but recommended for better results.</span>
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <FileUpload
          onFilesAccepted={handleFileAccepted}
          label="Upload Learning Materials"
          acceptedFileTypes=".pdf,.ppt,.pptx,.doc,.docx,.txt,.jpg,.png"
          maxFiles={5}
        />
        
        {materialFiles.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-blue-800 font-medium">Learning materials selected:</p>
            <ul className="pl-0 mt-2 space-y-1">
              {materialFiles.map((file, index) => (
                <li key={index} className="flex justify-between items-center border-b pb-1">
                  <span className="text-blue-700">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
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
            href="/upload-assignment"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to Assignment Upload
          </Link>
          
          <button
            type="submit"
            disabled={isUploading}
            className={`px-6 py-3 bg-primary text-white rounded-md transition-all ${isUploading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-opacity-90'}`}
          >
            {isUploading ? 'Processing...' : materialFiles.length > 0 ? 'Generate My Video' : 'Skip & Generate Video'}
          </button>
        </div>
      </form>
    </div>
  );
}
