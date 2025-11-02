import React from 'react';
import { Badge } from './ui/badge';
import { MapPin, Video, Home, User, Clock, AlertCircle } from 'lucide-react';

const TimeGridSlot = ({ slot, isDarkMode, onClick, onDelete }) => {
  const getSlotStyle = () => {
    const statusClass =
      slot.status === 'booked' ? 'slot-booked' :
      slot.status === 'available' ? 'slot-available' :
      'slot-blocked';
    // Absolute positioning is set on the wrapper inline style
    return `slot ${statusClass} group`;
  };

  const getSlotPosition = () => {
    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const startMinutes = timeToMinutes(slot.startTime);
    const endMinutes = timeToMinutes(slot.endTime);
    const startHour = Math.floor(startMinutes / 60);
    const startMinute = startMinutes % 60;
    const endHour = Math.floor(endMinutes / 60);
    const endMinute = endMinutes % 60;
    
    const top = ((startHour - 0) * 2 + (startMinute / 30)) * 40; // base 00:00
    const height = ((endHour - startHour) * 2 + ((endMinute - startMinute) / 30)) * 40;
    
    return { top, height };
  };

  const getModalityIcon = (modality) => {
    switch (modality) {
      case 'presencial':
        return MapPin;
      case 'telemedicina':
        return Video;
      case 'domiciliar':
        return Home;
      default:
        return Clock;
    }
  };

  const getModalityColor = (modality) => {
    switch (modality) {
      case 'presencial':
        return 'text-blue-400';
      case 'telemedicina':
        return 'text-green-400';
      case 'domiciliar':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatTime = (time) => {
    return time.substring(0, 5);
  };

  const { top, height } = getSlotPosition();

  return (
    <div
      className={getSlotStyle()}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left: '4px',
        right: '4px',
        zIndex: 10
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(slot);
      }}
    >
      {/* Delete button (visible on hover) */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(slot);
          }}
          className={`absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${
            isDarkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
          title="Remover slot"
        >
          <span className="text-xs">×</span>
        </button>
      )}

      {/* Time display */}
      <div className="flex items-center gap-1 mb-1">
        <Clock className="h-3 w-3 opacity-70" />
        <span className="font-medium">
          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
        </span>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-1 mb-1">
        {slot.status === 'booked' && (
          <>
            <User className="h-3 w-3" />
            <span className="text-xs">{slot?.booking?.patientName || 'Agendado'}</span>
          </>
        )}
        {slot.status === 'available' && (
          <>
            <div className="w-2 h-2 rounded-full bg-current opacity-70" />
            <span className="text-xs">Disponível</span>
          </>
        )}
        {slot.status === 'blocked' && (
          <>
            <AlertCircle className="h-3 w-3" />
            <span className="text-xs">Bloqueado</span>
          </>
        )}
      </div>

      {/* Modalities */}
      {slot.modality && slot.modality.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {slot.modality.map((modality) => {
            const Icon = getModalityIcon(modality);
            const color = getModalityColor(modality);
            return (
              <div key={modality} className={`flex items-center gap-1 ${color}`}>
                <Icon className="h-3 w-3" />
              </div>
            );
          })}
        </div>
      )}

      {/* Patient info (if booked) */}
      {slot.booking && (
        <div className="mt-1 pt-1 border-t border-current border-opacity-20">
          <div className="text-xs opacity-90">
            {slot.booking.patientName}
          </div>
          {slot.booking.status && (
            <Badge variant="secondary" className="text-xs mt-1">
              {slot.booking.status}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default TimeGridSlot;