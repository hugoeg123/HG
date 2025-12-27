import React, { useState, useEffect, useMemo } from 'react';
import HealthGadget from '../HealthGadget';
import { Button } from '../../../ui/button';
import { Progress } from '../../../ui/progress';
import { Droplet, Plus, Minus } from 'lucide-react';
import { patientInputService, tagHistoryService } from '../../../../services/api';
import { toast } from 'sonner';

const NASEM_GUIDELINES = {
    // ml/day
    men: 3700, // 3.7L total (approx 3L beverages)
    women: 2700, // 2.7L total (approx 2.2L beverages)
    pregnancy: 3000,
    lactation: 3800,
    children_1_3: 1300,
    children_4_8: 1700,
    boys_9_13: 2400,
    boys_14_18: 3300,
    girls_9_13: 2100,
    girls_14_18: 2300
};

const HydrationWidget = ({ patient, onPin, isPinned }) => {
    const [intake, setIntake] = useState(0);
    const [dailyTarget, setDailyTarget] = useState(2500); // Default fallback
    const [loading, setLoading] = useState(true);
    const [calculationMethod, setCalculationMethod] = useState('standard'); // 'weight_based' or 'age_based'

    // 1. Calculate Target based on Scientific Guidelines (35ml/kg)
    useEffect(() => {
        const calculateTarget = async () => {
            if (!patient) return;

            let target = 2500;
            let method = 'age_based';

            // Attempt weight-based (More precise)
            try {
                // Check patient.lastWeight first provided by parent or fetch
                // But here we rely on the recently fetched weight from history if we want to be super precise.
                // For simplicity, lets check simply if we can get a weight tag.
                const res = await tagHistoryService.get('PESO', { patientId: patient.id, limit: 1 });
                const weight = res.data?.items?.[0]?.value;

                if (weight) {
                    // 35ml/kg rule for healthy adults
                    target = Math.round(Number(weight) * 35);
                    method = 'weight_based';
                } else {
                    // Fallback to NASEM Age/Sex buckets
                    const age = new Date().getFullYear() - new Date(patient.birthDate).getFullYear();
                    const sex = patient.sex || 'unknown';
                    if (age >= 19) target = sex === 'female' ? 2700 : 3700;
                    else if (age >= 14) target = sex === 'female' ? 2300 : 3300;
                    else target = 1700;
                }
            } catch (e) {
                if (e.response?.status !== 401) {
                    console.error("Hydration calc error", e);
                }
            }

            setDailyTarget(target);
            setCalculationMethod(method);
        };
        calculateTarget();
    }, [patient]);

    // 2. Load Today's Intake
    const loadIntake = async () => {
        try {
            // Logic would ideally query by date range (today)
            // For now we assume tagHistoryService returns recent items and we filter client-side
            const res = await tagHistoryService.get('HIDRATACAO', { patientId: patient.id, limit: 20 });
            const items = res.data?.items || [];

            // Filter for today
            const today = new Date().toDateString();
            const todaysItems = items.filter(item => new Date(item.timestamp).toDateString() === today);

            const total = todaysItems.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
            setIntake(total);
        } catch (err) {
            if (err.response?.status !== 401) {
                console.error("Failed to load hydration", err);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (patient?.id) loadIntake();
    }, [patient?.id]);

    // 3. Add Water Handler
    const addWater = async (amount) => {
        if (!patient?.id) return;

        const previousIntake = intake;
        const updatedIntake = intake + amount;
        setIntake(updatedIntake);

        try {
            await patientInputService.create({
                tags: { HIDRATACAO: amount },
                content: `Ingestão de ${amount}ml de água`,
                source: 'patient',
                metadata: { unit: 'ml' }
            });
        } catch (err) {
            toast.error('Erro ao registrar hidratação');
            setIntake(previousIntake);
        }
    };

    const percentage = Math.min(100, Math.round((intake / dailyTarget) * 100));

    return (
        <HealthGadget
            title="Hidratação"
            icon={Droplet}
            evidenceLevel="High"
            sourceCitation="National Academies of Sciences, Engineering, and Medicine (NASEM) 2004"
            onPin={onPin}
            isPinned={isPinned}
        >
            <div className="flex flex-col h-full justify-between gap-4">

                <div className="text-center space-y-1">
                    <div className="text-4xl font-bold text-teal-600 dark:text-teal-400">
                        {intake}<span className="text-lg text-gray-400 font-normal">ml</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Meta: {dailyTarget}ml</p>
                </div>

                <div className="space-y-2">
                    <Progress value={percentage} className="h-3" indicatorClassName={percentage >= 100 ? "bg-green-500" : "bg-blue-500"} />
                    <p className="text-xs text-center text-muted-foreground">
                        {percentage}% da meta diária
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={() => addWater(250)} className="border-teal-200 text-teal-700 hover:bg-teal-50">
                        <Plus className="w-4 h-4 mr-1" /> 250ml
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => addWater(500)} className="border-teal-200 text-teal-700 hover:bg-teal-50">
                        <Plus className="w-4 h-4 mr-1" /> 500ml
                    </Button>
                </div>

            </div>
        </HealthGadget>
    );
};

export default HydrationWidget;
