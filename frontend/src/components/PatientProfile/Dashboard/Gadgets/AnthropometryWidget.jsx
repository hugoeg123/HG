import React, { useState, useMemo, useEffect } from 'react';
import HealthGadget from '../HealthGadget';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { patientInputService, tagHistoryService } from '../../../../services/api';
import { subscribeToPatient } from '../../../../services/socket';
import { toast } from 'sonner';

const BMI_THRESHOLDS = {
    Europid: { overweight: 25, obesity: 30 },
    Asian: { overweight: 23, obesity: 27.5 },
    SouthAmerican: { overweight: 25, obesity: 30 }, // Default safe
};

const AnthropometryWidget = ({ patient, onPin, isPinned }) => {
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [ethnicity, setEthnicity] = useState(patient?.ethnicity || 'SouthAmerican');
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    // Load initial data from history (Real Data Integration)
    useEffect(() => {
        const loadMeasurements = async () => {
            if (!patient?.id) return;
            try {
                const [wRes, hRes] = await Promise.all([
                    tagHistoryService.get('PESO', { patientId: patient.id, limit: 1 }),
                    tagHistoryService.get('ALTURA', { patientId: patient.id, limit: 1 })
                ]);

                const lastW = wRes.data?.items?.[0]?.value;
                const lastH = hRes.data?.items?.[0]?.value;

                if (lastW) setWeight(lastW);
                if (lastH) setHeight(lastH);
            } catch (err) {
                if (err.response?.status !== 401) {
                    console.error(err);
                }
            } finally {
                setLoading(false);
            }
        };
        loadMeasurements();

        // Socket Subscription
        let unsubscribe = null;
        if (patient?.id) {
            unsubscribe = subscribeToPatient(patient.id, (data) => {
                // Reload on any update for now, or check data.type
                loadMeasurements();
            });
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [patient?.id]);

    // Calculate BMI, BSA (Mosteller), and Ideal Weight Range
    const stats = useMemo(() => {
        if (!weight || !height) return null;
        const hM = parseFloat(height) / 100;
        const wKg = parseFloat(weight);
        if (hM <= 0 || wKg <= 0) return null;

        const bmi = (wKg / (hM * hM)).toFixed(1);

        // Mosteller Formula: sqrt( (cm * kg) / 3600 )
        const bsa = Math.sqrt((parseFloat(height) * wKg) / 3600).toFixed(2);

        // Ideal Weight (BMI 18.5 - 24.9)
        const minIdeal = (18.5 * hM * hM).toFixed(1);
        const maxIdeal = (24.9 * hM * hM).toFixed(1);

        return { bmi, bsa, minIdeal, maxIdeal };
    }, [weight, height]);

    // Classification
    const classification = useMemo(() => {
        if (!stats?.bmi) return null;
        const val = parseFloat(stats.bmi);
        const thresholds = BMI_THRESHOLDS[ethnicity] || BMI_THRESHOLDS.Europid;

        if (val < 18.5) return { status: 'Abaixo do peso', color: 'text-blue-500' };
        if (val < thresholds.overweight) return { status: 'Saudável', color: 'text-green-500' };
        if (val < thresholds.obesity) return { status: 'Sobrepeso', color: 'text-yellow-600' };
        return { status: 'Obesidade', color: 'text-red-500' };
    }, [stats?.bmi, ethnicity]);

    const handleSave = async () => {
        try {
            await patientInputService.create({
                tags: { PESO: parseFloat(weight), ALTURA: parseFloat(height) },
                content: `Atualização de antropometria: ${weight} kg, ${height} cm`,
                source: 'patient',
                metadata: { ethnicity } // Store ethnicity preference implicitly
            });
            toast.success('Medidas atualizadas!');
        } catch (err) {
            toast.error('Erro ao salvar');
        }
    };

    return (
        <HealthGadget
            title="Composição Corporal"
            evidenceLevel="Medium" // BMI has limitations
            sourceCitation="WHO & IDF Consensus"
            onPin={onPin}
            isPinned={isPinned}
        >
            <div className="flex flex-col gap-4 h-full">

                {/* Main Display */}
                <div className="grid grid-cols-2 gap-4 border-b border-gray-100 dark:border-gray-800 pb-3">
                    <div className="text-center border-r border-gray-100 dark:border-gray-700">
                        <span className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                            {loading ? <span className="text-sm text-gray-400">...</span> : (stats?.bmi || '--')}
                        </span>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">IMC</p>
                    </div>

                    <div className="text-center">
                        <div className="flex flex-col h-full justify-center">
                            <span className={`text-sm font-bold ${classification?.color || 'text-gray-500'}`}>
                                {loading ? '...' : (classification?.status || 'Calculando')}
                            </span>
                            <div className="text-[10px] text-gray-400 mt-1">
                                {stats?.bsa ? <span>SC: {stats.bsa} m²</span> : null}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sub-stats (Ideal Weight) */}
                {stats?.minIdeal && (
                    <div className="flex justify-between text-xs text-muted-foreground px-2">
                        <span>Peso Ideal:</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                            {stats.minIdeal} - {stats.maxIdeal} kg
                        </span>
                    </div>
                )}

                {/* Adjustments */}
                <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-lg border border-gray-100 dark:border-gray-800 transition-all duration-200">
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)} 
                        className="w-full flex items-center justify-between p-3 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
                    >
                        <span>
                            {isExpanded ? 'Ocultar ajustes' : 'Editar dados'}
                        </span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                        <div className="p-3 pt-0 space-y-3 animate-in slide-in-from-top-2 duration-200">
                            {/* Ethnicity Selector */}
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-muted-foreground">
                                    Etnia
                                </div>
                                <Select value={ethnicity} onValueChange={setEthnicity}>
                                    <SelectTrigger className="h-6 w-[120px] text-xs bg-white dark:bg-zinc-800 border-gray-200 dark:border-gray-700">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SouthAmerican">Sul-Americana</SelectItem>
                                        <SelectItem value="Europid">Caucasiana</SelectItem>
                                        <SelectItem value="Asian">Asiática</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Inputs */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-muted-foreground">
                                        Peso (kg)
                                    </label>
                                    <Input
                                        value={weight}
                                        onChange={e => setWeight(e.target.value)}
                                        className="h-8 text-sm bg-white dark:bg-zinc-800"
                                        placeholder="0.0"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-muted-foreground">
                                        Altura (cm)
                                    </label>
                                    <Input
                                        value={height}
                                        onChange={e => setHeight(e.target.value)}
                                        className="h-8 text-sm bg-white dark:bg-zinc-800"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <Button size="sm" className="w-full h-8 bg-teal-600 hover:bg-teal-700 text-white" onClick={handleSave}>
                                Atualizar
                            </Button>
                        </div>
                    )}
                </div>

            </div>
        </HealthGadget>
    );
};

export default AnthropometryWidget;
