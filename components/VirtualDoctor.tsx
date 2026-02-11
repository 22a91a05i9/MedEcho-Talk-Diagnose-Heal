import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { MedicalReport } from '../types';
import { analyzeSymptoms } from '../services/geminiService';
import { 
  StopIcon, 
  VideoCameraIcon, 
  CheckIcon,
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
  const [visualizerData, setVisualizerData] = useState<number[]>(Array(30).fill(10));
  const [persona, setPersona] = useState<Persona>('Sarah');
  const [language, setLanguage] = useState("Hindi");
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const transcriptionRef = useRef<string>("");

  const personas = {
    Sarah: { img: "https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=1200", voice: "Puck", desc: "Empathetic Female" },
    James: { img: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=1200&auto=format&fit=crop", voice: "Kore", desc: "Professional Male" },
    Elena: { img: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=1200&auto=format&fit=crop", voice: "Zephyr", desc: "Clear Alt-Female" },
    Marcus: { img: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=1200&auto=format&fit=crop", voice: "Charon", desc: "Deep Resonant Male" }
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
              setVisualizerData(prev => [...prev.slice(1), 10 + avg * 600]);
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
              setChatOverlay(prev => [...prev.slice(-2), { sender: 'Dr. Echo', text }]);
            }
            if (msg.serverContent?.inputTranscription) {
              setChatOverlay(prev => [...prev.slice(-2), { sender: 'You', text: msg.serverContent!.inputTranscription!.text }]);
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
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: personas[persona].voice as any } } },
          systemInstruction: `You are Dr. Echo, the MedEcho AI. 
          The patient preferred language is ${language}. 
          Always greet and speak in ${language} or the patient's language. 
          Your goal: Extract symptoms, be empathetic, and provide a preliminary diagnosis. 
          Use common terms suitable for rural healthcare users.`,
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

    // Academic Project: Perform automated NLP diagnosis extraction
    const analysis = await analyzeSymptoms(transcriptionRef.current);

    const newReport: MedicalReport = {
      id: 'r-' + Math.random().toString(36).substr(2, 9),
      patientId: patientId,
      doctorId: 'ai-assistant', 
      date: new Date().toISOString().split('T')[0],
      doctorName: `AI-Assistant (${persona})`,
      diagnosis: analysis?.condition || 'General Assessment',
      aiConfidence: analysis?.confidence || 75,
      inputLanguage: language,
      summary: analysis?.advice || transcriptionRef.current || 'Session completed.',
      prescription: ['Follow up with clinical staff', 'Observation'],
      vitals: { temperature: '98.6F' }
    };
    onSessionComplete(newReport);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] p-6 md:p-12 max-w-7xl mx-auto flex flex-col items-center">
      
      {!isActive && !isConnecting && (
        <div className="w-full max-w-5xl space-y-10 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
           <div className="text-center">
             <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-2">MedEcho Virtual Clinic</h2>
             <p className="text-slate-500 font-medium">Talk to our AI specialist in your local language.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
             <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 space-y-6">
               <h3 className="text-lg font-black text-slate-700 flex items-center space-x-2">
                 <GlobeAltIcon className="w-5 h-5 text-blue-600" />
                 <span>1. Select Language</span>
               </h3>
               <div className="grid grid-cols-2 gap-2">
                 {INDIAN_LANGUAGES.map(lang => (
                   <button 
                     key={lang}
                     onClick={() => setLanguage(lang)}
                     className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${language === lang ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                   >
                     {lang}
                   </button>
                 ))}
               </div>
             </div>

             <div className="space-y-4">
               <h3 className="text-lg font-black text-slate-700 ml-4 flex items-center space-x-2">
                 <UserCircleIcon className="w-5 h-5 text-indigo-600" />
                 <span>2. Choose AI Persona</span>
               </h3>
               <div className="grid grid-cols-2 gap-4">
                 {(Object.keys(personas) as Persona[]).map((name) => (
                   <button 
                     key={name}
                     onClick={() => setPersona(name)}
                     className={`group relative overflow-hidden rounded-3xl border-4 transition-all ${persona === name ? 'border-indigo-600 ring-8 ring-indigo-500/10 scale-105' : 'border-white hover:border-slate-200'}`}
                   >
                     <img src={personas[name].img} alt={name} className={`w-full h-32 object-cover ${persona === name ? 'brightness-110' : 'brightness-75'}`} />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 flex flex-col justify-end p-3 text-left">
                        <p className="text-white font-black text-[10px]">{name}</p>
                     </div>
                   </button>
                 ))}
               </div>
             </div>
           </div>
        </div>
      )}

      <div className="relative w-full aspect-video bg-slate-900 rounded-[4rem] shadow-2xl overflow-hidden border-[12px] border-white group">
        <img 
          src={personas[persona].img} 
          alt="Virtual Doctor" 
          className={`w-full h-full object-cover transition-all duration-1000 ${isActive ? 'scale-105 brightness-110' : 'scale-100 brightness-50'}`}
        />
        
        {/* HUD UI */}
        <div className="absolute inset-x-12 top-12 flex flex-col space-y-4 items-start pointer-events-none">
          <div className="bg-black/40 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 text-white flex items-center space-x-2">
            <GlobeAltIcon className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Input: {language}</span>
          </div>
          {chatOverlay.map((msg, i) => (
            <div 
              key={i} 
              className={`max-w-[70%] p-6 rounded-[2.5rem] shadow-2xl backdrop-blur-2xl border border-white/10 animate-in slide-in-from-left-4 duration-300 ${
                msg.sender.includes('Echo') 
                ? 'bg-blue-600/30 text-white border-blue-400/20' 
                : 'bg-white/10 text-slate-200 self-end border-white/5'
              }`}
            >
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">{msg.sender}</p>
              <p className="text-lg font-medium leading-relaxed italic">"{msg.text}"</p>
            </div>
          ))}
        </div>

        {isActive && (
          <div className="absolute bottom-10 inset-x-0 flex items-end justify-center space-x-1 h-20 px-24">
            {visualizerData.map((val, i) => (
              <div 
                key={i} 
                className="bg-blue-400/80 rounded-full w-1.5 transition-all duration-75 shadow-[0_0_20px_rgba(96,165,250,0.6)]"
                style={{ height: `${val}%` }}
              ></div>
            ))}
          </div>
        )}

        {!isActive && !isConnecting && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button 
              onClick={startSession}
              className="bg-white/95 backdrop-blur-xl p-10 rounded-[4rem] shadow-2xl text-center group hover:scale-105 transition-all"
            >
              <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto text-white shadow-2xl animate-pulse mb-6">
                <VideoCameraIcon className="w-12 h-12" />
              </div>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">Start Multilingual Checkup</h3>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">MedEcho AI Core Ready</p>
            </button>
          </div>
        )}

        {isConnecting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-xl text-white">
            <div className="w-20 h-20 border-[6px] border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-sm font-black uppercase mt-8 animate-pulse text-blue-200">Processing Audio Stream...</p>
          </div>
        )}
      </div>

      {isActive && (
        <div className="mt-12 flex space-x-6">
          <button 
            onClick={endSession}
            className="bg-rose-500 hover:bg-rose-600 text-white font-black py-5 px-14 rounded-[2.5rem] flex items-center space-x-4 shadow-xl hover:-translate-y-1 transition-all"
          >
            <StopIcon className="w-7 h-7" />
            <span className="uppercase tracking-widest text-sm">Analyze Symptoms</span>
          </button>
        </div>
      )}

      <div className="mt-12 max-w-2xl w-full bg-blue-50/50 p-6 rounded-[2.5rem] border border-blue-100 flex items-start space-x-4">
        <ExclamationTriangleIcon className="w-6 h-6 text-blue-600 flex-shrink-0" />
        <p className="text-[11px] font-bold text-blue-800 leading-relaxed uppercase">
          ACADEMIC PROJECT: This module uses Gemini AI to extract clinical entities in ${language}. For emergency, contact 102/108 immediately.
        </p>
      </div>
    </div>
  );
};

export default VirtualDoctor;