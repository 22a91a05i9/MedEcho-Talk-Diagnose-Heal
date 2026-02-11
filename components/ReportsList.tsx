
import React, { useState } from 'react';
import { MedicalReport } from '../types';
import ReportDetailModal from './ReportDetailModal';
import { 
  DocumentTextIcon, 
  ArrowDownTrayIcon, 
  ChartBarIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface ReportsListProps {
  reports: MedicalReport[];
}

const ReportsList: React.FC<ReportsListProps> = ({ reports }) => {
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReports = reports.filter(r => 
    r.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-10 max-w-6xl mx-auto space-y-8 sm:space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Medical Files</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Diagnostic History Archives</p>
        </div>
        <div className="relative w-full md:w-96">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input 
            type="text"
            placeholder="Search records..."
            className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-50 rounded-2xl outline-none font-bold text-sm focus:border-blue-500 shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
        {filteredReports.map((report) => (
          <button 
            key={report.id} 
            onClick={() => setSelectedReport(report)}
            className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-50 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group relative overflow-hidden text-left w-full"
          >
            {report.aiConfidence && (
              <div className="absolute top-0 right-0 p-4">
                <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100">
                  <ChartBarIcon className="w-3 h-3" />
                  <span className="text-[9px] font-black uppercase">{report.aiConfidence}% AI</span>
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 w-fit">
                <DocumentTextIcon className="w-6 h-6" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{report.date}</span>
                {report.inputLanguage && (
                  <div className="flex items-center space-x-1 text-slate-300">
                    <GlobeAltIcon className="w-3 h-3" />
                    <span className="text-[8px] font-black uppercase">{report.inputLanguage}</span>
                  </div>
                )}
              </div>
              
              <h3 className="text-xl font-black text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">{report.diagnosis}</h3>
              <p className="text-xs text-slate-500 font-medium italic line-clamp-2">"{report.summary}"</p>
              
              <div className="pt-6 mt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center font-black text-[10px] text-slate-500 uppercase">
                    {report.doctorName[0]}
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Physician</p>
                    <p className="text-xs font-bold text-slate-700">{report.doctorName}</p>
                  </div>
                </div>
                <div className="text-blue-600 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-black uppercase tracking-widest">Open Details →</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      {filteredReports.length === 0 && (
        <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-slate-50">
          <DocumentTextIcon className="w-16 h-16 mx-auto text-slate-100 mb-6" />
          <h3 className="text-lg font-black text-slate-300 uppercase tracking-widest">No matching archives</h3>
        </div>
      )}

      {selectedReport && (
        <ReportDetailModal 
          report={selectedReport} 
          onClose={() => setSelectedReport(null)} 
        />
      )}
    </div>
  );
};

export default ReportsList;
