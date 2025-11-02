import React, { useState } from 'react';
import { Plus, Settings, Download, Upload, Trash2, RefreshCw, Filter, Search, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { useTimeSlotStore } from '@/stores/timeSlotStore.js';
import { toast } from 'sonner';

const TimeGridControls = () => {
  const { 
    generateSlotsFromRanges, 
    clearAllSlots, 
    timeSlots,
    exportData,
    importData,
    markingMode,
    setMarkingMode,
  } = useTimeSlotStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterModality, setFilterModality] = useState('all');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importDataText, setImportDataText] = useState('');

  const handleGenerateSlots = () => {
    try {
      generateSlotsFromRanges();
      toast.success('Slots gerados com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar slots: ' + error.message);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os slots? Esta ação não pode ser desfeita.')) {
      clearAllSlots();
    }
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agenda-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importDataText);
      importData(data);
      setShowImportDialog(false);
      setImportDataText('');
      alert('Dados importados com sucesso!');
    } catch (error) {
      alert('Erro ao importar dados. Verifique o formato JSON.');
    }
  };

  const handleRefresh = () => {
    // Recarregar dados do localStorage
    window.location.reload();
  };

  const availableSlots = timeSlots.filter(slot => slot.status === 'available').length;
  const bookedSlots = timeSlots.filter(slot => slot.status === 'booked').length;
  const blockedSlots = timeSlots.filter(slot => slot.status === 'blocked').length;

  const isDarkModeUI = document.documentElement.classList.contains('dark-mode');

  return (
    <div className={`${isDarkModeUI ? 'bg-theme-card' : 'bg-[#DDDDDD]'} border border-theme-border rounded-lg shadow-sm p-4`}>
      <div className="flex flex-col gap-4">
        {/* Primeira linha - Ações principais */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleGenerateSlots}
              variant="default"
              size="sm"
              className="bg-theme-accent hover:bg-theme-accent/90"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Gerar Slots
            </Button>
            
            <Button
              onClick={handleClearAll}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Tudo
            </Button>

            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="border-theme-border hover:bg-theme-hover"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>

            {/* Modos de marcação */}
            <div className="flex items-center gap-2 ml-4">
              <Button
                type="button"
                variant={markingMode === 'availability' ? 'default' : 'outline'}
                size="sm"
                className={markingMode === 'availability' ? 'bg-blue-600 dark:bg-emerald-600 text-white' : ''}
                onClick={() => setMarkingMode(markingMode === 'availability' ? null : 'availability')}
                aria-pressed={markingMode === 'availability'}
              >
                Disponibilidade
              </Button>
              <Button
                type="button"
                variant={markingMode === 'booking' ? 'default' : 'outline'}
                size="sm"
                className={markingMode === 'booking' ? 'bg-blue-600 dark:bg-emerald-600 text-white' : ''}
                onClick={() => setMarkingMode(markingMode === 'booking' ? null : 'booking')}
                aria-pressed={markingMode === 'booking'}
              >
                Consulta
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
              className="border-theme-border hover:bg-theme-hover"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>

            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-theme-border hover:bg-theme-hover"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importar
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-theme-card border-theme-border">
                <DialogHeader>
                  <DialogTitle className="text-theme-text-primary">Importar Dados</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <textarea
                    value={importDataText}
                    onChange={(e) => setImportDataText(e.target.value)}
                    placeholder="Cole aqui o JSON com os dados da agenda..."
                    className="w-full h-32 p-3 border border-theme-border rounded-md bg-theme-background text-theme-text-primary"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowImportDialog(false)}
                      className="border-theme-border"
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleImport} className="bg-theme-accent hover:bg-theme-accent/90">
                      Importar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Segunda linha - Filtros e estatísticas */}
        <div className="flex flex-wrap items-center justify-center gap-4 border-t border-theme-border pt-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-theme-text-secondary" />
              <Input
                type="text"
                placeholder="Buscar paciente ou horário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-theme-border rounded-md bg-theme-background text-theme-text-primary w-64"
              />
            </div>

            <Select
              value={filterStatus}
              onValueChange={setFilterStatus}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="available">Disponíveis</SelectItem>
                <SelectItem value="booked">Agendados</SelectItem>
                <SelectItem value="blocked">Bloqueados</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filterModality}
              onValueChange={setFilterModality}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Todas modalidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas modalidades</SelectItem>
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="telemedicina">Telemedicina</SelectItem>
                <SelectItem value="domiciliar">Domiciliar</SelectItem>
              </SelectContent>
            </Select
            >
          </div>

          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[var(--slot-available-bg)] border border-[var(--slot-available-border)]"></div>
              <span className="text-theme-text-secondary">
                Disponíveis: <span className="font-semibold text-theme-text-primary">{availableSlots}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[var(--slot-booked-bg)] border border-[var(--slot-booked-border)]"></div>
              <span className="text-theme-text-secondary">
                Agendados: <span className="font-semibold text-theme-text-primary">{bookedSlots}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[var(--slot-blocked-bg)] border border-[var(--slot-blocked-border)]"></div>
              <span className="text-theme-text-secondary">
                Bloqueados: <span className="font-semibold text-theme-text-primary">{blockedSlots}</span>
              </span>
            </div>
            <div className="text-theme-text-secondary">
              Total: <span className="font-semibold text-theme-text-primary">{timeSlots.length}</span>
            </div>
          </div>
        </div>

        {/* Terceira linha - Informações adicionais */}
        <div className="flex items-center justify-between border-t border-theme-border pt-4">
          <div className="text-xs text-theme-text-secondary">
            Dica: Arraste para criar novos slots ou clique para editar. Use os filtros para encontrar horários específicos.
          </div>
          <div className="flex items-center gap-2 text-xs text-theme-text-secondary">
            <Clock className="h-3 w-3" />
            <span>Última atualização: {new Date().toLocaleTimeString('pt-BR')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeGridControls;