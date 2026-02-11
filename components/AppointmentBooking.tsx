
// Fix: Added React import to resolve the 'Cannot find namespace React' error when using React.FC.
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

    const blocked = selectedDoc.blockedSlots?.filter(slot => slot.date === date) || [];
    slots = slots.filter(slotTime => {
      const [h, m] = slotTime.split(':').map(Number);
      const slotMinutes = h * 60 + m;

      for (const block of blocked) {
        if (block.isAllDay) return false;
        if (block.startTime && block.endTime) {
          const [startH, startM] = block.startTime.split(':').map(Number);
          const [endH, endM] = block.endTime.split(':').map(Number);
          if (slotMinutes >= (startH * 60 + startM) && slotMinutes < (endH * 60 + endM)) return false;
        }
      }
      return true;
    });

    const booked = allAppointments.filter(a => a.doctorId === selectedDoc.id && a.date === date && a.status !== 'CANCELLED');
    slots = slots.filter(slotTime => !booked.some(a => a.time === slotTime));

    return slots;
  }, [selectedDoc, date, allAppointments]);

  const handleBookClick = () => {
    if (!selectedDoc || !selectedTime) return;
    const summary = { 
      doctorId: selectedDoc.id, 
      doctorName: selectedDoc.name, 
      doctorAvatar: selectedDoc.avatar,
      date, 
      time: selectedTime, 
      type 
    };
    setBookedAptSummary(summary);
    setShowSuccessModal(true);
  };

  const confirmFinalBooking = () => {
    if (bookedAptSummary) {
      onBook(bookedAptSummary);
    }
    setShowSuccessModal(false);
  };

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight uppercase">Book Consultation</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Select a specialist and preferred time</p>
        </div>
        <div className="relative w-full md:w-96">
          <MagnifyingGlassIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          <input 
            type="text" 
            placeholder="Search by name or specialization..." 
            className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-[2rem] outline-none font-bold text-sm focus:border-indigo-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-4">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Available Specialists</label>
          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredDoctors.map((doc) => (
              <button
                key={doc.id}
                onClick={() => { setSelectedDoc(doc); setSelectedTime(null); }}
                className={`w-full p-6 rounded-[2.5rem] border-2 flex items-center justify-between transition-all group ${
                  selectedDoc?.id === doc.id ? 'border-indigo-600 bg-white shadow-2xl scale-[1.02]' : 'border-slate-50 bg-white/50 hover:border-indigo-100 hover:bg-white'
                }`}
              >
                <div className="flex items-center space-x-5">
                  <div className="relative">
                    <img src={doc.avatar} alt={doc.name} className="w-20 h-20 rounded-[1.8rem] object-cover border-2 border-slate-50 shadow-md" />
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white ${doc.isAvailable ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                  </div>
                  <div className="text-left">
                    <p className="font-black text-slate-800 text-lg leading-tight">{doc.name}</p>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">{doc.specialization}</p>
                    <div className="flex items-center space-x-2 mt-2">
                       <ClockIcon className="w-3 h-3 text-slate-300" />
                       <span className="text-[9px] font-bold text-slate-400 uppercase">Available Slots</span>
                    </div>
                  </div>
                </div>
                <ChevronRightIcon className={`w-5 h-5 transition-transform ${selectedDoc?.id === doc.id ? 'text-indigo-600 translate-x-1' : 'text-slate-200'}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-[4rem] shadow-2xl border border-slate-50 overflow-hidden flex flex-col">
          {selectedDoc ? (
            <div className="flex-1 flex flex-col animate-in slide-in-from-right-10 duration-500">
              <div className="p-10 border-b bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Schedule for {selectedDoc.name.split(' ').pop()}</h3>
                  <div className="flex items-center space-x-4 mt-2">
                    <button onClick={() => setType('IN-PERSON')} className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border transition-all ${type === 'IN-PERSON' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-400'}`}>In-Person</button>
                    <button onClick={() => setType('VIRTUAL')} className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border transition-all ${type === 'VIRTUAL' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-400'}`}>Virtual</button>
                  </div>
                </div>
                <div className="relative">
                  <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                  <input 
                    type="date" 
                    value={date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="p-10 flex-1">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Time Slots</h4>
                </div>

                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {availableSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`py-4 px-2 rounded-2xl border-2 font-black text-xs transition-all ${
                          selectedTime === time 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl scale-105' 
                          : 'bg-white border-slate-50 text-slate-600 hover:border-indigo-200'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                     <ClockIcon className="w-12 h-12 text-slate-200" />
                     <p className="text-slate-300 font-bold uppercase text-[10px] tracking-widest">No availability found for this date</p>
                  </div>
                )}
              </div>

              <div className="p-10 pt-0">
                <button
                  onClick={handleBookClick}
                  disabled={!selectedTime}
                  className="w-full py-6 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center space-x-3 font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-black transition-all disabled:opacity-20 active:scale-95"
                >
                  <CheckBadgeIcon className="w-5 h-5" />
                  <span>Review & Book</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-8">
              <div className="w-32 h-32 bg-indigo-50 rounded-[3rem] flex items-center justify-center text-indigo-200">
                <UserIcon className="w-16 h-16" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Patient Gateway</h3>
                <p className="text-slate-400 text-sm font-medium max-w-xs mx-auto">Please select a healthcare professional from the directory to view their digital schedule.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success Confirmation Modal */}
      {showSuccessModal && bookedAptSummary && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-emerald-600 p-12 flex flex-col items-center text-white">
              <div className="relative mb-6">
                <img src={bookedAptSummary.doctorAvatar} alt={bookedAptSummary.doctorName} className="w-24 h-24 rounded-[1.8rem] object-cover border-4 border-white/20 shadow-2xl" />
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                   <CheckCircleIcon className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tighter">Confirmed!</h3>
              <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Appointment Secured</p>
            </div>
            
            <div className="p-10 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center space-x-3">
                    <UserIcon className="w-5 h-5 text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Doctor</span>
                  </div>
                  <span className="font-black text-slate-800">{bookedAptSummary.doctorName}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="w-5 h-5 text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date & Time</span>
                  </div>
                  <span className="font-black text-slate-800">{bookedAptSummary.date} @ {bookedAptSummary.time}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center space-x-3">
                    {bookedAptSummary.type === 'VIRTUAL' ? <VideoCameraIcon className="w-5 h-5 text-slate-400" /> : <MapPinIcon className="w-5 h-5 text-slate-400" />}
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Type</span>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${bookedAptSummary.type === 'VIRTUAL' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-800'}`}>
                    {bookedAptSummary.type}
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={confirmFinalBooking}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all"
                >
                  Continue to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentBooking;
