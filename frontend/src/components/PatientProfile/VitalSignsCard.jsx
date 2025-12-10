import React, { useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Progress } from '../../components/ui/progress'
import { AlertCircle, Activity, Heart, Thermometer, Wind } from 'lucide-react'
import { profileService } from '../../services/api'
import { calculateSeverity } from '../../lib/vitalSignAlerts'

const VitalSignsCard = ({ patient, lastSnapshot }) => {
    const [systolic, setSystolic] = useState('')
    const [diastolic, setDiastolic] = useState('')
    const [heartRate, setHeartRate] = useState('')
    const [respiratoryRate, setRespiratoryRate] = useState('')
    const [spo2, setSpo2] = useState('')
    const [temp, setTemp] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    // Calculate alerts in real-time
    const alerts = useMemo(() => {
        const birthDate = patient?.birthDate || patient?.dateOfBirth
        let age = 25
        if (birthDate) {
            const today = new Date()
            const birth = new Date(birthDate)
            age = today.getFullYear() - birth.getFullYear()
            const m = today.getMonth() - birth.getMonth()
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
        }
        const isPregnant = Boolean(patient?.obstetrics?.currentlyPregnant)
        const hasCOPD = Array.isArray(patient?.chronicConditions)
            ? patient.chronicConditions.some(c => String(c.condition_name || c).toLowerCase().includes('dpoc') || String(c.condition_name || c).toLowerCase().includes('copd'))
            : false
        return calculateSeverity(
            { systolic, diastolic, heartRate, respiratoryRate, spo2, temp },
            { age, isPregnant, hasCOPD, onRoomAir: true }
        )
    }, [systolic, diastolic, heartRate, respiratoryRate, spo2, temp, patient])

    const essentials = useMemo(() => {
        let total = 2 // BP is essential
        let filled = 0
        if (systolic && diastolic) filled += 2
        return { filled, total }
    }, [systolic, diastolic])

    const progress = useMemo(() => Math.min(100, Math.round((essentials.filled / essentials.total) * 100)), [essentials])

    const handleSave = async () => {
        if (!patient?.id) return
        setSaving(true)
        setError(null)
        try {
            await profileService.addVitalSigns(patient.id, {
                systolic_bp: systolic ? parseInt(systolic) : null,
                diastolic_bp: diastolic ? parseInt(diastolic) : null,
                heart_rate: heartRate ? parseInt(heartRate) : null,
                respiratory_rate: respiratoryRate ? parseInt(respiratoryRate) : null,
                spo2: spo2 ? parseInt(spo2) : null,
                temperature: temp ? parseFloat(temp) : null,
            })
            // Clear inputs (optional, maybe keep them or show success toast)
            setSystolic('')
            setDiastolic('')
            setHeartRate('')
            setRespiratoryRate('')
            setSpo2('')
            setTemp('')
        } catch (error) {
            console.error('Error saving vital signs:', error)
            setError('Erro ao salvar sinais vitais.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Card className="mb-4">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-teal-600" />
                        Sinais Vitais e Alertas
                    </CardTitle>
                    <div className="w-32"><Progress value={progress} /></div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Input Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Blood Pressure */}
                    <div className="col-span-2 space-y-2">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            Pressão Arterial (mmHg)
                        </label>
                        <div className="flex gap-2 items-center">
                            <Input
                                value={systolic}
                                onChange={(e) => setSystolic(e.target.value)}
                                placeholder="PAS (Ex: 120)"
                                className={alerts.some(a => a.key.includes('bp') && a.type === 'emergency') ? 'border-red-500 bg-red-50' : ''}
                            />
                            <span className="text-xl text-gray-400">/</span>
                            <Input
                                value={diastolic}
                                onChange={(e) => setDiastolic(e.target.value)}
                                placeholder="PAD (Ex: 80)"
                                className={alerts.some(a => a.key.includes('bp') && a.type === 'emergency') ? 'border-red-500 bg-red-50' : ''}
                            />
                        </div>
                    </div>

                    {/* Heart Rate */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <Heart className="w-3 h-3" /> Freq. Cardíaca
                        </label>
                        <Input
                            value={heartRate}
                            onChange={(e) => setHeartRate(e.target.value)}
                            placeholder="bpm"
                        />
                    </div>

                    {/* Resp Rate */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <Wind className="w-3 h-3" /> Freq. Resp.
                        </label>
                        <Input
                            value={respiratoryRate}
                            onChange={(e) => setRespiratoryRate(e.target.value)}
                            placeholder="rpm"
                        />
                    </div>

                    {/* SpO2 */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">SpO2 (%)</label>
                        <Input
                            value={spo2}
                            onChange={(e) => setSpo2(e.target.value)}
                            placeholder="%"
                        />
                    </div>

                    {/* Temp */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <Thermometer className="w-3 h-3" /> Temp (ºC)
                        </label>
                        <Input
                            value={temp}
                            onChange={(e) => setTemp(e.target.value)}
                            placeholder="ºC"
                        />
                    </div>
                </div>

                {/* Alerts Section (Real-time) */}
                {alerts.length > 0 && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        {alerts.map((alert, idx) => (
                            <div
                                key={idx}
                                className={`p-3 rounded-lg flex items-start gap-3 border ${alert.type === 'emergency'
                                        ? 'bg-red-50 border-red-200 text-red-800'
                                        : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                                    }`}
                            >
                                <AlertCircle className={`w-5 h-5 mt-0.5 ${alert.type === 'emergency' ? 'text-red-600' : 'text-yellow-600'
                                    }`} />
                                <div>
                                    <p className="font-bold text-sm uppercase tracking-wide">{alert.type === 'emergency' ? 'Emergência' : 'Alerta'}</p>
                                    <p className="text-sm">{alert.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Last Snapshot Info (if available) */}
                {lastSnapshot && (
                    <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                        Último registro: {new Date(lastSnapshot.recorded_at).toLocaleDateString()} -
                        PA: {lastSnapshot.systolic_bp}/{lastSnapshot.diastolic_bp} mmHg
                    </div>
                )}

                {error && <p className="text-sm text-red-500">{error}</p>}

                {/* Actions */}
                <div className="flex justify-end pt-2">
                    <Button
                        onClick={handleSave}
                        disabled={saving || (!systolic && !heartRate)}
                        variant={alerts.some(a => a.type === 'emergency') ? "destructive" : "default"}
                        className="w-full md:w-auto"
                    >
                        {saving ? 'Salvando...' : 'Registrar Sinais Vitais'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default VitalSignsCard
