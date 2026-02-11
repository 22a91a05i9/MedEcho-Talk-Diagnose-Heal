
import React, { useState, useRef, useEffect } from 'react';
import { Message, MedicalReport, User } from '../types';
import { getAIChatResponse, analyzeSymptoms } from '../services/geminiService';
import { dbService } from '../services/dbService';
import { PaperAirplaneIcon, ExclamationTriangleIcon, SparklesIcon, MicrophoneIcon, SpeakerWaveIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

interface AIChatAssistantProps {
  initialContext?: string;
  isModal?: boolean;
  onReportGenerated?: (report: MedicalReport) => void;
}

const AIChatAssistant: React.FC<AIChatAssistantProps> = ({ initialContext, isModal, onReportGenerated }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'ai', text: initialContext ? `I've received the patient context. How can I assist?` : 'Hello! I am your MedEcho health assistant. How are you feeling today?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [reportSaved, setReportSaved] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const user = dbService.auth.getCurrentUser();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

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

  const saveToMedicalFiles = async (transcript: string) => {
    if (!user || reportSaved) return;
    
    setIsTyping(true);
    const analysis = await analyzeSymptoms(transcript);
    setIsTyping(false);
    
    if (!analysis) return;

    const newReport: MedicalReport = {
      id: 'ai-rpt-' + Date.now(),
      patientId: user.id,
      doctorId: 'medecho-ai',
      doctorName: 'MedEcho AI Assistant',
      date: new Date().toISOString().split('T')[0],
      diagnosis: analysis.condition || 'Clinical Intake',
      summary: analysis.summary || 'Clinical session completed via chat.',
      prescription: [analysis.advice || 'General health monitoring and hydration advised.'],
      aiConfidence: analysis.confidence || 90,
      vitals: {}
    };

    await dbService.reports.create(newReport);
    setReportSaved(true);
    if (onReportGenerated) {
      onReportGenerated(newReport);
    }
  };

  const processMessage = async (text: string, wasVoice: boolean) => {
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text, timestamp: new Date() };
    const historyText = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const aiResponse = await getAIChatResponse(text, historyText);
    const aiMsg: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: aiResponse || '', timestamp: new Date() };
    
    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);

    const textToSpeak = aiMsg.text.replace(/\[GENERATING CLINICAL REPORT\]/gi, '');
    if (wasVoice && aiMsg.text) {
      speakText(textToSpeak);
    }

    // Logic to detect if the session is concluding via the trigger phrase
    if (aiMsg.text.includes("[GENERATING CLINICAL REPORT]")) {
      const fullTranscript = [...messages, userMsg, aiMsg].map(m => `${m.sender}: ${m.text}`).join('\n');
      saveToMedicalFiles(fullTranscript);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTyping || reportSaved) return;
    processMessage(input, false);
  };

  return (
    <div className={`${isModal ? 'h-full w-full' : 'max-w-4xl mx-auto h-[calc(100vh-140px)] m-4 sm:m-8'} flex flex-col bg-white sm:rounded-3xl shadow-xl border-x sm:border overflow-hidden animate-in zoom-in-95 duration-500`}>
      <div className="bg-slate-900 p-4 sm:p-6 text-white flex justify-between items-center flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-xl font-bold tracking-tight">AI Intake Assistant</h2>
            <p className="text-slate-400 text-[8px] sm:text-[10px] font-black uppercase tracking-widest">Interactive Multilingual Intake</p>
          </div>
        </div>
        {reportSaved && (
          <div className="flex items-center space-x-2 bg-emerald-500/20 px-3 py-1.5 rounded-full border border-emerald-500/30 animate-bounce">
            <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Filing Report</span>
          </div>
        )}
      </div>
      
      <div ref={scrollRef} className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar bg-slate-50">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] sm:max-w-[75%] p-3 sm:p-4 rounded-2xl shadow-sm relative group ${m.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border rounded-tl-none'}`}>
              <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">{m.text}</p>
              <p className={`text-[8px] sm:text-[10px] mt-1 ${m.sender === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              {m.sender === 'ai' && (
                <button 
                  onClick={() => speakText(m.text)}
                  className={`absolute -right-8 top-1 p-2 text-slate-300 hover:text-blue-600 transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100`}
                  title="Speak Response"
                >
                  <SpeakerWaveIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border p-3 rounded-2xl rounded-tl-none flex space-x-1 shadow-sm">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-amber-50 border-y border-amber-100 px-4 py-2 flex items-center space-x-2 flex-shrink-0">
        <ExclamationTriangleIcon className="w-3 h-3 text-amber-600 flex-shrink-0" />
        <p className="text-[8px] sm:text-[10px] text-amber-800 font-bold uppercase tracking-tight">
          Assistant: I'll ask one symptom at a time. Harmless advice is provided at the very end.
        </p>
      </div>

      <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
        <button 
          type="button"
          disabled={reportSaved}
          onClick={handleSpeechInput}
          className={`p-3 sm:p-4 rounded-2xl transition-all ${reportSaved ? 'opacity-20 bg-slate-100' : isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          title="Voice Input"
        >
          <MicrophoneIcon className="w-5 h-5" />
        </button>
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={reportSaved}
            placeholder={reportSaved ? "Consultation filed successfully." : isListening ? "Listening..." : "Tell me what you're experiencing..."}
            className="w-full pl-4 pr-12 py-3.5 sm:pl-6 sm:pr-14 sm:py-4 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm text-slate-800 shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping || reportSaved}
            className="absolute right-1.5 top-1.5 bottom-1.5 bg-blue-600 text-white px-3 sm:px-4 rounded-xl flex items-center justify-center transition-all disabled:opacity-20 shadow-lg hover:bg-blue-700 active:scale-95"
          >
            <PaperAirplaneIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIChatAssistant;
