import React, { useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Progress } from '../../components/ui/progress'
import { Checkbox } from '../../components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group'
import { patientService, patientInputService } from '../../services/api'

const AntecedentsCard = ({ patient }) => {
  const [hasAllergies, setHasAllergies] = useState((patient?.allergies || []).length > 0)
  const [allergies, setAllergies] = useState(patient?.allergies || [])
  const [conditions, setConditions] = useState(patient?.chronicConditions || [])
  const [medications, setMedications] = useState(patient?.medications || [])
  const [surgeries, setSurgeries] = useState([])
  const isFemale = (patient?.gender || '').toLowerCase() === 'feminino'
  const [everPregnant, setEverPregnant] = useState(false)
  const [gravidity, setGravidity] = useState('')
  const [parityNormal, setParityNormal] = useState('')
  const [parityCesarean, setParityCesarean] = useState('')
  const [abortions, setAbortions] = useState('')
  const [currentlyPregnant, setCurrentlyPregnant] = useState(false)
  const [gestationalAgeWeeks, setGestationalAgeWeeks] = useState('')
  const [saving, setSaving] = useState(false)

  const essentials = useMemo(() => {
    let total = 1
    let filled = 0
    if (!hasAllergies || allergies.length > 0) filled++
    return { filled, total }
  }, [hasAllergies, allergies])

  const progress = useMemo(() => Math.round((essentials.filled / essentials.total) * 100), [essentials])

  const addAllergy = () => setAllergies([...allergies, { substance: '', reaction: '', severity: '' }])
  const updateAllergy = (idx, key, value) => setAllergies(allergies.map((a, i) => i === idx ? { ...a, [key]: value } : a))
  const removeAllergy = (idx) => setAllergies(allergies.filter((_, i) => i !== idx))

  const addCondition = () => setConditions([...conditions, { condition_name: '', onset_date: '', resolution_date: '', status: 'active', notes: '' }])
  const updateCondition = (idx, key, value) => setConditions(conditions.map((c, i) => i === idx ? { ...c, [key]: value } : c))
  const removeCondition = (idx) => setConditions(conditions.filter((_, i) => i !== idx))

  const addMedication = () => setMedications([...medications, { drug_name: '', dose: '', schedule: '', indication: '' }])
  const updateMedication = (idx, key, value) => setMedications(medications.map((m, i) => i === idx ? { ...m, [key]: value } : m))
  const removeMedication = (idx) => setMedications(medications.filter((_, i) => i !== idx))

  const addSurgery = () => setSurgeries([...surgeries, { name: '', date: '', notes: '', complication: '', icu: false }])
  const updateSurgery = (idx, key, value) => setSurgeries(surgeries.map((s, i) => i === idx ? { ...s, [key]: value } : s))
  const removeSurgery = (idx) => setSurgeries(surgeries.filter((_, i) => i !== idx))

  const handleSave = async () => {
    if (!patient?.id) return
    setSaving(true)
    const payload = { allergies: hasAllergies ? allergies : [], chronicConditions: conditions, medications }
    const snapshot = {}
    if (surgeries.length > 0) {
      snapshot.surgicalHistory = surgeries
    }
    if (isFemale) {
      const obst = {
        everPregnant: Boolean(everPregnant),
        currentlyPregnant: Boolean(currentlyPregnant)
      }
      if (everPregnant) {
        if (gravidity !== '') obst.gravidity = Number(gravidity)
        if (parityNormal !== '') obst.parityNormal = Number(parityNormal)
        if (parityCesarean !== '') obst.parityCesarean = Number(parityCesarean)
        if (abortions !== '') obst.abortions = Number(abortions)
      }
      if (currentlyPregnant && gestationalAgeWeeks !== '') {
        obst.gestationalAgeWeeks = Number(gestationalAgeWeeks)
      }
      snapshot.obstetricHistory = obst
    }
    try {
      await patientService.update(patient.id, { ...payload, ...snapshot })
      const tags = {}
      surgeries.forEach((s, idx) => {
        if (s.name) tags[`SURGERY_${idx}_NAME`] = String(s.name)
        if (s.date) tags[`SURGERY_${idx}_DATE`] = String(s.date)
        if (s.notes) tags[`SURGERY_${idx}_NOTES`] = String(s.notes)
        if (s.complication) tags[`SURGERY_${idx}_COMPLICATION`] = String(s.complication)
        tags[`SURGERY_${idx}_ICU`] = String(Boolean(s.icu))
      })
      if (isFemale) {
        tags.OB_EVER_PREGNANT = String(Boolean(everPregnant))
        if (everPregnant) {
          if (gravidity !== '') tags.OB_GRAVIDITY = String(gravidity)
          if (parityNormal !== '') tags.OB_PARITY_NORMAL = String(parityNormal)
          if (parityCesarean !== '') tags.OB_PARITY_CESAREAN = String(parityCesarean)
          if (abortions !== '') tags.OB_ABORTIONS = String(abortions)
        }
        tags.OB_CURRENTLY_PREGNANT = String(Boolean(currentlyPregnant))
        if (currentlyPregnant && gestationalAgeWeeks !== '') tags.OB_GA_WEEKS = String(gestationalAgeWeeks)
      }
      if (Object.keys(tags).length > 0) {
        await patientInputService.create(tags)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Antecedentes</CardTitle>
          <div className="w-32"><Progress value={progress} /></div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4">
        <div className="flex items-center gap-2">
          <Checkbox id="all" checked={hasAllergies} onCheckedChange={(v) => setHasAllergies(Boolean(v))} />
          <label htmlFor="all">Tem alergias relevantes?</label>
        </div>
        {hasAllergies && (
          <div className="grid grid-cols-1 gap-3">
            {allergies.map((a, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <Input placeholder="Substância" value={a.substance || ''} onChange={(e) => updateAllergy(idx, 'substance', e.target.value)} />
                <Input placeholder="Reação" value={a.reaction || ''} onChange={(e) => updateAllergy(idx, 'reaction', e.target.value)} />
                <Input placeholder="Gravidade" value={a.severity || ''} onChange={(e) => updateAllergy(idx, 'severity', e.target.value)} />
                <Button variant="secondary" onClick={() => removeAllergy(idx)}>Remover</Button>
              </div>
            ))}
            <Button variant="outline" onClick={addAllergy}>Adicionar alergia</Button>
          </div>
        )}

        <div>
          <label className="text-sm text-muted-foreground">Condições patológicas</label>
          <div className="grid grid-cols-1 gap-3">
            {conditions.map((c, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <Input placeholder="Condição" value={c.condition_name || ''} onChange={(e) => updateCondition(idx, 'condition_name', e.target.value)} />
                <Input type="date" placeholder="Início" value={c.onset_date || ''} onChange={(e) => updateCondition(idx, 'onset_date', e.target.value)} />
                <Input type="date" placeholder="Resolução" value={c.resolution_date || ''} onChange={(e) => updateCondition(idx, 'resolution_date', e.target.value)} />
                <Input placeholder="Status" value={c.status || ''} onChange={(e) => updateCondition(idx, 'status', e.target.value)} />
                <Button variant="secondary" onClick={() => removeCondition(idx)}>Remover</Button>
              </div>
            ))}
            <Button variant="outline" onClick={addCondition}>Adicionar condição</Button>
          </div>
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Medicações de uso contínuo</label>
          <div className="grid grid-cols-1 gap-3">
            {medications.map((m, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <Input placeholder="Medicamento" value={m.drug_name || ''} onChange={(e) => updateMedication(idx, 'drug_name', e.target.value)} />
                <Input placeholder="Dose" value={m.dose || ''} onChange={(e) => updateMedication(idx, 'dose', e.target.value)} />
                <Input placeholder="Posologia" value={m.schedule || ''} onChange={(e) => updateMedication(idx, 'schedule', e.target.value)} />
                <Input placeholder="Indicação" value={m.indication || ''} onChange={(e) => updateMedication(idx, 'indication', e.target.value)} />
                <Button variant="secondary" onClick={() => removeMedication(idx)}>Remover</Button>
              </div>
            ))}
            <Button variant="outline" onClick={addMedication}>Adicionar medicação</Button>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm text-muted-foreground">Antecedentes cirúrgicos</label>
          <p className="text-xs text-muted-foreground mb-2">Liste cirurgias relevantes (médias/grandes, anestesia geral ou raqui/peridural).</p>
          <div className="grid grid-cols-1 gap-3">
            {surgeries.map((s, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-2">
                <Input placeholder="ex: Colecistectomia" value={s.name || ''} onChange={(e) => updateSurgery(idx, 'name', e.target.value)} />
                <Input type="date" placeholder="ex: 2018-01-01" value={s.date || ''} onChange={(e) => updateSurgery(idx, 'date', e.target.value)} />
                <Input placeholder="Complicações" value={s.complication || ''} onChange={(e) => updateSurgery(idx, 'complication', e.target.value)} />
                <Input placeholder="Notas" value={s.notes || ''} onChange={(e) => updateSurgery(idx, 'notes', e.target.value)} />
                <div className="flex items-center gap-2"><Checkbox checked={Boolean(s.icu)} onCheckedChange={(v) => updateSurgery(idx, 'icu', Boolean(v))} /> <span>Necessitou UTI?</span></div>
                <Button variant="secondary" onClick={() => removeSurgery(idx)}>Remover</Button>
              </div>
            ))}
            <Button variant="outline" onClick={addSurgery}>Adicionar cirurgia</Button>
          </div>
        </div>

        {isFemale && (
          <div className="mt-4">
            <h4 className="text-base font-semibold">Antecedentes obstétricos</h4>
            <p className="text-xs text-muted-foreground mb-2">Informação relevante para risco cardiovascular e planejamento reprodutivo.</p>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm text-muted-foreground">Já gestou?</label>
              <RadioGroup value={everPregnant ? 'yes' : 'no'} onValueChange={(v) => setEverPregnant(v === 'yes')} className="flex gap-3">
                <div className="flex items-center gap-2"><RadioGroupItem value="yes" id="preg-yes" /><label htmlFor="preg-yes">Sim</label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="no" id="preg-no" /><label htmlFor="preg-no">Não</label></div>
              </RadioGroup>
            </div>
            {everPregnant && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2">
                <Input placeholder="Gestações (ex: 3)" value={gravidity} onChange={(e) => setGravidity(e.target.value)} />
                <Input placeholder="Partos normais (ex: 2)" value={parityNormal} onChange={(e) => setParityNormal(e.target.value)} />
                <Input placeholder="Cesáreas (ex: 1)" value={parityCesarean} onChange={(e) => setParityCesarean(e.target.value)} />
                <Input placeholder="Abortos (ex: 0)" value={abortions} onChange={(e) => setAbortions(e.target.value)} />
              </div>
            )}
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm text-muted-foreground">Está gestante atualmente?</label>
              <RadioGroup value={currentlyPregnant ? 'yes' : 'no'} onValueChange={(v) => setCurrentlyPregnant(v === 'yes')} className="flex gap-3">
                <div className="flex items-center gap-2"><RadioGroupItem value="yes" id="pregcurr-yes" /><label htmlFor="pregcurr-yes">Sim</label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="no" id="pregcurr-no" /><label htmlFor="pregcurr-no">Não</label></div>
              </RadioGroup>
            </div>
            {currentlyPregnant && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input placeholder="Idade gestacional (semanas, ex: 24)" value={gestationalAgeWeeks} onChange={(e) => setGestationalAgeWeeks(e.target.value)} />
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={saving} variant="default">Salvar antecedentes</Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default AntecedentsCard
