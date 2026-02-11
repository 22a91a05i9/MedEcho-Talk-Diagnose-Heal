
import React, { useState } from 'react';
import { User, Appointment, MedicalReport } from '../types';
import HospitalLocator from './HospitalLocator';
import { 
  HeartIcon, 
  ScaleIcon, 
  FireIcon, 
  UserCircleIcon,
  VideoCameraIcon,
  ClockIcon,
  ArrowUpRightIcon,
  PhoneIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';

interface PatientDashboardProps {
  user: User;
  appointments: Appointment[];
  reports: MedicalReport[];
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({ user, appointments, reports }) => {
  const [activeCall, setActiveCall] = useState<string | null>(null);
  const upcoming = appointments.filter(a => a.status === 'PENDING').slice(0, 2);
  const latestReport = reports[0];

  return (
    <div className="p-8 space-y-10 animate-in fade-in slide-in-from-top-4 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative">
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
            Hello, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">{user.name}</span>
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic tracking-wide">"Your health journey is our priority."</p>
        </div>
        <div className="flex items-center space-x-3 bg-white/60 backdrop-blur-lg px-6 py-3 rounded-2xl shadow-xl border border-white/50 group">
          <div className="p-2 bg-blue-500 rounded-xl text-white">
            <UserCircleIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Patient ID</p>
            <span className="font-bold text-slate-700">{user.id.toUpperCase()}</span>
          </div>
        </div>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: HeartIcon, label: 'BPM', value: '72', color: 'from-rose-500 to-pink-500', sub: 'Average' },
          { icon: ScaleIcon, label: 'Weight', value: '72kg', color: 'from-blue-500 to-indigo-600', sub: 'Stable' },
          { icon: FireIcon, label: 'Glucose', value: '95', color: 'from-amber-400 to-orange-500', sub: 'Optimal' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 flex items-center justify-between group hover:-translate-y-2 transition-all duration-300">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <div className="flex items-baseline space-x-1">
                <span className="text-4xl font-black text-slate-800">{stat.value}</span>
                <span className="text-xs font-bold text-emerald-500">{stat.sub}</span>
              </div>
            </div>
            <div className={`p-5 rounded-3xl bg-gradient-to-br ${stat.color} text-white shadow-2xl group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-7 h-7" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Real Appointments & "Direct Call" Feature */}
        <section className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] -mr-40 -mt-40"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black uppercase tracking-tight">Appointments</h2>
              <span className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-full text-blue-300 uppercase tracking-widest">Live Connect</span>
            </div>
            <div className="space-y-6">
              {upcoming.map(apt => (
                <div key={apt.id} className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] flex items-center justify-between hover:bg-white/10 transition-all">
                  <div className="flex items-center space-x-5">
                    <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <VideoCameraIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="font-black text-lg">{apt.doctorName}</p>
                      <p className="text-sm text-white/40">{apt.date} at {apt.time}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveCall(apt.doctorName)}
                    className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-900/40 transition-all active:scale-95"
                  >
                    <PhoneIcon className="w-4 h-4" />
                    <span>Join Room</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Health Insights */}
        <section className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-50 flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Recent Records</h2>
            <button className="text-blue-600 font-black text-[10px] uppercase tracking-widest hover:underline">View Folder</button>
          </div>
          {latestReport ? (
            <div className="flex-1 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">{latestReport.diagnosis}</span>
                <p className="text-lg font-black text-slate-800 mt-4 leading-snug">{latestReport.summary.substring(0, 120)}...</p>
                <div className="flex flex-wrap gap-2 mt-6">
                  {latestReport.prescription.map((p, i) => (
                    <span key={i} className="bg-white px-4 py-2 rounded-xl text-[10px] font-black border border-slate-200 text-slate-600 shadow-sm uppercase tracking-tighter">{p}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between mt-10 pt-8 border-t border-slate-200/60">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-black text-blue-600">S</div>
                  <span className="text-sm font-black text-slate-700">{latestReport.doctorName}</span>
                </div>
                <span className="text-xs font-bold text-slate-400">{latestReport.date}</span>
              </div>
            </div>
          ) : <div className="text-center py-20 text-slate-300 italic">No records found.</div>}
        </section>
      </div>

      <HospitalLocator />

      {/* Realistic Doctor Video Call Simulation Overlay */}
      {activeCall && (
        <div className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center animate-in fade-in duration-500">
          <div className="relative w-full h-full max-w-5xl aspect-video bg-black rounded-[4rem] shadow-2xl border-[16px] border-slate-800 overflow-hidden m-10">
            <img 
              src={`https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=1200&auto=format&fit=crop`} 
              className="w-full h-full object-cover brightness-110" 
              alt="Doctor" 
            />
            {/* Self View */}
            <div className="absolute top-10 right-10 w-48 aspect-video bg-slate-800 rounded-2xl border-4 border-white shadow-2xl overflow-hidden">
               <div className="w-full h-full flex items-center justify-center text-white font-black text-[10px] uppercase tracking-widest">Your Feed</div>
            </div>
            {/* HUD */}
            <div className="absolute top-10 left-10 text-white space-y-2">
              <h4 className="text-3xl font-black drop-shadow-lg">{activeCall}</h4>
              <p className="text-sm font-bold bg-blue-600/50 backdrop-blur px-3 py-1 rounded-lg w-fit">Live Consultation</p>
            </div>
            {/* Controls */}
            <div className="absolute bottom-12 inset-x-0 flex justify-center space-x-8">
               <button className="p-6 bg-slate-800/80 backdrop-blur-xl text-white rounded-full hover:bg-slate-700 transition-all border border-white/10"><PhoneIcon className="w-8 h-8 rotate-90" /></button>
               <button onClick={() => setActiveCall(null)} className="p-8 bg-rose-600 text-white rounded-[2.5rem] hover:bg-rose-700 transition-all shadow-2xl shadow-rose-900/60 flex items-center space-x-3 px-12">
                 <XMarkIcon className="w-8 h-8" />
                 <span className="font-black uppercase tracking-widest">End Session</span>
               </button>
               <button className="p-6 bg-slate-800/80 backdrop-blur-xl text-white rounded-full hover:bg-slate-700 transition-all border border-white/10"><VideoCameraIcon className="w-8 h-8" /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
