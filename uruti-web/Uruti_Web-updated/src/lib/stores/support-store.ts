import { create } from 'zustand';
import apiClient from '../api-client';
import { useAuthStore } from './auth-store';

export interface SupportMessage {
  id: number;
  visitor_name: string;
  visitor_email: string;
  message: string;
  response?: string;
  status: 'pending' | 'responded' | 'closed';
  created_at: string;
  responded_at?: string;
}

interface SupportStore {
  messages: SupportMessage[];
  unreadCount: number;
  refreshMessages: () => Promise<void>;
  sendMessage: (name: string, email: string, message: string) => Promise<SupportMessage>;
  getVisitorMessages: (email: string) => Promise<SupportMessage[]>;
  respondToMessage: (id: number, response: string) => Promise<void>;
  closeMessage: (id: number) => Promise<void>;
}

export const useSupportStore = create<SupportStore>((set, get) => ({
  messages: [],
  unreadCount: 0,

  refreshMessages: async () => {
    const { user, isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated || user?.role !== 'admin') return;
    try {
      const data = await apiClient.getSupportMessages();
      set({
        messages: data,
        unreadCount: data.filter((m: SupportMessage) => m.status === 'pending').length,
      });
    } catch (error) {
      console.error('Error loading support messages:', error);
    }
  },

  sendMessage: async (name, email, message) => {
    try {
      const newMessage = await apiClient.createSupportMessage({
        visitor_name: name,
        visitor_email: email,
        message,
      });
      set((state) => ({ messages: [newMessage, ...state.messages] }));
      localStorage.setItem('uruti_support_messages', JSON.stringify(get().messages));
      window.dispatchEvent(new CustomEvent('new-support-message', { detail: newMessage }));
      return newMessage;
    } catch {
      const fallback: SupportMessage = {
        id: Date.now(),
        visitor_name: name,
        visitor_email: email,
        message,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      set((state) => ({ messages: [fallback, ...state.messages] }));
      localStorage.setItem('uruti_support_messages', JSON.stringify(get().messages));
      window.dispatchEvent(new CustomEvent('new-support-message', { detail: fallback }));
      return fallback;
    }
  },

  getVisitorMessages: async (email) => {
    try {
      return await apiClient.getPublicSupportMessages(email, 0, 100);
    } catch {
      const local = localStorage.getItem('uruti_support_messages');
      if (!local) return [];
      return (JSON.parse(local) as SupportMessage[]).filter((m) => m.visitor_email === email);
    }
  },

  respondToMessage: async (id, response) => {
    try {
      await apiClient.respondToSupportMessage(id, response);
      const now = new Date().toISOString();
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === id ? { ...msg, response, status: 'responded', responded_at: now } : msg
        ),
      }));
      localStorage.setItem('uruti_support_messages', JSON.stringify(get().messages));
      window.dispatchEvent(new CustomEvent('support-response-received', { detail: { id, response } }));
    } catch (error) {
      console.error('Error responding to support message:', error);
      throw error;
    }
  },

  closeMessage: async (id) => {
    try {
      await apiClient.closeSupportMessage(id);
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === id ? { ...msg, status: 'closed' } : msg
        ),
      }));
      localStorage.setItem('uruti_support_messages', JSON.stringify(get().messages));
    } catch (error) {
      console.error('Error closing support message:', error);
      throw error;
    }
  },
}));

// Backward-compatible hook — same API as the old useSupport() from support-context
export function useSupport() {
  return useSupportStore();
}
