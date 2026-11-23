import { useAuth } from '../context/AuthContext';

export interface Permissions {
  // Ministère - Accès complet
  canViewAllCenters: boolean;
  canViewAllStats: boolean;
  canManageUsers: boolean;
  canViewNationalReports: boolean;
  
  // Admin Centre - Gestion de son centre uniquement
  canManageOwnCenter: boolean;
  canViewOwnCenterStats: boolean;
  canManageOwnCenterUsers: boolean;
  canViewOwnCenterReports: boolean;
  
  // Médecin - Consultations et patients de son centre
  canViewOwnPatients: boolean;
  canCreateConsultations: boolean;
  canViewOwnSchedule: boolean;
  canPrescribeMedications: boolean;
  
  // Personnel - Accueil et gestion des RDV
  canManageAppointments: boolean;
  canCheckInPatients: boolean;
  canViewTodaySchedule: boolean;
  canRegisterNewPatients: boolean;
  
  // Patient - Ses propres informations
  canViewOwnProfile: boolean;
  canEditOwnProfile: boolean;
  canBookAppointments: boolean;
  canViewOwnAppointments: boolean;
  canViewOwnMedicalRecords: boolean;
  
  // Informations sur le centre
  userCentreId: number | null;
  userCentreName: string | null;
  isLinkedToCentre: boolean;
}

export const usePermissions = (): Permissions => {
  const { user } = useAuth();
  const role = user?.role;
  const centreId = user?.id_centre;
  const centreName = user?.centre_name;

  const permissions: Permissions = {
    // Ministère - Accès complet
    canViewAllCenters: role === 'ministere',
    canViewAllStats: role === 'ministere',
    canManageUsers: role === 'ministere',
    canViewNationalReports: role === 'ministere',
    
    // Admin Centre - Gestion de son centre uniquement
    canManageOwnCenter: role === 'admin_centre' || role === 'ministere',
    canViewOwnCenterStats: role === 'admin_centre' || role === 'ministere',
    canManageOwnCenterUsers: role === 'admin_centre' || role === 'ministere',
    canViewOwnCenterReports: role === 'admin_centre' || role === 'ministere',
    
    // Médecin - Consultations et patients de son centre
    canViewOwnPatients: role === 'medecin' || role === 'admin_centre' || role === 'ministere',
    canCreateConsultations: role === 'medecin' || role === 'admin_centre' || role === 'ministere',
    canViewOwnSchedule: role === 'medecin' || role === 'admin_centre' || role === 'ministere',
    canPrescribeMedications: role === 'medecin' || role === 'admin_centre' || role === 'ministere',
    
    // Personnel - Accueil et gestion des RDV
    canManageAppointments: role === 'personnel' || role === 'admin_centre' || role === 'ministere',
    canCheckInPatients: role === 'personnel' || role === 'admin_centre' || role === 'ministere',
    canViewTodaySchedule: role === 'personnel' || role === 'admin_centre' || role === 'ministere',
    canRegisterNewPatients: role === 'personnel' || role === 'admin_centre' || role === 'ministere',
    
    // Patient - Ses propres informations
    canViewOwnProfile: role === 'patient' || role === 'medecin' || role === 'admin_centre' || role === 'ministere',
    canEditOwnProfile: role === 'patient',
    canBookAppointments: role === 'patient',
    canViewOwnAppointments: role === 'patient' || role === 'medecin' || role === 'admin_centre' || role === 'ministere',
    canViewOwnMedicalRecords: role === 'patient' || role === 'medecin' || role === 'admin_centre' || role === 'ministere',
    
    // Informations sur le centre
    userCentreId: centreId || null,
    userCentreName: centreName || null,
    isLinkedToCentre: !!centreId,
  };

  return permissions;
};

export default usePermissions;
