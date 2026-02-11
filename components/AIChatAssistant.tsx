
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { getAIChatResponse } from '../services/geminiService';
import { PaperAirplaneIcon, ExclamationTriangleIcon, SparklesIcon, MicrophoneIcon, SpeakerWaveIcon } from '@heroicons/react/24/solid';

interface AIChatAssistantProps {
  initialContext?: string;
  isModal?: boolean;
}

const AIChatAssistant: React.FC<AIChatAssistantProps> = ({ initialContext, isModal }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'ai', text: initialContext ? `I've received the patient context. How can I assist with your clinical analysis?` : 'Hello! I am your MedEcho health assistant. How can I help you today?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  // Fixed: Added 'const' keyword to scrollRef declaration to fix name lookup errors.
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSpeechInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.start();
  };

  const handleReadAloud = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const fullPrompt = messages.length === 1 && initialContext 
      ? `Patient Context: ${initialContext}\n\nDoctor Inquiry: ${input}`
      : input;

    const aiResponse = await getAIChatResponse(fullPrompt);
    const aiMsg: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: aiResponse || '', timestamp: new Date() };
    
    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
  };

  return (
    <div className={`${isModal ? 'h-[600px] w-full max-w-4xl' : 'max-w-3xl mx-auto h-[calc(100vh-160px)] m-8'} flex flex-col bg-white rounded-3xl shadow-xl border overflow-hidden animate-in zoom-in-95 duration-500`}>
      <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <SparklesIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Clinical AI Support</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Medical Intelligence Core</p>
          </div>
        </div>
      </div>
      
      <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar bg-slate-50">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm relative group ${m.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border rounded-tl-none'}`}>
              <p className="text-sm leading-relaxed">{m.text}</p>
              <p className={`text-[10px] mt-1 ${m.sender === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              {m.sender === 'ai' && (
                <button 
                  onClick={() => handleReadAloud(m.text)}
                  className="absolute -right-10 top-2 p-2 text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <SpeakerWaveIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border p-4 rounded-2xl rounded-tl-none flex space-x-1 shadow-sm">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-amber-50 border-y border-amber-100 px-4 py-2 flex items-center space-x-2">
        <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <p className="text-[10px] text-amber-800 font-medium italic">
          MedEcho provides clinical guidance, not professional diagnosis. Always verify with staff.
        </p>
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white flex items-center space-x-3">
        <button 
          type="button"
          onClick={handleSpeechInput}
          className={`p-4 rounded-2xl transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
        >
          <MicrophoneIcon className="w-5 h-5" />
        </button>
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening..." : "Describe clinical situation..."}
            className="w-full pl-6 pr-14 py-4 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 rounded-xl transition-all flex items-center justify-center"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIChatAssistant;
