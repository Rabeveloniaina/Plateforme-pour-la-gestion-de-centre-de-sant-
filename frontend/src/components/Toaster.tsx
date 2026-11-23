import { useToast } from '../context/ToastContext'

export default function Toaster() {
	const { toasts, removeToast } = useToast()
	return (
		<div className="fixed top-4 right-4 z-50 space-y-2">
			{toasts.map(t => (
				<div key={t.id} className={`min-w-[260px] max-w-sm rounded shadow px-4 py-2 text-white ${t.type === 'error' ? 'bg-red-600' : t.type === 'success' ? 'bg-green-600' : 'bg-gray-800'}`}>
					<div className="flex items-start justify-between gap-4">
						<div>{t.message}</div>
						<button onClick={() => removeToast(t.id)} className="opacity-80 hover:opacity-100">✕</button>
					</div>
				</div>
			))}
		</div>
	)
}
