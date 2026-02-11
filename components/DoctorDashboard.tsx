
import React, { useState } from 'react';
import { User, Appointment, MedicalReport } from '../types';
import AIChatAssistant from './AIChatAssistant';
import ReportDetailModal from './ReportDetailModal';
import { 
  UsersIcon, 
  CalendarDaysIcon, 
  VideoCameraIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
  XMarkIcon,
  SignalIcon,
  BoltIcon,
  ShieldCheckIcon,
  TrashIcon,
  ChevronRightIcon
} from '@heroicons/react/24/solid';

interface DoctorDashboardProps {
  doctor: User;
  appointments: Appointment[];
  reports: MedicalReport[]; // Added missing prop
  onUpdateUser: (updatedUser: User) => void;
  onUpdateAppointment: (updatedApt: Appointment) => void;
  onDeleteAppointment: (id: string) => void;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ 
  doctor, 
  appointments, 
  reports,
  onUpdateUser,
  onUpdateAppointment,
  onDeleteAppointment
}) => {
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);

  const doctorAppointments = appointments.filter(a => a.doctorId === doctor.id);
  const pendingApts = doctorAppointments.filter(a => a.status === 'PENDING');
  
  const stats = [
    { label: 'Pending Visits', value: pendingApts.length.toString(), icon: ClockIcon, color: 'bg-indigo-500' },
    { label: 'Patient Count', value: '24', icon: UsersIcon, color: 'bg-slate-800' },
    { label: 'Finished', value: doctorAppointments.filter(a => a.status === 'COMPLETED').length.toString(), icon: CheckCircleIcon, color: 'bg-emerald-500' },
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
    <div className="relative min-h-screen p-4 sm:p-10 space-y-8 sm:space-y-12 animate-in fade-in duration-500">
      {/* Doctor Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-sm border border-slate-50">
        <div className="flex items-center space-x-4 sm:space-x-6">
          <div className="relative flex-shrink-0">
            <img src={doctor.avatar} className="w-16 h-16 sm:w-24 sm:h-24 rounded-[1.5rem] sm:rounded-[2rem] object-cover border-4 border-slate-50 shadow-sm" alt={doctor.name} />
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white ${doctor.isAvailable ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight truncate">{doctor.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-2">
              <span className="bg-indigo-50 text-indigo-600 text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-full uppercase truncate max-w-[120px]">{doctor.specialization}</span>
              <span className="text-slate-400 text-[10px] font-bold">ID: {doctor.id.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="flex-1 lg:flex-none flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
             <button 
              onClick={() => toggleAvailability(true)}
              className={`flex-1 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${doctor.isAvailable ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
             >
               Online
             </button>
             <button 
              onClick={() => toggleAvailability(false)}
              className={`flex-1 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${!doctor.isAvailable ? 'bg-white text-slate-600 shadow-sm' : 'text-slate-400'}`}
             >
               Away
             </button>
          </div>
          
          <button 
            onClick={() => setAiPanelOpen(true)}
            className="p-3 sm:px-8 sm:py-4 bg-indigo-600 text-white rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg active:scale-95 hover:bg-indigo-700 transition-all"
          >
            <SparklesIcon className="w-5 h-5" />
            <span className="hidden sm:inline-block font-black text-[10px] uppercase ml-3">AI Support</span>
          </button>
        </div>
      </header>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-50 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tighter">{stat.value}</p>
            </div>
            <div className={`${stat.color} p-4 sm:p-5 rounded-3xl text-white shadow-lg`}>
              <stat.icon className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
        <div className="lg:col-span-2 bg-white rounded-[2rem] sm:rounded-[3.5rem] shadow-sm border border-slate-50 overflow-hidden">
          <div className="p-6 sm:p-10 border-b flex justify-between items-center bg-indigo-50/10">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 uppercase tracking-tight">Active Queue</h2>
            </div>
            <SignalIcon className={`w-5 h-5 ${doctor.isAvailable ? 'text-emerald-500 animate-pulse' : 'text-slate-300'}`} />
          </div>
          
          <div className="p-4 sm:p-6 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
            {pendingApts.length > 0 ? pendingApts.map(apt => (
              <div key={apt.id} className="p-5 sm:p-6 bg-slate-50/50 border border-slate-100 rounded-[2rem] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4 sm:space-x-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center font-black text-indigo-600 border border-indigo-50 flex-shrink-0">
                    {apt.patientName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-800 text-base sm:text-lg truncate">{apt.patientName}</p>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-1">
                       <span className="font-bold">{apt.time}</span>
                       <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600 font-black uppercase text-[8px]">{apt.type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 w-full sm:w-auto">
                  <button 
                    onClick={() => handleStartCall(apt.patientName)}
                    className="flex-1 sm:flex-none p-3.5 bg-indigo-600 text-white rounded-xl shadow-md"
                  >
                    <VideoCameraIcon className="w-5 h-5 mx-auto" />
                  </button>
                  <button 
                    onClick={() => handleStatusChange(apt, 'COMPLETED')}
                    className="flex-1 sm:flex-none p-3.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl"
                  >
                    <CheckCircleIcon className="w-5 h-5 mx-auto" />
                  </button>
                </div>
              </div>
            )) : (
              <div className="py-16 text-center text-slate-200">
                <CalendarDaysIcon className="w-12 h-12 mx-auto mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest">Your queue is empty</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-50 flex flex-col max-h-[600px]">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center">
            <BoltIcon className="w-4 h-4 text-amber-500 mr-2" />
            Patient Records
          </h3>
          <div className="space-y-3 overflow-y-auto custom-scrollbar pr-1">
            {reports.map(report => (
              <button 
                key={report.id} 
                onClick={() => setSelectedReport(report)}
                className="w-full p-4 rounded-2xl border border-slate-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left group"
              >
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <p className="font-black text-slate-800 text-sm truncate group-hover:text-indigo-600 transition-colors">{report.diagnosis}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{report.date}</p>
                  </div>
                  <ChevronRightIcon className="w-3 h-3 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                </div>
              </button>
            ))}
            {reports.length === 0 && (
              <div className="text-center py-10 text-slate-200 uppercase text-[9px] font-black">No recent records</div>
            )}
          </div>
        </div>
      </div>

      {/* Side Panel Overlay */}
      {aiPanelOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[490]"
          onClick={() => setAiPanelOpen(false)}
        ></div>
      )}

      {/* Responsive Side Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[500px] lg:w-[600px] bg-white shadow-2xl z-[500] transform transition-transform duration-500 ease-in-out border-l border-slate-100 flex flex-col ${
          aiPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="w-6 h-6 text-indigo-400" />
            <h2 className="text-lg font-black tracking-tight uppercase">AI Clinical Research</h2>
          </div>
          <button onClick={() => setAiPanelOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <AIChatAssistant isModal />
        </div>
      </div>

      {/* Detail Modal */}
      {selectedReport && (
        <ReportDetailModal 
          report={selectedReport} 
          onClose={() => setSelectedReport(null)} 
        />
      )}
    </div>
  );
};

export default DoctorDashboard;
