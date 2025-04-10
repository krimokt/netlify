// Temporary mock implementation of react-hot-toast
// Replace with actual react-hot-toast when npm install works

type ToastOptions = {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
};

const defaultToastOptions: ToastOptions = {
  duration: 4000,
  position: 'bottom-center',
};

const showToast = (message: string, type: 'success' | 'error' | 'loading', options?: ToastOptions) => {
  console.log(`[Toast ${type}]:`, message);

  if (typeof window !== 'undefined') {
    // Create temporary DOM toast notification
    const toast = document.createElement('div');
    toast.className = `fixed ${(options?.position || defaultToastOptions.position)?.replace('-', ' ')} px-4 py-2 rounded-md text-white transform transition-all duration-300 ease-in-out`;
    
    if (type === 'success') {
      toast.className += ' bg-green-500';
    } else if (type === 'error') {
      toast.className += ' bg-red-500';
    } else {
      toast.className += ' bg-blue-500';
    }

    toast.textContent = message;
    document.body.appendChild(toast);

    // Remove toast after duration
    setTimeout(() => {
      toast.className += ' opacity-0';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, options?.duration || defaultToastOptions.duration);
  }
};

export const toast = {
  success: (message: string, options?: ToastOptions) => showToast(message, 'success', options),
  error: (message: string, options?: ToastOptions) => showToast(message, 'error', options),
  loading: (message: string, options?: ToastOptions) => showToast(message, 'loading', options),
  custom: (message: string, options?: ToastOptions) => showToast(message, 'success', options),
  dismiss: () => {
    console.log('[Toast]: Dismissed all toasts');
    // In real implementation this would remove all active toasts
  },
}; 