import React, { useState, useEffect } from 'react';
import HealthGadget from '../HealthGadget';
import { tagHistoryService } from '../../../../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Activity, Thermometer, Heart, Wind, Gauge, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Generic Metric Widget
 * Plots history for ANY numeric tag (FC, FR, PAS, PAD, PESO, etc.)
 */
const GenericMetricWidget = ({ patient, tag, title, unit, color = "#14b8a6", icon: Icon = Activity, onPin, isPinned }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [latest, setLatest] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            if (!patient?.id || !tag) return;

            try {
                setLoading(true);
                // Fetch history for the specific tag
                const res = await tagHistoryService.get(tag, { patientId: patient.id, limit: 30 });

                if (Array.isArray(res.data?.items)) {
                    const validItems = res.data.items
                        .filter(item => !isNaN(Number(item.value)))
                        .map(item => ({
                            timestamp: new Date(item.timestamp).getTime(),
                            dateStr: format(new Date(item.timestamp), 'dd/MM HH:mm', { locale: ptBR }),
                            value: Number(item.value),
                            unit: item.unit || unit
                        }))
                        .sort((a, b) => a.timestamp - b.timestamp);

                    setData(validItems);
                    if (validItems.length > 0) {
                        setLatest(validItems[validItems.length - 1]);
                    }
                }
            } catch (err) {
                console.error(`Failed to load history for ${tag}`, err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [patient, tag]);

    // Determine Icon based on common tags if not provided (though props usually handle this)
    const DisplayIcon = Icon;

    return (
        <HealthGadget
            title={title || tag}
            icon={DisplayIcon}
            evidenceLevel="Medium" // Generic data display, context varies
            sourceCitation="Histórico Clínico"
            onPin={onPin}
            isPinned={isPinned}
            className="min-h-[200px]"
        >
            <div className="flex flex-col h-full gap-2">
                {loading ? (
                    <div className="flex items-center justify-center h-32 text-xs text-muted-foreground animate-pulse">Carregando dados...</div>
                ) : data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground opacity-60">
                        <Hash className="w-6 h-6 mb-2" />
                        <p className="text-xs">Sem registros</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-foreground">{latest?.value}</span>
                            <span className="text-xs text-muted-foreground">{latest?.unit || unit}</span>
                            <span className="text-[10px] text-muted-foreground ml-auto">{latest?.dateStr}</span>
                        </div>

                        <div className="flex-1 min-h-[120px] w-full -ml-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data}>
                                    <defs>
                                        <linearGradient id={`color-${tag}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={color} stopOpacity={0.6} />
                                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                                    <XAxis
                                        dataKey="dateStr"
                                        hide
                                    />
                                    <RechartsTooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--card)',
                                            borderColor: 'var(--border)',
                                            color: 'var(--foreground)',
                                            borderRadius: '8px',
                                            fontSize: '12px'
                                        }}
                                        itemStyle={{ color: 'var(--foreground)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke={color}
                                        fillOpacity={1}
                                        fill={`url(#color-${tag})`}
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}
            </div>
        </HealthGadget>
    );
};

export default GenericMetricWidget;
