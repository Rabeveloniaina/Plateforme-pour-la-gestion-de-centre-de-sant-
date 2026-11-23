import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

export default function App() {
	const { user } = useAuth();
	return (
		<Layout>
			<div className="max-w-6xl mx-auto">
				<h1 className="text-2xl font-bold mb-2">Bienvenue</h1>
				<p className="text-muted-foreground">Sélectionnez une section dans la navigation.</p>
				{user?.role === 'admin' && (
					<div className="mt-6 flex flex-wrap gap-3">
						<Link to="/dashboard" className="px-4 py-2 rounded border border-border hover:bg-muted">Accéder au dashboard</Link>
						<Link to="/stats" className="px-4 py-2 rounded border border-border hover:bg-muted">Statistiques</Link>
					</div>
				)}
			</div>
		</Layout>
	)
}
