/**
 * Configuration Swagger/OpenAPI pour la documentation de l'API
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: '🏥 API Plateforme de Gestion des Centres de Santé',
            version: '1.0.0',
            description: `
API REST complète pour la gestion des centres de santé.

## 🎯 Fonctionnalités

- **Gestion des patients** : CRUD complet, dossiers médicaux
- **Gestion des rendez-vous** : Création, confirmation, check-in, finalisation
- **Gestion médicale** : Fiches médicales, prescriptions, vaccinations
- **Statistiques** : Rapports par centre et par région
- **Notifications** : Système de notifications automatiques

## 🔐 Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification.

**Format :** \`Bearer <token>\`

**Exemple :**
\`\`\`
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

## 👥 Rôles

- **ministere** : Accès complet à tous les centres et données
- **admin_centre** : Gestion complète de son centre
- **medecin** : Accès aux patients et consultations
- **personnel** : Support administratif
- **patient** : Accès à son propre dossier

## 📝 Notes

- Toutes les dates sont au format ISO 8601 (YYYY-MM-DD HH:mm:ss)
- Les réponses suivent le format : \`{ success: boolean, data: any, message?: string }\`
- Les erreurs : \`{ success: false, message: string, error?: string }\`
            `,
            contact: {
                name: 'Équipe de développement',
                email: 'support@sante.local'
            },
            license: {
                name: 'ISC'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
                description: 'Serveur de développement'
            },
            {
                url: 'https://api.sante.local/api',
                description: 'Serveur de production'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT Token obtenu via /api/auth/login'
                }
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            example: 'Erreur de validation'
                        },
                        error: {
                            type: 'string',
                            example: 'Détails de l\'erreur'
                        }
                    }
                },
                Success: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        data: {
                            type: 'object'
                        },
                        message: {
                            type: 'string',
                            example: 'Opération réussie'
                        }
                    }
                },
                Patient: {
                    type: 'object',
                    properties: {
                        id_patient: { type: 'integer', example: 1 },
                        nom: { type: 'string', example: 'Doe' },
                        prenom: { type: 'string', example: 'John' },
                        date_naissance: { type: 'string', format: 'date', example: '1990-01-01' },
                        sexe: { type: 'string', enum: ['M', 'F'], example: 'M' },
                        telephone: { type: 'string', example: '+261 34 12 345 67' },
                        email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
                        adresse: { type: 'string', example: '123 Rue Example' },
                        centre_id: { type: 'integer', example: 1 }
                    }
                },
                RendezVous: {
                    type: 'object',
                    properties: {
                        id_rdv: { type: 'integer', example: 1 },
                        patient_id: { type: 'integer', example: 1 },
                        medecin_id: { type: 'integer', example: 1 },
                        centre_id: { type: 'integer', example: 1 },
                        date_rdv: { type: 'string', format: 'date-time', example: '2025-01-15 10:00:00' },
                        statut: {
                            type: 'string',
                            enum: ['planifie', 'confirme', 'attente', 'en_cours', 'termine', 'annule'],
                            example: 'confirme'
                        },
                        duree_estimee: { type: 'integer', example: 30 },
                        duree_reelle: { type: 'integer', example: 35 },
                        motif: { type: 'string', example: 'Consultation de routine' }
                    }
                },
                FicheMedicale: {
                    type: 'object',
                    properties: {
                        id_fiche: { type: 'integer', example: 1 },
                        patient_id: { type: 'integer', example: 1 },
                        diagnostic: { type: 'string', example: 'Rhume simple' },
                        traitement: { type: 'string', example: 'Repos, hydratation' },
                        observations: { type: 'string', example: 'État général bon' }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ],
        tags: [
            {
                name: 'Authentification',
                description: 'Endpoints pour la connexion et l\'inscription'
            },
            {
                name: 'Patients',
                description: 'Gestion des patients'
            },
            {
                name: 'Rendez-vous',
                description: 'Gestion des rendez-vous et consultations'
            },
            {
                name: 'Médecins',
                description: 'Gestion des médecins'
            },
            {
                name: 'Centres',
                description: 'Gestion des centres de santé'
            },
            {
                name: 'Fiches Médicales',
                description: 'Gestion des dossiers médicaux'
            },
            {
                name: 'Prescriptions',
                description: 'Gestion des prescriptions médicales'
            },
            {
                name: 'Vaccinations',
                description: 'Suivi des vaccinations'
            },
            {
                name: 'Statistiques',
                description: 'Rapports et statistiques'
            },
            {
                name: 'Notifications',
                description: 'Système de notifications'
            }
        ]
    },
    apis: [
        './src/routes/*.js',
        './src/routes/*.swagger.js'
    ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

