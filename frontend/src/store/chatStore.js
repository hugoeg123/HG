import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useChatStore = create(
  persist(
    (set, get) => ({
      messages: [],
      history: [],
      currentChatId: null,

      // Actions
      setMessages: (messages) => set({ messages }),
      
      addMessage: (message) => set((state) => ({ 
        messages: [...state.messages, message] 
      })),

      updateMessage: (id, updates) => set((state) => ({
        messages: state.messages.map(msg => msg.id === id ? { ...msg, ...updates } : msg)
      })),

      startNewChat: () => {
         const { messages, currentChatId } = get();
         // Auto-save current if not empty
         if (messages.length > 0) {
             get().saveCurrentChat();
         }
         set({ messages: [], currentChatId: null });
      },

      saveCurrentChat: () => {
        const { messages, currentChatId, history } = get();
        if (messages.length === 0) return;

        // Determine title from first user message
        const firstUserMsg = messages.find(m => m.sender === 'user');
        const title = firstUserMsg ? (firstUserMsg.content.substring(0, 40) + (firstUserMsg.content.length > 40 ? '...' : '')) : 'Nova Conversa';
        
        const lastMsg = messages[messages.length - 1];
        const preview = lastMsg ? (lastMsg.content.substring(0, 60) + (lastMsg.content.length > 60 ? '...' : '')) : '';
        
        const chatData = {
            id: currentChatId || `chat-${Date.now()}`,
            title,
            date: new Date().toISOString(),
            preview,
            messages: messages
        };

        // Check if exists in history
        const existingIndex = history.findIndex(h => h.id === chatData.id);
        let newHistory = [...history];
        
        if (existingIndex >= 0) {
            newHistory[existingIndex] = chatData;
        } else {
            newHistory.unshift(chatData); // Add to top
        }
        
        set({ history: newHistory, currentChatId: chatData.id });
      },
      
      loadChat: (chatId) => {
         // Save current before loading new
         const { messages, currentChatId } = get();
         if (messages.length > 0) {
             get().saveCurrentChat();
         }

         const { history } = get();
         const chat = history.find(h => h.id === chatId);
         if (chat) {
             set({ messages: chat.messages || [], currentChatId: chat.id });
         }
      },

      deleteChat: (chatId) => {
         set((state) => {
             const newHistory = state.history.filter(h => h.id !== chatId);
             // If deleting current chat, clear messages
             if (state.currentChatId === chatId) {
                 return { history: newHistory, messages: [], currentChatId: null };
             }
             return { history: newHistory };
         });
      },
      
      clearHistory: () => set({ history: [] })
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => localStorage),
      // Optional: Filter out streaming state if needed, but keeping it simple for now
    }
  )
);
