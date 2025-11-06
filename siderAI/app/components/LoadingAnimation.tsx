'use client';

interface LoadingAnimationProps {
  className?: string;
}

export default function LoadingAnimation({ className = '' }: LoadingAnimationProps) {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 ${className}`}>
      <div className="text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Loading...
          </div>
        </div>
      </div>
    </div>
  );
}

