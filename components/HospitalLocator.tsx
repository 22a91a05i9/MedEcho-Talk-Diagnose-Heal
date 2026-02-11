
import React, { useState, useEffect } from 'react';
import { getNearbyHospitals } from '../services/geminiService';
import { MapPinIcon, PhoneIcon, ArrowTopRightOnSquareIcon, BeakerIcon } from '@heroicons/react/24/outline';

const HospitalLocator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ text: string, groundingChunks: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHospitals = () => {
    setLoading(true);
    setError(null);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const result = await getNearbyHospitals(position.coords.latitude, position.coords.longitude);
          if (result) {
            setData(result);
          } else {
            setError("Could not retrieve nearby hospital information.");
          }
          setLoading(false);
        },
        (err) => {
          setError("Location access denied. Please enable location to find nearby hospitals.");
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Find Nearby Care</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">MedEcho-Powered Hospital Recommendations</p>
        </div>
        <button 
          onClick={fetchHospitals}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-black px-6 py-2 rounded-xl text-xs transition-all flex items-center space-x-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : <MapPinIcon className="w-4 h-4" />}
          <span>{loading ? 'LOCATING...' : 'REFRESH LIST'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-bold border border-rose-100">
          {error}
        </div>
      )}

      {data ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="prose prose-slate prose-sm max-w-none text-slate-600 font-medium whitespace-pre-line bg-slate-50 p-6 rounded-3xl border border-slate-100">
            {data.text}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.groundingChunks?.map((chunk, i) => (
              chunk.maps && (
                <a 
                  key={i} 
                  href={chunk.maps.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:bg-blue-50 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <MapPinIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-sm group-hover:text-blue-700">{chunk.maps.title}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Open in Google Maps</p>
                    </div>
                  </div>
                  <ArrowTopRightOnSquareIcon className="w-4 h-4 text-slate-300" />
                </a>
              )
            ))}
          </div>
        </div>
      ) : !loading && !error && (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
          <MapPinIcon className="w-16 h-16 text-slate-200" />
          <p className="text-slate-500 font-bold uppercase text-xs">Allow location to see the best hospitals near you.</p>
        </div>
      )}
    </div>
  );
};

export default HospitalLocator;
