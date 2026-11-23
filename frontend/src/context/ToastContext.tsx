import { createContext, useCallback, useContext, useMemo, useState } from 'react'

export type Toast = { id: number; message: string; type?: 'info' | 'error' | 'success' }

type ToastContextType = {
	toasts: Toast[];
	showToast: (message: string, type?: Toast['type']) => void;
	removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([])

	const removeToast = useCallback((id: number) => {
		setToasts(prev => prev.filter(t => t.id !== id))
	}, [])

	const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
		const id = Date.now() + Math.floor(Math.random() * 1000)
		setToasts(prev => [...prev, { id, message, type }])
		setTimeout(() => removeToast(id), type === 'error' ? 7000 : 4000)
	}, [removeToast])

	const value = useMemo(() => {
		// Exposer le contexte globalement pour api.ts
		if (typeof window !== 'undefined') {
			(window as any).__toastContext = { showToast };
		}
		return { toasts, showToast, removeToast };
	}, [toasts, showToast, removeToast])
	
	return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
	const ctx = useContext(ToastContext)
	if (!ctx) throw new Error('useToast must be used within ToastProvider')
	return ctx
}
