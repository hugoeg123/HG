import React, { useState } from 'react';
import { DrugResult } from '../hooks/useKnowledgeSearch';
import { ChevronDown, ChevronUp, AlertOctagon, Info, ShieldAlert, Activity } from 'lucide-react';

export const DrugMonographCard: React.FC<{ drug: DrugResult }> = ({ drug }) => {
    // Accordion state management (could be individual or one-at-a-time)
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        indications: true // Default open
    });

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    return (
        <div className="bg-[var(--color-bg-light)] rounded-lg border border-[var(--color-border)] mb-3 overflow-hidden shadow-sm animate-fadeIn">
            {/* Header */}
            <div className="p-3 bg-[var(--color-bg-dark)] border-b border-[var(--color-border)]">
                <h3 className="font-bold text-sm text-[var(--color-text-primary)]">{drug.generic_name}</h3>
                <p className="text-xs text-[var(--color-text-secondary)]">{drug.brand_name} • {drug.manufacturer}</p>
            </div>

            {/* Boxed Warning (if exists) */}
            {drug.boxed_warning && (
                <div className="bg-red-900/10 border-b border-red-800/20 p-3 flex gap-3">
                    <AlertOctagon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-xs font-bold text-red-500 uppercase mb-1">Black Box Warning</h4>
                        <p className="text-xs text-[var(--color-text-primary)] leading-relaxed">{drug.boxed_warning}</p>
                    </div>
                </div>
            )}

            {/* Accordion Sections */}
            <div className="divide-y divide-[var(--color-border)]">

                {/* Indications */}
                <AccordionSection
                    title="Indicações e Uso"
                    icon={<Activity className="w-4 h-4 text-blue-500" />}
                    isOpen={openSections['indications']}
                    onToggle={() => toggleSection('indications')}
                >
                    {drug.indications || 'Descrição não disponível.'}
                </AccordionSection>

                {/* Mechanism of Action */}
                {drug.mechanism && (
                    <AccordionSection
                        title="Mecanismo de Ação"
                        icon={<Activity className="w-4 h-4 text-cyan-500" />}
                        isOpen={openSections['mechanism']}
                        onToggle={() => toggleSection('mechanism')}
                    >
                        {drug.mechanism}
                    </AccordionSection>
                )}

                {/* Contraindications */}
                <AccordionSection
                    title="Contraindicações"
                    icon={<ShieldAlert className="w-4 h-4 text-amber-500" />}
                    isOpen={openSections['contraindications']}
                    onToggle={() => toggleSection('contraindications')}
                >
                    {drug.contraindications || 'Nenhuma contraindicação específica listada.'}
                </AccordionSection>

                {/* Adverse Reactions */}
                <AccordionSection
                    title="Efeitos Adversos"
                    icon={<AlertOctagon className="w-4 h-4 text-purple-500" />}
                    isOpen={openSections['adverse']}
                    onToggle={() => toggleSection('adverse')}
                >
                    {drug.adverse_reactions || 'Nenhuma reação adversa específica listada.'}
                </AccordionSection>

                {/* General Warnings (fallback) */}
                {!drug.boxed_warning && drug.warnings && drug.warnings !== 'No specific warnings' && (
                    <AccordionSection
                        title="Alertas Gerais"
                        icon={<Info className="w-4 h-4 text-gray-500" />}
                        isOpen={openSections['warnings']}
                        onToggle={() => toggleSection('warnings')}
                    >
                        {drug.warnings}
                    </AccordionSection>
                )}

            </div>
        </div>
    );
};

const AccordionSection: React.FC<{
    title: string,
    icon: React.ReactNode,
    isOpen: boolean,
    onToggle: () => void,
    children: React.ReactNode
}> = ({ title, icon, isOpen, onToggle, children }) => (
    <div>
        <button
            onClick={onToggle}
            className="w-full flex justify-between items-center p-2.5 hover:bg-[var(--color-bg-dark)] transition-colors text-left"
        >
            <div className="flex items-center gap-2">
                {icon}
                <span className="text-xs font-semibold text-[var(--color-text-primary)]">{title}</span>
            </div>
            {isOpen ? <ChevronUp className="w-3 h-3 text-[var(--color-text-secondary)]" /> : <ChevronDown className="w-3 h-3 text-[var(--color-text-secondary)]" />}
        </button>
        {isOpen && (
            <div className="p-3 pt-0 text-xs text-[var(--color-text-muted)] leading-relaxed whitespace-pre-line animate-slideDown">
                {children}
            </div>
        )}
    </div>
);
