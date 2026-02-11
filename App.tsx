
import React, { useState, useEffect, useCallback } from 'react';
import { User, Appointment, MedicalReport, BlockedSlot, DaySchedule, TimeSlot, AppNotification } from './types';
import { dbService } from './services/dbService';
import Sidebar from './components/Sidebar';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import AppointmentBooking from './components/AppointmentBooking';
import ReportsList from './components/ReportsList';
import AIChatAssistant from './components/AIChatAssistant';
import VirtualDoctor from './components/VirtualDoctor';
import FloatingAIChat from './components/FloatingAIChat';
import { 
  UserIcon, 
  BriefcaseIcon, 
  ShieldCheckIcon, 
  ClockIcon, 
  NoSymbolIcon, 
  PlusIcon,
  TrashIcon,
  BoltIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  XMarkIcon,
  DocumentDuplicateIcon,
  ExclamationCircleIcon,
  BellIcon,
  CheckIcon,
  Bars3Icon
} from '@heroicons/react/24/solid';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authRole, setAuthRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const generateReminders = useCallback((user: User, apts: Appointment[]) => {
    const today = new Date();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    
    const newNotifications: AppNotification[] = [];
    apts.forEach(apt => {
      if (apt.status !== 'PENDING') return;
      const aptDate = new Date(apt.date);
      const timeDiff = aptDate.getTime() - today.getTime();
      
      if (timeDiff > 0 && timeDiff <= oneDayInMs) {
        newNotifications.push({
          id: `reminder-${apt.id}`,
          userId: user.id,
          title: 'Appointment Reminder',
          message: `Your visit with ${user.role === 'DOCTOR' ? apt.patientName : apt.doctorName} is tomorrow at ${apt.time}.`,
          type: 'REMINDER',
          timestamp: new Date(),
          isRead: false,
          appointmentId: apt.id
        });
      }
    });

    setNotifications(prev => {
      const existingIds = new Set(prev.map(n => n.id));
      const uniqueNew = newNotifications.filter(n => !existingIds.has(n.id));
      return [...uniqueNew, ...prev];
    });
  }, []);

  useEffect(() => {
    dbService.init();
    const currentUser = dbService.auth.getCurrentUser();
    if (currentUser) setUser(currentUser);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const [apts, reps] = await Promise.all([
          dbService.appointments.getAll(),
          dbService.reports.getAll()
        ]);
        
        if (user.role === 'DOCTOR') {
          setAppointments(apts.filter(a => a.doctorId === user.id));
          // For doctors, we might show all patient reports they've generated
          setReports(reps.filter(r => r.doctorId === user.id));
        } else {
          setAppointments(apts.filter(a => a.patientId === user.id));
          setReports(reps.filter(r => r.patientId === user.id));
        }
        generateReminders(user, apts);
      };
      fetchData();
    }
  }, [user, generateReminders]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (authMode === 'LOGIN') {
        const loggedUser = await dbService.auth.login(formData.email);
        if (loggedUser.role !== authRole) throw new Error(`Role mismatch. Use ${loggedUser.role} portal.`);
        setUser(loggedUser);
      } else {
        const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          name: formData.name,
          email: formData.email,
          role: authRole,
          avatar: `https://picsum.photos/200?random=${Math.random()}`,
          isAvailable: true,
          daySchedules: Array.from({length: 7}, (_, i) => ({ dayIndex: i, slots: [{ startTime: '09:00', endTime: '17:00' }], isActive: i >= 1 && i <= 5 })),
          blockedSlots: []
        };
        const registered = await dbService.auth.register(newUser);
        setUser(registered);
      }
      setActiveTab('dashboard');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    dbService.auth.logout();
    setUser(null);
    setNotifications([]);
    setActiveTab('dashboard');
    setIsSidebarOpen(false);
  };

  if (loading) return null;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center auth-gradient p-4 sm:p-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-500/10 blur-[150px] rounded-full"></div>
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center z-10">
          <div className="hidden lg:flex flex-col space-y-6">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl transform rotate-6">
                <span className="text-4xl font-black text-blue-600">ME</span>
              </div>
              <h1 className="text-6xl font-black text-white tracking-tighter">MedEcho</h1>
            </div>
            <p className="text-slate-400 text-2xl font-medium max-w-lg leading-relaxed">
              Precision health infrastructure. Automated triage, real-time reporting, and intelligent patient tracking.
            </p>
          </div>

          <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden w-full max-w-lg mx-auto">
            <div className="p-1 flex border-b bg-slate-50">
              <button 
                onClick={() => setAuthRole('PATIENT')}
                className={`flex-1 py-5 flex flex-col items-center space-y-2 transition-all ${authRole === 'PATIENT' ? 'bg-white border-b-4 border-blue-600' : 'opacity-40 hover:opacity-100'}`}
              >
                <UserIcon className={`w-6 h-6 ${authRole === 'PATIENT' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">Patient Portal</span>
              </button>
              <button 
                onClick={() => setAuthRole('DOCTOR')}
                className={`flex-1 py-5 flex flex-col items-center space-y-2 transition-all ${authRole === 'DOCTOR' ? 'bg-white border-b-4 border-indigo-600' : 'opacity-40 hover:opacity-100'}`}
              >
                <BriefcaseIcon className={`w-6 h-6 ${authRole === 'DOCTOR' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">Clinical Staff</span>
              </button>
            </div>

            <div className="p-8 sm:p-14 space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">
                  {authMode === 'LOGIN' ? 'Secure Access' : 'Create Credentials'}
                </h2>
              </div>
              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'REGISTER' && (
                  <input required type="text" placeholder="Legal Full Name" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}/>
                )}
                <input required type="email" placeholder="Email Address" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}/>
                <input required type="password" placeholder="Account Password" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}/>
                <button type="submit" disabled={authLoading} className={`w-full py-5 rounded-2xl text-white font-black uppercase text-xs shadow-xl tracking-widest ${authRole === 'PATIENT' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                  {authLoading ? 'Verifying...' : (authMode === 'LOGIN' ? 'Sign In' : 'Register')}
                </button>
              </form>
              <button onClick={() => setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN')} className="w-full text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-blue-600">
                {authMode === 'LOGIN' ? "Join MedEcho? Register" : "Already have access? Login"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-inter relative">
      {/* Mobile Drawer Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Responsive Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out z-[60] lg:z-30 h-full`}>
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={handleLogout} 
          role={user.role} 
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      <main className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col h-full">
        {/* Responsive Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-6 sm:px-10 py-5 sm:py-6 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
           <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Bars3Icon className="w-6 h-6" />
              </button>
              <h1 className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-slate-800">{activeTab.replace('-', ' ')}</h1>
           </div>
           
           <div className="flex items-center space-x-2 sm:space-x-4">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-3 rounded-2xl transition-all relative ${showNotifications ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
              >
                <BellIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                {notifications.some(n => !n.isRead) && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-600 rounded-full border-2 border-white"></span>
                )}
              </button>
              <div className="hidden sm:flex items-center space-x-3 bg-slate-50 p-1.5 pr-4 rounded-2xl border border-slate-100">
                <img src={user.avatar} className="w-8 h-8 rounded-xl object-cover" alt={user.name} />
                <span className="text-[10px] font-black uppercase text-slate-700 truncate max-w-[100px]">{user.name}</span>
              </div>
           </div>
        </header>

        {/* Tab Content Container */}
        <div className="flex-1">
          {activeTab === 'dashboard' && (
            user.role === 'DOCTOR' 
              ? <DoctorDashboard doctor={user} appointments={appointments} reports={reports} onUpdateUser={setUser} onUpdateAppointment={(u) => setAppointments(p => p.map(a => a.id === u.id ? u : a))} onDeleteAppointment={(id) => setAppointments(p => p.filter(a => a.id !== id))} />
              : <PatientDashboard user={user} appointments={appointments} reports={reports} />
          )}
          {activeTab === 'appointments' && <AppointmentBooking onBook={(apt) => {
            const newApt = { ...apt, id: Date.now().toString(), patientId: user.id, patientName: user.name, status: 'PENDING' } as Appointment;
            setAppointments(prev => [newApt, ...prev]);
            setActiveTab('dashboard');
          }} />}
          {activeTab === 'reports' && <ReportsList reports={reports} />}
          {activeTab === 'chat' && <AIChatAssistant onReportGenerated={(report) => setReports(prev => [report, ...prev])} />}
          {activeTab === 'virtual-doc' && <VirtualDoctor patientId={user.id} onSessionComplete={(r) => { setReports(prev => [r, ...prev]); setActiveTab('reports'); }} />}
        </div>
        
        <FloatingAIChat onReportGenerated={(report) => setReports(prev => [report, ...prev])} />
      </main>
    </div>
  );
};

export default App;
