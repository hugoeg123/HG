import React, { useState, useEffect } from 'react';
import HealthGadget from '../HealthGadget';
import { tagHistoryService } from '../../../../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const GlucoseWidget = ({ patient, onPin, isPinned }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Query multiple tags for glucose context
                const res = await tagHistoryService.get('GLICEMIA', { patientId: patient.id, limit: 30 });
                if (Array.isArray(res.data?.items)) {
                    // Normalize data for chart
                    const chartData = res.data.items
                        .filter(item => !isNaN(Number(item.value)))
                        .map(item => ({
                            timestamp: new Date(item.timestamp).getTime(),
                            dateStr: format(new Date(item.timestamp), 'dd/MM HH:mm', { locale: ptBR }),
                            value: Number(item.value),
                            unit: item.unit || 'mg/dL'
                        }))
                        .sort((a, b) => a.timestamp - b.timestamp); // Sort by time ascending

                    setData(chartData);
                }
            } catch (err) {
                if (err.response?.status !== 401) {
                    console.error("Failed to load glucose history", err);
                }
            } finally {
                setLoading(false);
            }
        };

        if (patient?.id) loadData();
    }, [patient]);

    const latestValue = data.length > 0 ? data[data.length - 1].value : null;

    return (
        <HealthGadget
            title="Glicemia"
            icon={Activity}
            evidenceLevel="High"
            sourceCitation="SBD & ADA Guidelines 2024"
            onPin={onPin}
            isPinned={isPinned}
            className="min-h-[250px]"
        >
            <div className="flex flex-col h-full gap-2">
                {loading ? (
                    <div className="flex items-center justify-center h-40 text-sm text-gray-400">Carregando gráfico...</div>
                ) : data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-300">
                        <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-xs">Sem dados recentes</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">{latestValue}</span>
                            <span className="text-xs text-gray-500">mg/dL (último)</span>
                        </div>

                        <div className="flex-1 min-h-[150px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data}>
                                    <defs>
                                        <linearGradient id="colorGlucose" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="dateStr"
                                        tick={{ fontSize: 10 }}
                                        tickLine={false}
                                        axisLine={false}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                                        formatter={(value) => [`${value} mg/dL`, 'Glicemia']}
                                    />
                                    {/* Safe Range Reference Area/Lines could go here */}
                                    <ReferenceLine y={70} stroke="red" strokeDasharray="3 3" label={{ position: 'right', value: 'Min', fontSize: 8, fill: 'red' }} />
                                    <ReferenceLine y={180} stroke="orange" strokeDasharray="3 3" label={{ position: 'right', value: 'Max', fontSize: 8, fill: 'orange' }} />

                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#14b8a6"
                                        fillOpacity={1}
                                        fill="url(#colorGlucose)"
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

export default GlucoseWidget;
