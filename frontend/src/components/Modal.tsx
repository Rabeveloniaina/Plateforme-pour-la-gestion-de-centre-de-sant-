export default function Modal({ open, title, onClose, children, isOpen }: { open?: boolean; title: string; onClose: () => void; children: React.ReactNode; isOpen?: boolean }) {
	if (!open && !isOpen) return null
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="absolute inset-0 bg-black/40" onClick={onClose} />
			<div className="relative bg-white rounded shadow-lg w-[90%] max-w-lg p-4">
				<div className="flex items-center justify-between mb-3">
					<h2 className="text-lg font-semibold">{title}</h2>
					<button onClick={onClose} className="text-gray-500 hover:text-gray-800">✕</button>
				</div>
				<div className="text-sm">
					{children}
				</div>
			</div>
		</div>
	)
}


