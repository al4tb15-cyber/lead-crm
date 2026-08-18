import { db } from './db.ts';
import { PlatformEvent, Lead, Conversation, Appointment } from '../src/types/index.ts';

export type EventHandler = (event: PlatformEvent) => Promise<void>;

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  constructor() {
    this.registerDefaultHandlers();
  }

  on(eventType: string, handler: EventHandler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  async emit(event: Omit<PlatformEvent, 'id' | 'timestamp'>): Promise<PlatformEvent> {
    const fullEvent: PlatformEvent = {
      id: 'evt_' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      ...event
    };

    // 1. Log event in tenant-isolated DB
    db.logEvent(fullEvent);

    // 2. Increment tenant AI/event usage counters
    const tenant = db.getTenant(event.tenantId);
    if (tenant) {
      tenant.usage.usedAiTokens += 250; // Base telemetry token cost
    }

    // 3. Dispatch to registered listeners
    const handlers = this.handlers.get(event.eventType) || [];
    const wildcardHandlers = this.handlers.get('*') || [];
    
    for (const h of [...handlers, ...wildcardHandlers]) {
      try {
        await h(fullEvent);
      } catch (err) {
        console.error(`[EventBus Error on ${event.eventType}]:`, err);
      }
    }

    return fullEvent;
  }

  private registerDefaultHandlers() {
    // When appointment is created -> automatically mark lead as 'booked' & notify
    this.on('appointment.created', async (evt) => {
      const { leadId, appointmentId, contactName, title } = evt.details;
      if (leadId) {
        const lead = db.leads.get(leadId);
        if (lead && lead.tenantId === evt.tenantId) {
          lead.status = 'booked';
          lead.notes.push(`[System Event ${new Date().toLocaleTimeString()}]: Appointment scheduled for "${title}" with ${contactName}.`);
          lead.updatedAt = new Date().toISOString();
        }
      }
    });

    // When lead is won -> update revenue & metrics
    this.on('lead.won', async (evt) => {
      const { leadId, value } = evt.details;
      if (leadId) {
        const lead = db.leads.get(leadId);
        if (lead && lead.tenantId === evt.tenantId) {
          lead.status = 'won';
          lead.notes.push(`[Won Deal]: Converted with estimated deal value of $${value?.toLocaleString() || '0'}.`);
          lead.updatedAt = new Date().toISOString();
        }
      }
    });
  }
}

export const eventBus = new EventBus();
