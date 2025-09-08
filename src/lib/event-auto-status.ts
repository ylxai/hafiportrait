// Automatic Event Status Management
import { database } from './database';

export class EventAutoStatus {
  
  // Auto-complete events yang sudah lewat 24 jam
  static async autoCompleteExpiredEvents() {
    try {
      const events = await database.getAllEvents();
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const expiredActiveEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return (
          event.status === 'active' && 
          eventDate < oneDayAgo
        );
      });

      const results = [];
      for (const event of expiredActiveEvents) {
        try {
          await database.updateEventStatus(event.id, 'completed');
          results.push({
            eventId: event.id,
            eventName: event.name,
            status: 'success',
            message: 'Auto-completed expired event'
          });
        } catch (error) {
          results.push({
            eventId: event.id,
            eventName: event.name,
            status: 'error',
            message: `Failed to auto-complete: ${error}`
          });
        }
      }

      return {
        processed: expiredActiveEvents.length,
        results
      };
    } catch (error) {
      console.error('Auto-complete expired events error:', error);
      throw error;
    }
  }

  // Auto-suggest archive untuk events yang sudah selesai > 7 hari
  static async suggestArchiveForOldEvents() {
    try {
      const events = await database.getAllEvents();
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const oldCompletedEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return (
          event.status === 'completed' && 
          eventDate < sevenDaysAgo &&
          !event.is_archived
        );
      });

      return oldCompletedEvents.map(event => ({
        eventId: event.id,
        eventName: event.name,
        eventDate: event.date,
        daysSinceCompletion: Math.floor(
          (now.getTime() - new Date(event.date).getTime()) / (24 * 60 * 60 * 1000)
        ),
        suggestion: 'archive',
        reason: 'Event completed more than 7 days ago'
      }));
    } catch (error) {
      console.error('Suggest archive error:', error);
      throw error;
    }
  }

  // Auto-activate events yang tanggalnya hari ini
  static async autoActivateTodayEvents() {
    try {
      const events = await database.getAllEvents();
      const today = new Date().toDateString();
      
      const todayDraftEvents = events.filter(event => {
        const eventDate = new Date(event.date).toDateString();
        return (
          event.status === 'draft' && 
          eventDate === today
        );
      });

      const results = [];
      for (const event of todayDraftEvents) {
        try {
          await database.updateEventStatus(event.id, 'active');
          results.push({
            eventId: event.id,
            eventName: event.name,
            status: 'success',
            message: 'Auto-activated today event'
          });
        } catch (error) {
          results.push({
            eventId: event.id,
            eventName: event.name,
            status: 'error',
            message: `Failed to auto-activate: ${error}`
          });
        }
      }

      return {
        processed: todayDraftEvents.length,
        results
      };
    } catch (error) {
      console.error('Auto-activate today events error:', error);
      throw error;
    }
  }

  // Comprehensive status health check
  static async performStatusHealthCheck() {
    try {
      const [
        autoCompleteResult,
        archiveSuggestions,
        autoActivateResult
      ] = await Promise.all([
        this.autoCompleteExpiredEvents(),
        this.suggestArchiveForOldEvents(),
        this.autoActivateTodayEvents()
      ]);

      return {
        timestamp: new Date().toISOString(),
        autoComplete: autoCompleteResult,
        archiveSuggestions,
        autoActivate: autoActivateResult,
        summary: {
          totalProcessed: autoCompleteResult.processed + autoActivateResult.processed,
          suggestionsCount: archiveSuggestions.length,
          errors: [
            ...autoCompleteResult.results.filter(r => r.status === 'error'),
            ...autoActivateResult.results.filter(r => r.status === 'error')
          ]
        }
      };
    } catch (error) {
      console.error('Status health check error:', error);
      throw error;
    }
  }
}