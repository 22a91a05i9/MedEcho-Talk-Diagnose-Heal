
import React, { useState } from 'react';
import { User, Appointment } from '../types';
import AIChatAssistant from './AIChatAssistant';
import { 
  UsersIcon, 
  CalendarDaysIcon, 
  DocumentChartBarIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
  XMarkIcon,
  SignalIcon,
  BoltIcon,
  ShieldCheckIcon,
  NoSymbolIcon,
  TrashIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/solid';

interface DoctorDashboardProps {
  doctor: User;
  appointments: Appointment[];
  onUpdateUser: (updatedUser: User) => void;
  onUpdateAppointment: (updatedApt: Appointment) => void;
  onDeleteAppointment: (id: string) => void;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ 
  doctor, 
  appointments, 
  onUpdateUser,
  onUpdateAppointment,
  onDeleteAppointment
}) => {
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiContext, setAiContext] = useState<string | undefined>(undefined);

  // Filter appointments for this doctor
  const doctorAppointments = appointments.filter(a => a.doctorId === doctor.id);
  const pendingApts = doctorAppointments.filter(a => a.status === 'PENDING');
  
  const stats = [
    { label: 'Today Queue', value: pendingApts.length.toString(), icon: ClockIcon, color: 'bg-indigo-500' },
    { label: 'Active Patients', value: '24', icon: UsersIcon, color: 'bg-slate-800' },
    { label: 'Completed', value: doctorAppointments.filter(a => a.status === 'COMPLETED').length.toString(), icon: CheckCircleIcon, color: 'bg-emerald-500' },
  ];

  const handleStartCall = (patientName: string) => {
    alert(`[SECURE LINE] Initiating clinical consultation with ${patientName}...`);
  };

  const toggleAvailability = (isAvailable: boolean) => {
    onUpdateUser({ ...doctor, isAvailable });
  };

  const handleStatusChange = (apt: Appointment, status: 'COMPLETED' | 'CANCELLED' | 'PENDING') => {
    onUpdateAppointment({ ...apt, status });
  };

  return (
    <div className="relative min-h-screen">
      <div className={`p-10 space-y-12 transition-all duration-500 ${aiPanelOpen ? 'pr-[450px] opacity-50 pointer-events-none lg:opacity-100 lg:pointer-events-auto' : ''}`}>
        {/* Doctor Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-50">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <img src={doctor.avatar} className="w-24 h-24 rounded-[2rem] object-cover border-4 border-slate-50 shadow-lg" alt={doctor.name} />
              <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center ${doctor.isAvailable ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                {doctor.isAvailable && <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>}
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-800 tracking-tighter">Welcome, {doctor.name}</h1>
              <div className="flex items-center space-x-3 mt-2">
                <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{doctor.specialization}</span>
                <span className="text-slate-400 text-xs font-bold">MedEcho ID: {doctor.id.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center bg-slate-50 p-2 rounded-3xl border border-slate-100">
               <button 
                onClick={() => toggleAvailability(true)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${doctor.isAvailable ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Available
               </button>
               <button 
                onClick={() => toggleAvailability(false)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${!doctor.isAvailable ? 'bg-white text-slate-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Offline
               </button>
            </div>
            
            <button 
              onClick={() => setAiPanelOpen(true)}
              className="bg-indigo-600 text-white px-8 py-4 rounded-3xl flex items-center space-x-3 shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
            >
              <SparklesIcon className="w-5 h-5" />
              <span className="font-black text-xs uppercase tracking-widest">Clinical AI</span>
            </button>
          </div>
        </header>

        {/* Grid Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-50 flex items-center justify-between group">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-4xl font-black text-slate-800 tracking-tighter">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-5 rounded-3xl text-white shadow-xl group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-8 h-8" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Active Consultations Queue */}
          <div className="lg:col-span-2 bg-white rounded-[3.5rem] shadow-2xl border border-slate-50 overflow-hidden">
            <div className="p-10 border-b flex justify-between items-center bg-indigo-50/20">
              <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Consultation Queue</h2>
                <p className="text-xs text-indigo-500 font-bold">Priority Patient List</p>
              </div>
              <div className="bg-white px-4 py-2 rounded-2xl border flex items-center space-x-2">
                 <SignalIcon className={`w-4 h-4 ${doctor.isAvailable ? 'text-emerald-500 animate-pulse' : 'text-slate-300'}`} />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Status: {doctor.isAvailable ? 'Receiving' : 'Standby'}</span>
              </div>
            </div>
            
            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
              {pendingApts.length > 0 ? pendingApts.map(apt => (
                <div key={apt.id} className="p-6 bg-slate-50/50 border border-slate-100 rounded-[2.5rem] flex items-center justify-between hover:bg-white hover:shadow-xl transition-all group">
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-white rounded-[1.8rem] shadow-sm flex items-center justify-center font-black text-indigo-600 border border-indigo-50">
                      {apt.patientName[0]}
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-xl">{apt.patientName}</p>
                      <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                         <span className="font-bold flex items-center"><ClockIcon className="w-3 h-3 mr-1" /> {apt.time}</span>
                         <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${apt.type === 'VIRTUAL' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-600'}`}>
                           {apt.type}
                         </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => handleStartCall(apt.patientName)}
                      className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg hover:shadow-indigo-500/40 transition-all active:scale-95"
                    >
                      <VideoCameraIcon className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => handleStatusChange(apt, 'COMPLETED')}
                      className="p-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all"
                      title="Complete Session"
                    >
                      <CheckCircleIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center">
                  <CalendarDaysIcon className="w-16 h-16 mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-400 font-bold uppercase text-xs">Queue is empty</p>
                </div>
              )}
            </div>
          </div>

          {/* Manage Appointments Section */}
          <div className="bg-white rounded-[3rem] p-8 shadow-2xl border border-slate-50 flex flex-col h-full">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-8 flex items-center">
              <BoltIcon className="w-5 h-5 text-amber-500 mr-2" />
              Manage All Visits
            </h3>
            
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[480px] pr-2 custom-scrollbar">
              {doctorAppointments.map(apt => (
                <div key={apt.id} className={`p-5 rounded-3xl border-2 transition-all ${apt.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-100 opacity-60' : apt.status === 'CANCELLED' ? 'bg-rose-50 border-rose-100 opacity-60' : 'bg-white border-slate-50 shadow-sm'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-black text-slate-800 text-sm">{apt.patientName}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{apt.date} • {apt.time}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${apt.status === 'COMPLETED' ? 'text-emerald-600' : apt.status === 'CANCELLED' ? 'text-rose-600' : 'text-amber-600 bg-amber-50'}`}>
                      {apt.status}
                    </div>
                  </div>
                  
                  {apt.status === 'PENDING' && (
                    <div className="flex space-x-2 mt-4">
                      <button 
                        onClick={() => handleStatusChange(apt, 'COMPLETED')}
                        className="flex-1 py-2 bg-emerald-600 text-white text-[10px] font-black rounded-xl hover:bg-emerald-700 transition-all uppercase tracking-widest"
                      >
                        Complete
                      </button>
                      <button 
                        onClick={() => handleStatusChange(apt, 'CANCELLED')}
                        className="flex-1 py-2 bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-black rounded-xl hover:bg-rose-600 hover:text-white transition-all uppercase tracking-widest"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => onDeleteAppointment(apt.id)}
                        className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {apt.status !== 'PENDING' && (
                    <button 
                      onClick={() => handleStatusChange(apt, 'PENDING')}
                      className="w-full mt-2 py-2 text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors"
                    >
                      Re-open
                    </button>
                  )}
                </div>
              ))}
              {doctorAppointments.length === 0 && (
                <div className="py-20 text-center text-slate-200">
                  <NoSymbolIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No history recorded</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SIDE-OVER CLINICAL AI DRAWER */}
      <div 
        className={`fixed top-0 right-0 h-full w-full md:w-[600px] bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.1)] z-[500] transform transition-transform duration-500 ease-in-out border-l border-slate-100 flex flex-col ${
          aiPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl">
              <ShieldCheckIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight uppercase leading-none">AI Research Console</h2>
              <p className="text-indigo-300 text-[9px] font-black uppercase tracking-widest mt-1">Authorized Specialist Access Only</p>
            </div>
          </div>
          <button 
            onClick={() => setAiPanelOpen(false)} 
            className="p-3 hover:bg-white/10 rounded-full transition-all group"
          >
            <XMarkIcon className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <AIChatAssistant isModal initialContext={aiContext} />
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Session Encrypted & Logged • Patient Privacy Protected
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
