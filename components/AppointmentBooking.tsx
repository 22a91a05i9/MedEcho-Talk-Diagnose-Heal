
import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../services/dbService';
import { User, Appointment } from '../types';
import { 
  CalendarIcon, 
  MagnifyingGlassIcon,
  ClockIcon,
  ChevronRightIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  UserIcon,
  VideoCameraIcon,
  MapPinIcon
} from '@heroicons/react/24/solid';

interface AppointmentBookingProps {
  onBook: (appointment: Partial<Appointment>) => void;
}

const AppointmentBooking: React.FC<AppointmentBookingProps> = ({ onBook }) => {
  const [doctors, setDoctors] = useState<User[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<User | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [type, setType] = useState<'VIRTUAL' | 'IN-PERSON'>('IN-PERSON');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookedAptSummary, setBookedAptSummary] = useState<(Partial<Appointment> & { doctorAvatar?: string }) | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const users = JSON.parse(localStorage.getItem('medecho_users') || '[]');
      const apts = await dbService.appointments.getAll();
      setDoctors(users.filter((u: User) => u.role === 'DOCTOR'));
      setAllAppointments(apts);
    };
    loadData();
  }, []);

  const filteredDoctors = doctors.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    doc.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateSlots = (startTime: string, endTime: string) => {
    const slots: string[] = [];
    let [h, m] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const endTotal = endH * 60 + endM;

    while ((h * 60 + m) < endTotal) {
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      m += 30;
      if (m >= 60) {
        h += 1;
        m = 0;
      }
    }
    return slots;
  };

  const availableSlots = useMemo(() => {
    if (!selectedDoc || !date) return [];
    const bookingDate = new Date(date);
    const dayOfWeek = bookingDate.getUTCDay();
    const daySched = selectedDoc.daySchedules?.find(s => s.dayIndex === dayOfWeek);
    if (!daySched || !daySched.isActive) return [];
    let slots: string[] = [];
    daySched.slots.forEach(range => {
      slots = [...slots, ...generateSlots(range.startTime, range.endTime)];
    });
    const booked = allAppointments.filter(a => a.doctorId === selectedDoc.id && a.date === date && a.status !== 'CANCELLED');
    slots = slots.filter(slotTime => !booked.some(a => a.time === slotTime));
    return slots;
  }, [selectedDoc, date, allAppointments]);

  const handleBookClick = () => {
    if (!selectedDoc || !selectedTime) return;
    const summary = { doctorId: selectedDoc.id, doctorName: selectedDoc.name, doctorAvatar: selectedDoc.avatar, date, time: selectedTime, type };
    setBookedAptSummary(summary);
    setShowSuccessModal(true);
  };

  const confirmFinalBooking = () => {
    if (bookedAptSummary) onBook(bookedAptSummary);
    setShowSuccessModal(false);
  };

  return (
    <div className="p-4 sm:p-10 max-w-7xl mx-auto space-y-8 sm:space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight uppercase">Book Visit</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Select Specialist & Time</p>
        </div>
        <div className="relative w-full md:w-96">
          <MagnifyingGlassIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input 
            type="text" 
            placeholder="Search specialists..." 
            className="w-full pl-12 pr-5 py-3.5 sm:py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none font-bold text-sm focus:border-indigo-500 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
        <div className={`lg:col-span-5 space-y-4 ${selectedDoc ? 'hidden lg:block' : 'block'}`}>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Specialists</label>
          <div className="space-y-3 sm:space-y-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredDoctors.map((doc) => (
              <button
                key={doc.id}
                onClick={() => { setSelectedDoc(doc); setSelectedTime(null); }}
                className={`w-full p-4 sm:p-6 rounded-[2rem] border-2 flex items-center justify-between transition-all group ${
                  selectedDoc?.id === doc.id ? 'border-indigo-600 bg-white shadow-xl' : 'border-slate-50 bg-white/50 hover:border-indigo-100'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="relative flex-shrink-0">
                    <img src={doc.avatar} alt={doc.name} className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl object-cover border border-slate-50 shadow-sm" />
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${doc.isAvailable ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-black text-slate-800 text-sm sm:text-lg leading-tight truncate">{doc.name}</p>
                    <p className="text-[8px] sm:text-[10px] font-black text-indigo-500 uppercase mt-1 truncate">{doc.specialization}</p>
                  </div>
                </div>
                <ChevronRightIcon className={`w-4 h-4 flex-shrink-0 ${selectedDoc?.id === doc.id ? 'text-indigo-600' : 'text-slate-200'}`} />
              </button>
            ))}
          </div>
        </div>

        <div className={`lg:col-span-7 bg-white rounded-[2rem] sm:rounded-[4rem] shadow-xl border border-slate-50 overflow-hidden flex flex-col min-h-[500px] ${!selectedDoc ? 'hidden lg:flex' : 'flex'}`}>
          {selectedDoc ? (
            <div className="flex-1 flex flex-col">
              <div className="p-6 sm:p-10 border-b bg-slate-50/50 flex flex-col gap-6">
                <div className="flex justify-between items-start">
                  <button onClick={() => setSelectedDoc(null)} className="lg:hidden text-[10px] font-black uppercase text-indigo-600 mb-2 underline">← Back to List</button>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setDate(e.target.value)}
                      className="pl-4 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-800 truncate">{selectedDoc.name}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setType('IN-PERSON')} className={`text-[8px] sm:text-[10px] font-black uppercase px-3 py-1.5 rounded-full border ${type === 'IN-PERSON' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400'}`}>In-Person</button>
                    <button onClick={() => setType('VIRTUAL')} className={`text-[8px] sm:text-[10px] font-black uppercase px-3 py-1.5 rounded-full border ${type === 'VIRTUAL' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400'}`}>Virtual</button>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-10 flex-1">
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                    {availableSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`py-3 sm:py-4 px-2 rounded-2xl border-2 font-black text-[10px] sm:text-xs transition-all ${
                          selectedTime === time 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-105' 
                          : 'bg-white border-slate-50 text-slate-600'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
                     <p className="text-slate-300 font-bold uppercase text-[10px]">No Availability</p>
                  </div>
                )}
              </div>

              <div className="p-6 sm:p-10 pt-0">
                <button
                  onClick={handleBookClick}
                  disabled={!selectedTime}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl flex items-center justify-center space-x-2 font-black uppercase text-xs tracking-widest disabled:opacity-20"
                >
                  <CheckBadgeIcon className="w-4 h-4" />
                  <span>Review & Book</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-10 sm:p-20 text-center space-y-6 sm:space-y-8">
              <div className="w-20 h-20 sm:w-32 sm:h-32 bg-indigo-50 rounded-[2.5rem] sm:rounded-[3rem] flex items-center justify-center text-indigo-200">
                <UserIcon className="w-10 h-10 sm:w-16 sm:h-16" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Select Specialist</h3>
                <p className="text-slate-400 text-xs sm:text-sm max-w-xs mx-auto">Browse the specialist list to view clinical availability.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success Confirmation Modal - Mobile Optimized */}
      {showSuccessModal && bookedAptSummary && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-emerald-600 p-8 sm:p-10 flex flex-col items-center text-white text-center">
              <CheckCircleIcon className="w-12 h-12 mb-4" />
              <h3 className="text-2xl font-black uppercase">Confirmed</h3>
            </div>
            <div className="p-8 sm:p-10 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-400 font-black uppercase text-[10px]">Doctor</span>
                  <span className="font-black text-slate-800">{bookedAptSummary.doctorName}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-400 font-black uppercase text-[10px]">Time</span>
                  <span className="font-black text-slate-800">{bookedAptSummary.date} @ {bookedAptSummary.time}</span>
                </div>
              </div>
              <button 
                onClick={confirmFinalBooking}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentBooking;
