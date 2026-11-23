/**
 * @swagger
 * components:
 *   schemas:
 *     RendezVous:
 *       type: object
 *       required:
 *         - patient_id
 *         - medecin_id
 *         - date_rdv
 *       properties:
 *         id_rdv:
 *           type: integer
 *           description: ID du rendez-vous
 *         patient_id:
 *           type: integer
 *           description: ID du patient
 *         medecin_id:
 *           type: integer
 *           description: ID du médecin
 *         centre_id:
 *           type: integer
 *           description: ID du centre
 *         date_rdv:
 *           type: string
 *           format: date-time
 *           description: Date et heure du rendez-vous
 *         statut:
 *           type: string
 *           enum: [planifie, confirme, attente, en_cours, termine, annule]
 *           description: Statut du rendez-vous
 *         duree_estimee:
 *           type: integer
 *           description: Durée estimée en minutes
 *         duree_reelle:
 *           type: integer
 *           description: Durée réelle en minutes
 *         motif:
 *           type: string
 *           description: Motif de la consultation
 * 
 * /api/rendez-vous:
 *   get:
 *     summary: Liste des rendez-vous
 *     tags: [Rendez-vous]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: centre_id
 *         schema:
 *           type: integer
 *         description: Filtrer par centre
 *     responses:
 *       200:
 *         description: Liste des rendez-vous
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RendezVous'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 * 
 *   post:
 *     summary: Créer un nouveau rendez-vous
 *     tags: [Rendez-vous]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - medecin_id
 *               - date_rdv
 *             properties:
 *               patient_id:
 *                 type: integer
 *               medecin_id:
 *                 type: integer
 *               centre_id:
 *                 type: integer
 *               date_rdv:
 *                 type: string
 *                 format: date-time
 *               duree_estimee:
 *                 type: integer
 *                 default: 30
 *               motif:
 *                 type: string
 *     responses:
 *       201:
 *         description: Rendez-vous créé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 * 
 * /api/rendez-vous/{id}:
 *   get:
 *     summary: Obtenir un rendez-vous par ID
 *     tags: [Rendez-vous]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Détails du rendez-vous
 *       404:
 *         description: Rendez-vous non trouvé
 * 
 *   put:
 *     summary: Modifier un rendez-vous
 *     tags: [Rendez-vous]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date_rdv:
 *                 type: string
 *                 format: date-time
 *               motif:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rendez-vous modifié
 * 
 * /api/rendez-vous/{id}/confirmer:
 *   post:
 *     summary: Confirmer un rendez-vous
 *     tags: [Rendez-vous]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rendez-vous confirmé
 * 
 * /api/rendez-vous/{id}/checkin:
 *   post:
 *     summary: Enregistrer l'arrivée du patient (check-in)
 *     tags: [Rendez-vous]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Check-in enregistré
 * 
 * /api/rendez-vous/{id}/demarrer:
 *   post:
 *     summary: Démarrer la consultation
 *     tags: [Rendez-vous]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Consultation démarrée
 * 
 * /api/rendez-vous/{id}/terminer:
 *   post:
 *     summary: Terminer une consultation
 *     tags: [Rendez-vous]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               duree_reelle:
 *                 type: integer
 *               note_medecin:
 *                 type: string
 *     responses:
 *       200:
 *         description: Consultation terminée
 * 
 * /api/rendez-vous/{id}/annuler:
 *   post:
 *     summary: Annuler un rendez-vous
 *     tags: [Rendez-vous]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               raison:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rendez-vous annulé
 * 
 * /api/rendez-vous/walk-in:
 *   post:
 *     summary: Créer un rendez-vous pour patient sans RDV (walk-in)
 *     tags: [Rendez-vous]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patient_id
 *               - medecin_id
 *             properties:
 *               patient_id:
 *                 type: integer
 *               medecin_id:
 *                 type: integer
 *               motif:
 *                 type: string
 *     responses:
 *       201:
 *         description: Rendez-vous walk-in créé
 */

