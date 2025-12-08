import React, { useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Progress } from '../../components/ui/progress'
import { profileService } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

const AnthropometricsCard = () => {
  const { user } = useAuthStore()
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [saving, setSaving] = useState(false)

  const essentials = useMemo(() => {
    let total = 2
    let filled = 0
    if (weight) filled++
    if (height) filled++
    return { filled, total }
  }, [weight, height])

  const progress = useMemo(() => Math.round((essentials.filled / essentials.total) * 100), [essentials])

  const handleSave = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      await profileService.addAnthropometrics(user.id, {
        weight_kg: parseFloat(weight),
        height_m: parseFloat(height)
      })
      setWeight('')
      setHeight('')
    } catch (error) {
      console.error('Error saving anthropometrics:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Antropometria</CardTitle>
          <div className="w-32"><Progress value={progress} /></div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm text-muted-foreground">Peso (kg)</label>
          <Input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Altura (m)</label>
          <Input value={height} onChange={(e) => setHeight(e.target.value)} placeholder="1.75" />
        </div>
        <div className="md:col-span-3 flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={saving} variant="default">Salvar antropometria</Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default AnthropometricsCard

