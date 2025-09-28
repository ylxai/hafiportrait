// Custom hook untuk mengelola events dengan CRUD operations
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Event } from '@/lib/database';
import type { EventFormData } from '@/components/admin/EventForm';

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const { toast } = useToast();

  // Fetch all events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create new event
  const createEvent = async (eventData: EventFormData) => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create event');
      }

      const newEvent = await response.json();
      setEvents(prev => [newEvent, ...prev]);
      
      toast({
        title: "Berhasil!",
        description: "Event baru berhasil dibuat",
      });

      return newEvent;
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal membuat event",
        variant: "destructive",
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Update existing event
  const updateEvent = async (eventId: string, eventData: EventFormData) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update event');
      }

      const updatedEvent = await response.json();
      setEvents(prev => prev.map(event => 
        event.id === eventId ? updatedEvent : event
      ));
      
      toast({
        title: "Berhasil!",
        description: "Event berhasil diperbarui",
      });

      return updatedEvent;
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal memperbarui event",
        variant: "destructive",
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Delete event
  const deleteEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete event');
      }

      setEvents(prev => prev.filter(event => event.id !== eventId));
      
      toast({
        title: "Berhasil!",
        description: "Event berhasil dihapus",
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menghapus event",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Save event (create or update)
  const saveEvent = async (eventData: EventFormData & { id?: string }) => {
    if (eventData.id) {
      return await updateEvent(eventData.id, eventData);
    } else {
      return await createEvent(eventData);
    }
  };

  // Start editing an event
  const startEdit = (event: Event) => {
    setEditingEvent(event);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingEvent(null);
  };

  // Load events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    loading,
    saving,
    editingEvent,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    saveEvent,
    startEdit,
    cancelEdit,
  };
}