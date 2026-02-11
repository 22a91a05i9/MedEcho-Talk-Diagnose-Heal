
import React, { useState } from 'react';
import { User, Appointment, MedicalReport } from '../types';
import HospitalLocator from './HospitalLocator';
import ReportDetailModal from './ReportDetailModal';
import { 
  HeartIcon, 
  ScaleIcon, 
  FireIcon, 
  UserCircleIcon,
  VideoCameraIcon,
  PhoneIcon,
  XMarkIcon,
  ArrowRightCircleIcon
} from '@heroicons/react/24/solid';

interface PatientDashboardProps {
  user: User;
  appointments: Appointment[];
  reports: MedicalReport[];
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({ user, appointments, reports }) => {
  const [activeCall, setActiveCall] = useState<string | null>(null);
  const [viewingReport, setViewingReport] = useState<MedicalReport | null>(null);
  const upcoming = appointments.filter(a => a.status === 'PENDING').slice(0, 2);
  const latestReport = reports[0];

  return (
    <div className="p-4 sm:p-10 space-y-8 sm:space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">
            Hi, <span className="text-blue-600">{user.name.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic text-sm">Welcome to your clinical dashboard.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100">
          <div className="p-2 bg-blue-500 rounded-xl text-white">
            <UserCircleIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">PATIENT ID</p>
            <span className="font-black text-slate-700 text-xs">{user.id.toUpperCase()}</span>
          </div>
        </div>
      </header>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
        {[
          { icon: HeartIcon, label: 'BPM', value: '72', color: 'bg-rose-500', sub: 'Optimal Range' },
          { icon: ScaleIcon, label: 'Weight', value: '72kg', color: 'bg-blue-500', sub: 'Last: Oct 20' },
          { icon: FireIcon, label: 'Glucose', value: '95', color: 'bg-amber-400', sub: 'Stable' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-50 flex items-center justify-between group hover:shadow-xl hover:-translate-y-1 transition-all">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-800">{stat.value}</span>
                <span className="text-[9px] font-bold text-emerald-500 uppercase">{stat.sub}</span>
              </div>
            </div>
            <div className={`p-4 sm:p-5 rounded-3xl ${stat.color} text-white shadow-lg`}>
              <stat.icon className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
        <section className="bg-slate-900 rounded-[2.5rem] sm:rounded-[3rem] p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">Active Visits</h2>
              <span className="text-[9px] font-black bg-white/10 px-3 py-1 rounded-full text-blue-300 uppercase tracking-widest">Real-time</span>
            </div>
            <div className="space-y-4">
              {upcoming.length > 0 ? upcoming.map(apt => (
                <div key={apt.id} className="bg-white/5 border border-white/10 p-4 sm:p-6 rounded-[2rem] flex items-center justify-between group hover:bg-white/10 transition-colors">
                  <div className="flex items-center space-x-4 sm:space-x-5">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-white">
                      <VideoCameraIcon className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <div>
                      <p className="font-black text-sm sm:text-lg">{apt.doctorName}</p>
                      <p className="text-[10px] sm:text-xs text-white/40 font-bold uppercase tracking-widest">{apt.date} • {apt.time}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveCall(apt.doctorName)}
                    className="p-3.5 sm:p-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl sm:rounded-2xl shadow-lg transition-transform active:scale-95"
                  >
                    <PhoneIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              )) : (
                <div className="text-center py-10 text-white/20 font-black uppercase tracking-widest text-[10px]">No appointments booked</div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] shadow-sm border border-slate-50 flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 uppercase tracking-tight">Latest Report</h2>
          </div>
          {latestReport ? (
            <button 
              onClick={() => setViewingReport(latestReport)}
              className="flex-1 bg-slate-50 p-6 sm:p-8 rounded-[2rem] border border-slate-100 flex flex-col justify-between hover:bg-blue-50 hover:border-blue-100 transition-all text-left group"
            >
              <div>
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-100/50 px-3 py-1 rounded-full border border-blue-200">{latestReport.diagnosis}</span>
                <p className="text-base sm:text-lg font-bold text-slate-800 mt-6 leading-relaxed">"{latestReport.summary.substring(0, 100)}..."</p>
                <div className="mt-4 flex items-center space-x-2 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-black uppercase tracking-widest">See Full Details</span>
                  <ArrowRightCircleIcon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-200">
                <span className="text-[11px] font-black text-slate-700 uppercase">{latestReport.doctorName}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{latestReport.date}</span>
              </div>
            </button>
          ) : <div className="text-center py-20 text-slate-300 font-black uppercase text-[10px] tracking-widest">No reports archived</div>}
        </section>
      </div>

      <HospitalLocator />

      {/* Video Modal */}
      {activeCall && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-10 animate-in fade-in duration-500">
          <div className="relative w-full h-full max-w-5xl bg-black rounded-[2rem] sm:rounded-[4rem] shadow-2xl overflow-hidden border-[8px] sm:border-[16px] border-slate-800">
            <img 
              src={`https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=1200&auto=format&fit=crop`} 
              className="w-full h-full object-cover opacity-60" 
              alt="Consultation" 
            />
            <div className="absolute top-6 right-6 sm:top-10 sm:right-10 w-24 sm:w-48 aspect-video bg-slate-800 rounded-xl border-2 sm:border-4 border-white shadow-2xl overflow-hidden">
               <div className="w-full h-full flex items-center justify-center text-[10px] text-white font-black uppercase opacity-20">Preview</div>
            </div>
            <div className="absolute top-6 left-6 sm:top-10 sm:left-10 text-white space-y-1 sm:space-y-2">
              <h4 className="text-xl sm:text-4xl font-black uppercase tracking-tight truncate max-w-[200px] sm:max-w-none">{activeCall}</h4>
              <p className="text-[10px] sm:text-sm font-bold bg-blue-600/50 px-3 py-1 rounded-lg w-fit uppercase tracking-widest">Clinical Session • Live</p>
            </div>
            <div className="absolute bottom-8 sm:bottom-12 inset-x-0 flex justify-center space-x-6 sm:space-x-8 px-6">
               <button onClick={() => setActiveCall(null)} className="flex-1 sm:flex-none p-5 sm:p-8 bg-rose-600 text-white rounded-full sm:rounded-[2.5rem] shadow-2xl flex items-center justify-center space-x-3 sm:px-14 active:scale-95 transition-transform">
                 <XMarkIcon className="w-6 h-6 sm:w-8 sm:h-8" />
                 <span className="hidden sm:inline font-black uppercase tracking-widest text-sm">Disconnect</span>
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {viewingReport && (
        <ReportDetailModal 
          report={viewingReport} 
          onClose={() => setViewingReport(null)} 
        />
      )}
    </div>
  );
};

export default PatientDashboard;
