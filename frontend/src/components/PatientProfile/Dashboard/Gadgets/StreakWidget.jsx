import React, { useState, useEffect } from 'react';
import HealthGadget from '../HealthGadget';
import { Button } from '../../../ui/button';
import { Flame, CheckCircle, CigaretteOff } from 'lucide-react';
import { patientInputService, tagHistoryService } from '../../../../services/api';
import { toast } from 'sonner';

const StreakWidget = ({ patient, onPin, isPinned, type = 'ACTIVITY' }) => {
    const [streak, setStreak] = useState(0);
    const [lastLogDate, setLastLogDate] = useState(null);
    const [loading, setLoading] = useState(true);

    // Configuration based on type
    const config = {
        ACTIVITY: {
            title: "Sequência Ativa",
            icon: Flame,
            tag: "ATIVIDADE_FISICA",
            unit: "min",
            actionLabel: "Registrar Treino",
            color: "text-orange-500",
            message: "dias ativos"
        },
        SMOKING: {
            title: "Dias Sem Fumar",
            icon: CigaretteOff,
            tag: "CIGARRO", // Logic might be inverted for cessation, but let's assume tracking "smoke free days" explicitly or deriving it.
            // For simplicity: We track "Check-ins" of being smoke free.
            unit: "checkin",
            actionLabel: "Hoje não fumei!",
            color: "text-green-500",
            message: "dias limpo"
        }
    }[type];

    const loadStreak = async () => {
        try {
            // Simplistic streak calculation: consecutive days with entries
            // In a real app, this would be a backend aggregation
            const res = await tagHistoryService.get(config.tag, { patientId: patient.id, limit: 100 });
            const items = res.data?.items || [];

            if (items.length === 0) {
                setStreak(0);
                return;
            }

            // Group by date
            const dates = items.map(i => new Date(i.timestamp).toDateString());
            const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a)); // Descending

            const today = new Date().toDateString();
            const yesterday = new Date(Date.now() - 86400000).toDateString();

            let currentStreak = 0;
            let checkDate = new Date();

            // Check if logged today
            const hasToday = uniqueDates.includes(today);
            if (hasToday) {
                currentStreak = 1;
                setLastLogDate(today);
            } else {
                // If not today, check if yesterday exists (broken streak prevention)
                if (!uniqueDates.includes(yesterday)) {
                    setStreak(0); // Streak broken
                    setLastLogDate(uniqueDates[0]);
                    return;
                }
            }

            // Count backwards
            // This is a naive client-side implementation.
            // Ideally, backend does this.
            for (let i = hasToday ? 1 : 0; i < uniqueDates.length; i++) {
                const d1 = new Date(uniqueDates[i]);
                const dPrev = new Date(uniqueDates[i - 1] || today); // Compare to previous in list (which is actually newer date)

                const diffTime = Math.abs(dPrev - d1);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays <= 1) {
                    currentStreak++;
                } else {
                    break;
                }
            }

            setStreak(currentStreak);
        } catch (err) {
            if (err.response?.status !== 401) {
                console.error(err);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (patient?.id) loadStreak();
    }, [patient, type]);

    const handleCheckIn = async () => {
        try {
            await patientInputService.create({
                tags: { [config.tag]: 1 },
                content: `Check-in: ${config.title}`,
                source: 'patient',
                metadata: { type: 'streak_checkin' }
            });
            toast.success('Check-in realizado!', { description: 'Continue assim!' });
            setStreak(prev => prev + 1);
            setLastLogDate(new Date().toDateString());
        } catch (err) {
            toast.error('Erro ao salvar');
        }
    };

    const isCheckedInToday = lastLogDate === new Date().toDateString();

    return (
        <HealthGadget
            title={config.title}
            icon={config.icon}
            evidenceLevel="Low" // Motivational
            sourceCitation="Behavioral Science"
            onPin={onPin}
            isPinned={isPinned}
        >
            <div className="flex flex-col items-center justify-center h-full gap-4">

                <div className="relative flex items-center justify-center">
                    {/* Fire Ring or similar visual could go here */}
                    <div className={`text-5xl font-black ${config.color} animate-pulse`}>
                        {streak}
                    </div>
                </div>

                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                    {config.message}
                </p>

                <Button
                    onClick={handleCheckIn}
                    disabled={isCheckedInToday || loading}
                    variant={isCheckedInToday ? "secondary" : "default"}
                    className="w-full mt-2"
                >
                    {isCheckedInToday ? (
                        <><CheckCircle className="w-4 h-4 mr-2" /> Registrado</>
                    ) : (
                        config.actionLabel
                    )}
                </Button>
            </div>
        </HealthGadget>
    );
};

export default StreakWidget;
