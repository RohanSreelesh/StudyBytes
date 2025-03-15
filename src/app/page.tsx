import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-4xl font-bold mb-6">Welcome to CU Brainrot Assistant</h1>
      <p className="text-xl mb-8 max-w-2xl">
        Transform your academic assignments into engaging, short-form educational videos tailored to your learning needs.
      </p>
      <Link 
        href="/upload-assignment"
        className="px-6 py-3 bg-primary text-white rounded-md hover:bg-opacity-90 transition-all"
      >
        Get Started
      </Link>
    </div>
  );
}
