import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientStore } from '../../store/patientStore';

/**
 * NewPatient component - Cria um novo paciente com nome inicial "Sem Nome"
 * 
 * @component
 * @example
 * return (
 *   <NewPatient />
 * )
 * 
 * Integra com: store/patientStore.js para gerenciamento de dados do paciente
 */
const NewPatient = () => {
  const { createPatient, isLoading, error } = usePatientStore();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(true);
  
  // Criar um novo paciente automaticamente ao carregar o componente
  useEffect(() => {
    const createNewPatient = async () => {
      if (isCreating) {
        try {
          // Criar paciente com nome inicial "Sem Nome" e campos vazios
          const newPatient = await createPatient({
            name: 'Sem Nome',
            dateOfBirth: new Date(), // Usando a data atual em vez de null
            gender: 'não informado',
            email: null, // Definir como null para evitar falha na validação isEmail
            phone: null,
            cpf: null,
            street: null,
            city: null,
            state: null,
            zipCode: null,
            country: 'Brasil',
            bloodType: 'Desconhecido',
            allergies: [],
            chronicConditions: [],
            medications: [],
            familyHistory: []
          });
          
          if (newPatient && newPatient.id) {
            // Redirecionar para a página do paciente recém-criado
            navigate(`/patients/${newPatient.id}`);
          }
        } catch (err) {
          console.error('Erro ao criar paciente:', err);
        } finally {
          setIsCreating(false);
        }
      }
    };
    
    createNewPatient();
  }, [createPatient, navigate, isCreating]);
  
  return (
    <div className="flex items-center justify-center h-full">
      {isLoading || isCreating ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Criando novo paciente...</p>
        </div>
      ) : error ? (
        <div className="text-center bg-dark-lighter p-6 rounded-lg border border-danger max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-danger mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold mb-2">Erro ao criar paciente</h2>
          <p className="mb-4">{error}</p>
          <div className="flex justify-center space-x-3">
            <button 
              onClick={() => setIsCreating(true)}
              className="btn btn-primary"
            >
              Tentar novamente
            </button>
            <button 
              onClick={() => navigate('/') } 
              className="btn btn-outline"
            >
              Voltar para Dashboard
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default NewPatient;