// Types pour les nouvelles fonctionnalités médicales
export interface FicheMedicale {
	id_fiche: number;
	patient_id: number;
	medecin_id: number;
	date_consultation: string;
	poids?: number;
	taille?: number;
	tension_systolique?: number;
	tension_diastolique?: number;
	temperature?: number;
	frequence_cardiaque?: number;
	symptomes?: string[];
	diagnostic_principal?: string;
	diagnostics_secondaires?: string[];
	observations_medecin?: string;
	recommandations?: string;
	suivi_necessaire?: boolean;
	date_prochain_rdv?: string;
	statut: 'brouillon' | 'termine' | 'annule';
	patient_nom?: string;
	patient_prenom?: string;
	medecin_nom?: string;
	medecin_prenom?: string;
	centre_nom?: string;
	prescriptions?: Prescription[];
}

export interface Medicament {
	id_medicament: number;
	nom_commercial: string;
	denomination_commune: string;
	dci?: string;
	forme_pharmaceutique: string;
	dosage: string;
	unite_dosage?: string;
	fabricant?: string;
	code_atc?: string;
	prix_unitaire?: number;
	contre_indications?: string;
	effets_secondaires?: string;
	interactions?: string;
	statut: 'actif' | 'inactif';
}

export interface Prescription {
	id_prescription: number;
	fiche_medicale_id: number;
	medicament_id: number;
	dosage_prescrit: string;
	frequence: string;
	duree_traitement: number;
	quantite_totale: number;
	instructions_specifiques?: string;
	moment_prise: string;
	date_debut: string;
	date_fin: string;
	statut: 'active' | 'terminee' | 'arretee' | 'suspendue';
	raison_arret?: string;
	medicament_nom?: string;
	medicament_denomination?: string;
	medicament_forme?: string;
	patient_nom?: string;
	patient_prenom?: string;
	medecin_nom?: string;
	medecin_prenom?: string;
	date_consultation?: string;
}

export interface Vaccination {
	id_vaccination: number;
	patient_id: number;
	medecin_id?: number;
	nom_vaccin: string;
	type_vaccin: 'obligatoire' | 'recommande' | 'voyage' | 'professionnel';
	date_administration: string;
	numero_lot?: string;
	lot_vaccin?: string;
	fabricant?: string;
	date_expiration?: string;
	site_injection?: string;
	voie_administration?: string;
	reactions_adverses?: string;
	date_rappel?: string;
	date_rappel_prevu?: string;
	statut: 'planifie' | 'administre' | 'reporte' | 'annule' | 'contre_indique';
	patient_nom?: string;
	patient_prenom?: string;
	medecin_nom?: string;
	medecin_prenom?: string;
	centre_nom?: string;
}

// Types pour les utilisateurs
export interface User {
	id_user: number;
	nom_utilisateur: string;
	email: string;
	role: 'admin' | 'medecin' | 'personnel' | 'patient';
	statut: 'actif' | 'inactif';
	created_at?: string;
	updated_at?: string;
}

// Types pour les notifications
export interface Notification {
	id: number;
	patient_id?: number;
	medecin_id?: number;
	type: string;
	titre?: string;
	message: string;
	statut: 'en_attente' | 'envoyee' | 'envoye' | 'echec';
	lu: boolean;
	created_at: string;
	date_envoi?: string;
	tentatives?: number;
	patient_nom?: string;
	patient_prenom?: string;
	medecin_nom?: string;
	medecin_prenom?: string;
}

// Types pour les réponses API
export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	message?: string;
	error?: string;
	pagination?: {
		page: number;
		limit: number;
		total: number;
		pages: number;
	};
}

// Types pour les statistiques
export interface Statistiques {
	total_consultations?: number;
	consultations_terminees?: number;
	poids_moyen?: number;
	tension_systolique_moy?: number;
	patients_suivi_necessaire?: number;
	total_patients?: number;
	patients_actifs?: number;
	patients_inactifs?: number;
	total_medecins?: number;
	medecins_actifs?: number;
	medecins_conges?: number;
	experience_moyenne?: number;
	total_medicaments?: number;
	medicaments_actifs?: number;
	medicaments_inactifs?: number;
	total_prescriptions?: number;
	prescriptions_actives?: number;
	prescriptions_terminees?: number;
	prescriptions_arretees?: number;
	duree_moyenne_traitement?: number;
	total_vaccinations?: number;
	vaccinations_administrees?: number;
	vaccinations_reportees?: number;
	vaccinations_contre_indiquees?: number;
	total_notifications?: number;
	notifications_en_attente?: number;
	notifications_envoyees?: number;
	notifications_echec?: number;
}
