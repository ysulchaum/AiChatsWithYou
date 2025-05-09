import { create } from 'zustand';
import { Message } from '../App.tsx'; // Import the Message interface

interface ConversationState {
  conversation: Message[];
  setConversation: (conversation: Message[]) => void;
  addMessage: (message: Message) => void;
  clearConversation: () => void;
}

export const useConversationStore = create<ConversationState>((set) => ({
  conversation: [],
  setConversation: (conversation) => set({ conversation }),
  addMessage: (message) =>
    set((state) => ({
      conversation: [...state.conversation, message],
    })),
  clearConversation: () => set({ conversation: [] }),
}));

