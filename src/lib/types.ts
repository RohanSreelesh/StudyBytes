export interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: number; // in seconds
  description?: string;
}