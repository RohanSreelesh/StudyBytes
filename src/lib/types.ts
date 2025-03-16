export interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: number; // in seconds
  description?: string;
}

export interface ProcessingStatus {
  processingId: string;
  progress: number;
  status: string;
  complete: boolean;
  videos?: Video[];
}