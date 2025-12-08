import React, { useState } from 'react';
import { Settings, Save, RotateCcw, AlertCircle, Clock, MapPin, Video, Home } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription
} from '@/components/ui/card.tsx';
import {
  Alert,
  AlertDescription
} from '@/components/ui/alert.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { useTimeSlotStore } from '../store/timeSlotStore';

const AvailabilitySettings = ({ onOpenChange }) => {
  const {
    settings,
    updateSettings,
    resetSettings
  } = useTimeSlotStore();

  const toTimeString = (hour) => `${String(hour).padStart(2, '0')}:00`;
  const toLocalSettings = (s) => ({
    minTime: toTimeString(s.minWorkHour ?? 6),
    maxTime: toTimeString(s.maxWorkHour ?? 22),
    defaultDuration: s.defaultDuration ?? 30,
    defaultInterval: s.defaultInterval ?? 15,
    slotStep: s.timeStep ?? 15,
    enabledModalities: s.modalities ?? [],
    allowOverlap: !!s.allowOverlap,
    autoConfirmBookings: !!s.autoConfirm,
    showWeekends: !!s.showWeekends,
    maxRangesPerDay: s.maxRangesPerDay ?? 3,
    maxAdvanceBookingDays: s.maxAdvanceBooking ?? 30,
  });
  const fromLocalSettings = (ls) => ({
    minWorkHour: parseInt((ls.minTime || '06:00').split(':')[0], 10),
    maxWorkHour: parseInt((ls.maxTime || '22:00').split(':')[0], 10),
    defaultDuration: ls.defaultDuration,
    defaultInterval: ls.defaultInterval,
    timeStep: ls.slotStep,
    modalities: ls.enabledModalities,
    allowOverlap: ls.allowOverlap,
    autoConfirm: ls.autoConfirmBookings,
    showWeekends: ls.showWeekends,
    maxRangesPerDay: ls.maxRangesPerDay,
    maxAdvanceBooking: ls.maxAdvanceBookingDays,
  });

  const [localSettings, setLocalSettings] = useState(toLocalSettings(settings));
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    setSaving(true);
    const result = updateSettings(fromLocalSettings(localSettings));
    setSaving(false);
    if (result.success) {
      setHasChanges(false);
      alert('Configurações salvas com sucesso!');
      if (onOpenChange) onOpenChange(false);
    } else {
      alert('Erro ao salvar configurações: ' + result.errors.join(', '));
    }
  };

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
      resetSettings();
      const refreshed = useTimeSlotStore.getState().settings;
      setLocalSettings(toLocalSettings(refreshed));
      setHasChanges(false);
    }
  };

  const modalityOptions = [
    { id: 'presencial', label: 'Presencial', icon: MapPin, description: 'Atendimento no consultório' },
    { id: 'telemedicina', label: 'Telemedicina', icon: Video, description: 'Consulta por vídeo chamada' },
    { id: 'domiciliar', label: 'Domiciliar', icon: Home, description: 'Visita ao domicílio do paciente' }
  ];

  return (
    <Card className="bg-theme-card border-theme-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-theme-text-primary">
            <Settings className="h-5 w-5" />
            Configurações de Disponibilidade
          </CardTitle>
          <CardDescription className="text-theme-text-secondary">
            Configure as regras gerais para sua agenda e disponibilidade
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="border-theme-border hover:bg-theme-hover"
            disabled={saving}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar Padrão
          </Button>
          <Button
            onClick={handleSave}
            variant="default"
            size="sm"
            className="bg-theme-accent hover:bg-theme-accent/90"
            disabled={!hasChanges || saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {hasChanges && (
          <Alert className="border-theme-accent/30 bg-theme-accent/10">
            <AlertCircle className="h-4 w-4 text-theme-accent" />
            <AlertDescription className="text-theme-text-primary">
              Você tem alterações não salvas. Não se esqueça de salvar suas configurações.
            </AlertDescription>
          </Alert>
        )}

        {/* Horários de Trabalho */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-theme-text-primary flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horários de Trabalho
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minTime" className="text-theme-text-primary">
                Horário Mínimo
              </Label>
              <Input
                id="minTime"
                type="time"
                value={localSettings.minTime}
                onChange={(e) => handleSettingChange('minTime', e.target.value)}
                className="border-theme-border bg-theme-background text-theme-text-primary"
              />
              <p className="text-xs text-theme-text-secondary">
                Horário mais cedo para atendimento (padrão: 06:00)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxTime" className="text-theme-text-primary">
                Horário Máximo
              </Label>
              <Input
                id="maxTime"
                type="time"
                value={localSettings.maxTime}
                onChange={(e) => handleSettingChange('maxTime', e.target.value)}
                className="border-theme-border bg-theme-background text-theme-text-primary"
              />
              <p className="text-xs text-theme-text-secondary">
                Horário mais tarde para atendimento (padrão: 22:00)
              </p>
            </div>
          </div>
        </div>

        {/* Configurações de Slots */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-theme-text-primary">
            Configurações de Slots
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultDuration" className="text-theme-text-primary">
                Duração Padrão (min)
              </Label>
              <Select
                value={localSettings.defaultDuration.toString()}
                onValueChange={(value) => handleSettingChange('defaultDuration', parseInt(value))}
              >
                <SelectTrigger id="defaultDuration" className="border-theme-border bg-theme-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">1h 30min</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-theme-text-secondary">
                Tempo padrão para cada consulta
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultInterval" className="text-theme-text-primary">
                Intervalo (min)
              </Label>
              <Select
                value={localSettings.defaultInterval.toString()}
                onValueChange={(value) => handleSettingChange('defaultInterval', parseInt(value))}
              >
                <SelectTrigger id="defaultInterval" className="border-theme-border bg-theme-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sem intervalo</SelectItem>
                  <SelectItem value="5">5 minutos</SelectItem>
                  <SelectItem value="10">10 minutos</SelectItem>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-theme-text-secondary">
                Tempo entre consultas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slotStep" className="text-theme-text-primary">
                Passo de Tempo (min)
              </Label>
              <Select
                value={localSettings.slotStep.toString()}
                onValueChange={(value) => handleSettingChange('slotStep', parseInt(value))}
              >
                <SelectTrigger id="slotStep" className="border-theme-border bg-theme-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-theme-text-secondary">
                Resolução mínima do grid
              </p>
            </div>
          </div>
        </div>

        {/* Modalidades de Atendimento */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-theme-text-primary">
            Modalidades de Atendimento
          </h3>

          <div className="space-y-3">
            {modalityOptions.map((modality) => {
              const Icon = modality.icon;
              return (
                <div key={modality.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={modality.id}
                    checked={localSettings.enabledModalities.includes(modality.id)}
                    onCheckedChange={(checked) => {
                      const updatedModalities = checked
                        ? [...localSettings.enabledModalities, modality.id]
                        : localSettings.enabledModalities.filter(id => id !== modality.id);
                      handleSettingChange('enabledModalities', updatedModalities);
                    }}
                    className="border-theme-border"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <Icon className="h-4 w-4 text-theme-text-secondary" />
                    <Label
                      htmlFor={modality.id}
                      className="text-theme-text-primary cursor-pointer flex-1"
                    >
                      {modality.label}
                    </Label>
                    <span className="text-xs text-theme-text-secondary">
                      {modality.description}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Configurações Avançadas */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-theme-text-primary">
            Configurações Avançadas
          </h3>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="allowOverlap"
                checked={localSettings.allowOverlap}
                onCheckedChange={(checked) => handleSettingChange('allowOverlap', checked)}
                className="border-theme-border"
              />
              <Label htmlFor="allowOverlap" className="text-theme-text-primary">
                Permitir sobreposição de horários
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="autoConfirm"
                checked={localSettings.autoConfirmBookings}
                onCheckedChange={(checked) => handleSettingChange('autoConfirmBookings', checked)}
                className="border-theme-border"
              />
              <Label htmlFor="autoConfirm" className="text-theme-text-primary">
                Confirmar agendamentos automaticamente
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="showWeekends"
                checked={localSettings.showWeekends}
                onCheckedChange={(checked) => handleSettingChange('showWeekends', checked)}
                className="border-theme-border"
              />
              <Label htmlFor="showWeekends" className="text-theme-text-primary">
                Mostrar fins de semana no grid
              </Label>
            </div>
          </div>
        </div>

        {/* Limites e Restrições */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-theme-text-primary">
            Limites e Restrições
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxRangesPerDay" className="text-theme-text-primary">
                Máximo de faixas por dia
              </Label>
              <Input
                id="maxRangesPerDay"
                type="number"
                min="1"
                max="10"
                value={localSettings.maxRangesPerDay}
                onChange={(e) => handleSettingChange('maxRangesPerDay', parseInt(e.target.value))}
                className="border-theme-border bg-theme-background text-theme-text-primary"
              />
              <p className="text-xs text-theme-text-secondary">
                Número máximo de faixas horárias por dia da semana
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAdvanceBooking" className="text-theme-text-primary">
                Antecedência máxima (dias)
              </Label>
              <Input
                id="maxAdvanceBooking"
                type="number"
                min="1"
                max="365"
                value={localSettings.maxAdvanceBookingDays}
                onChange={(e) => handleSettingChange('maxAdvanceBookingDays', parseInt(e.target.value))}
                className="border-theme-border bg-theme-background text-theme-text-primary"
              />
              <p className="text-xs text-theme-text-secondary">
                Quantos dias no futuro os pacientes podem agendar
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailabilitySettings;