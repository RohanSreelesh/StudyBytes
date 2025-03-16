import { Video } from './types';

const API_URL = 'http://localhost:8000/api';

export async function processFiles(
  assignmentFiles: File[] = [],
  materialFiles: File[] = []
): Promise<Video[]> {
  const formData = new FormData();
  
  // Add material files
  materialFiles.forEach((file) => {
    formData.append('material_files', file);
  });
  
  try {
    const response = await fetch(`${API_URL}/process-materials`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to process files');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error processing files:', error);
    throw error;
  }
}

export async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}

export async function cleanupDirectories() {
  try {
    const response = await fetch(`${API_URL}/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    return data.status === 'success';
  } catch (error) {
    console.error('Cleanup request failed:', error);
    return false;
  }
}