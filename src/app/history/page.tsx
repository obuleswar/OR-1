
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HistoryRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect all history traffic to the new integrated wallet activity view
    router.replace('/dashboard');
  }, [router]);

  return null;
}
