import React from 'react';
import { WikiResult } from '../hooks/useKnowledgeSearch';
import { Globe, ExternalLink } from 'lucide-react';

export const WikipediaCard: React.FC<{ wiki: WikiResult }> = ({ wiki }) => {
    return (
        <div className="bg-[var(--color-bg-light)] rounded-lg border border-[var(--color-border)] mb-3 overflow-hidden shadow-sm animate-fadeIn hover:shadow-md transition-shadow">
            <div className="p-3">
                <div className="flex gap-3">
                    {/* Thumbnail */}
                    {wiki.thumbnail && (
                        <div className="shrink-0">
                            <img
                                src={wiki.thumbnail}
                                alt={wiki.title}
                                className="w-20 h-20 object-cover rounded-md border border-[var(--color-border)] bg-white"
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-sm text-[var(--color-text-primary)] leading-tight">{wiki.title}</h3>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] text-[var(--color-text-secondary)] flex items-center gap-1 shrink-0 ml-2">
                                <Globe className="w-2 h-2" /> Wiki
                            </span>
                        </div>

                        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-3 mb-2">
                            {wiki.description}
                        </p>

                        <a
                            href={wiki.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-teal-300 hover:underline flex items-center gap-1 w-fit transition-colors"
                        >
                            Ler artigo completo <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
