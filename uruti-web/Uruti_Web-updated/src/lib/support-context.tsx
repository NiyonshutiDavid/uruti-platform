import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from './api-client';
import { useAuth } from './auth-context';

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

interface SupportContextType {
  messages: SupportMessage[];
  unreadCount: number;
  sendMessage: (name: string, email: string, message: string) => Promise<SupportMessage>;
  getVisitorMessages: (email: string) => Promise<SupportMessage[]>;
  respondToMessage: (id: number, response: string) => Promise<void>;
  closeMessage: (id: number) => Promise<void>;
  refreshMessages: () => Promise<void>;
}

const SupportContext = createContext<SupportContextType | undefined>(undefined);

export function SupportProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, isAuthenticated } = useAuth();

  // Load messages from backend (only for admins)
  const refreshMessages = async () => {
    // Only fetch if user is admin
    if (!isAuthenticated || user?.role !== 'admin') {
      return;
    }

    try {
      const data = await apiClient.getSupportMessages();
      setMessages(data);
      setUnreadCount(data.filter((m: SupportMessage) => m.status === 'pending').length);
    } catch (error) {
      console.error('Error loading support messages:', error);
      // Silently fail - this is expected for non-admin users
    }
  };

  useEffect(() => {
    refreshMessages();
    
    // Refresh every 30 seconds (only for admins)
    if (isAuthenticated && user?.role === 'admin') {
      const interval = setInterval(refreshMessages, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user?.role]);

  const sendMessage = async (name: string, email: string, message: string): Promise<SupportMessage> => {
    try {
      const newMessage = await apiClient.createSupportMessage({
        visitor_name: name,
        visitor_email: email,
        message: message,
      });

      setMessages(prev => [newMessage, ...prev]);
      
      // Also save to localStorage as backup
      const updatedMessages = [newMessage, ...messages];
      localStorage.setItem('uruti_support_messages', JSON.stringify(updatedMessages));
      
      // Emit event for real-time updates
      window.dispatchEvent(new CustomEvent('new-support-message', { detail: newMessage }));
      return newMessage;
    } catch (error) {
      console.error('Error sending support message:', error);
      
      // Fallback to localStorage
      const newMessage: SupportMessage = {
        id: Date.now(),
        visitor_name: name,
        visitor_email: email,
        message: message,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [newMessage, ...prev]);
      const updatedMessages = [newMessage, ...messages];
      localStorage.setItem('uruti_support_messages', JSON.stringify(updatedMessages));
      
      window.dispatchEvent(new CustomEvent('new-support-message', { detail: newMessage }));
      return newMessage;
    }
  };

  const getVisitorMessages = async (email: string): Promise<SupportMessage[]> => {
    try {
      const data = await apiClient.getPublicSupportMessages(email, 0, 100);
      return data;
    } catch (error) {
      const localMessages = localStorage.getItem('uruti_support_messages');
      if (!localMessages) return [];
      const parsed = JSON.parse(localMessages) as SupportMessage[];
      return parsed.filter((m) => m.visitor_email === email);
    }
  };

  const respondToMessage = async (id: number, response: string) => {
    try {
      await apiClient.respondToSupportMessage(id, response);
      
      setMessages(prev => prev.map(msg => 
        msg.id === id 
          ? { 
              ...msg, 
              response, 
              status: 'responded' as const, 
              responded_at: new Date().toISOString() 
            }
          : msg
      ));

      // Update localStorage
      const updatedMessages = messages.map(msg => 
        msg.id === id 
          ? { 
              ...msg, 
              response, 
              status: 'responded' as const, 
              responded_at: new Date().toISOString() 
            }
          : msg
      );
      localStorage.setItem('uruti_support_messages', JSON.stringify(updatedMessages));

      // Emit event for visitor to receive response
      window.dispatchEvent(new CustomEvent('support-response-received', { detail: { id, response } }));
    } catch (error) {
      console.error('Error responding to support message:', error);
      throw error;
    }
  };

  const closeMessage = async (id: number) => {
    try {
      await apiClient.closeSupportMessage(id);
      
      setMessages(prev => prev.map(msg => 
        msg.id === id ? { ...msg, status: 'closed' as const } : msg
      ));

      // Update localStorage
      const updatedMessages = messages.map(msg => 
        msg.id === id ? { ...msg, status: 'closed' as const } : msg
      );
      localStorage.setItem('uruti_support_messages', JSON.stringify(updatedMessages));
    } catch (error) {
      console.error('Error closing support message:', error);
      throw error;
    }
  };

  return (
    <SupportContext.Provider value={{ 
      messages, 
      unreadCount, 
      sendMessage, 
      getVisitorMessages,
      respondToMessage, 
      closeMessage,
      refreshMessages 
    }}>
      {children}
    </SupportContext.Provider>
  );
}

export function useSupport() {
  const context = useContext(SupportContext);
  if (context === undefined) {
    throw new Error('useSupport must be used within a SupportProvider');
  }
  return context;
}