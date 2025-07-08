import { useState, useCallback } from 'react';

interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = useCallback((props: ToastProps) => {
    // For now, just console.log the toast
    // In a real app, this would show a toast notification
    console.log('Toast:', props);
    
    setToasts(prev => [...prev, props]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t !== props));
    }, 5000);
  }, []);

  return { toast };
};