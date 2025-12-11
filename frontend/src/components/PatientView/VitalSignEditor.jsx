import React, { useCallback, forwardRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { ViewPlugin, Decoration } from '@codemirror/view';
import { EditorView } from '@codemirror/view';
import { calculateSeverity } from '../../lib/vitalSignAlerts';
import { RangeSetBuilder } from '@codemirror/state';
import { EditorState } from '@codemirror/state';

/**
 * VitalSignEditor
 * Editor "inteligente" que substitui o textarea simples.
 * Usa CodeMirror 6 para colorir valores anormais em tempo real.
 * 
 * Props:
 * - value: string
 * - onChange: (value) => void
 * - onKeyDown: (e) => void
 * - placeholder: string
 * - style: object
 */

// Fábrica de plugin do CodeMirror para decorar Sinais Vitais com contexto
const createVitalSignDecorator = (context) => ViewPlugin.fromClass(class {
    constructor(view) {
        this.decorations = this.computeDecorations(view);
    }

    update(update) {
        if (update.docChanged || update.viewportChanged) {
            this.decorations = this.computeDecorations(update.view);
        }
    }

    computeDecorations(view) {
        const builder = new RangeSetBuilder();
        for (const { from, to } of view.visibleRanges) {
            const text = view.state.doc.sliceString(from, to);
            const regex = /(PA|PAS|PAD|FC|FR|SpO2|Temp|T)(?:[:\s=]+)(\d{2,3}(?:[\.,]\d{1,2})?)(?:([x\/])(\d{2,3}))?/gi;

            let match;
            while ((match = regex.exec(text))) {
                const start = from + match.index;
                const end = start + match[0].length;
                const type = match[1].toLowerCase();
                const val1 = parseFloat(String(match[2]).replace(',', '.'));
                const val2 = match[4] ? parseFloat(match[4]) : null;

                let vitals = {};
                if (type.startsWith('pa') && val2) vitals = { systolic: val1, diastolic: val2 };
                else if (type === 'pas' || (type.startsWith('pa') && !val2)) vitals = { systolic: val1 };
                else if (type === 'pad') vitals = { diastolic: val1 };
                else if (type === 'fc') vitals = { heartRate: val1 };
                else if (type === 'fr') vitals = { respiratoryRate: val1 };
                else if (type === 'spo2') vitals = { spo2: val1 };
                else if (type.startsWith('temp') || type === 't') vitals = { temp: val1 };

                const alerts = calculateSeverity(vitals, context || {});
                const isAbnormal = Array.isArray(alerts) && alerts.length > 0;

                if (isAbnormal) {
                    builder.add(start, end, Decoration.mark({
                        class: "text-red-500 font-bold bg-red-500/10 rounded px-1"
                    }));
                }
            }
        }
        return builder.finish();
    }
}, {
    decorations: v => v.decorations
});

const VitalSignEditor = forwardRef(({ value, onChange, placeholder, style, onKeyDown, context }, ref) => {

    const handleChange = useCallback((val) => {
        onChange(val);
    }, [onChange]);

    // Tema customizado para parecer transparente/integrado
    const theme = EditorView.theme({
        "&": {
            backgroundColor: "transparent !important",
            height: "100%",
            minHeight: "60px",
            outline: "none"
        },
        ".cm-content": {
            fontFamily: "inherit",
            color: "inherit",
            padding: "0"
        },
        ".cm-line": {
            padding: "0"
        },
        "&.cm-focused": {
            outline: "none"
        },
        ".cm-scroller": {
            overflow: "hidden !important",
            fontFamily: "inherit"
        }
    });

    return (
        <CodeMirror
            ref={ref}
            value={value}
            height="100%"
            onChange={handleChange}
            extensions={[createVitalSignDecorator(context)]}
            theme={theme}
            basicSetup={{
                lineNumbers: false,
                foldGutter: false,
                highlightActiveLine: false,
                highlightActiveLineGutter: false,
                history: true,
                drawSelection: true,
                dropCursor: true,
                allowMultipleSelections: true,
                indentOnInput: false,
                syntaxHighlighting: true,
                bracketMatching: false,
                closeBrackets: false,
                autocompletion: false,
                rectangularSelection: false,
                crosshairCursor: false,
                highlightSelectionMatches: false,
                searchKeymap: false,
                lintKeymap: false,
            }}
            className="w-full h-full text-base font-sans leading-relaxed"
            placeholder={placeholder}
            onKeyDown={onKeyDown} // CodeMirror supports onKeyDown prop in @uiw wrapper
            style={style}
        />
    );
});

export default VitalSignEditor;
