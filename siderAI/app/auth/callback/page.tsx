'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('authToken', token);
      router.push('/');
    }
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center text-lg font-semibold">
      Authenticating with Google...
    </div>
  );
}
