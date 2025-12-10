import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselProps {
    children: React.ReactNode[];
    title?: string;
}

export const Carousel: React.FC<CarouselProps> = ({ children, title }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const prev = () => {
        setCurrentIndex((prev) => (prev === 0 ? children.length - 1 : prev - 1));
    };

    const next = () => {
        setCurrentIndex((prev) => (prev === children.length - 1 ? 0 : prev + 1));
    };

    if (children.length === 0) return null;

    if (children.length === 1) {
        return <>{children[0]}</>;
    }

    return (
        <div className="relative group">
            {title && <h4 className="text-xs font-semibold mb-2 text-[var(--color-text-primary)]">{title}</h4>}

            <div className="overflow-hidden relative rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-light)]">
                <div className="p-1">
                    {children[currentIndex]}
                </div>

                {/* Navigation Buttons */}
                <button
                    onClick={prev}
                    className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                    onClick={next}
                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>

                {/* Indicators */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                    {children.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full ${idx === currentIndex ? 'bg-[var(--color-primary)]' : 'bg-gray-300'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
