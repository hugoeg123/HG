import React, { useState, useRef, useEffect } from 'react';
import { Search, Send, Plus, Tag } from 'lucide-react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { patientInputService } from '../../../services/api';
import { useToast } from '../../ui/Toast';

/**
 * HealthOmnibox
 * 
 * "Google-like" input bar that parses text to find tags and values.
 * Examples: 
 * "80kg #peso" -> { tag: "PESO", value: 80, unit: "kg" }
 * "105 #glicemia pós almoço" -> { tag: "GLICEMIA", value: 105, context: "pós almoço" }
 */
const HealthOmnibox = ({ onNewEntry, className }) => {
    const [input, setInput] = useState('');
    const [detectedTag, setDetectedTag] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const inputRef = useRef(null);

    // Regex patterns for common metrics
    const patterns = {
        peso: { regex: /(\d+[.,]?\d*)\s*(kg|kilos|quilos)/i, tag: 'PESO', unit: 'kg' },
        altura: { regex: /(\d+[.,]?\d*)\s*(cm|metros|m)/i, tag: 'ALTURA', unit: 'cm' },
        glicemia: { regex: /(\d{2,3})\s*(mg\/dl)?/i, tag: 'GLICEMIA', unit: 'mg/dL', keywords: ['glicemia', 'dextro', 'diabetes', 'açucar'] },
        pressao: { regex: /(\d{2,3})\s*[\/x]\s*(\d{2,3})/i, tag: 'PA', unit: 'mmHg', keywords: ['pressão', 'pa', 'tensão'] },
        agua: { regex: /(\d+)\s*(ml|l|copos)/i, tag: 'HIDRATACAO', unit: 'ml', keywords: ['agua', 'água', 'bebi', 'hidratação'] }
    };

    // Auto-detect tag as user types
    useEffect(() => {
        // 1. Check for explicit hashtag
        const hashtagMatch = input.match(/#(\w+)/);
        if (hashtagMatch) {
            setDetectedTag({ code: hashtagMatch[1].toUpperCase(), source: 'explicit' });
            return;
        }

        // 2. Check for keywords/patterns
        const lowerInput = input.toLowerCase();

        // Glicemia keywords
        if (patterns.glicemia.keywords.some(k => lowerInput.includes(k))) {
            setDetectedTag({ code: 'GLICEMIA', source: 'inference' });
            return;
        }
        // Peso keywords/units
        if (lowerInput.includes('kg') || lowerInput.includes('peso')) {
            setDetectedTag({ code: 'PESO', source: 'inference' });
            return;
        }
        // Pressão
        if (patterns.pressao.keywords.some(k => lowerInput.includes(k)) || input.match(/\d{2,3}[\/x]\d{2,3}/)) {
            setDetectedTag({ code: 'PA', source: 'inference' });
            return;
        }
        // Água
        if (patterns.agua.keywords.some(k => lowerInput.includes(k)) || lowerInput.includes('ml')) {
            setDetectedTag({ code: 'HIDRATACAO', source: 'inference' });
            return;
        }

        setDetectedTag(null);
    }, [input]);

    const parseInput = (text) => {
        // Logic to extract value and unit based on the detected tag
        let value = null;
        let unit = null;
        let type = detectedTag?.code || 'NOTA';

        // Simple number extraction fallback
        const numberMatch = text.match(/(\d+[.,]?\d*)/);
        if (numberMatch) {
            value = parseFloat(numberMatch[1].replace(',', '.'));
        }

        return {
            tags: { [type]: value }, // Flexible JSONB structure expected by Backend
            content: text,
            source: 'patient',
            metadata: { unit: unit || 'raw' }
        };
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!input.trim()) return;

        setIsSubmitting(true);
        try {
            const payload = parseInput(input);

            // Call API
            await patientInputService.create(payload);

            toast.success('Registro salvo!', { description: `${payload.content}` });
            setInput('');
            if (onNewEntry) onNewEntry();
        } catch (err) {
            console.error(err);
            toast.error('Erro ao salvar', { description: 'Tente novamente.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`relative ${className}`}>
            <form onSubmit={handleSubmit} className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {detectedTag ? <Tag className="w-4 h-4 text-teal-500" /> : <Plus className="w-4 h-4" />}
                </div>

                <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Digite algo como '80kg #peso' ou '102 glicemia'..."
                    className="pl-10 pr-24 py-6 text-lg shadow-sm border-teal-100 focus:border-teal-500 rounded-xl"
                />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {detectedTag && (
                        <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors animate-in fade-in zoom-in">
                            #{detectedTag.code}
                        </Badge>
                    )}
                    <Button
                        type="submit"
                        size="sm"
                        disabled={!input.trim() || isSubmitting}
                        className="h-8 w-8 p-0 rounded-full bg-teal-600 hover:bg-teal-700"
                    >
                        <Send className="w-4 h-4 text-white" />
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default HealthOmnibox;
