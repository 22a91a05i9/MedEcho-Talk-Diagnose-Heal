
import React from 'react';
import { 
  HomeIcon, 
  CalendarIcon, 
  ClipboardDocumentListIcon, 
  ChatBubbleBottomCenterTextIcon, 
  MicrophoneIcon,
  ArrowLeftOnRectangleIcon,
  ClockIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  role: UserRole;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, role }) => {
  const patientItems = [
    { id: 'dashboard', name: 'Dashboard', icon: HomeIcon },
    { id: 'appointments', name: 'Book Visit', icon: CalendarIcon },
    { id: 'reports', name: 'Medical Files', icon: ClipboardDocumentListIcon },
    { id: 'chat', name: 'Chat Support', icon: ChatBubbleBottomCenterTextIcon },
    { id: 'virtual-doc', name: 'Virtual Doctor', icon: MicrophoneIcon },
  ];

  const doctorItems = [
    { id: 'dashboard', name: 'Clinical Overview', icon: HomeIcon },
    { id: 'schedule', name: 'My Schedule', icon: ClockIcon },
    { id: 'reports', name: 'Patient Records', icon: ClipboardDocumentListIcon },
    { id: 'chat', name: 'AI Research', icon: AcademicCapIcon },
  ];

  const menuItems = role === 'DOCTOR' ? doctorItems : patientItems;
  const themeColor = role === 'DOCTOR' ? 'indigo' : 'blue';

  return (
    <div className={`w-72 bg-white border-r border-slate-100 h-full flex flex-col z-30 shadow-sm`}>
      <div className="p-8 border-b border-slate-50 flex items-center space-x-4">
        <div className={`w-12 h-12 bg-gradient-to-tr from-${themeColor}-600 to-slate-800 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg transform rotate-6 transition-transform hover:rotate-0`}>
          {role === 'DOCTOR' ? 'DR' : 'ME'}
        </div>
        <div>
          <span className="text-xl font-black text-slate-800 tracking-tight">MedEcho</span>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{role === 'DOCTOR' ? 'Staff Edition' : 'Patient Care'}</p>
        </div>
      </div>
      
      <nav className="flex-1 p-6 space-y-3">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-4 px-6 py-4 rounded-[1.5rem] transition-all duration-300 ${
              activeTab === item.id 
                ? `bg-${themeColor}-600 text-white shadow-xl shadow-${themeColor}-500/20 translate-x-2` 
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
            }`}
          >
            <item.icon className={`w-6 h-6 transition-transform ${activeTab === item.id ? 'scale-110' : ''}`} />
            <span className="font-bold text-sm">{item.name}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-50">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-4 px-6 py-4 rounded-[1.5rem] text-rose-500 hover:bg-rose-50 transition-all group"
        >
          <ArrowLeftOnRectangleIcon className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold text-sm">Log Out System</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
