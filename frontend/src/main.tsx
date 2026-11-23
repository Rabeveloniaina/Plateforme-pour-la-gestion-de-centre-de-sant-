import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import './index.css'
import App from './pages/App'
import LoginSimple from './pages/LoginSimple'
import Register from './pages/Register'
import BookAppointment from './pages/BookAppointment'
import Patients from './pages/Patients'
import Medecins from './pages/Medecins'
import RendezVous from './pages/RendezVous'
import Centres from './pages/Centres'
import DashboardRedirect from './components/DashboardRedirect'
import Users from './pages/Users'
import PatientDetail from './pages/PatientDetail'
import MedecinDetail from './pages/MedecinDetail'
import RendezVousDetail from './pages/RendezVousDetail'
import CentreDetail from './pages/CentreDetail'
import PatientForm from './pages/PatientForm'
import PatientFormNew from './pages/PatientFormNew'
import MedecinForm from './pages/MedecinForm'
import CentreForm from './pages/CentreForm'
import RendezVousForm from './pages/RendezVousForm'
import BookAppointmentNew from './pages/BookAppointmentNew'
import { AuthProvider, useAuth } from './context/AuthContext'
import Stats from './pages/Stats'
import FichesMedicales from './pages/FichesMedicales'
import Medicaments from './pages/Medicaments'
import Prescriptions from './pages/Prescriptions'
import Vaccinations from './pages/Vaccinations'
import Notifications from './pages/Notifications'
import { ToastProvider } from './context/ToastContext'
import Toaster from './components/Toaster'
import RoleProtected from './components/RoleProtected'

// Portails spécialisés
import MinistereDashboard from './pages/MinistereDashboard'
import AdminDashboard from './pages/AdminDashboard'
import MedecinDashboard from './pages/MedecinDashboard'
import PatientDashboard from './pages/PatientDashboard'
import PersonnelDashboard from './pages/PersonnelDashboard'
import PersonnelDashboardSimple from './pages/PersonnelDashboardSimple'
import MedicalRecordForm from './pages/MedicalRecordForm'
import CompletePatientProfile from './pages/CompletePatientProfile'

// Nouvelles pages pour fonctionnalités médicales
import VaccinationForm from './pages/VaccinationForm'
import MedicamentForm from './pages/MedicamentForm'
import PrescriptionForm from './pages/PrescriptionForm'
import PrescriptionDetail from './pages/PrescriptionDetail'
import FicheMedicaleForm from './pages/FicheMedicaleForm'
import Configuration from './pages/Configuration'
import LayoutTest from './pages/LayoutTest'

