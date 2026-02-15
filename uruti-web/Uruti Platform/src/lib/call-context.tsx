import { createContext, useContext, useState, ReactNode } from 'react';

interface CallState {
  isOpen: boolean;
  type: 'voice' | 'video';
  contactName: string;
  contactAvatar?: string;
  contactOnline: boolean;
}

interface CallContextType {
  callState: CallState;
  startCall: (type: 'voice' | 'video', contactName: string, contactAvatar?: string, contactOnline?: boolean) => void;
  endCall: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: ReactNode }) {
  const [callState, setCallState] = useState<CallState>({
    isOpen: false,
    type: 'voice',
    contactName: '',
    contactAvatar: undefined,
    contactOnline: false
  });

  const startCall = (type: 'voice' | 'video', contactName: string, contactAvatar?: string, contactOnline: boolean = false) => {
    setCallState({
      isOpen: true,
      type,
      contactName,
      contactAvatar,
      contactOnline
    });
  };

  const endCall = () => {
    setCallState(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  return (
    <CallContext.Provider value={{ callState, startCall, endCall }}>
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
