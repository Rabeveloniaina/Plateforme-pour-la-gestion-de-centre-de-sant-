/**
 * Utilitaires de formatage de dates en français
 */

/**
 * Parse une date MySQL/ISO en tant que date LOCALE (pas UTC)
 * Corrige le problème de décalage horaire de 3h
 * @param dateStr - Date sous forme de string (MySQL DATETIME, ISO, etc.)
 * @returns Date object en heure locale
 */
export const parseLocalDate = (dateStr: string | Date | null | undefined): Date | null => {
  if (!dateStr) return null;
  
  // Si c'est déjà un objet Date, le retourner
  if (dateStr instanceof Date) return dateStr;
  
  try {
    // Si c'est un string
    if (typeof dateStr === 'string') {
      // Format MySQL DATETIME: "YYYY-MM-DD HH:MM:SS" → convertir en ISO local
      if (dateStr.includes(' ') && !dateStr.includes('T')) {
        // Remplacer l'espace par 'T' mais SANS ajouter 'Z' (pas UTC)
        const isoStr = dateStr.replace(' ', 'T').replace('Z', '');
        return new Date(isoStr);
      }
      
      // Format ISO avec 'Z' (UTC): "YYYY-MM-DDTHH:MM:SSZ" → enlever le 'Z'
      if (dateStr.includes('T') && dateStr.endsWith('Z')) {
        const localStr = dateStr.replace('Z', '');
        return new Date(localStr);
      }
      
      // Format ISO sans 'Z' (déjà local): "YYYY-MM-DDTHH:MM:SS"
      if (dateStr.includes('T')) {
        return new Date(dateStr);
      }
      
      // Format date seule: "YYYY-MM-DD"
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return new Date(dateStr + 'T00:00:00');
      }
      
      // Autres formats, essayer de parser normalement
      return new Date(dateStr);
    }
    
    return null;
  } catch (error) {
    console.error('Erreur parsing date:', error);
    return null;
  }
};

/**
 * Formate une date en format français court (JJ/MM/AAAA)
 * @param date - Date à formatter (string ISO ou Date object)
 * @returns Date formatée (ex: "15/05/1990")
 */
export const formatDateFR = (date: string | Date | null | undefined): string => {
  if (!date) return 'Non renseigné';
  
  try {
    // Utiliser parseLocalDate pour éviter les problèmes de timezone
    const d = typeof date === 'string' ? parseLocalDate(date) : date;
    if (!d || isNaN(d.getTime())) return 'Date invalide';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    return 'Date invalide';
  }
};

/**
 * Formate une date en format français long (JJ mois AAAA)
 * @param date - Date à formatter
 * @returns Date formatée (ex: "15 mai 1990")
 */
export const formatDateLongFR = (date: string | Date | null | undefined): string => {
  if (!date) return 'Non renseigné';
  
  try {
    const d = typeof date === 'string' ? parseLocalDate(date) : date;
    if (!d || isNaN(d.getTime())) return 'Date invalide';
    
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    return 'Date invalide';
  }
};

/**
 * Formate une heure en format français (HHhMM)
 * @param time - Heure à formatter (HH:MM:SS ou HH:MM)
 * @returns Heure formatée (ex: "10h30")
 */
export const formatTimeFR = (time: string | null | undefined): string => {
  if (!time) return '';
  
  try {
    // Si c'est une date complète, extraire l'heure en LOCAL
    if (time.includes('T') || time.includes(' ')) {
      const d = parseLocalDate(time);
      if (d && !isNaN(d.getTime())) {
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${hours}h${minutes}`;
      }
    }
    
    // Si c'est juste une heure HH:MM ou HH:MM:SS
    const parts = time.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}h${parts[1]}`;
    }
    
    return time;
  } catch (error) {
    return time;
  }
};

/**
 * Formate une date et heure complète en français
 * @param datetime - Date/heure à formatter
 * @returns Date et heure formatées (ex: "15/05/1990 à 10h30")
 */
export const formatDateTimeFR = (datetime: string | Date | null | undefined): string => {
  if (!datetime) return 'Non renseigné';
  
  try {
    const d = typeof datetime === 'string' ? parseLocalDate(datetime) : datetime;
    if (!d || isNaN(d.getTime())) return 'Date invalide';
    
    const date = formatDateFR(d);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${date} à ${hours}h${minutes}`;
  } catch (error) {
    return 'Date invalide';
  }
};

/**
 * Calcule l'âge à partir d'une date de naissance
 * @param birthDate - Date de naissance
 * @returns Âge en années
 */
export const calculateAge = (birthDate: string | Date | null | undefined): number => {
  if (!birthDate) return 0;
  
  try {
    const birth = typeof birthDate === 'string' ? parseLocalDate(birthDate) : birthDate;
    if (!birth || isNaN(birth.getTime())) return 0;
    
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    return 0;
  }
};

/**
 * Formate une date de naissance avec l'âge
 * @param birthDate - Date de naissance
 * @returns Date formatée avec âge (ex: "15/05/1990 (35 ans)")
 */
export const formatBirthDateWithAge = (birthDate: string | Date | null | undefined): string => {
  if (!birthDate) return 'Non renseigné';
  
  const date = formatDateFR(birthDate);
  const age = calculateAge(birthDate);
  
  return age > 0 ? `${date} (${age} ans)` : date;
};

/**
 * Formate une date relative (ex: "Il y a 2 jours")
 * @param date - Date à formatter
 * @returns Chaîne relative
 */
export const formatRelativeDate = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  
  try {
    const d = typeof date === 'string' ? parseLocalDate(date) : date;
    if (!d || isNaN(d.getTime())) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    
    return formatDateFR(date);
  } catch (error) {
    return '';
  }
};

/**
 * Formate une date pour un input datetime-local (sans conversion UTC)
 * @param date - Date à formatter
 * @returns Format YYYY-MM-DDTHH:MM pour input datetime-local
 */
export const formatDateTimeLocal = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  
  try {
    const d = typeof date === 'string' ? parseLocalDate(date) : date;
    if (!d || isNaN(d.getTime())) return '';
    
    // Formater manuellement en LOCAL (pas UTC)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    return '';
  }
};
