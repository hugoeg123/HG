import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip';
import { Info, Pin, PinOff, MoreHorizontal } from 'lucide-react';
import { cn } from '../../../lib/utils';

/**
 * HealthGadget
 * 
 * Standard wrapper for all health widgets.
 * Handles "Evidence Level" badging and source citations.
 * THEME UPDATE: Uses compatible colors for dark/light modes.
 */
const HealthGadget = ({
    title,
    icon: Icon,
    children,
    evidenceLevel = 'High', // High, Medium, Low
    sourceCitation, // e.g. "WHO Guidelines 2024"
    onPin,
    isPinned,
    className
}) => {

    const getEvidenceColor = (level) => {
        // Strict Theme: Light -> Blue, Dark -> Green
        // We act as if "levels" are just intensities of the primary theme color.

        switch (level) {
            case 'High':
                return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800';
            case 'Medium':
                // Light: Lighter Blue / Dark: Medium Green
                return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900';
            case 'Low':
                // Light: Slate (Neutral) / Dark: Zinc (Neutral) - allowed exception for "Low" or map to very faint theme color
                return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800';
            default:
                return 'bg-blue-100 text-blue-800 dark:bg-green-900/40 dark:text-green-300';
        }
    };

    return (
        <Card className={cn("h-full transition-all hover:shadow-md border-l-4 bg-card", className,
            // Border Colors: Blue (Light) / Green (Dark)
            // We ignore the "Evidence Level" color distinction for the main border to keep the strict theme,
            // OR we map Evidence Levels to intensities of the Theme Color.
            "border-l-blue-500 dark:border-l-green-600"
        )}>
            <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                    {/* Icon: Always Theme Color */}
                    {Icon && <Icon className="w-5 h-5 text-blue-600 dark:text-green-500" />}
                    <CardTitle className="text-base font-bold text-slate-800 dark:text-gray-100">{title}</CardTitle>
                </div>

                <div className="flex items-center gap-1">
                    {/* Evidence Badge */}
                    {sourceCitation && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className={cn("px-2 py-0.5 rounded text-[10px] uppercase font-bold border cursor-help flex items-center gap-1 select-none", getEvidenceColor(evidenceLevel))}>
                                        {evidenceLevel === 'High' ? 'NÍVEL A' : evidenceLevel === 'Medium' ? 'NÍVEL B' : 'NÍVEL C'}
                                        <Info className="w-3 h-3" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[200px] bg-slate-900 text-slate-50 border-slate-800">
                                    <p className="font-semibold mb-1 text-blue-300 dark:text-green-300">Fonte da Evidência:</p>
                                    <p className="text-xs">{sourceCitation}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    {/* Actions */}
                    {onPin && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 ml-1 text-slate-400 hover:text-blue-500 dark:hover:text-green-400" onClick={onPin}>
                            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
                {children}
            </CardContent>
        </Card>
    );
};

export default HealthGadget;
