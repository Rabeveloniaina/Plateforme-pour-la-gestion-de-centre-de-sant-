export function formatDateTime(value: string | number | Date) {
	try {
		const d = new Date(value)
		return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d)
	} catch {
		return String(value)
	}
}

export function formatDate(value: string | number | Date) {
	try {
		const d = new Date(value)
		return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(d)
	} catch {
		return String(value)
	}
}

