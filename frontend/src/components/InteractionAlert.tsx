import React from 'react';
import { InteractionResult } from '../hooks/useKnowledgeSearch';
import { AlertTriangle } from 'lucide-react';

export const InteractionAlert: React.FC<{ interaction: InteractionResult }> = ({ interaction }) => {
    return (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-3 animate-pulse-soft">
            <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                    <h4 className="text-sm font-bold text-amber-600 mb-1 flex items-center gap-2">
                        Interação Detectada
                        <span className="text-[10px] uppercase bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">{interaction.severity}</span>
                    </h4>
                    <p className="text-xs text-[var(--color-text-primary)] font-medium mb-1">
                        {interaction.drug_a} + {interaction.drug_b}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                        {interaction.description}
                    </p>
                </div>
            </div>
        </div>
    );
};
