
import React from 'react';
import { MedicalReport } from '../types';
import { 
  DocumentTextIcon, 
  ArrowDownTrayIcon, 
  BeakerIcon,
  ChartBarIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

interface ReportsListProps {
  reports: MedicalReport[];
}

const ReportsList: React.FC<ReportsListProps> = ({ reports }) => {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Diagnostic History</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Stored securely in MedEcho Cloud</p>
        </div>
        <div className="flex space-x-2">
           <button className="px-6 py-3 bg-white border rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Export PDF</button>
           <button className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all">Share Data</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {reports.map((report) => (
          <div key={report.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
            {report.aiConfidence && (
              <div className="absolute top-0 right-0 p-6">
                <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100">
                  <ChartBarIcon className="w-4 h-4" />
                  <span className="text-[10px] font-black">{report.aiConfidence}% AI Confidence</span>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-blue-50 rounded-[1.5rem] text-blue-600">
                <DocumentTextIcon className="w-8 h-8" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{report.date}</span>
                {report.inputLanguage && (
                  <div className="flex items-center space-x-1 text-slate-400">
                    <GlobeAltIcon className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase">{report.inputLanguage}</span>
                  </div>
                )}
              </div>
              
              <h3 className="text-2xl font-black text-slate-800 leading-tight">{report.diagnosis}</h3>
              <p className="text-sm text-slate-500 font-medium italic">" {report.summary.substring(0, 150)}... "</p>
              
              <div className="pt-6 mt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-500">
                    {report.doctorName[0]}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consultant</p>
                    <p className="text-sm font-bold text-slate-700">{report.doctorName}</p>
                  </div>
                </div>
                <button className="text-blue-600 p-2 hover:bg-blue-50 rounded-xl transition-all">
                  <ArrowDownTrayIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {reports.length === 0 && (
        <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
          <DocumentTextIcon className="w-20 h-20 mx-auto text-slate-100 mb-6" />
          <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest">No Medical Files</h3>
        </div>
      )}
    </div>
  );
};

export default ReportsList;
