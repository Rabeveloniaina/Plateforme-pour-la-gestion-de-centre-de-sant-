export default function EmptyState({ title = 'Aucune donnée', description, action }: { title?: string; description?: string; action?: React.ReactNode }) {
	return (
		<div className="bg-gray-50 border border-dashed rounded p-6 text-center text-gray-600">
			<div className="text-lg font-medium mb-1">{title}</div>
			{description ? <div className="text-sm opacity-80">{description}</div> : null}
			{action ? <div className="mt-4">{action}</div> : null}
		</div>
	)
}
