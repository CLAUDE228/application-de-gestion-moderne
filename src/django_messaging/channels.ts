/**
 * DJANGO MESSAGING CHANNELS
 * Emulation of Python Django Channels & ASGI WebSockets
 * chat/consumers.py, chat/routing.py
 */

import { store } from '../services/store';
import { Message, UserRole } from '../types';

export class DjangoMessageConsumer {
  public static broadcastAlert(topic: string, message: {
    recipientRole: UserRole | 'all';
    subject: string;
    body: string;
    priority?: Message['priority'];
  }) {
    return store.sendMessage(message);
  }

  public static getInboxForRole(role: UserRole): Message[] {
    const messages = store.getState().messages;
    return messages.filter((m) => m.recipientRole === 'all' || m.recipientRole === role);
  }

  public static markRead(messageId: string) {
    store.markMessageAsRead(messageId);
  }
}
