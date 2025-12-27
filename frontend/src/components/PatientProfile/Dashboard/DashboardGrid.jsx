import React, { useState, useEffect } from 'react';
import HydrationWidget from './Gadgets/HydrationWidget';
import AnthropometryWidget from './Gadgets/AnthropometryWidget';
import GlucoseWidget from './Gadgets/GlucoseWidget';
import StreakWidget from './Gadgets/StreakWidget';
import GenericMetricWidget from './Gadgets/GenericMetricWidget';
import HealthOmnibox from './HealthOmnibox';
import { Heart, Activity, Thermometer, Wind, Plus, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Command, CommandGroup, CommandItem, CommandList, CommandInput } from '../../ui/command';
import { toast } from 'sonner';

/**
 * Available Generic Metrics
 * The user can pin any of these to their dashboard.
 */
const AVAILABLE_METRICS = [
    // We use generic classes or let the Widget handle the theme.
    // To strictly follow the "Dark=Green, Light=Blue" rule, we avoid specific icon colors here.
    { tag: 'FC', title: 'Frequência Cardíaca', unit: 'bpm', icon: Heart },
    { tag: 'FR', title: 'Frequência Respiratória', unit: 'rpm', icon: Wind },
    { tag: 'PAS', title: 'Pressão Sistólica (PAS)', unit: 'mmHg', icon: Activity },
    { tag: 'PAD', title: 'Pressão Diastólica (PAD)', unit: 'mmHg', icon: Activity },
    { tag: 'TEMP', title: 'Temperatura', unit: '°C', icon: Thermometer },
    { tag: 'SAT', title: 'Saturação O2', unit: '%', icon: Activity },
];

import MetabolicRateWidget from './Gadgets/MetabolicRateWidget';

const DashboardGrid = ({ patient }) => {
    // Core Widgets
    const [showHydration, setShowHydration] = useState(true);
    const [showAnthropometry, setShowAnthropometry] = useState(true);
    const [showGlucose, setShowGlucose] = useState(true);
    const [showStreak, setShowStreak] = useState(true);
    const [showMetabolic, setShowMetabolic] = useState(true);

    // Generic Widgets (pinned tags)
    const [pinnedMetrics, setPinnedMetrics] = useState(() => {
        // Load from local storage or default to empty
        const saved = localStorage.getItem(`hg_pinned_metrics_${patient?.id}`);
        return saved ? JSON.parse(saved) : [];
    });

    // Persist pinned metrics
    useEffect(() => {
        if (patient?.id) {
            localStorage.setItem(`hg_pinned_metrics_${patient.id}`, JSON.stringify(pinnedMetrics));
        }
    }, [pinnedMetrics, patient?.id]);

    const toggleMetric = (metricTag) => {
        setPinnedMetrics(prev => {
            if (prev.includes(metricTag)) {
                return prev.filter(t => t !== metricTag);
            }
            return [...prev, metricTag];
        });
        toast.success('Dashboard atualizado');
    };

    const widgets = [];

    // 1. Core Widgets Pushing
    if (showHydration) widgets.push(<HydrationWidget key="hydro" patient={patient} onPin={() => setShowHydration(!showHydration)} isPinned={showHydration} />);
    if (showAnthropometry) widgets.push(<AnthropometryWidget key="anthro" patient={patient} initialWeight={patient?.lastWeight} initialHeight={patient?.height} onPin={() => setShowAnthropometry(!showAnthropometry)} isPinned={showAnthropometry} />);
    if (showMetabolic) widgets.push(<MetabolicRateWidget key="metabolic" patient={patient} onPin={() => setShowMetabolic(!showMetabolic)} isPinned={showMetabolic} />);
    if (showGlucose) widgets.push(<GlucoseWidget key="gluc" patient={patient} onPin={() => setShowGlucose(!showGlucose)} isPinned={showGlucose} />);
    if (showStreak) widgets.push(<StreakWidget key="streak" patient={patient} type="ACTIVITY" onPin={() => setShowStreak(!showStreak)} isPinned={showStreak} />);

    // 2. Generic Metrics Pushing
    pinnedMetrics.forEach(tag => {
        const def = AVAILABLE_METRICS.find(m => m.tag === tag);
        if (def) {
            widgets.push(
                <GenericMetricWidget
                    key={`metric-${tag}`}
                    tag={tag}
                    title={def.title}
                    unit={def.unit}
                    // color={def.color} // Removed to enforce strict Blue/Green theme
                    icon={def.icon}
                    patient={patient}
                    onPin={() => toggleMetric(tag)}
                    isPinned={true}
                />
            );
        }
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* 1. Omnibox - Always Top */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
                <div className="w-full max-w-2xl">
                    <HealthOmnibox
                        className="w-full"
                        onNewEntry={() => {
                            // Trigger refresh
                            window.dispatchEvent(new Event('health-entry-updated'));
                        }}
                    />
                </div>

                {/* Widget Manager */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="border-dashed border-gray-400 dark:border-gray-600">
                            <Plus className="w-4 h-4 mr-2" /> Adicionar Gadget
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0" align="end">
                        <Command>
                            <CommandInput placeholder="Buscar métrica..." />
                            <CommandList>
                                <CommandGroup heading="Métricas Disponíveis">
                                    {AVAILABLE_METRICS.map(metric => (
                                        <CommandItem
                                            key={metric.tag}
                                            onSelect={() => toggleMetric(metric.tag)}
                                            className="flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2">
                                                <metric.icon className="w-4 h-4 text-muted-foreground" />
                                                <span>{metric.title}</span>
                                            </div>
                                            {pinnedMetrics.includes(metric.tag) && <Plus className="w-3 h-3 text-green-500 rotate-45" />}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                                <CommandGroup heading="Core Gadgets">
                                    <CommandItem onSelect={() => setShowHydration(!showHydration)}>
                                        <span>Hidratação</span> {showHydration && <Plus className="w-3 h-3 ml-auto rotate-45" />}
                                    </CommandItem>
                                    <CommandItem onSelect={() => setShowAnthropometry(!showAnthropometry)}>
                                        <span>Antropometria (IMC)</span> {showAnthropometry && <Plus className="w-3 h-3 ml-auto rotate-45" />}
                                    </CommandItem>
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {/* 2. Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {widgets.map((widget, i) => (
                    <div key={i} className="h-64 sm:h-72 animate-in zoom-in-95 duration-300">
                        {widget}
                    </div>
                ))}

                {widgets.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                        <p>Nenhum gadget fixado. Use o botão "+ Adicionar Gadget" para personalizar.</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default DashboardGrid;
