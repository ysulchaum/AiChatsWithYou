import { create } from 'zustand';
import { Message } from '../App.tsx'; // Import the Message interface


interface ConversationState {
  conversation: Message[];
  image: string | null;
  isImageLoading: boolean;
  setConversation: (conversation: Message[]) => void;
  addMessage: (message: Message) => void;
  clearConversation: () => void;
  setImage: (image: string | null) => void;
  setIsImageLoading: (isLoading: boolean) => void;
}

export const useConversationStore = create<ConversationState>((set) => ({
  conversation: [],
  image: null,
  isImageLoading: false,
  setConversation: (conversation) => set({ conversation }),
  addMessage: (message) =>
    set((state) => ({
      conversation: [...state.conversation, message],
    })),
  clearConversation: () => set({ conversation: [], image: null, isImageLoading: false }),
  setImage: (image) => set({ image }),
  setIsImageLoading: (isImageLoading) => set({ isImageLoading }),
}));