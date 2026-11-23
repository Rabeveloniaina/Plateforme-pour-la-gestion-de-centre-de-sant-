const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');
const { protect, authorize } = require('../middlewares/auth');
const { runValidations } = require('../middlewares/validate');
const { createNotification, listNotifications, updateNotificationStatut } = require('../validators/notificationValidators');

// Routes pour les notifications
router.get('/', protect, authorize('admin', 'personnel'), NotificationController.getAll);
router.get('/search', protect, authorize('admin', 'personnel'), NotificationController.search);
router.get('/unread', protect, NotificationController.getUnread);
router.get('/unread/count', protect, NotificationController.getUnreadCount);
router.get('/stats', protect, authorize('admin', 'personnel'), NotificationController.getStatistiques);
router.get('/patient/:patient_id', protect, NotificationController.getByPatientId);
router.get('/medecin/:medecin_id', protect, authorize('admin', 'personnel', 'medecin'), NotificationController.getByMedecinId);
router.get('/:id', protect, NotificationController.getById);


router.post('/', protect, authorize('admin', 'personnel'), runValidations(createNotification), NotificationController.create);
router.post('/rappel-rdv', protect, authorize('admin', 'personnel'), NotificationController.sendRappelRdv);
router.post('/rappel-vaccination', protect, authorize('admin', 'personnel'), NotificationController.sendRappelVaccination);

router.put('/:id', protect, authorize('admin', 'personnel'), NotificationController.update);
router.put('/:id/statut', protect, authorize('admin', 'personnel'), runValidations(updateNotificationStatut), NotificationController.updateStatut);
router.put('/:id/mark-read', protect, NotificationController.markAsRead);
router.put('/mark-all-read', protect, NotificationController.markAllAsRead);


router.delete('/:id', protect, authorize('admin', 'personnel'), NotificationController.delete);
router.delete('/cleanup/old', protect, authorize('admin'), NotificationController.deleteOld);

module.exports = router;
