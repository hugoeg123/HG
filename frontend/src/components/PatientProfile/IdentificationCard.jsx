import React, { useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Progress } from '../../components/ui/progress'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../../components/ui/select'
import { patientService } from '../../services/api'

const IdentificationCard = ({ patient }) => {
  const [birthDate, setBirthDate] = useState(patient?.dateOfBirth ? String(patient.dateOfBirth).substring(0, 10) : '')
  const [gender, setGender] = useState(patient?.gender || 'não informado')
  const [ethnicity, setEthnicity] = useState(patient?.race_color || '')
  const [occupation, setOccupation] = useState('')
  const [saving, setSaving] = useState(false)

  const essentials = useMemo(() => {
    let total = 3
    let filled = 0
    if (birthDate) filled++
    if (gender && gender !== 'não informado') filled++
    if (ethnicity) filled++
    return { filled, total }
  }, [birthDate, gender, ethnicity])

  const progress = useMemo(() => Math.round((essentials.filled / essentials.total) * 100), [essentials])

  const handleSave = async () => {
    if (!patient?.id) return
    setSaving(true)
    const payload = { dateOfBirth: birthDate ? new Date(birthDate) : null, gender, race_color: ethnicity }
    try {
      await patientService.update(patient.id, payload)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Identificação</CardTitle>
          <div className="w-32"><Progress value={progress} /></div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm text-muted-foreground">Data de nascimento</label>
          <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Gênero</label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="masculino">Masculino</SelectItem>
              <SelectItem value="feminino">Feminino</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
              <SelectItem value="não informado">Não informar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Etnia</label>
          <Select value={ethnicity} onValueChange={setEthnicity}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="branca">Branca</SelectItem>
              <SelectItem value="preta">Preta</SelectItem>
              <SelectItem value="parda">Parda</SelectItem>
              <SelectItem value="amarela">Amarela</SelectItem>
              <SelectItem value="indigena">Indígena</SelectItem>
              <SelectItem value="outra">Outra</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Trabalho</label>
          <Input value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="Ocupação" />
        </div>
        <div className="md:col-span-3 flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={saving} variant="default">Salvar identificação</Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default IdentificationCard

