export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Classe d'erreur API personnalisée
export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public data?: any,
        public errors?: Array<{ param?: string; msg: string }>
    ) {
        super(message);
        this.name = 'ApiError';
        Object.setPrototypeOf(this, ApiError.prototype);
    }

    // Extraire le message d'erreur principal
    getMessage(): string {
        return this.message || this.data?.message || this.data?.error || 'Une erreur est survenue';
    }

    // Extraire les erreurs de validation
    getValidationErrors(): Record<string, string> {
        const validationErrors: Record<string, string> = {};

        if (this.errors && Array.isArray(this.errors)) {
            this.errors.forEach((err) => {
                const field = err.param || 'general';
                validationErrors[field] = err.msg;
            });
        } else if (this.data?.errors && Array.isArray(this.data.errors)) {
            this.data.errors.forEach((err: any) => {
                const field = err.param || err.path || 'general';
                validationErrors[field] = err.msg || err.message;
            });
        }

        return validationErrors;
    }
}

const getBaseUrl = (): string => {
    // FORCE l'utilisation du proxy Vite en développement
    return '/api';
};

const getAuthToken = (): string | null => {
    try {
        return localStorage.getItem('token');
    } catch {
        return null;
    }
};

const buildHeaders = (extra?: HeadersInit): HeadersInit => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...extra as Record<string, string>,
    };
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

