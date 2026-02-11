import React, { useState, useRef, useEffect } from 'react';
import { Message, MedicalReport } from '../types';
import { getAIChatResponse, analyzeSymptoms } from '../services/geminiService';
import { dbService } from '../services/dbService';
import { 
  PaperAirplaneIcon, 
  ChatBubbleLeftRightIcon, 
  XMarkIcon, 
  ExclamationTriangleIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  CheckCircleIcon
} from '@heroicons/react/24/solid';

interface FloatingAIChatProps {
  onReportGenerated?: (report: MedicalReport) => void;
}

const FloatingAIChat: React.FC<FloatingAIChatProps> = ({ onReportGenerated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'ai', text: 'Hi! I am your MedEcho assistant. How can I help you today?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [reportSaved, setReportSaved] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const user = dbService.auth.getCurrentUser();

  useEffect(() => {
    if (isOpen) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

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
      if (transcript.trim()) {
        processMessage(transcript, true);
      }
    };
    recognition.start();
  };

  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const saveToMedicalFiles = async (transcript: string) => {
    if (!user || reportSaved) return;
    
    setIsTyping(true);
    const analysis = await analyzeSymptoms(transcript);
    setIsTyping(false);
    
    if (!analysis) return;

    const newReport: MedicalReport = {
      id: 'ai-rpt-float-' + Date.now(),
      patientId: user.id,
      doctorId: 'medecho-ai',
      doctorName: 'MedEcho AI Assistant',
      date: new Date().toISOString().split('T')[0],
      diagnosis: analysis.condition || 'Floating Consultation',
      summary: analysis.summary || 'Clinical intake via quick chat.',
      prescription: [analysis.advice || 'Standard precautions advised.'],
      aiConfidence: analysis.confidence || 85,
      vitals: {}
    };

    await dbService.reports.create(newReport);
    setReportSaved(true);
    if (onReportGenerated) onReportGenerated(newReport);
  };

  const processMessage = async (text: string, wasVoice: boolean) => {
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text, timestamp: new Date() };
    const currentHistory = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const aiResponse = await getAIChatResponse(text, currentHistory);
    const aiMsg: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: aiResponse || '', timestamp: new Date() };
    
    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);

    if (wasVoice && aiMsg.text) {
      const textToSpeak = aiMsg.text.replace(/\[GENERATING CLINICAL REPORT\]/gi, '');
      speakText(textToSpeak);
    }

    if (aiMsg.text.includes("[GENERATING CLINICAL REPORT]")) {
      const fullTranscript = [...messages, userMsg, aiMsg].map(m => `${m.sender}: ${m.text}`).join('\n');
      saveToMedicalFiles(fullTranscript);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || reportSaved) return;
    processMessage(input, false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="w-80 md:w-96 h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden mb-4 flex flex-col animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm">MedEcho Chat</h3>
                <p className="text-[10px] text-blue-100 uppercase font-black tracking-widest">{reportSaved ? 'Case Saved' : isListening ? 'Listening...' : 'Mirror Mode Active'}</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 custom-scrollbar">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm text-sm relative group ${
                  m.sender === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                }`}>
                  <p>{m.text}</p>
                  <p className={`text-[9px] mt-1 ${m.sender === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                    {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {m.sender === 'ai' && (
                    <button 
                      onClick={() => speakText(m.text)}
                      className={`absolute -right-8 top-1 p-1 text-slate-300 hover:text-blue-600 transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100`}
                    >
                      <SpeakerWaveIcon className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border p-3 rounded-2xl rounded-tl-none flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-amber-50 px-4 py-2 flex items-center justify-between border-t border-amber-100">
            <div className="flex items-start space-x-2">
              <ExclamationTriangleIcon className="w-3 h-3 text-amber-600 mt-0.5" />
              <p className="text-[8px] text-amber-800 font-bold leading-tight uppercase">
                Notice: Automatic reporting on intake conclusion.
              </p>
            </div>
            {reportSaved && <CheckCircleIcon className="w-4 h-4 text-emerald-600" />}
          </div>

          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex items-center space-x-2">
            <button 
              type="button"
              onClick={handleSpeechInput}
              disabled={reportSaved}
              className={`p-2 rounded-xl transition-all ${reportSaved ? 'opacity-20' : isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
            >
              <MicrophoneIcon className="w-4 h-4" />
            </button>
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={reportSaved}
                placeholder={reportSaved ? "Consultation saved" : isListening ? "Listening..." : "How can I help?"}
                className="w-full pl-4 pr-10 py-3 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-800 shadow-inner"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping || reportSaved}
                className="absolute right-1.5 p-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg transition-all"
              >
                <PaperAirplaneIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 active:scale-95 ${
          isOpen ? 'bg-slate-800' : 'bg-gradient-to-tr from-blue-600 to-indigo-600'
        } text-white`}
      >
        {isOpen ? <XMarkIcon className="w-8 h-8" /> : <ChatBubbleLeftRightIcon className="w-8 h-8" />}
      </button>
    </div>
  );
};

export default FloatingAIChat;