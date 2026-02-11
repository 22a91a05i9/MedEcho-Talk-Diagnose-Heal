
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { MedicalReport } from '../types';
import { analyzeSymptoms } from '../services/geminiService';
import { 
  StopIcon, 
  VideoCameraIcon, 
  ExclamationTriangleIcon,
  GlobeAltIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

interface VirtualDoctorProps {
  patientId: string;
  onSessionComplete: (report: MedicalReport) => void;
}

type Persona = 'Sarah' | 'James' | 'Elena' | 'Marcus';
const INDIAN_LANGUAGES = [
  "English", "Hindi", "Telugu", "Tamil", "Bengali", "Marathi", "Gujarati", "Kannada", "Malayalam", "Punjabi"
];

const VirtualDoctor: React.FC<VirtualDoctorProps> = ({ patientId, onSessionComplete }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [chatOverlay, setChatOverlay] = useState<{sender: string, text: string}[]>([]);
  const [visualizerData, setVisualizerData] = useState<number[]>(Array(20).fill(10));
  const [persona, setPersona] = useState<Persona>('Sarah');
  const [language, setLanguage] = useState("English");
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const transcriptionRef = useRef<string>("");

  const personas = {
    Sarah: { img: "https://images.unsplash.com/photo-1550831107-1553da8c8464?auto=format&fit=crop&q=80&w=1200", voice: "Puck", desc: "Empathetic" },
    James: { img: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=1200&auto=format&fit=crop", voice: "Kore", desc: "Professional" },
    Elena: { img: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=1200&auto=format&fit=crop", voice: "Zephyr", desc: "Pediatric" },
    Marcus: { img: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=1200&auto=format&fit=crop", voice: "Charon", desc: "Expert Surgeon" }
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const startSession = async () => {
    try {
      setIsConnecting(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let nextStartTime = 0;
      const sources = new Set<AudioBufferSourceNode>();

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const avg = inputData.reduce((acc, val) => acc + Math.abs(val), 0) / inputData.length;
              setVisualizerData(prev => [...prev.slice(1), 5 + avg * 400]);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            setIsConnecting(false);
            setIsActive(true);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.outputTranscription) {
              const text = msg.serverContent.outputTranscription.text;
              transcriptionRef.current += text + " ";
              setChatOverlay(prev => [...prev.slice(-1), { sender: 'Doc', text }]);
            }
            if (msg.serverContent?.inputTranscription) {
              setChatOverlay(prev => [...prev.slice(-1), { sender: 'You', text: msg.serverContent!.inputTranscription!.text }]);
            }
            const audioBase64 = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioBase64) {
              nextStartTime = Math.max(nextStartTime, outputCtx.currentTime);
              const buffer = await decodeAudioData(decode(audioBase64), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.start(nextStartTime);
              nextStartTime += buffer.duration;
              sources.add(source);
              source.onended = () => sources.delete(source);
            }
          },
          onerror: () => { setIsActive(false); setIsConnecting(false); },
          onclose: () => setIsActive(false),
        },
        config: {
          // Fixed typo: responseModalities
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: personas[persona].voice as any } } },
          systemInstruction: `You are Dr. Echo. Greeting in ${language}. Ask step-by-step. extracted clinical data later.`,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        }
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (err) {
      setIsConnecting(false);
    }
  };

  const endSession = async () => {
    if (sessionPromiseRef.current) (await sessionPromiseRef.current).close();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setIsActive(false);
    const analysis = await analyzeSymptoms(transcriptionRef.current);
    const newReport: MedicalReport = {
      id: 'r-' + Math.random().toString(36).substr(2, 9),
      patientId: patientId,
      doctorId: 'ai-assistant', 
      date: new Date().toISOString().split('T')[0],
      doctorName: `AI-Doc (${persona})`,
      diagnosis: analysis?.condition || 'Checkup Completed',
      aiConfidence: analysis?.confidence || 80,
      inputLanguage: language,
      summary: analysis?.advice || transcriptionRef.current || 'Session recorded.',
      prescription: ['Follow-up as advised'],
      vitals: { temperature: '98.6F' }
    };
    onSessionComplete(newReport);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto flex flex-col items-center min-h-[calc(100vh-100px)]">
      {!isActive && !isConnecting && (
        <div className="w-full max-w-4xl space-y-8 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
           <div className="text-center">
             <h2 className="text-2xl sm:text-4xl font-black text-slate-800 tracking-tight">Virtual Clinic</h2>
             <p className="text-slate-500 text-sm mt-1">Talk to our AI specialist instantly.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
               <h3 className="text-sm font-black text-slate-700 flex items-center space-x-2 mb-4">
                 <GlobeAltIcon className="w-4 h-4 text-blue-600" />
                 <span>1. Language</span>
               </h3>
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                 {INDIAN_LANGUAGES.slice(0, 6).map(lang => (
                   <button 
                     key={lang}
                     onClick={() => setLanguage(lang)}
                     className={`px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${language === lang ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}
                   >
                     {lang}
                   </button>
                 ))}
               </div>
             </div>

             <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
               <h3 className="text-sm font-black text-slate-700 flex items-center space-x-2 mb-4">
                 <UserCircleIcon className="w-4 h-4 text-indigo-600" />
                 <span>2. Specialist</span>
               </h3>
               <div className="grid grid-cols-2 gap-3">
                 {(Object.keys(personas) as Persona[]).map((name) => (
                   <button 
                     key={name}
                     onClick={() => setPersona(name)}
                     className={`relative rounded-2xl overflow-hidden border-2 transition-all ${persona === name ? 'border-indigo-600 ring-4 ring-indigo-100' : 'border-slate-50'}`}
                   >
                     <img src={personas[name].img} alt={name} className="w-full h-20 object-cover" />
                     <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                        <span className="text-white font-black text-[9px] uppercase">{name}</span>
                     </div>
                   </button>
                 ))}
               </div>
             </div>
           </div>
        </div>
      )}

      <div className="relative w-full max-w-5xl aspect-square sm:aspect-video bg-slate-900 rounded-[2.5rem] sm:rounded-[4rem] shadow-2xl overflow-hidden border-[6px] sm:border-[12px] border-white group">
        <img 
          src={personas[persona].img} 
          alt="Doc" 
          className={`w-full h-full object-cover transition-all duration-1000 ${isActive ? 'scale-105' : 'brightness-50'}`}
        />
        
        {/* HUD UI - Responsive stacking */}
        <div className="absolute inset-x-6 sm:inset-x-12 top-6 sm:top-12 flex flex-col space-y-3 items-start pointer-events-none">
          <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white text-[9px] font-black uppercase tracking-widest">
            {language} Mode
          </div>
          {chatOverlay.map((msg, i) => (
            <div 
              key={i} 
              className={`max-w-[85%] sm:max-w-[60%] p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] backdrop-blur-xl border border-white/10 ${
                msg.sender.includes('Doc') ? 'bg-blue-600/20 text-white' : 'bg-white/10 text-slate-100'
              }`}
            >
              <p className="text-[10px] sm:text-lg font-medium leading-relaxed">"{msg.text}"</p>
            </div>
          ))}
        </div>

        {isActive && (
          <div className="absolute bottom-8 inset-x-0 flex items-end justify-center space-x-1 h-12 px-10">
            {visualizerData.map((val, i) => (
              <div 
                key={i} 
                className="bg-blue-400/80 rounded-full w-1 transition-all duration-75"
                style={{ height: `${val}%` }}
              ></div>
            ))}
          </div>
        )}

        {!isActive && !isConnecting && (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <button 
              onClick={startSession}
              className="bg-white/95 p-6 sm:p-10 rounded-[2rem] sm:rounded-[4rem] shadow-2xl text-center active:scale-95 transition-all w-full sm:w-auto"
            >
              <VideoCameraIcon className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl sm:text-3xl font-black text-slate-800">Start Checkup</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">MedEcho AI Ready</p>
            </button>
          </div>
        )}

        {isConnecting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md text-white p-6 text-center">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-xs font-black uppercase mt-6 tracking-widest">Connecting Session...</p>
          </div>
        )}
      </div>

      {isActive && (
        <button 
          onClick={endSession}
          className="mt-8 bg-rose-500 text-white font-black py-4 px-10 rounded-[2rem] flex items-center space-x-3 shadow-xl active:scale-95 transition-all"
        >
          <StopIcon className="w-6 h-6" />
          <span className="uppercase tracking-widest text-xs">Finish & Analyze</span>
        </button>
      )}

      <div className="mt-8 max-w-2xl w-full bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start space-x-3">
        <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <p className="text-[10px] font-bold text-blue-800 leading-tight uppercase">
          ACADEMIC PROJECT: Clinical entities are AI-extracted. Call 102/108 for emergencies.
        </p>
      </div>
    </div>
  );
};

export default VirtualDoctor;
