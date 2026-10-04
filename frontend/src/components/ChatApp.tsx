import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import LanguageSelector from './LanguageSelector';
import { Message, Language } from '../types/chat';
import { chatApi } from '../services/chatApi';

interface ChatAppProps {}

const ChatApp: React.FC<ChatAppProps> = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true); // Auto-open chat to show DHRUV name

  const getWelcomeMessage = (language: Language): string => {
    const welcomeMessages = {
      en: "Hello! I'm Dhruv, your JECRC campus assistant. How can I help you today?",
      hi: "नमस्ते! मैं ध्रुव हूं, आपका JECRC कैंपस सहायक। मैं आज आपकी कैसे सहायता कर सकता हूं?",
      raj: "नमस्कार! म्हैं ध्रुव हूं, थारो JECRC कैंपस सहायक। म्हैं आज थानै कांई मदद कर सकूं?"
    };
    return welcomeMessages[language];
  };

  const initializeChat = useCallback(async () => {
    try {
      const session = await chatApi.createSession(currentLanguage);
      setSessionId(session.sessionId);

      const newSocket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5002');
      
      newSocket.on('connect', () => {
        setIsConnected(true);
        newSocket.emit('join_chat', { sessionId: session.sessionId });
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      newSocket.on('receive_message', (data: any) => {
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          content: data.message,
          sender: 'bot',
          timestamp: new Date(),
          language: data.language,
          intent: data.intent,
          confidence: data.confidence
        };
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
      });

      setSocket(newSocket);

      const welcomeMessage: Message = {
        id: 'welcome',
        content: getWelcomeMessage(currentLanguage),
        sender: 'bot',
        timestamp: new Date(),
        language: currentLanguage
      };
      setMessages([welcomeMessage]);

    } catch (error) {
      console.error('Failed to initialize chat:', error);
      toast.error('Failed to start chat session');
    }
  }, [currentLanguage]);

  useEffect(() => {
    const handleOpenFloatingChat = () => {
      setIsChatOpen(true);
    };

    window.addEventListener('openFloatingChat', handleOpenFloatingChat);
    initializeChat();
    
    return () => {
      window.removeEventListener('openFloatingChat', handleOpenFloatingChat);
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [initializeChat]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !sessionId) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: content.trim(),
      sender: 'user',
      timestamp: new Date(),
      language: currentLanguage
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      if (socket && isConnected) {
        socket.emit('send_message', {
          sessionId,
          message: content.trim(),
          language: currentLanguage
        });
      } else {
        const response = await chatApi.sendMessage(sessionId, content.trim(), currentLanguage);
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          content: response.botResponse.content,
          sender: 'bot',
          timestamp: new Date(),
          language: response.botResponse.language,
          intent: response.botResponse.intent,
          confidence: response.botResponse.confidence
        };
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
      toast.error('Failed to send message. Please try again.');
    }
  };

  const handleLanguageChange = async (newLanguage: Language) => {
    try {
      setCurrentLanguage(newLanguage);

      if (socket && isConnected) {
        socket.emit('join_chat', { sessionId: sessionId });
      }
      
      const welcomeMessage: Message = {
        id: 'welcome-new-lang',
        content: getWelcomeMessage(newLanguage),
        sender: 'bot',
        timestamp: new Date(),
        language: newLanguage
      };
      setMessages(prev => [...prev, welcomeMessage]);
    } catch (error) {
      console.error('Failed to change language:', error);
      toast.error('Failed to switch language. Please try again.');
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isChatOpen && (
          <motion.div
            className="fixed bottom-6 right-6"
            style={{ zIndex: 9999 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <button
              onClick={() => setIsChatOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group relative"
            >
              <MessageCircle className="h-6 w-6" />
              
              {/* Simple DHRUV label */}
                          {/* Simple DHRUV label */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
              DHRUV Chat
            </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            className="fixed bottom-6 right-6 z-50 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
            style={{ width: '380px', height: '520px' }}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-4">
              {/* Main title row */}
              <div className="text-center mb-3">
                <h1 className="text-white font-black text-4xl">DHRUV</h1>
                <p className="text-white text-lg font-bold">JECRC Assistant</p>
              </div>
              
              {/* Status and close button row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5 text-white" />
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-300' : 'bg-red-300'}`}></div>
                    <span className="text-indigo-100 text-xs">{isConnected ? 'Online' : 'Offline'}</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 bg-gray-50 overflow-hidden" style={{ height: '350px' }}>
              <div className="h-full overflow-y-auto p-3">
                <ChatMessages messages={messages} isLoading={isLoading} />
              </div>
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 p-3 space-y-2">
              <LanguageSelector 
                currentLanguage={currentLanguage}
                onLanguageChange={handleLanguageChange}
              />
              <ChatInput 
                onSendMessage={sendMessage}
                currentLanguage={currentLanguage}
                disabled={isLoading}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatApp;
