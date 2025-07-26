import React from 'react';
import { Link } from 'react-router-dom';

/**
 * NotFound component - Página de erro 404
 * 
 * @component
 * @example
 * return (
 *   <NotFound />
 * )
 */
const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-darkBg p-6 text-center">
      <div className="max-w-md">
        <h1 className="text-6xl font-bold text-purple-500 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-6">Página não encontrada</h2>
        
        <p className="text-gray-400 mb-8">
          A página que você está procurando não existe ou foi movida para outro endereço.
        </p>
        
        <div className="space-y-4">
          <Link 
            to="/" 
            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            Voltar para o Dashboard
          </Link>
          
          <div>
            <Link 
              to="/login" 
              className="text-purple-400 hover:text-purple-300 font-medium"
            >
              Ir para o Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;