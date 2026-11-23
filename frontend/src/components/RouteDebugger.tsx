import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RouteDebugger: React.FC = () => {
  const location = useLocation();
  const params = useParams();
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Route Debugger</h3>
      <div className="space-y-1">
        <div><strong>Location:</strong> {location.pathname}</div>
        <div><strong>Search:</strong> {location.search}</div>
        <div><strong>Hash:</strong> {location.hash}</div>
        <div><strong>Params:</strong> {JSON.stringify(params)}</div>
        <div><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</div>
        <div><strong>User:</strong> {user ? user.nom_utilisateur : 'None'}</div>
        <div><strong>Role:</strong> {user ? user.role : 'None'}</div>
      </div>
    </div>
  );
};

export default RouteDebugger;