function Protected({ children }: { children: React.ReactNode }) {
	const { isAuthenticated } = useAuth();
	if (!isAuthenticated) return <Navigate to="/login" replace />
	return <>{children}</>
}

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginSimple /> },
  { path: '/register', element: <Register /> },
	
	// Portails spécialisés
	{ path: '/ministere/dashboard', element: <RoleProtected requiredRole="ministere"><MinistereDashboard /></RoleProtected> },
	{ path: '/admin/dashboard', element: <RoleProtected requiredRole="admin_centre"><AdminDashboard /></RoleProtected> },
	{ path: '/medecin/dashboard', element: <RoleProtected requiredRole="medecin"><MedecinDashboard /></RoleProtected> },
	{ path: '/personnel/dashboard', element: <RoleProtected requiredRole="personnel"><PersonnelDashboard /></RoleProtected> },
	{ path: '/patient/dashboard', element: <RoleProtected requiredRole="patient"><PatientDashboard /></RoleProtected> },
	
	// Fonctionnalités patients
	{ path: '/patient/book-appointment', element: <RoleProtected requiredRole="patient"><BookAppointmentNew /></RoleProtected> },
	{ path: '/patient/complete-profile', element: <RoleProtected requiredRole="patient"><CompletePatientProfile /></RoleProtected> },
	{ path: '/patient/medical-record', element: <RoleProtected requiredRole="patient"><MedicalRecordForm /></RoleProtected> },
	
	// Redirection automatique vers le bon dashboard selon le rôle
	{ path: '/dashboard', element: <Protected><DashboardRedirect /></Protected> },
	{ path: '/patients', element: <Protected><Patients /></Protected> },
	{ path: '/patients/nouveau', element: <Protected><PatientFormNew /></Protected> },
	{ path: '/patients/:id', element: <Protected><PatientDetail /></Protected> },
	{ path: '/patients/:id/modifier', element: <Protected><PatientFormNew /></Protected> },
	{ path: '/medecins', element: <Protected><Medecins /></Protected> },
	{ path: '/medecins/nouveau', element: <Protected><MedecinForm /></Protected> },
	{ path: '/medecins/:id', element: <Protected><MedecinDetail /></Protected> },
	{ path: '/medecins/:id/modifier', element: <Protected><MedecinForm /></Protected> },
	{ path: '/rendez-vous', element: <Protected><RendezVous /></Protected> },
	{ path: '/rendez-vous/nouveau', element: <Protected><RendezVousForm /></Protected> },
	{ path: '/rendez-vous/:id', element: <Protected><RendezVousDetail /></Protected> },
	{ path: '/rendez-vous/:id/modifier', element: <Protected><RendezVousForm /></Protected> },
	{ path: '/centres', element: <Protected><Centres /></Protected> },
	{ path: '/centres/nouveau', element: <Protected><CentreForm /></Protected> },
	{ path: '/centres/:id', element: <Protected><CentreDetail /></Protected> },
	{ path: '/centres/:id/modifier', element: <Protected><CentreForm /></Protected> },
	{ path: '/utilisateurs', element: <Protected><Users /></Protected> },
	{ path: '/configuration', element: <Protected><Configuration /></Protected> },
	{ path: '/stats', element: <Protected><Stats /></Protected> },
	{ path: '/test-layout', element: <Protected><LayoutTest /></Protected> },
	
	// Nouvelles routes pour les fonctionnalités médicales
	{ path: '/fiches-medicales', element: <Protected><FichesMedicales /></Protected> },
	{ path: '/fiches-medicales/nouvelle', element: <Protected><FicheMedicaleForm /></Protected> },
	{ path: '/fiches-medicales/:id', element: <Protected><PatientDetail /></Protected> },
	{ path: '/fiches-medicales/:id/modifier', element: <Protected><FicheMedicaleForm /></Protected> },
	
	// Routes pour les consultations (fiches de consultation créées par médecins)
	{ path: '/consultations/nouvelle', element: <Protected><FicheMedicaleForm /></Protected> },
	{ path: '/consultations/:id', element: <Protected><PatientDetail /></Protected> },
	{ path: '/consultations/:id/modifier', element: <Protected><FicheMedicaleForm /></Protected> },
	
	{ path: '/medicaments', element: <Protected><Medicaments /></Protected> },
	{ path: '/medicaments/nouveau', element: <Protected><MedicamentForm /></Protected> },
	{ path: '/medicaments/statistiques', element: <Protected><Stats /></Protected> },
	{ path: '/medicaments/:id', element: <Protected><Medicaments /></Protected> },
	{ path: '/medicaments/:id/modifier', element: <Protected><MedicamentForm /></Protected> },
	
	{ path: '/prescriptions', element: <Protected><Prescriptions /></Protected> },
	{ path: '/prescriptions/nouvelle', element: <Protected><PrescriptionForm /></Protected> },
	{ path: '/prescriptions/interactions', element: <Protected><Prescriptions /></Protected> },
	{ path: '/prescriptions/:id', element: <Protected><PrescriptionDetail /></Protected> },
	{ path: '/prescriptions/:id/modifier', element: <Protected><PrescriptionForm /></Protected> },
	
	{ path: '/vaccinations', element: <Protected><Vaccinations /></Protected> },
	{ path: '/vaccinations/nouvelle', element: <Protected><VaccinationForm /></Protected> },
	{ path: '/vaccinations/statistiques', element: <Protected><Stats /></Protected> },
	{ path: '/vaccinations/:id', element: <Protected><Vaccinations /></Protected> },
	{ path: '/vaccinations/:id/administrer', element: <Protected><VaccinationForm /></Protected> },
	{ path: '/vaccinations/:id/rappel', element: <Protected><VaccinationForm /></Protected> },
	{ path: '/vaccinations/:id/modifier', element: <Protected><VaccinationForm /></Protected> },
	
	{ path: '/notifications', element: <Protected><Notifications /></Protected> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<ToastProvider>
			<AuthProvider>
				<RouterProvider router={router} />
				<Toaster />
			</AuthProvider>
		</ToastProvider>
	</React.StrictMode>,
)
