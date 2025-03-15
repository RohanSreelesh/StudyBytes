import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-3xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
        <h1 className="text-4xl font-bold mb-6 text-gray-800 dark:text-white">Welcome to CU Brainrot Assistant</h1>
        <p className="text-xl mb-8 max-w-2xl text-gray-600 dark:text-gray-300">
          Transform your learning materials into engaging, short-form educational videos tailored to your learning style.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
            <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Upload Your Materials
            </h3>
            <p className="text-blue-600 dark:text-blue-200 text-sm">Upload lecture slides, notes, textbooks, and other learning resources.</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
            <h3 className="font-semibold text-green-700 dark:text-green-300 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              Get Personalized Videos
            </h3>
            <p className="text-green-600 dark:text-green-200 text-sm">Our AI analyzes your materials and creates engaging short-form videos.</p>
          </div>
        </div>
        <Link 
          href="/upload-materials"
          className="px-6 py-3 bg-primary text-white rounded-full shadow-md hover:bg-opacity-90 hover:shadow-lg transform hover:scale-105 transition-all"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}
