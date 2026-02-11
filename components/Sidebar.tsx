import React from 'react';
import { 
  HomeIcon, 
  CalendarIcon, 
  ClipboardDocumentListIcon, 
  ChatBubbleBottomCenterTextIcon, 
  MicrophoneIcon,
  ArrowLeftOnRectangleIcon,
  ClockIcon,
  AcademicCapIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  role: UserRole;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, role, onClose }) => {
  const patientItems = [
    { id: 'dashboard', name: 'Dashboard', icon: HomeIcon },
    { id: 'appointments', name: 'Book Visit', icon: CalendarIcon },
    { id: 'reports', name: 'Medical Files', icon: ClipboardDocumentListIcon },
    { id: 'chat', name: 'Chat Support', icon: ChatBubbleBottomCenterTextIcon },
    { id: 'virtual-doc', name: 'Virtual Doctor', icon: MicrophoneIcon },
  ];

  const doctorItems = [
    { id: 'dashboard', name: 'Overview', icon: HomeIcon },
    { id: 'schedule', name: 'My Schedule', icon: ClockIcon },
    { id: 'reports', name: 'Records', icon: ClipboardDocumentListIcon },
    { id: 'chat', name: 'AI Research', icon: AcademicCapIcon },
  ];

  const menuItems = role === 'DOCTOR' ? doctorItems : patientItems;
  const themeColor = role === 'DOCTOR' ? 'indigo' : 'blue';

  return (
    <div className="w-full max-w-[300px] sm:w-72 bg-white border-r border-slate-100 h-full flex flex-col shadow-2xl sm:shadow-sm overflow-y-auto custom-scrollbar">
      <div className="p-6 sm:p-8 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-tr ${role === 'DOCTOR' ? 'from-indigo-600' : 'from-blue-600'} to-slate-800 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg transform rotate-6`}>
            {role === 'DOCTOR' ? 'DR' : 'ME'}
          </div>
          <div>
            <span className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">MedEcho</span>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{role === 'DOCTOR' ? 'Staff' : 'Patient'}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="sm:hidden p-2 text-slate-400 hover:text-slate-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        )}
      </div>
      
      <nav className="flex-1 p-4 sm:p-6 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); if (onClose) onClose(); }}
            className={`w-full flex items-center space-x-4 px-5 py-4 sm:py-3.5 rounded-2xl transition-all duration-300 ${
              activeTab === item.id 
                ? `${role === 'DOCTOR' ? 'bg-indigo-600' : 'bg-blue-600'} text-white shadow-xl shadow-blue-500/20 translate-x-1` 
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
            }`}
          >
            <item.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${activeTab === item.id ? 'scale-110' : ''}`} />
            <span className="font-black text-[11px] sm:text-sm uppercase tracking-wider">{item.name}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 sm:p-6 border-t border-slate-50">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-4 px-5 py-4 sm:py-3.5 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all font-black uppercase text-[11px] sm:text-sm tracking-wider"
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;