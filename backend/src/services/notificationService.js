const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Configuration du transporteur email
const mailer = process.env.SMTP_HOST && process.env.SMTP_USER ? nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_PORT == 465, // true pour 465, false pour 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
}) : null;

// Configuration du client Twilio (noms de variables corrigés)
const smsClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) ? 
  twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;

// Fonction d'envoi d'email
async function sendEmail(to, subject, text, html = null) {
  if (!mailer) {
    console.warn('📧 Service email non configuré - Email non envoyé');
    return false;
  }
  
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@sante.sn',
      to: to,
      subject: subject,
      text: text
    };
    
    if (html) {
      mailOptions.html = html;
    }
    
    await mailer.sendMail(mailOptions);
    console.log(`📧 Email envoyé à ${to}: ${subject}`);
  return true;
  } catch (error) {
    console.error('❌ Erreur envoi email:', error.message);
    return false;
  }
}

// Fonction d'envoi de SMS
async function sendSMS(to, text) {
  if (!smsClient || !process.env.TWILIO_PHONE_NUMBER) {
    console.warn('📱 Service SMS non configuré - SMS non envoyé');
    return false;
  }
  
  try {
    await smsClient.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
      body: text
    });
    console.log(`📱 SMS envoyé à ${to}`);
  return true;
  } catch (error) {
    console.error('❌ Erreur envoi SMS:', error.message);
    return false;
  }
}

// Notification pour rendez-vous
async function notifyRdv(patient, rdv, type) {
  const subjects = {
    confirme: '✅ Confirmation de rendez-vous',
    annule: '❌ Annulation de rendez-vous',
    rappel: '⏰ Rappel de rendez-vous',
    reprogramme: '📅 Rendez-vous reprogrammé'
  };
  
  const subject = subjects[type] || '📋 Mise à jour de rendez-vous';
  
  const dateRdv = new Date(rdv.date_rdv).toLocaleString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const text = `Bonjour ${patient.prenom} ${patient.nom},

Votre rendez-vous du ${dateRdv} est ${type}.

${rdv.centre_nom ? `Centre: ${rdv.centre_nom}` : ''}
${rdv.medecin_nom ? `Médecin: Dr. ${rdv.medecin_nom}` : ''}

Plateforme de Gestion des Centres de Santé`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">${subject}</h2>
      <p>Bonjour <strong>${patient.prenom} ${patient.nom}</strong>,</p>
      <p>Votre rendez-vous du <strong>${dateRdv}</strong> est <strong>${type}</strong>.</p>
      ${rdv.centre_nom ? `<p><strong>Centre:</strong> ${rdv.centre_nom}</p>` : ''}
      ${rdv.medecin_nom ? `<p><strong>Médecin:</strong> Dr. ${rdv.medecin_nom}</p>` : ''}
      <hr style="margin: 20px 0;">
      <p style="font-size: 12px; color: #666;">
        Plateforme de Gestion des Centres de Santé<br>
        Ministère de la Santé Publique
      </p>
    </div>
  `;
  
  const results = {
    email: false,
    sms: false
  };
  
  // Envoi email si disponible
  if (patient.email) {
    results.email = await sendEmail(patient.email, subject, text, html);
  }
  
  // Envoi SMS si disponible
  if (patient.telephone) {
    const smsText = `${subject}\nBonjour ${patient.prenom}, votre RDV du ${dateRdv} est ${type}.`;
    results.sms = await sendSMS(patient.telephone, smsText);
  }
  
  return results;
}

// Notification pour prescription
async function notifyPrescription(patient, prescription, type = 'nouvelle') {
  const subjects = {
    nouvelle: '💊 Nouvelle prescription',
    renouvellement: '🔄 Renouvellement de prescription',
    expiration: '⚠️ Prescription bientôt expirée'
  };
  
  const subject = subjects[type] || '💊 Prescription';
  
  const text = `Bonjour ${patient.prenom} ${patient.nom},

${type === 'nouvelle' ? 'Une nouvelle prescription a été établie' : 
  type === 'renouvellement' ? 'Votre prescription a été renouvelée' : 
  'Votre prescription expire bientôt'} :

Médicament: ${prescription.medicament_nom}
Dosage: ${prescription.dosage_prescrit}
Fréquence: ${prescription.frequence}
${prescription.date_fin ? `Fin de traitement: ${new Date(prescription.date_fin).toLocaleDateString('fr-FR')}` : ''}

Plateforme de Gestion des Centres de Santé`;

  const results = {
    email: false,
    sms: false
  };
  
  if (patient.email) {
    results.email = await sendEmail(patient.email, subject, text);
  }
  
  if (patient.telephone) {
    const smsText = `${subject}\n${prescription.medicament_nom} - ${prescription.dosage_prescrit}\nFréquence: ${prescription.frequence}`;
    results.sms = await sendSMS(patient.telephone, smsText);
  }
  
  return results;
}

// Notification pour vaccination
async function notifyVaccination(patient, vaccination, type = 'rappel') {
  const subjects = {
    rappel: '💉 Rappel de vaccination',
    administre: '✅ Vaccination effectuée',
    planifie: '📅 Vaccination planifiée'
  };
  
  const subject = subjects[type] || '💉 Vaccination';
  
  const text = `Bonjour ${patient.prenom} ${patient.nom},

${type === 'rappel' ? 'Rappel: Il est temps de faire votre vaccination' :
  type === 'administre' ? 'Votre vaccination a été effectuée' :
  'Votre vaccination a été planifiée'} :

Vaccin: ${vaccination.nom_vaccin}
Type: ${vaccination.type_vaccin}
${vaccination.date_administration ? `Date: ${new Date(vaccination.date_administration).toLocaleDateString('fr-FR')}` : ''}
${vaccination.date_rappel ? `Prochain rappel: ${new Date(vaccination.date_rappel).toLocaleDateString('fr-FR')}` : ''}

Plateforme de Gestion des Centres de Santé`;

  const results = {
    email: false,
    sms: false
  };
  
  if (patient.email) {
    results.email = await sendEmail(patient.email, subject, text);
  }
  
  if (patient.telephone) {
    const smsText = `${subject}\n${vaccination.nom_vaccin} (${vaccination.type_vaccin})`;
    results.sms = await sendSMS(patient.telephone, smsText);
  }
  
  return results;
}

// Test de configuration des services
async function testConfiguration() {
  const status = {
    email: !!mailer,
    sms: !!smsClient,
    services: []
  };
  
  if (mailer) {
    try {
      await mailer.verify();
      status.services.push('Email: Configuré et fonctionnel');
    } catch (error) {
      status.services.push(`Email: Configuré mais erreur - ${error.message}`);
    }
  } else {
    status.services.push('Email: Non configuré');
  }
  
  if (smsClient) {
    status.services.push('SMS: Configuré (Twilio)');
  } else {
    status.services.push('SMS: Non configuré');
  }
  
  return status;
}

module.exports = { 
  sendEmail, 
  sendSMS, 
  notifyRdv, 
  notifyPrescription, 
  notifyVaccination,
  testConfiguration 
};


