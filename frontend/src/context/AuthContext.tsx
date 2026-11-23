import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import type { LoginResponse } from '../lib/api';

type User = LoginResponse['user'];

type AuthContextType = {
	user: User | null;
	token: string | null;
	isAuthenticated: boolean;
	login: (username: string, password: string) => Promise<void>;
	logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
	const [user, setUser] = useState<User | null>(() => {
		const raw = localStorage.getItem('user');
		return raw ? JSON.parse(raw) : null;
	});

	useEffect(() => {
		if (token) localStorage.setItem('token', token); else localStorage.removeItem('token');
	}, [token]);

	useEffect(() => {
		if (user) localStorage.setItem('user', JSON.stringify(user)); else localStorage.removeItem('user');
	}, [user]);

	const login = async (username: string, password: string) => {
		const res = await api.post<LoginResponse>('/auth/login', { nom_utilisateur: username, mot_de_passe: password });
		setToken(res.token);
		setUser(res.user);
	};

	const logout = () => {
		// Nettoyer le state et le localStorage
		setToken(null);
		setUser(null);
		localStorage.removeItem('token');
		localStorage.removeItem('user');
	};

	const value = useMemo<AuthContextType>(() => ({ user, token, isAuthenticated: !!token, login, logout }), [user, token]);
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
	return ctx;
}
