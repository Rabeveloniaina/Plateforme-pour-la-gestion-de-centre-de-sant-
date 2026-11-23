/**
 * CALENDRIER AMÉLIORÉ AVEC REACT-BIG-CALENDAR
 * Calendrier interactif avec drag & drop, vues multiples, et navigation fluide
 */

import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer, View, Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar as CalendarIcon, Clock, User, AlertCircle } from 'lucide-react';

const locales = {
  'fr': fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: fr, weekStartsOn: 1 }), // Lundi
  getDay,
  locales,
});

interface CalendarEvent {
  id: number;
  id_rdv?: number;
  patient_id?: number;
  title: string;
  start: Date;
  end: Date;
  patientName?: string;
  statut?: 'attente' | 'confirme' | 'termine' | 'annule' | 'absent';
  type?: string;
  motif?: string;
  rawData?: any;
}

interface CalendarEnhancedProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
  onEventDrop?: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
  height?: number;
}

export default function CalendarEnhanced({
  events,
  onEventClick,
  onSelectSlot,
  onEventDrop,
  height = 600
}: CalendarEnhancedProps) {
  const [currentView, setCurrentView] = useState<View>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Convertir nos événements au format react-big-calendar
  const calendarEvents: Event[] = events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    resource: event // Stocker les données complètes dans resource
  }));

  // Style personnalisé selon le statut
  const eventStyleGetter = (event: Event) => {
    const eventData = event.resource as CalendarEvent;
    const statut = eventData?.statut || 'attente';
    
    let backgroundColor = '#fef3c7'; // Jaune par défaut (attente)
    let borderColor = '#f59e0b';
    let color = '#92400e';

    switch (statut) {
      case 'confirme':
        backgroundColor = '#d1fae5';
        borderColor = '#10b981';
        color = '#065f46';
        break;
      case 'termine':
        backgroundColor = '#dbeafe';
        borderColor = '#3b82f6';
        color = '#1e40af';
        break;
      case 'annule':
      case 'absent':
        backgroundColor = '#fee2e2';
        borderColor = '#ef4444';
        color = '#991b1b';
        break;
      default:
        backgroundColor = '#fef3c7';
        borderColor = '#f59e0b';
        color = '#92400e';
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: '2px',
        borderStyle: 'solid',
        color,
        borderRadius: '6px',
        padding: '2px 4px',
        fontSize: '0.875rem',
        fontWeight: '500'
      }
    };
  };

  // Formater le titre de l'événement avec plus d'informations
  const formatEventTitle = (event: Event) => {
    const eventData = event.resource as CalendarEvent;
    if (!eventData) return event.title;
    
    const time = moment(event.start).format('HH:mm');
    const patientName = eventData.patientName || event.title;
    
    return `${time} - ${patientName}`;
  };

  // Gérer le clic sur un événement
  const handleSelectEvent = (event: Event) => {
    const eventData = event.resource as CalendarEvent;
    if (onEventClick && eventData) {
      onEventClick(eventData);
    }
  };

  // Gérer le clic sur un créneau vide
  const handleSelectSlot = (slotInfo: { start: Date; end: Date; action: 'select' | 'click' }) => {
    if (onSelectSlot && slotInfo.action === 'click') {
      onSelectSlot({ start: slotInfo.start, end: slotInfo.end });
    }
  };

  // Gérer le drag & drop
  const handleEventDrop = ({ event, start, end }: { event: Event; start: Date; end: Date }) => {
    const eventData = event.resource as CalendarEvent;
    if (onEventDrop && eventData) {
      // Calculer la nouvelle durée
      const duration = event.end.getTime() - event.start.getTime();
      const newEnd = new Date(start.getTime() + duration);
      onEventDrop(eventData, start, newEnd);
    }
  };

  // Messages personnalisés en français
  const messages = {
    allDay: 'Toute la journée',
    previous: 'Précédent',
    next: 'Suivant',
    today: "Aujourd'hui",
    month: 'Mois',
    week: 'Semaine',
    day: 'Jour',
    agenda: 'Agenda',
    date: 'Date',
    time: 'Heure',
    event: 'Événement',
    noEventsInRange: 'Aucun rendez-vous dans cette période',
    showMore: (total: number) => `+ ${total} autre(s)`
  };

  // Naviguer vers aujourd'hui
  const navigateToToday = () => {
    setCurrentDate(new Date());
  };

  // Naviguer vers une date spécifique
  const onNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      {/* En-tête personnalisé */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Calendrier des rendez-vous</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={navigateToToday}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition"
          >
            Aujourd'hui
          </button>
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-500"></div>
          <span>En attente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-500"></div>
          <span>Confirmé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-500"></div>
          <span>Terminé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-500"></div>
          <span>Annulé/Absent</span>
        </div>
      </div>

      {/* Calendrier */}
      <div style={{ height: `${height}px` }}>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          view={currentView}
          onView={setCurrentView}
          date={currentDate}
          onNavigate={onNavigate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          resizable
          onEventDrop={handleEventDrop}
          draggableAccessor={() => true}
          eventPropGetter={eventStyleGetter}
          messages={messages}
          formats={{
            dayFormat: 'dddd D',
            dayHeaderFormat: 'dddd D MMMM',
            dayRangeHeaderFormat: ({ start, end }) =>
              `${moment(start).format('D MMMM')} - ${moment(end).format('D MMMM YYYY')}`,
            monthHeaderFormat: 'MMMM YYYY',
            timeGutterFormat: 'HH:mm',
            eventTimeRangeFormat: ({ start, end }) =>
              `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`
          }}
          defaultView="week"
          min={new Date(2024, 0, 1, 0, 0)} // 00h (minuit) - Centre de santé 24h/24
          max={new Date(2024, 0, 1, 23, 59)} // 23h59 - Toute la journée
          step={30} // Créneaux de 30 minutes
          timeslots={2} // 2 créneaux par heure
        />
      </div>

      {/* Info si aucun événement */}
      {events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <AlertCircle className="w-12 h-12 mb-4 text-gray-400" />
          <p className="text-lg font-medium">Aucun rendez-vous</p>
          <p className="text-sm">Cliquez sur un créneau pour créer un nouveau rendez-vous</p>
        </div>
      )}
    </div>
  );
}

