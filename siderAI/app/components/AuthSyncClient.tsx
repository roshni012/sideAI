"use client";

import { useEffect } from 'react';
import { syncAuthFromExtension } from '../lib/authService';

export default function AuthSyncClient() {
  useEffect(() => {
    syncAuthFromExtension();
  }, []);

  return null;
}
