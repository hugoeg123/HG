import React from 'react';
import { WikiResult } from '../hooks/useKnowledgeSearch';
import { Globe, ExternalLink } from 'lucide-react';

export const WikipediaCard: React.FC<{ wiki: WikiResult }> = ({ wiki }) => {
    return (
        <div className="bg-[var(--color-bg-light)] rounded-lg border border-[var(--color-border)] mb-3 overflow-hidden shadow-sm animate-fadeIn">
            {/* Header */}
            <div className="p-3 bg-gradient-to-r from-cyan-900/10 to-transparent border-b border-[var(--color-border)] flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-600" />
                    <h3 className="font-bold text-sm text-[var(--color-text-primary)]">Conceito Clínico (Wikipedia)</h3>
                </div>
                <a
                    href={wiki.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-cyan-600 hover:underline flex items-center gap-1"
                >
                    Ver original <ExternalLink className="w-2.5 h-2.5" />
                </a>
            </div>

            <div className="p-3 flex gap-3">
                {wiki.thumbnail && (
                    <img
                        src={wiki.thumbnail}
                        alt={wiki.title}
                        className="w-16 h-16 object-cover rounded border border-[var(--color-border)] shrink-0 bg-white"
                    />
                )}
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-[var(--color-text-primary)] mb-1">{wiki.title}</h4>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-4">
                        {wiki.description}
                    </p>
                </div>
            </div>
        </div>
    );
};