interface RequestOptions extends RequestInit {
    showErrorToast?: boolean; // Option pour afficher automatiquement les erreurs
    silent?: boolean; // Option pour ne pas logger les erreurs
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { showErrorToast = false, silent = false, ...fetchOptions } = options;
    const url = `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;

    try {
        const res = await fetch(url, {
            ...fetchOptions,
            headers: buildHeaders(fetchOptions.headers),
        });

        const isJson = res.headers.get('content-type')?.includes('application/json');
        const data = isJson ? await res.json() : (await res.text() as any);

        if (!res.ok) {
            const message = (data && (data.message || data.error)) || res.statusText;
            const errorMessage = typeof message === 'string' ? message : 'Request failed';

            const apiError = new ApiError(
                errorMessage,
                res.status,
                data,
                data?.errors
            );

            // Gérer les erreurs d'authentification
            if (res.status === 401) {
                // Token expiré ou invalide - rediriger vers login
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                throw apiError;
            }

            // Afficher toast si demandé
            if (showErrorToast && typeof window !== 'undefined') {
                // Utiliser le système toast global si disponible
                const toastContext = (window as any).__toastContext;
                if (toastContext) {
                    toastContext.showToast(apiError.getMessage(), 'error');
                }
            }

            if (!silent) {
                console.error(`API Error [${res.status}]:`, apiError.getMessage());
            }

            throw apiError;
        }

        return data as T;
    } catch (error) {
        // Si c'est déjà une ApiError, la relancer
        if (error instanceof ApiError) {
            throw error;
        }

        // Erreur réseau ou autre
        const networkError = new ApiError(
            error instanceof Error ? error.message : 'Erreur de connexion au serveur',
            0,
            null
        );

        if (showErrorToast && typeof window !== 'undefined') {
            const toastContext = (window as any).__toastContext;
            if (toastContext) {
                toastContext.showToast(networkError.getMessage(), 'error');
            }
        }

        throw networkError;
    }
}

export const api = {
    get: <T>(path: string, init?: RequestOptions) => request<T>(path, { method: 'GET', ...init }),
    post: <T>(path: string, body?: unknown, init?: RequestOptions) => request<T>(path, { method: 'POST', body: body != null ? JSON.stringify(body) : undefined, ...init }),
    put: <T>(path: string, body?: unknown, init?: RequestOptions) => request<T>(path, { method: 'PUT', body: body != null ? JSON.stringify(body) : undefined, ...init }),
    patch: <T>(path: string, body?: unknown, init?: RequestOptions) => request<T>(path, { method: 'PATCH', body: body != null ? JSON.stringify(body) : undefined, ...init }),
    delete: <T>(path: string, init?: RequestOptions) => request<T>(path, { method: 'DELETE', ...init }),
};

export type LoginResponse = { success: boolean; token: string; user: { id_user: number; nom_utilisateur: string; role: string; email?: string } };

// Import des types depuis le fichier types
import type { FicheMedicale, Medicament, Prescription, Vaccination, User, Notification, ApiResponse, Statistiques } from '../types';

// Services API pour les nouvelles fonctionnalités
export const apiServices = {
    // Fiches médicales
    fichesMedicales: {
        getAll: (params?: any) => api.get<ApiResponse<FicheMedicale[]>>(`/fiches-medicales?${new URLSearchParams(params || {})}`),
        getById: (id: number) => api.get<ApiResponse<FicheMedicale>>(`/fiches-medicales/${id}`),
        create: (data: Partial<FicheMedicale>) => api.post<ApiResponse<FicheMedicale>>('/fiches-medicales', data),
        update: (id: number, data: Partial<FicheMedicale>) => api.put<ApiResponse<FicheMedicale>>(`/fiches-medicales/${id}`, data),
        delete: (id: number) => api.delete<ApiResponse<void>>(`/fiches-medicales/${id}`),
        getByPatient: (patientId: number, params?: any) => api.get<ApiResponse<FicheMedicale[]>>(`/fiches-medicales/patient/${patientId}?${new URLSearchParams(params || {})}`),
        getByMedecin: (medecinId: number, params?: any) => api.get<ApiResponse<FicheMedicale[]>>(`/fiches-medicales/medecin/${medecinId}?${new URLSearchParams(params || {})}`),
        search: (query: string) => api.get<ApiResponse<FicheMedicale[]>>(`/fiches-medicales/search?q=${encodeURIComponent(query)}`),
        finaliserConsultation: (id: number, data: any) => api.post<ApiResponse<any>>(`/fiches-medicales/${id}/finaliser`, data),
        createWithPrescriptions: (data: any) => api.post<ApiResponse<any>>('/fiches-medicales/with-prescriptions', data),
        getResumeMedical: (patientId: number) => api.get<ApiResponse<any>>(`/fiches-medicales/patient/${patientId}/resume`),
        getStatistiques: (params?: any) => api.get<ApiResponse<Statistiques>>(`/fiches-medicales/statistiques?${new URLSearchParams(params || {})}`)
    },

    // Médicaments
    medicaments: {
        getAll: (params?: any) => api.get<ApiResponse<Medicament[]>>(`/medicaments?${new URLSearchParams(params || {})}`),
        getById: (id: number) => api.get<ApiResponse<Medicament>>(`/medicaments/${id}`),
        create: (data: Partial<Medicament>) => api.post<ApiResponse<Medicament>>('/medicaments', data),
        update: (id: number, data: Partial<Medicament>) => api.put<ApiResponse<Medicament>>(`/medicaments/${id}`, data),
        delete: (id: number) => api.delete<ApiResponse<void>>(`/medicaments/${id}`),
        search: (terme: string) => api.get<ApiResponse<Medicament[]>>(`/medicaments/search?q=${encodeURIComponent(terme)}`),
        getByForme: (forme: string) => api.get<ApiResponse<Medicament[]>>(`/medicaments/forme/${forme}`),
        checkInteractions: (medicamentIds: number[]) => api.post<ApiResponse<any>>('/medicaments/check-interactions', { medicament_ids: medicamentIds }),
        importBulk: (medicaments: Partial<Medicament>[]) => api.post<ApiResponse<any>>('/medicaments/import-bulk', { medicaments }),
        getFormes: () => api.get<ApiResponse<string[]>>('/medicaments/formes'),
        getStatistiques: () => api.get<ApiResponse<Statistiques>>('/medicaments/statistiques')
    },

    // Prescriptions
    prescriptions: {
        getAll: (params?: any) => api.get<ApiResponse<Prescription[]>>(`/prescriptions?${new URLSearchParams(params || {})}`),
        getById: (id: number) => api.get<ApiResponse<Prescription>>(`/prescriptions/${id}`),
        create: (data: Partial<Prescription>) => api.post<ApiResponse<Prescription>>('/prescriptions', data),
        createMultiple: (data: Partial<Prescription>[]) => api.post<ApiResponse<Prescription[]>>('/prescriptions/multiple', { prescriptions: data }),
        update: (id: number, data: Partial<Prescription>) => api.put<ApiResponse<Prescription>>(`/prescriptions/${id}`, data),
        delete: (id: number) => api.delete<ApiResponse<void>>(`/prescriptions/${id}`),
        getMyPrescriptions: (params?: any) => api.get<ApiResponse<Prescription[]>>(`/prescriptions/me?${new URLSearchParams(params || {})}`),
        getByPatient: (patientId: number, params?: any) => api.get<ApiResponse<Prescription[]>>(`/prescriptions/patient/${patientId}?${new URLSearchParams(params || {})}`),
        getByFicheMedicale: (ficheId: number) => api.get<ApiResponse<Prescription[]>>(`/prescriptions/fiche/${ficheId}`),
        getActives: (patientId: number) => api.get<ApiResponse<Prescription[]>>(`/prescriptions/patient/${patientId}/actives`),
        arreter: (id: number, raison?: string) => api.post<ApiResponse<void>>(`/prescriptions/${id}/arreter`, { raison }),
        suspendre: (id: number, raison?: string) => api.post<ApiResponse<void>>(`/prescriptions/${id}/suspendre`, { raison }),
        terminer: (id: number) => api.post<ApiResponse<void>>(`/prescriptions/${id}/terminer`),
        renouveler: (id: number, data: any) => api.post<ApiResponse<Prescription>>(`/prescriptions/${id}/renouveler`, data),
        genererOrdonnance: (patientId: number, ficheId: number) => api.get<ApiResponse<any>>(`/prescriptions/patient/${patientId}/fiche/${ficheId}/ordonnance`),
        checkInteractions: (patientId: number) => api.get<ApiResponse<any>>(`/prescriptions/patient/${patientId}/interactions`),
        getStatistiques: (params?: any) => api.get<ApiResponse<Statistiques>>(`/prescriptions/statistiques?${new URLSearchParams(params || {})}`)
    },

    // Vaccinations
    vaccinations: {
        getAll: (params?: any) => api.get<ApiResponse<Vaccination[]>>(`/vaccinations?${new URLSearchParams(params || {})}`),
        getById: (id: number) => api.get<ApiResponse<Vaccination>>(`/vaccinations/${id}`),
        create: (data: Partial<Vaccination>) => api.post<ApiResponse<Vaccination>>('/vaccinations', data),
        update: (id: number, data: Partial<Vaccination>) => api.put<ApiResponse<Vaccination>>(`/vaccinations/${id}`, data),
        delete: (id: number) => api.delete<ApiResponse<void>>(`/vaccinations/${id}`),
        getByPatient: (patientId: number, params?: any) => api.get<ApiResponse<Vaccination[]>>(`/vaccinations/patient/${patientId}?${new URLSearchParams(params || {})}`),
        getCarnetVaccination: (patientId: number) => api.get<ApiResponse<any>>(`/vaccinations/patient/${patientId}/carnet`),
        getRappels: (centreId?: number) => api.get<ApiResponse<Vaccination[]>>(`/vaccinations/rappels${centreId ? `?centre_id=${centreId}` : ''}`),
        getCouvertureVaccinale: (centreId?: number, regionId?: number) => api.get<ApiResponse<any>>(`/vaccinations/couverture${centreId ? `?centre_id=${centreId}` : regionId ? `?region_id=${regionId}` : ''}`),
        planifierRappel: (id: number, data: any) => api.post<ApiResponse<void>>(`/vaccinations/${id}/rappel`, data),
        administrer: (id: number, data: any) => api.post<ApiResponse<void>>(`/vaccinations/${id}/administrer`, data),
        reporter: (id: number, data: any) => api.post<ApiResponse<void>>(`/vaccinations/${id}/reporter`, data),
        annuler: (id: number, raison?: string) => api.post<ApiResponse<void>>(`/vaccinations/${id}/annuler`, { raison }),
        getStatistiques: (params?: any) => api.get<ApiResponse<Statistiques>>(`/vaccinations/statistiques?${new URLSearchParams(params || {})}`)
    },

    // Utilisateurs
    users: {
        getAll: (params?: any) => api.get<ApiResponse<User[]>>(`/users?${new URLSearchParams(params || {})}`),
        getById: (id: number) => api.get<ApiResponse<User>>(`/users/${id}`),
        create: (data: Partial<User>) => api.post<ApiResponse<User>>('/users', data),
        update: (id: number, data: Partial<User>) => api.put<ApiResponse<User>>(`/users/${id}`, data),
        delete: (id: number) => api.delete<ApiResponse<void>>(`/users/${id}`),
        search: (query: string) => api.get<ApiResponse<User[]>>(`/users/search?q=${encodeURIComponent(query)}`),
        checkUsername: (username: string) => api.get<ApiResponse<{ available: boolean }>>(`/users/check-username/${username}`),
        checkEmail: (email: string) => api.get<ApiResponse<{ available: boolean }>>(`/users/check-email/${email}`),
        changePassword: (id: number, data: any) => api.put<ApiResponse<void>>(`/users/${id}/change-password`, data),
        resetPassword: (id: number, data: any) => api.put<ApiResponse<void>>(`/users/${id}/reset-password`, data),
        activate: (id: number) => api.post<ApiResponse<void>>(`/users/${id}/activate`),
        deactivate: (id: number) => api.post<ApiResponse<void>>(`/users/${id}/deactivate`),
        getStatistiques: () => api.get<ApiResponse<Statistiques>>('/users/statistiques')
    },

    // Notifications
    notifications: {
        getAll: (params?: any) => api.get<ApiResponse<Notification[]>>(`/notifications?${new URLSearchParams(params || {})}`),
        getById: (id: number) => api.get<ApiResponse<Notification>>(`/notifications/${id}`),
        create: (data: Partial<Notification>) => api.post<ApiResponse<Notification>>('/notifications', data),
        update: (id: number, data: Partial<Notification>) => api.put<ApiResponse<Notification>>(`/notifications/${id}`, data),
        delete: (id: number) => api.delete<ApiResponse<void>>(`/notifications/${id}`),
        getByPatient: (patientId: number, params?: any) => api.get<ApiResponse<Notification[]>>(`/notifications/patient/${patientId}?${new URLSearchParams(params || {})}`),
        getByMedecin: (medecinId: number, params?: any) => api.get<ApiResponse<Notification[]>>(`/notifications/medecin/${medecinId}?${new URLSearchParams(params || {})}`),
        getUnread: (params?: any) => api.get<ApiResponse<Notification[]>>(`/notifications/unread?${new URLSearchParams(params || {})}`),
        getUnreadCount: (params?: any) => api.get<ApiResponse<{ count: number }>>(`/notifications/unread/count?${new URLSearchParams(params || {})}`),
        updateStatut: (id: number, statut: string) => api.put<ApiResponse<void>>(`/notifications/${id}/statut`, { statut }),
        markAsRead: (id: number) => api.put<ApiResponse<void>>(`/notifications/${id}/mark-read`),
        markAllAsRead: (patient_id?: number, medecin_id?: number) => api.put<ApiResponse<{ count: number }>>('/notifications/mark-all-read', { patient_id, medecin_id }),
        envoyer: (id: number) => api.post<ApiResponse<void>>(`/notifications/${id}/envoyer`),
        relancer: (id: number) => api.post<ApiResponse<void>>(`/notifications/${id}/relancer`),
        getStatistiques: (params?: any) => api.get<ApiResponse<Statistiques>>(`/notifications/statistiques?${new URLSearchParams(params || {})}`)
    }
};
