import React, { useState, useRef } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { Language } from '../types/chat';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  currentLanguage: Language;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  currentLanguage,
  disabled = false,
}) => {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const toggleVoiceInput = () => {
    setIsListening(!isListening);
    // Voice input logic would go here
  };

  const getPlaceholder = (): string => {
    const placeholders = {
      en: 'Type your message...',
      hi: 'अपना संदेश लिखें...',
      raj: 'आपणो संदेश लिखो...'
    };
    return placeholders[currentLanguage];
  };

  return (
    <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2">
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={getPlaceholder()}
        disabled={disabled}
        className={`flex-1 resize-none border-none bg-transparent focus:outline-none text-sm max-h-20 min-h-[36px] ${
          currentLanguage === 'hi' || currentLanguage === 'raj' ? 'hindi-text' : ''
        }`}
        rows={1}
      />
      
      <button
        type="button"
        onClick={toggleVoiceInput}
        disabled={disabled}
        className={`p-2 rounded-lg transition-colors ${
          isListening
            ? 'bg-red-500 text-white'
            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
        } disabled:opacity-50`}
      >
        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </button>

      <button
        onClick={handleSubmit}
        disabled={!message.trim() || disabled}
        className={`p-2 rounded-lg transition-colors ${
          message.trim() && !disabled
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ChatInput;
