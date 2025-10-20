import React, { useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function MedicalCalendar() {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(20);
  
  const daysWithAppointments = {
    14: { scheduled: 2, available: 6 },
    16: { scheduled: 1, available: 7 },
    17: { scheduled: 2, available: 6 },
    18: { scheduled: 5, available: 3 },
    19: { scheduled: 4, available: 4 },
    20: { scheduled: 5, available: 3 },
    21: { scheduled: 3, available: 5 },
    22: { scheduled: 4, available: 4 },
    23: { scheduled: 6, available: 2 },
    24: { scheduled: 2, available: 6 },
    25: { scheduled: 2, available: 6 }
  };

  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';
  
  const scheduledBg = darkMode ? 'bg-emerald-900' : 'bg-blue-900';
  const scheduledText = darkMode ? 'text-emerald-100' : 'text-blue-100';
  const availableBg = darkMode ? 'bg-emerald-100' : 'bg-blue-100';
  const availableText = darkMode ? 'text-emerald-900' : 'text-blue-900';
  const selectedBorder = darkMode ? 'border-emerald-400' : 'border-blue-500';
  const selectedBg = darkMode ? 'bg-emerald-500 bg-opacity-10' : 'bg-blue-500 bg-opacity-10';

  return (
    <div className={`min-h-screen ${bgClass} p-6 transition-colors duration-300`}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-3xl font-semibold ${textPrimary}`}>
              Janeiro 2025
            </h1>
            <p className={`${textSecondary} mt-1`}>Agenda Médica</p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} ${textPrimary} transition-colors`}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Calendar */}
        <div className={`${cardBg} rounded-lg shadow-sm p-6 border ${borderClass}`}>
          <div className="grid grid-cols-7 gap-3 mb-4">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className={`text-center font-semibold ${textSecondary} text-sm py-2`}>
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-3">
            {[28, 29, 30].map(day => (
              <div key={`prev-${day}`} className={`h-24 p-3 flex items-start ${textSecondary} opacity-30`}>
                <div className="font-medium text-lg">{day}</div>
              </div>
            ))}
            
            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
              const dayInfo = daysWithAppointments[day];
              const isSelected = day === selectedDate;
              
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    h-24 p-3 rounded-lg transition-all flex items-start justify-between
                    ${isSelected ? selectedBg : cardBg} ${textPrimary}
                    border-3 ${isSelected ? `${selectedBorder} shadow-xl` : `${borderClass} hover:border-opacity-50`}
                    ${isSelected ? 'scale-105' : 'hover:scale-102'}
                  `}
                  style={isSelected ? { borderWidth: '3px' } : { borderWidth: '2px' }}
                >
                  <div className="font-semibold text-lg">{day}</div>
                  {dayInfo && (
                    <div className="space-y-1 text-right">
                      <div className={`${scheduledBg} ${scheduledText} text-xs py-0.5 px-2 rounded font-medium whitespace-nowrap`}>
                        {dayInfo.scheduled} agend.
                      </div>
                      <div className={`${availableBg} ${availableText} text-xs py-0.5 px-2 rounded font-medium whitespace-nowrap`}>
                        {dayInfo.available} livre{dayInfo.available !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
            
            <div className={`h-24 p-3 flex items-start ${textSecondary} opacity-30`}>
              <div className="font-medium text-lg">1</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}