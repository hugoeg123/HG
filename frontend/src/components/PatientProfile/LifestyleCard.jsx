import React, { useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Progress } from '../../components/ui/progress'
import { Checkbox } from '../../components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group'
import { profileService } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

const LifestyleCard = () => {
  const { user } = useAuthStore()
  const [smokeToggle, setSmokeToggle] = useState(false)
  const [drinkToggle, setDrinkToggle] = useState(false)
  const [exerciseToggle, setExerciseToggle] = useState(false)

  const [smokingStatus, setSmokingStatus] = useState('never')
  const [cigPerDay, setCigPerDay] = useState('')
  const [yearsSmoked, setYearsSmoked] = useState('')
  const [yearsSinceQuit, setYearsSinceQuit] = useState('')

  const [drinksPerWeek, setDrinksPerWeek] = useState('')
  const [binge30d, setBinge30d] = useState('none')

  const [modMin, setModMin] = useState('')
  const [vigMin, setVigMin] = useState('')
  const [strengthDpW, setStrengthDpW] = useState('')
  const [saving, setSaving] = useState(false)

  const essentials = useMemo(() => {
    let total = 3
    let filled = 0
    if (!smokeToggle || smokingStatus) filled++
    if (!drinkToggle || drinksPerWeek !== '') filled++
    if (!exerciseToggle || (modMin !== '' || vigMin !== '')) filled++
    return { filled, total }
  }, [smokeToggle, smokingStatus, drinkToggle, drinksPerWeek, exerciseToggle, modMin, vigMin])

  const progress = useMemo(() => Math.round((essentials.filled / essentials.total) * 100), [essentials])

  const handleSave = async () => {
    if (!user?.id) return
    setSaving(true)
    const payload = {}
    if (!smokeToggle) {
      payload.smoking_status = 'never'
    } else {
      payload.smoking_status = smokingStatus
      if (cigPerDay) payload.cigarettes_per_day = Number(cigPerDay)
      if (yearsSmoked) payload.years_smoked = Number(yearsSmoked)
      if (yearsSinceQuit) payload.years_since_quit = Number(yearsSinceQuit)
    }
    if (!drinkToggle) {
      payload.drinks_per_week = 0
      payload.binge_last_30_days = 'none'
    } else {
      if (drinksPerWeek !== '') payload.drinks_per_week = Number(drinksPerWeek)
      payload.binge_last_30_days = binge30d
    }
    if (!exerciseToggle) {
      payload.mod_minutes_per_week = 0
      payload.vig_minutes_per_week = 0
      payload.strength_days_per_week = 0
    } else {
      if (modMin !== '') payload.mod_minutes_per_week = Number(modMin)
      if (vigMin !== '') payload.vig_minutes_per_week = Number(vigMin)
      if (strengthDpW !== '') payload.strength_days_per_week = Number(strengthDpW)
    }
    try {
      await profileService.addLifestyle(user.id, payload)
      setSmokeToggle(false)
      setDrinkToggle(false)
      setExerciseToggle(false)
      setSmokingStatus('never')
      setCigPerDay('')
      setYearsSmoked('')
      setYearsSinceQuit('')
      setDrinksPerWeek('')
      setBinge30d('none')
      setModMin('')
      setVigMin('')
      setStrengthDpW('')
    } catch (error) {
      console.error('Error saving lifestyle:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Hábitos de vida</CardTitle>
          <div className="w-32"><Progress value={progress} /></div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4">
        <h4 className="text-base font-semibold">Tabagismo</h4>
        <p className="text-xs text-muted-foreground mb-2">Registrar tabagismo atual e prévio é essencial para estratificar risco cardiovascular.</p>
        <div className="flex items-center gap-2">
          <Checkbox id="smk" checked={smokeToggle} onCheckedChange={(v) => setSmokeToggle(Boolean(v))} />
          <label htmlFor="smk">Tabagismo (já fumou em base regular?)</label>
        </div>
        {smokeToggle && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-muted-foreground">Status</label>
              <RadioGroup value={smokingStatus} onValueChange={setSmokingStatus} className="flex gap-3">
                <div className="flex items-center gap-2"><RadioGroupItem value="current" id="smk-current" /><label htmlFor="smk-current">Atual</label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="former" id="smk-former" /><label htmlFor="smk-former">Ex</label></div>
              </RadioGroup>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Cigarros/dia</label>
              <Input value={cigPerDay} onChange={(e) => setCigPerDay(e.target.value)} placeholder="ex: 20" />
              <p className="text-xs text-muted-foreground mt-1">Informe a média habitual. Se cigarro artesanal, estime número/dia.</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Anos de uso</label>
              <Input value={yearsSmoked} onChange={(e) => setYearsSmoked(e.target.value)} placeholder="ex: 10" />
              <p className="text-xs text-muted-foreground mt-1">Some os anos em que fumou diariamente ou quase diariamente.</p>
            </div>
            {smokingStatus === 'former' && (
              <div>
                <label className="text-sm text-muted-foreground">Anos desde que parou (20 anos ou mais sem fumar)</label>
                <Input value={yearsSinceQuit} onChange={(e) => setYearsSinceQuit(e.target.value)} placeholder="ex: 22" />
                <p className="text-xs text-muted-foreground mt-1">Mais de 20 anos sem fumar aproxima o risco ao de não fumantes.</p>
              </div>
            )}
          </div>
        )}
        <div className="border-t border-theme-border/60 my-3" />
        <h4 className="text-base font-semibold">Álcool</h4>
        <p className="text-xs text-muted-foreground mb-2">1 dose padrão = 1 lata de cerveja (330 mL), 1 taça de vinho (100–150 mL) ou 1 dose de destilado (40 mL).</p>
        <div className="flex items-center gap-2">
          <Checkbox id="alc" checked={drinkToggle} onCheckedChange={(v) => setDrinkToggle(Boolean(v))} />
          <label htmlFor="alc">Bebo bebidas alcoólicas?</label>
        </div>
        {drinkToggle && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-muted-foreground">Doses padrão por semana</label>
              <Input value={drinksPerWeek} onChange={(e) => setDrinksPerWeek(e.target.value)} placeholder="ex: 4" />
              <p className="text-xs text-muted-foreground mt-1">Some todas as doses em uma semana típica.</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Episódios de uso pesado (“binge”) nos últimos 30 dias</label>
              <p className="text-xs text-muted-foreground mb-1">Binge = ≥5 doses em ~2h (homem) ou ≥4 doses (mulher).</p>
              <RadioGroup value={binge30d} onValueChange={setBinge30d} className="flex gap-3">
                <div className="flex items-center gap-2"><RadioGroupItem value="none" id="b0" /><label htmlFor="b0">Nenhum</label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="1" id="b1" /><label htmlFor="b1">1</label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="2-3" id="b23" /><label htmlFor="b23">2–3</label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="4+" id="b4" /><label htmlFor="b4">≥4</label></div>
              </RadioGroup>
            </div>
          </div>
        )}
        <div className="border-t border-theme-border/60 my-3" />
        <h4 className="text-base font-semibold">Atividade física</h4>
        <p className="text-xs text-muted-foreground mb-2">Recomendações da OMS: ≥150 min/sem moderada, ou ≥75 min/sem vigorosa, e força em ≥2 dias/sem.</p>
        <div className="flex items-center gap-2">
          <Checkbox id="ex" checked={exerciseToggle} onCheckedChange={(v) => setExerciseToggle(Boolean(v))} />
          <label htmlFor="ex">Pratico atividade física regularmente?</label>
        </div>
        {exerciseToggle && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-muted-foreground">Moderado (min/sem)</label>
              <Input value={modMin} onChange={(e) => setModMin(e.target.value)} placeholder="ex: 150" />
              <p className="text-xs text-muted-foreground mt-1">Exemplos: caminhada rápida, bike leve, tarefas domésticas intensas.</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Vigoroso (min/sem)</label>
              <Input value={vigMin} onChange={(e) => setVigMin(e.target.value)} placeholder="ex: 75" />
              <p className="text-xs text-muted-foreground mt-1">Exemplos: corrida, esportes competitivos, bike intensa.</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Força (dias/sem)</label>
              <Input value={strengthDpW} onChange={(e) => setStrengthDpW(e.target.value)} placeholder="ex: 2" />
              <p className="text-xs text-muted-foreground mt-1">Exercícios de musculação, resistência ou similares.</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={saving} variant="default">Salvar hábitos</Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default LifestyleCard
