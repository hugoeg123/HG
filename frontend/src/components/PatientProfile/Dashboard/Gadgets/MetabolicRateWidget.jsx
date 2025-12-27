import React, { useState, useEffect, useMemo } from 'react';
import HealthGadget from '../HealthGadget';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { tagHistoryService } from '../../../../services/api';

const ACTIVITY_FACTORS = [
    { value: "1.2", label: "Sedentário (x1.2)", desc: "Pouco ou nenhum exercício" },
    { value: "1.375", label: "Leve (x1.375)", desc: "1-3 dias/semana" },
    { value: "1.55", label: "Moderado (x1.55)", desc: "3-5 dias/semana" },
    { value: "1.725", label: "Intenso (x1.725)", desc: "6-7 dias/semana" },
    { value: "1.9", label: "Muito Intenso (x1.9)", desc: "2x/dia ou pesado" }
];

const MetabolicRateWidget = ({ patient, onPin, isPinned }) => {
    const [weight, setWeight] = useState(null);
    const [height, setHeight] = useState(null);
    const [activityFactor, setActivityFactor] = useState("1.375");
    const [loading, setLoading] = useState(true);

    // Load measurements
    useEffect(() => {
        const loadOps = async () => {
            if (!patient?.id) return;
            try {
                const [wRes, hRes] = await Promise.all([
                    tagHistoryService.get('PESO', { patientId: patient.id, limit: 1 }),
                    tagHistoryService.get('ALTURA', { patientId: patient.id, limit: 1 })
                ]);
                if (wRes.data?.items?.[0]) setWeight(Number(wRes.data.items[0].value));
                if (hRes.data?.items?.[0]) setHeight(Number(hRes.data.items[0].value));
            } catch (err) {
                if (err.response?.status !== 401) {
                    console.error(err);
                }
            } finally {
                setLoading(false);
            }
        };
        loadOps();
    }, [patient?.id]);

    const { tmb, get } = useMemo(() => {
        if (!weight || !height || !patient?.birthDate) return { tmb: 0, get: 0 };

        // Mifflin-St Jeor (1990)
        // Men: (10 × weight) + (6.25 × height) - (5 × age) + 5
        // Women: (10 × weight) + (6.25 × height) - (5 × age) - 161

        const age = new Date().getFullYear() - new Date(patient.birthDate).getFullYear();
        const isMale = (patient.sex || 'male') === 'male';

        let base = (10 * weight) + (6.25 * height) - (5 * age);
        base = isMale ? (base + 5) : (base - 161);

        const total = base * parseFloat(activityFactor);

        return { tmb: Math.round(base), get: Math.round(total) };
    }, [weight, height, patient, activityFactor]);

    return (
        <HealthGadget
            title="Gasto Energético"
            evidenceLevel="High"
            sourceCitation="Mifflin-St Jeor (1990)"
            onPin={onPin}
            isPinned={isPinned}
        >
            <div className="flex flex-col gap-3 h-full">

                {loading ? (
                    <div className="text-sm text-gray-400 text-center py-4">Carregando dados...</div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 py-2">
                        <div className="flex flex-col items-center p-2 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 transition-all hover:scale-[1.02] duration-200">
                            <span className="text-[10px] text-orange-600 dark:text-orange-400 font-medium uppercase mb-1">
                                Basal (TMB)
                            </span>
                            <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">{tmb}</span>
                            <span className="text-[10px] text-orange-400/80">kcal/dia</span>
                        </div>
                        <div className="flex flex-col items-center p-2 rounded-lg bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/30 transition-all hover:scale-[1.02] duration-200 shadow-sm">
                            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium uppercase mb-1">
                                Total (GET)
                            </span>
                            <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">{get}</span>
                            <span className="text-[10px] text-teal-400/80">kcal/dia</span>
                        </div>
                    </div>
                )}

                    <div className="space-y-2 bg-gray-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 text-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                            Fator de Atividade
                        </span>
                        <Select value={activityFactor} onValueChange={setActivityFactor}>
                            <SelectTrigger className="h-6 w-[140px] text-[10px] bg-white dark:bg-zinc-800">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ACTIVITY_FACTORS.map(f => (
                                    <SelectItem key={f.value} value={f.value}>
                                        <span className="font-medium">{f.label}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <p className="text-[10px] text-gray-400 text-center mt-1">
                        {ACTIVITY_FACTORS.find(f => f.value === activityFactor)?.desc}
                    </p>
                </div>

            </div>
        </HealthGadget>
    );
};

export default MetabolicRateWidget;
