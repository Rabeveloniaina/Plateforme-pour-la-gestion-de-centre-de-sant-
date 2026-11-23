/**
 * COMPOSANT CALENDRIER INTERACTIF
 * Affiche les rendez-vous sous forme de calendrier visuel
 * Supporte vue jour/semaine/mois et drag & drop
 */

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  start: Date;
  end: Date;
  patientName?: string;
  medecinName?: string;
  statut?: 'attente' | 'confirme' | 'termine' | 'annule';
  type?: string;
}

interface CalendarProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  onDateClick?: (date: Date) => void;
  view?: 'day' | 'week' | 'month';
  onViewChange?: (view: 'day' | 'week' | 'month') => void;
}

export default function Calendar({ 
  events, 
  onEventClick, 
  onDateClick,
  view = 'week',
  onViewChange 
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [localView, setLocalView] = useState<'day' | 'week' | 'month'>(view);

  useEffect(() => {
    setLocalView(view);
  }, [view]);

  const handleViewChange = (newView: 'day' | 'week' | 'month') => {
    setLocalView(newView);
    if (onViewChange) {
      onViewChange(newView);
    }
  };

  // Couleurs par statut
  const getStatusColor = (statut?: string) => {
    switch (statut) {
      case 'confirme':
        return 'bg-green-100 border-green-500 text-green-800';
      case 'attente':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'termine':
        return 'bg-blue-100 border-blue-500 text-blue-800';
      case 'annule':
        return 'bg-red-100 border-red-500 text-red-800';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  // Navigation
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    switch (localView) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    switch (localView) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Obtenir la semaine actuelle
  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay()); // Dimanche
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Obtenir les jours du mois
  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const startDay = firstDay.getDay(); // 0 = dimanche
    
    // Jours du mois précédent
    for (let i = startDay - 1; i >= 0; i--) {
      const day = new Date(year, month, -i);
      days.push({ date: day, currentMonth: false });
    }
    
    // Jours du mois courant
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const day = new Date(year, month, i);
      days.push({ date: day, currentMonth: true });
    }
    
    // Compléter avec jours du mois suivant pour avoir 6 semaines
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const day = new Date(year, month + 1, i);
      days.push({ date: day, currentMonth: false });
    }
    
    return days;
  };

  // Filtrer les événements pour un jour donné
  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  // Formater la date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // Heures pour la vue jour/semaine - Centre de santé 24h/24
  const hours = Array.from({ length: 24 }, (_, i) => i); // 0h à 23h

  // Render selon la vue
  const renderDayView = () => {
    const dayEvents = getEventsForDay(currentDate);
    
    return (
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-[100px_1fr] border-t">
          {hours.map(hour => (
            <div key={hour} className="contents">
              <div className="border-b border-r p-2 text-sm text-gray-600 bg-gray-50">
                {hour}:00
              </div>
              <div className="border-b p-2 relative min-h-[60px]">
                {dayEvents
                  .filter(event => new Date(event.start).getHours() === hour)
                  .map(event => (
                    <div
                      key={event.id}
                      className={`p-2 mb-1 rounded border-l-4 cursor-pointer hover:shadow-md transition ${getStatusColor(event.statut)}`}
                      onClick={() => onEventClick?.(event)}
                    >
                      <div className="font-semibold text-sm">{event.title}</div>
                      {event.patientName && (
                        <div className="text-xs flex items-center gap-1 mt-1">
                          <User className="w-3 h-3" />
                          {event.patientName}
                        </div>
                      )}
                      <div className="text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(new Date(event.start))} - {formatTime(new Date(event.end))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    
    return (
      <div className="flex-1 overflow-auto">
        {/* En-têtes des jours */}
        <div className="grid grid-cols-[100px_repeat(7,1fr)] border-t sticky top-0 bg-white z-10">
          <div className="border-b border-r p-2 bg-gray-50"></div>
          {weekDays.map((day, idx) => (
            <div key={idx} className={`border-b border-r p-2 text-center ${
              day.toDateString() === new Date().toDateString() ? 'bg-blue-50' : 'bg-gray-50'
            }`}>
              <div className="text-sm font-semibold">{dayNames[idx]}</div>
              <div className="text-2xl">{day.getDate()}</div>
            </div>
          ))}
        </div>
        
        {/* Grille horaire */}
        {hours.map(hour => (
          <div key={hour} className="grid grid-cols-[100px_repeat(7,1fr)]">
            <div className="border-b border-r p-2 text-sm text-gray-600 bg-gray-50">
              {hour}:00
            </div>
            {weekDays.map((day, dayIdx) => {
              const dayEvents = getEventsForDay(day)
                .filter(event => new Date(event.start).getHours() === hour);
              
              return (
                <div 
                  key={dayIdx} 
                  className="border-b border-r p-1 min-h-[60px] hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    const clickedDate = new Date(day);
                    clickedDate.setHours(hour);
                    onDateClick?.(clickedDate);
                  }}
                >
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      className={`p-1 mb-1 rounded text-xs border-l-2 cursor-pointer hover:shadow ${getStatusColor(event.statut)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                    >
                      <div className="font-semibold truncate">{event.title}</div>
                      {event.patientName && (
                        <div className="truncate text-[10px]">{event.patientName}</div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderMonthView = () => {
    const monthDays = getMonthDays(currentDate);
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    
    return (
      <div className="flex-1 overflow-auto">
        {/* En-têtes des jours */}
        <div className="grid grid-cols-7 border-t">
          {dayNames.map(day => (
            <div key={day} className="border-b border-r p-2 text-center font-semibold bg-gray-50">
              {day}
            </div>
          ))}
        </div>
        
        {/* Grille des jours */}
        <div className="grid grid-cols-7">
          {monthDays.map(({ date, currentMonth }, idx) => {
            const dayEvents = getEventsForDay(date);
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={idx}
                className={`border-b border-r p-2 min-h-[100px] hover:bg-gray-50 cursor-pointer ${
                  !currentMonth ? 'bg-gray-100 text-gray-400' : ''
                } ${isToday ? 'bg-blue-50' : ''}`}
                onClick={() => onDateClick?.(date)}
              >
                <div className={`text-sm font-semibold ${isToday ? 'text-blue-600' : ''}`}>
                  {date.getDate()}
                </div>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={`p-1 rounded text-xs truncate border-l-2 ${getStatusColor(event.statut)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayEvents.length - 3} autre(s)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <button
            onClick={goToPrevious}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={goToToday}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Aujourd'hui
          </button>
          
          <button
            onClick={goToNext}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          <div className="text-xl font-semibold flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            {localView === 'day' && formatDate(currentDate)}
            {localView === 'week' && `Semaine du ${currentDate.toLocaleDateString('fr-FR')}`}
            {localView === 'month' && currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => handleViewChange('day')}
            className={`px-3 py-1 rounded text-sm ${
              localView === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Jour
          </button>
          <button
            onClick={() => handleViewChange('week')}
            className={`px-3 py-1 rounded text-sm ${
              localView === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Semaine
          </button>
          <button
            onClick={() => handleViewChange('month')}
            className={`px-3 py-1 rounded text-sm ${
              localView === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Mois
          </button>
        </div>
      </div>
      
      {/* Body */}
      {localView === 'day' && renderDayView()}
      {localView === 'week' && renderWeekView()}
      {localView === 'month' && renderMonthView()}
      
      {/* Footer Legend */}
      <div className="flex items-center gap-4 p-4 border-t bg-gray-50 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-100 border-2 border-yellow-500"></div>
          <span>En attente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-100 border-2 border-green-500"></div>
          <span>Confirmé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-100 border-2 border-blue-500"></div>
          <span>Terminé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-100 border-2 border-red-500"></div>
          <span>Annulé</span>
        </div>
      </div>
    </div>
  );
}

