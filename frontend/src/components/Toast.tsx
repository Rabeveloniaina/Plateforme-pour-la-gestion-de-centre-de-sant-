import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const ToastItem = ({ toast, onClose }: ToastProps) => {
  const duration = toast.duration || 5000;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, duration, onClose]);

  const config = {
    success: {
      icon: CheckCircle,
      bg: 'bg-white',
      border: 'border-l-4 border-emerald-500',
      iconColor: 'text-emerald-500',
      textColor: 'text-gray-900',
    },
    error: {
      icon: XCircle,
      bg: 'bg-white',
      border: 'border-l-4 border-rose-500',
      iconColor: 'text-rose-500',
      textColor: 'text-gray-900',
    },
    warning: {
      icon: AlertCircle,
      bg: 'bg-white',
      border: 'border-l-4 border-amber-500',
      iconColor: 'text-amber-500',
      textColor: 'text-gray-900',
    },
    info: {
      icon: Info,
      bg: 'bg-white',
      border: 'border-l-4 border-blue-500',
      iconColor: 'text-blue-500',
      textColor: 'text-gray-900',
    },
  };

  const { icon: Icon, bg, border, iconColor, textColor } = config[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95, transition: { duration: 0.2 } }}
      whileHover={{ scale: 1.02 }}
      className={`flex items-start gap-3 p-4 rounded-xl ${border} ${bg} shadow-lg backdrop-blur-sm min-w-[320px] max-w-[420px] relative overflow-hidden`}
    >
      {/* Barre de progression */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        className={`absolute bottom-0 left-0 h-1 ${
          toast.type === 'success' ? 'bg-emerald-500' :
          toast.type === 'error' ? 'bg-rose-500' :
          toast.type === 'warning' ? 'bg-amber-500' :
          'bg-blue-500'
        }`}
      />
      
      <div className={`flex-shrink-0 ${iconColor}`}>
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      
      <div className="flex-1 pt-0.5">
        <p className={`text-sm font-medium leading-relaxed ${textColor}`}>
          {toast.message}
        </p>
      </div>
      
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100"
        aria-label="Fermer"
      >
        <X className="w-4 h-4" strokeWidth={2} />
      </button>
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export const ToastContainer = ({ toasts, onClose }: ToastContainerProps) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onClose={onClose} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Hook pour utiliser les toasts
import { useState, useCallback } from 'react';

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string, duration?: number) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { id, type, message, duration };
    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    return showToast('success', message, duration);
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    return showToast('error', message, duration || 7000); // Erreurs plus longues
  }, [showToast]);

  const warning = useCallback((message: string, duration?: number) => {
    return showToast('warning', message, duration);
  }, [showToast]);

  const info = useCallback((message: string, duration?: number) => {
    return showToast('info', message, duration);
  }, [showToast]);

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info,
    ToastContainer: () => <ToastContainer toasts={toasts} onClose={removeToast} />,
  };
};

