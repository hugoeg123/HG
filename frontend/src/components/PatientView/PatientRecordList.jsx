import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, User, Calendar, MessageSquare, Plus } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { usePatientStore } from '../../store/patientStore';

/**
 * PatientRecordList - Tree view for patients and their records
 * 
 * Structure:
 * - Patient Name
 *   - Record 1 (Date - Type)
 *   - Record 2 (Date - Type)
 */
const PatientRecordList = ({
    patients,
    activePatientId,
    activeRecordId,
    onPatientClick,
    onRecordClick,
    onDeletePatient
}) => {
    const { isDarkMode } = useThemeStore();
    const { setChatContext } = usePatientStore();
    const [expandedPatients, setExpandedPatients] = useState({});

    const togglePatientExpansion = (patientId, e) => {
        e.stopPropagation();
        setExpandedPatients(prev => ({
            ...prev,
            [patientId]: !prev[patientId]
        }));
    };

    const handlePatientSelect = (patient, e) => {
        e.stopPropagation(); // Previne que eventos de pais capturem, se houver
        onPatientClick(patient);
    };

    const handleAddToChat = (e, item, type) => {
        e.stopPropagation();
        setChatContext({
            type: type,
            id: item.id,
            title: type === 'patient' ? item.name : (item.title || 'Registro'),
            content: type === 'patient' ? JSON.stringify(item) : (item.content || '')
        });
    };

    // Helper to check if a patient is expanded (either manually or because it's active)
    const isExpanded = (patientId) => {
        return expandedPatients[patientId] || String(activePatientId) === String(patientId);
    };

    if (!patients || patients.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p>Nenhum paciente encontrado.</p>
            </div>
        );
    }

    return (
        <div className="patient-tree-view space-y-1">
            {patients.map(patient => {
                const expanded = isExpanded(patient.id);
                const isActive = String(activePatientId) === String(patient.id);
                const hasRecords = patient.records && patient.records.length > 0;

                return (
                    <div key={patient.id} className="patient-node select-none group">
                        {/* Patient Header */}
                        <div
                            className={`
                flex items-center px-2 py-1.5 rounded-md cursor-pointer transition-colors
                ${isActive
                                    ? (isDarkMode ? 'bg-teal-900/30 text-teal-300' : 'bg-blue-50 text-blue-700')
                                    : (isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100')
                                }
              `}
                            onClick={(e) => handlePatientSelect(patient, e)}
                        >
                            <button
                                className={`mr-1 p-0.5 rounded-sm hover:bg-black/10 transition-transform ${expanded ? 'rotate-90' : ''}`}
                                onClick={(e) => togglePatientExpansion(patient.id, e)}
                            >
                                <ChevronRight size={14} />
                            </button>

                            <User size={14} className="mr-2 opacity-70" />

                            <span className="text-sm font-medium truncate flex-1">
                                {patient.name}
                            </span>

                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => handleAddToChat(e, patient, 'patient')}
                                    className="p-1 hover:text-teal-500 transition-colors mr-1"
                                    title="Adicionar ao Chat"
                                >
                                    <MessageSquare size={14} />
                                </button>

                                {/* Delete Action */}
                                {onDeletePatient && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeletePatient(patient);
                                        }}
                                        className="p-1 hover:text-red-500 transition-colors"
                                        title="Excluir"
                                    >
                                        <span className="sr-only">Excluir</span>
                                        &times;
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Records List (Children) */}
                        {expanded && (
                            <div className="ml-4 border-l border-gray-200 dark:border-gray-700 pl-1 mt-1 space-y-0.5">
                                {hasRecords ? (
                                    patient.records.map(record => {
                                        const isRecordActive = String(activeRecordId) === String(record.id);
                                        return (
                                            <div
                                                key={record.id}
                                                className={`
                          flex items-center px-2 py-1 rounded-md cursor-pointer text-xs group/record
                          ${isRecordActive
                                                        ? (isDarkMode ? 'bg-teal-900/50 text-teal-200 font-medium' : 'bg-blue-100 text-blue-800 font-medium')
                                                        : (isDarkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
                                                    }
                        `}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRecordClick(patient.id, record.id);
                                                }}
                                            >
                                                <FileText size={12} className="mr-2 opacity-70" />
                                                <div className="flex flex-col truncate flex-1">
                                                    <span className="truncate">{record.title || 'Consulta'}</span>
                                                    <span className="text-[10px] opacity-60">
                                                        {new Date(record.date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={(e) => handleAddToChat(e, record, 'record')}
                                                    className="opacity-0 group-hover/record:opacity-100 p-1 hover:text-teal-500 transition-opacity"
                                                    title="Adicionar ao Chat"
                                                >
                                                    <MessageSquare size={12} />
                                                </button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="px-2 py-1 text-xs text-gray-500 italic">
                                        Sem registros
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default PatientRecordList;
