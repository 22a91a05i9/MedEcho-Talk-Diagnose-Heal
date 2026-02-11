
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
  CalendarIcon
} from '@heroicons/react/24/solid';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
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

  // Scheduling State for Frozen Slots
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [newBlockedStart, setNewBlockedStart] = useState('');
  const [newBlockedEnd, setNewBlockedEnd] = useState('');
  const [isAllDay, setIsAllDay] = useState(true);
  const [newBlockedReason, setNewBlockedReason] = useState('');

  // Automated Notification Logic
  const generateReminders = useCallback((user: User, apts: Appointment[]) => {
    const today = new Date();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    
    const newNotifications: AppNotification[] = [];
    
    apts.forEach(apt => {
      if (apt.status !== 'PENDING') return;
      
      const aptDate = new Date(apt.date);
      const timeDiff = aptDate.getTime() - today.getTime();
      
      // If appointment is within 24 hours
      if (timeDiff > 0 && timeDiff <= oneDayInMs) {
        newNotifications.push({
          id: `reminder-${apt.id}`,
          userId: user.id,
          title: 'Upcoming Appointment Reminder',
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
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const [apts, reps] = await Promise.all([
          dbService.appointments.getAll(),
          dbService.reports.getAll()
        ]);
        
        let filteredApts = [];
        if (user.role === 'DOCTOR') {
          filteredApts = apts.filter(a => a.doctorId === user.id);
          setReports(reps.filter(r => r.doctorId === user.id || r.doctorName.includes(user.name.split(' ').pop() || '')));
        } else {
          filteredApts = apts.filter(a => a.patientId === user.id);
          setReports(reps.filter(r => r.patientId === user.id));
        }
        
        setAppointments(filteredApts);
        generateReminders(user, filteredApts);
      };
      fetchData();
    }
  }, [user, generateReminders]);

  const handleUpdateUser = async (updatedUser: User) => {
    const saved = await dbService.auth.updateUser(updatedUser);
    setUser(saved);
  };

  const handleUpdateAppointment = async (apt: Appointment) => {
    const saved = await dbService.appointments.update(apt);
    setAppointments(prev => prev.map(a => a.id === saved.id ? saved : a));
  };

  const handleDeleteAppointment = async (id: string) => {
    await dbService.appointments.delete(id);
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  const getDefaultSchedules = (): DaySchedule[] => 
    Array.from({length: 7}, (_, i) => ({
      dayIndex: i,
      slots: [{ startTime: '09:00', endTime: '17:00' }],
      isActive: i >= 1 && i <= 5
    }));

  const updateDaySchedule = async (dayIndex: number, updates: Partial<DaySchedule>) => {
    if (!user) return;
    const currentSchedules = user.daySchedules || getDefaultSchedules();
    const newSchedules = currentSchedules.map(s => 
      s.dayIndex === dayIndex ? { ...s, ...updates } : s
    );
    await handleUpdateUser({ ...user, daySchedules: newSchedules });
  };

  const addSlotToDay = (dayIndex: number) => {
    if (!user) return;
    const currentSchedules = user.daySchedules || getDefaultSchedules();
    const day = currentSchedules.find(s => s.dayIndex === dayIndex);
    if (day) {
      const newSlots = [...day.slots, { startTime: '09:00', endTime: '17:00' }];
      updateDaySchedule(dayIndex, { slots: newSlots });
    }
  };

  const removeSlotFromDay = (dayIndex: number, slotIndex: number) => {
    if (!user) return;
    const currentSchedules = user.daySchedules || getDefaultSchedules();
    const day = currentSchedules.find(s => s.dayIndex === dayIndex);
    if (day && day.slots.length > 1) {
      const newSlots = day.slots.filter((_, i) => i !== slotIndex);
      updateDaySchedule(dayIndex, { slots: newSlots });
    }
  };

  const updateSlotInDay = (dayIndex: number, slotIndex: number, field: keyof TimeSlot, value: string) => {
    if (!user) return;
    const currentSchedules = user.daySchedules || getDefaultSchedules();
    const day = currentSchedules.find(s => s.dayIndex === dayIndex);
    if (day) {
      const newSlots = day.slots.map((s, i) => i === slotIndex ? { ...s, [field]: value } : s);
      updateDaySchedule(dayIndex, { slots: newSlots });
    }
  };

  const copyScheduleToAllWeekdays = async (sourceIndex: number) => {
    if (!user) return;
    const currentSchedules = user.daySchedules || getDefaultSchedules();
    const source = currentSchedules.find(s => s.dayIndex === sourceIndex);
    if (!source) return;

    const newSchedules = currentSchedules.map(s => {
      // Apply to Mon (1) through Fri (5)
      if (s.dayIndex >= 1 && s.dayIndex <= 5) {
        return { ...s, slots: JSON.parse(JSON.stringify(source.slots)), isActive: true };
      }
      return s;
    });

    await handleUpdateUser({ ...user, daySchedules: newSchedules });
    addNotification('SUCCESS', 'Schedule Sync', 'Applied template to all clinical weekdays.');
  };

  const addBlockedSlot = async () => {
    if (!user || !newBlockedDate || !newBlockedReason) return;
    const newSlot: BlockedSlot = {
      id: Date.now().toString(),
      date: newBlockedDate,
      reason: newBlockedReason,
      isAllDay: isAllDay,
      startTime: isAllDay ? undefined : newBlockedStart,
      endTime: isAllDay ? undefined : newBlockedEnd,
    };
    await handleUpdateUser({
      ...user,
      blockedSlots: [...(user.blockedSlots || []), newSlot]
    });
    setNewBlockedDate('');
    setNewBlockedReason('');
    setNewBlockedStart('');
    setNewBlockedEnd('');
    setIsAllDay(true);
    addNotification('ALERT', 'Calendar Frozen', `Restriction added for ${newSlot.date}.`);
  };

  const removeBlockedSlot = async (id: string) => {
    if (!user) return;
    await handleUpdateUser({
      ...user,
      blockedSlots: (user.blockedSlots || []).filter(s => s.id !== id)
    });
  };

  const addNotification = (type: AppNotification['type'], title: string, message: string) => {
    if (!user) return;
    const newNotif: AppNotification = {
      id: Date.now().toString(),
      userId: user.id,
      title,
      message,
      type,
      timestamp: new Date(),
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const clearAllNotifications = () => setNotifications([]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (authMode === 'LOGIN') {
        const loggedUser = await dbService.auth.login(formData.email);
        if (loggedUser.role !== authRole) {
          throw new Error(`Account role mismatch. Use the ${loggedUser.role} portal.`);
        }
        setUser(loggedUser);
      } else {
        const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          name: formData.name,
          email: formData.email,
          role: authRole,
          avatar: `https://picsum.photos/200?random=${Math.random()}`,
          specialization: authRole === 'DOCTOR' ? 'General Practitioner' : undefined,
          isAvailable: true,
          daySchedules: getDefaultSchedules(),
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
  };

  const handleBook = async (apt: Partial<Appointment>) => {
    const newApt: Appointment = {
      ...apt,
      id: 'a-' + Math.random().toString(36).substr(2, 9),
      patientId: user!.id,
      patientName: user!.name,
      status: 'PENDING',
    } as Appointment;
    const saved = await dbService.appointments.create(newApt);
    setAppointments(prev => [saved, ...prev]);
    addNotification('SUCCESS', 'Visit Confirmed', `Appointment with ${newApt.doctorName} locked for ${newApt.date}.`);
    setActiveTab('dashboard');
  };

  const handleNewReport = async (report: MedicalReport) => {
    const reportWithDocId = { ...report, doctorId: user!.id };
    await dbService.reports.create(reportWithDocId);
    setReports(prev => [reportWithDocId, ...prev]);
    addNotification('SUCCESS', 'Clinical Record Generated', `New diagnostic report available for ${report.patientId}.`);
    setActiveTab('reports');
  };

  if (loading) return null;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center auth-gradient p-4 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-500/10 blur-[150px] rounded-full"></div>
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center z-10">
          <div className="hidden lg:flex flex-col space-y-8 p-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-2xl transform rotate-6">
                <span className="text-3xl font-black text-blue-600">ME</span>
              </div>
              <h1 className="text-5xl font-black text-white tracking-tighter">MedEcho</h1>
            </div>
            <p className="text-slate-400 text-xl font-medium max-w-lg">
              Empowering healthcare with intelligence. Seamlessly managing schedules, diagnostics, and patient care.
            </p>
          </div>

          <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden">
            <div className="p-1 pb-0 flex border-b">
              <button 
                onClick={() => setAuthRole('PATIENT')}
                className={`flex-1 py-6 flex flex-col items-center space-y-2 transition-all ${authRole === 'PATIENT' ? 'bg-slate-50 border-b-4 border-blue-600' : 'bg-white opacity-40 hover:opacity-100'}`}
              >
                <UserIcon className={`w-6 h-6 ${authRole === 'PATIENT' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Patient Portal</span>
              </button>
              <button 
                onClick={() => setAuthRole('DOCTOR')}
                className={`flex-1 py-6 flex flex-col items-center space-y-2 transition-all ${authRole === 'DOCTOR' ? 'bg-slate-50 border-b-4 border-indigo-600' : 'bg-white opacity-40 hover:opacity-100'}`}
              >
                <BriefcaseIcon className={`w-6 h-6 ${authRole === 'DOCTOR' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Medical Staff</span>
              </button>
            </div>

            <div className="p-10 md:p-14 space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-black text-slate-800">
                  {authMode === 'LOGIN' ? 'Welcome Back' : 'Join the Network'}
                </h2>
              </div>
              <form onSubmit={handleAuth} className="space-y-6">
                {authMode === 'REGISTER' && (
                  <input required type="text" placeholder="Full Name" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}/>
                )}
                <input required type="email" placeholder="Email Address" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}/>
                <input required type="password" placeholder="Password" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}/>
                <button type="submit" disabled={authLoading} className={`w-full py-5 rounded-2xl text-white font-black uppercase text-xs shadow-2xl ${authRole === 'PATIENT' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                  {authLoading ? 'Authenticating...' : (authMode === 'LOGIN' ? 'Login' : 'Register')}
                </button>
              </form>
              <button onClick={() => setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN')} className="w-full text-slate-400 text-xs font-black uppercase tracking-widest hover:text-blue-600">
                {authMode === 'LOGIN' ? "Create an Account" : "Back to Login"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;
  // Fix: Defined 'currentSchedules' in the main render flow to ensure it's globally available for the schedule view.
  const currentSchedules = user.daySchedules || getDefaultSchedules();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-inter">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} role={user.role} />
      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        {/* Top Header with Notification Center */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-10 py-6 border-b border-slate-100 flex justify-between items-center">
           <div className="flex items-center space-x-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{activeTab.replace('-', ' ')}</span>
           </div>
           
           <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-3 rounded-2xl transition-all relative ${showNotifications ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
              >
                <BellIcon className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-4 w-96 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-top-4 duration-300">
                  <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800">System Alerts</h4>
                    <button onClick={clearAllNotifications} className="text-[9px] font-black uppercase text-rose-500 hover:text-rose-600 tracking-widest">Clear All</button>
                  </div>
                  <div className="max-h-96 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {notifications.length > 0 ? notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-5 rounded-3xl border transition-all cursor-pointer group ${n.isRead ? 'bg-white border-slate-50 opacity-60' : 'bg-slate-50 border-slate-100 hover:border-blue-100'}`}
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`p-3 rounded-2xl ${n.type === 'REMINDER' ? 'bg-amber-100 text-amber-600' : n.type === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {n.type === 'REMINDER' ? <ClockIcon className="w-5 h-5" /> : n.type === 'SUCCESS' ? <CheckIcon className="w-5 h-5" /> : <ExclamationCircleIcon className="w-5 h-5" />}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-black text-slate-800 text-sm">{n.title}</h5>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase mt-2">{new Date(n.timestamp).toLocaleTimeString()}</p>
                          </div>
                          {!n.isRead && <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>}
                        </div>
                      </div>
                    )) : (
                      <div className="py-12 text-center">
                        <BellIcon className="w-12 h-12 text-slate-100 mx-auto mb-3" />
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No New Notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
           </div>
        </div>

        <div className="relative">
          {activeTab === 'dashboard' && (
            user.role === 'DOCTOR' 
              ? <DoctorDashboard 
                  doctor={user} 
                  appointments={appointments} 
                  onUpdateUser={handleUpdateUser} 
                  onUpdateAppointment={handleUpdateAppointment}
                  onDeleteAppointment={handleDeleteAppointment}
                />
              : <PatientDashboard user={user} appointments={appointments} reports={reports} />
          )}
          {activeTab === 'appointments' && <AppointmentBooking onBook={handleBook} />}
          {activeTab === 'reports' && <ReportsList reports={reports} />}
          {activeTab === 'chat' && <AIChatAssistant />}
          {activeTab === 'virtual-doc' && <VirtualDoctor patientId={user.id} onSessionComplete={handleNewReport} />}
          
          {activeTab === 'schedule' && (
            <div className="p-10 max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500">
               <div className="flex items-center justify-between">
                 <div>
                   <h2 className="text-4xl font-black text-slate-800 tracking-tight uppercase">Schedule Manager</h2>
                   <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Multi-slot Daily Availability</p>
                 </div>
                 <div className="flex items-center space-x-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
                    <ShieldCheckIcon className="w-5 h-5 text-emerald-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800">Secure Sync Active</span>
                 </div>
               </div>
               
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                 <div className="lg:col-span-2 space-y-8">
                   {/* Per-Day Multi-Slot Availability */}
                   <div className="space-y-6">
                      <div className="flex justify-between items-center px-4">
                        <h3 className="text-xl font-black text-slate-800 flex items-center space-x-3">
                          <CalendarDaysIcon className="w-6 h-6 text-indigo-600" />
                          <span>Clinical Availability Grid</span>
                        </h3>
                        <div className="flex items-center space-x-2 bg-indigo-50 p-2 rounded-xl text-indigo-600">
                           <ClockIcon className="w-4 h-4" />
                           <span className="text-[10px] font-black uppercase">24h System</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dayName, idx) => {
                          const schedule = currentSchedules.find(s => s.dayIndex === idx) || { dayIndex: idx, slots: [], isActive: false };
                          return (
                            <div key={dayName} className={`p-8 rounded-[2.5rem] border-2 transition-all space-y-6 ${schedule.isActive ? 'bg-white border-indigo-200 shadow-xl shadow-indigo-500/5' : 'bg-slate-100 border-slate-100 opacity-50'}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-6">
                                  <button 
                                    onClick={() => updateDaySchedule(idx, { isActive: !schedule.isActive })}
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${schedule.isActive ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-300 border-2 border-slate-200'}`}
                                  >
                                    {schedule.isActive ? <CheckCircleIcon className="w-7 h-7" /> : <div className="w-4 h-4 bg-slate-200 rounded-full"></div>}
                                  </button>
                                  <div>
                                    <p className="font-black text-slate-800 uppercase tracking-tighter text-lg">{dayName}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{schedule.isActive ? 'Receiving Patient Bookings' : 'Closed / Off-Duty'}</p>
                                  </div>
                                </div>
                                
                                {schedule.isActive && (
                                  <div className="flex items-center space-x-3">
                                    <button 
                                      onClick={() => copyScheduleToAllWeekdays(idx)}
                                      title="Copy to all weekdays"
                                      className="p-3 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all group"
                                    >
                                      <DocumentDuplicateIcon className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => addSlotToDay(idx)}
                                      className="flex items-center space-x-2 p-3 px-5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                                    >
                                      <PlusIcon className="w-4 h-4" />
                                      <span className="text-[10px] font-black uppercase">Add Slot</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                              
                              {schedule.isActive && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {schedule.slots.map((slot, sIdx) => (
                                    <div key={sIdx} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex items-center justify-between group hover:border-indigo-300 transition-all">
                                      <div className="flex items-center space-x-4">
                                        <div className="flex flex-col">
                                          <label className="text-[8px] font-black uppercase text-slate-400 mb-1 ml-1">Session Start</label>
                                          <input 
                                            type="time" 
                                            value={slot.startTime}
                                            onChange={(e) => updateSlotInDay(idx, sIdx, 'startTime', e.target.value)}
                                            className="bg-white px-4 py-2.5 rounded-xl border-none text-[12px] font-black outline-none shadow-sm focus:ring-2 focus:ring-indigo-500"
                                          />
                                        </div>
                                        <div className="pt-4">
                                          <div className="w-4 h-0.5 bg-slate-300"></div>
                                        </div>
                                        <div className="flex flex-col">
                                          <label className="text-[8px] font-black uppercase text-slate-400 mb-1 ml-1">Session End</label>
                                          <input 
                                            type="time" 
                                            value={slot.endTime}
                                            onChange={(e) => updateSlotInDay(idx, sIdx, 'endTime', e.target.value)}
                                            className="bg-white px-4 py-2.5 rounded-xl border-none text-[12px] font-black outline-none shadow-sm focus:ring-2 focus:ring-indigo-500"
                                          />
                                        </div>
                                      </div>
                                      {schedule.slots.length > 1 && (
                                        <button 
                                          onClick={() => removeSlotFromDay(idx, sIdx)}
                                          className="p-3 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                        >
                                          <TrashIcon className="w-5 h-5" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                   </div>
                 </div>

                 <div className="space-y-8">
                    {/* Freeze Slots Management */}
                   <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-50 h-fit">
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-black text-slate-800 flex items-center space-x-3">
                          <NoSymbolIcon className="w-6 h-6 text-rose-500" />
                          <span>Session Freeze</span>
                        </h3>
                      </div>
                      
                      <div className="space-y-6 mb-10">
                        <div className="space-y-4">
                          <div className="flex flex-col">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Block Date</label>
                            <input 
                              type="date" 
                              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold focus:border-rose-500 transition-all"
                              value={newBlockedDate}
                              onChange={(e) => setNewBlockedDate(e.target.value)}
                            />
                          </div>
                          <div className="flex flex-col">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Restrict Reason</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Surgery, Seminar" 
                              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold focus:border-rose-500 transition-all"
                              value={newBlockedReason}
                              onChange={(e) => setNewBlockedReason(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100 space-y-6">
                          <div className="flex items-center space-x-4">
                            <input 
                              type="checkbox" 
                              id="allday"
                              checked={isAllDay} 
                              onChange={(e) => setIsAllDay(e.target.checked)}
                              className="w-6 h-6 accent-rose-600 cursor-pointer rounded-lg"
                            />
                            <label htmlFor="allday" className="text-xs font-black uppercase text-slate-700 cursor-pointer select-none">Full Day Restrictions</label>
                          </div>
                          {!isAllDay && (
                            <div className="flex items-center justify-between animate-in slide-in-from-top-2">
                              <input type="time" value={newBlockedStart} onChange={(e) => setNewBlockedStart(e.target.value)} className="w-[45%] px-3 py-2.5 bg-white border border-rose-100 rounded-xl text-xs font-bold outline-none shadow-sm" />
                              <span className="text-rose-300 font-black">/</span>
                              <input type="time" value={newBlockedEnd} onChange={(e) => setNewBlockedEnd(e.target.value)} className="w-[45%] px-3 py-2.5 bg-white border border-rose-100 rounded-xl text-xs font-bold outline-none shadow-sm" />
                            </div>
                          )}
                        </div>
                        <button onClick={addBlockedSlot} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center space-x-2 font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200">
                          <BoltIcon className="w-4 h-4" />
                          <span>Freeze Calendar</span>
                        </button>
                      </div>

                      <div className="space-y-3">
                        {user.blockedSlots && user.blockedSlots.length > 0 ? [...user.blockedSlots].reverse().map(slot => (
                          <div key={slot.id} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-3xl group">
                            <div className="flex items-center space-x-5">
                              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                                <ExclamationCircleIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-black text-slate-800 text-sm">{slot.date}</p>
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                                  {slot.isAllDay ? 'All Day' : `${slot.startTime} - ${slot.endTime}`} • {slot.reason}
                                </p>
                              </div>
                            </div>
                            <button onClick={() => removeBlockedSlot(slot.id)} className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )) : (
                          <div className="py-14 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
                            <p className="text-slate-300 font-bold text-xs uppercase tracking-widest italic">No Calendar Freezes Active</p>
                          </div>
                        )}
                      </div>
                   </div>

                    <div className="bg-indigo-900 rounded-[3rem] p-8 text-white shadow-2xl overflow-hidden relative">
                      <div className="relative z-10 space-y-6 text-center">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">Visibility Hub</h4>
                          <div className={`w-3 h-3 rounded-full ${user.isAvailable ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`}></div>
                        </div>
                        <div className="py-6 border-y border-white/10">
                           <h3 className="text-5xl font-black tracking-tighter">{user.isAvailable ? 'LIVE' : 'IDLE'}</h3>
                        </div>
                        <button 
                          onClick={() => handleUpdateUser({...user, isAvailable: !user.isAvailable})}
                          className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all shadow-2xl ${user.isAvailable ? 'bg-rose-500' : 'bg-indigo-600'}`}
                        >
                          {user.isAvailable ? 'Switch Offline' : 'Go Online'}
                        </button>
                      </div>
                      <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
                    </div>
                 </div>
               </div>
            </div>
          )}
        </div>
        <FloatingAIChat />
      </main>
    </div>
  );
};

export default App;
