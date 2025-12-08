import React, { useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Progress } from '../../components/ui/progress'
import { patientService } from '../../services/api'

const ContactCard = ({ patient }) => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneMain, setPhoneMain] = useState(patient?.phone || '')
  const [phoneEmergency, setPhoneEmergency] = useState(patient?.emergencyContactPhone || '')
  const email = patient?.email || ''
  const [saving, setSaving] = useState(false)

  const essentials = useMemo(() => {
    let total = 3
    let filled = 0
    if ((firstName || (patient?.name || '').split(' ')?.[0])) filled++
    if ((lastName || (patient?.name || '').split(' ')?.slice(1).join(' '))) filled++
    if (phoneMain) filled++
    return { filled, total }
  }, [firstName, lastName, phoneMain, patient?.name])

  const progress = useMemo(() => Math.round((essentials.filled / essentials.total) * 100), [essentials])

  const handleSave = async () => {
    if (!patient?.id) return
    setSaving(true)
    const name = `${firstName || ''} ${lastName || ''}`.trim() || patient?.name || ''
    const payload = { name, phone: phoneMain, emergencyContactPhone: phoneEmergency }
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
          <CardTitle>Contato</CardTitle>
          <div className="w-32"><Progress value={progress} /></div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm text-muted-foreground">Nome</label>
          <Input placeholder="Primeiro nome" defaultValue={(patient?.name || '').split(' ')?.[0] || ''} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Sobrenome</label>
          <Input placeholder="Sobrenome" defaultValue={(patient?.name || '').split(' ')?.slice(1).join(' ') || ''} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">E-mail (conta)</label>
          <Input value={email} disabled />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Celular principal</label>
          <Input value={phoneMain} onChange={(e) => setPhoneMain(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Celular emergência</label>
          <Input value={phoneEmergency} onChange={(e) => setPhoneEmergency(e.target.value)} />
        </div>
        <div className="md:col-span-3 flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={saving} variant="default">Salvar contato</Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default ContactCard

