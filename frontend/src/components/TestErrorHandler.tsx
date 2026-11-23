/**
 * Composant de test pour le hook useErrorHandler
 * 
 * Utilisation :
 * - Ajouter <TestErrorHandler /> dans une page pour tester
 * - Supprimer après validation
 */

import React, { useState } from 'react';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { apiFetch } from '../utils/apiFetch';

const TestErrorHandler: React.FC = () => {
  const { 
    handleError, 
    handleErrorWithMessage, 
    handleErrorSilent,
    error, 
    fieldErrors, 
    clearError,
    hasError,
    hasFieldErrors
  } = useErrorHandler();

  const [testResult, setTestResult] = useState<string>('');

  // Test 1 : Erreur simple (string)
  const testStringError = () => {
    clearError();
    setTestResult('');
    handleError('Erreur de test simple');
    setTestResult('✅ Erreur string gérée');
  };

  // Test 2 : Erreur Error
  const testErrorObject = () => {
    clearError();
    setTestResult('');
    handleError(new Error('Erreur de test avec Error object'));
    setTestResult('✅ Erreur Error object gérée');
  };

  // Test 3 : Erreur réseau (simulée)
  const testNetworkError = async () => {
    clearError();
    setTestResult('');
    try {
      // Tenter d'accéder à un endpoint qui n'existe pas
      const response = await apiFetch('/api/test-endpoint-inexistant');
      if (!response.ok) {
        const error = new Error('Endpoint non trouvé');
        (error as any).response = response;
        throw error;
      }
    } catch (err) {
      await handleError(err);
      setTestResult('✅ Erreur réseau gérée');
    }
  };

  // Test 4 : Erreur avec validation
  const testValidationError = async () => {
    clearError();
    setTestResult('');
    try {
      // Tenter de créer un patient sans données (devrait échouer)
      const response = await apiFetch('/api/patients', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        const data = await response.json();
        const error = new Error(data.message || 'Erreur de validation');
        (error as any).response = {
          status: response.status,
          data,
        };
        throw error;
      }
    } catch (err) {
      const result = await handleError(err);
      if (result.hasFieldErrors) {
        setTestResult('✅ Erreur de validation avec champs gérée');
      } else {
        setTestResult('✅ Erreur de validation gérée');
      }
    }
  };

  // Test 5 : Message personnalisé
  const testCustomMessage = () => {
    clearError();
    setTestResult('');
    handleErrorWithMessage(
      new Error('Erreur originale'),
      'Message personnalisé pour l\'utilisateur'
    );
    setTestResult('✅ Message personnalisé géré');
  };

  // Test 6 : Mode silencieux
  const testSilentError = () => {
    clearError();
    setTestResult('');
    handleErrorSilent(new Error('Erreur silencieuse'));
    setTestResult('✅ Erreur silencieuse gérée (pas de toast)');
  };

  // Test 7 : Erreur 401 (Non autorisé)
  const testUnauthorizedError = async () => {
    clearError();
    setTestResult('');
    try {
      // Simuler une erreur 401
      const error = new Error('Unauthorized');
      (error as any).response = {
        status: 401,
        data: { message: 'Non autorisé' },
      };
      throw error;
    } catch (err) {
      await handleError(err);
      setTestResult('✅ Erreur 401 gérée');
    }
  };

  // Test 8 : Erreur 404 (Non trouvé)
  const testNotFoundError = async () => {
    clearError();
    setTestResult('');
    try {
      const error = new Error('Not Found');
      (error as any).response = {
        status: 404,
        data: { message: 'Ressource non trouvée' },
      };
      throw error;
    } catch (err) {
      await handleError(err);
      setTestResult('✅ Erreur 404 gérée');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border">
      <h2 className="text-2xl font-bold mb-6">Test du Hook useErrorHandler</h2>
      
      {/* État actuel */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">État actuel :</h3>
        <div className="space-y-2 text-sm">
          <div>
            <strong>Erreur :</strong> {error || 'Aucune erreur'}
          </div>
          <div>
            <strong>Has Error :</strong> {hasError ? 'Oui' : 'Non'}
          </div>
          <div>
            <strong>Field Errors :</strong> {hasFieldErrors ? JSON.stringify(fieldErrors) : 'Aucune'}
          </div>
          {testResult && (
            <div className="text-green-600 font-medium">{testResult}</div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={testStringError}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Test String
        </button>
        <button
          onClick={testErrorObject}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Test Error
        </button>
        <button
          onClick={testNetworkError}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Test Réseau
        </button>
        <button
          onClick={testValidationError}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Test Validation
        </button>
        <button
          onClick={testCustomMessage}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Message Personnalisé
        </button>
        <button
          onClick={testSilentError}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Mode Silencieux
        </button>
        <button
          onClick={testUnauthorizedError}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          Test 401
        </button>
        <button
          onClick={testNotFoundError}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          Test 404
        </button>
      </div>

      {/* Bouton pour effacer */}
      <button
        onClick={clearError}
        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
      >
        Effacer l'erreur
      </button>

      {/* Affichage des erreurs de validation */}
      {hasFieldErrors && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-800 mb-2">Erreurs de validation :</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
            {Object.entries(fieldErrors).map(([field, message]) => (
              <li key={field}>
                <strong>{field}:</strong> {message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TestErrorHandler;

