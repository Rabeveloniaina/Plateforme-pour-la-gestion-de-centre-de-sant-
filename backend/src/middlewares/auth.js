const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, message: 'Non autorisé' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_jwt_plateforme_sante_2024_dev');
        req.user = { 
            id: decoded.id, 
            role: decoded.role, 
            username: decoded.username,
            id_centre: decoded.id_centre  // ✅ Ajout de id_centre
        };
        return next();
    } catch (e) {
        return res.status(401).json({ success: false, message: 'Token invalide' });
    }
};

const authorize = (...roles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Non autorisé' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Accès interdit' });
    return next();
};

module.exports = { protect, authorize };
