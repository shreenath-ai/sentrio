'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js');
    }
    if (navigator.storage?.persist) {
      void navigator.storage.persist();
    }
  }, []);
  return null;
}
