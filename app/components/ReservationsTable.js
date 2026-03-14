"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ReservationsTable() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRes, setSelectedRes] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Custom Confirmation State
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { fetchReservations(); }, []);

  async function fetchReservations() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations') 
        .select('*')
        .order('customer_reservation_date', { ascending: true });

      if (error) console.error("Error: " + error.message);
      else setReservations(data || []);
    } finally {
      setLoading(false);
    }
  }

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('reservations')
      .update({ reservation_status: newStatus })
      .eq('reservation_id', id);

    if (error) alert(error.message);
    else {
      setIsModalOpen(false);
      fetchReservations();
    }
  };

  const deleteReservation = async (id) => {
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('reservation_id', id);

    if (error) {
      alert("Error: " + error.message);
    } else {
      setConfirmDelete(null);
      setIsModalOpen(false);
      fetchReservations();
    }
  };

  if (loading) return (
    <div className="p-20 text-center text-stone-400 animate-pulse font-bold tracking-widest uppercase text-[10px]">
      Connecting to Registry...
    </div>
  );

  return (
    <div className="relative">
      <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-stone-50 border-b border-stone-100">
            <tr>
              <th className="px-8 py-5 text-[10px] uppercase font-black text-stone-400 tracking-widest">Reserved For</th>
              <th className="px-8 py-5 text-[10px] uppercase font-black text-stone-400 tracking-widest">Purpose</th>
              <th className="px-8 py-5 text-[10px] uppercase font-black text-stone-400 tracking-widest">Date</th>
              <th className="px-8 py-5 text-[10px] uppercase font-black text-stone-400 tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {reservations.map((res) => (
              <tr key={res.reservation_id} className="hover:bg-stone-50/50 transition-colors">
                <td className="px-8 py-6">
                  <p className="font-bold text-[#1a2e1a] text-sm uppercase">{res.reserved_for}</p>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    res.reservation_status === 'Checked In' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {res.reservation_status}
                  </span>
                </td>
                <td className="px-8 py-6 text-xs text-stone-500 font-medium">{res.purpose}</td>
                <td className="px-8 py-6 text-xs text-stone-500 font-bold">{res.customer_reservation_date}</td>
                <td className="px-8 py-6 text-right space-x-2">
                  <button 
                    onClick={() => { setSelectedRes(res); setIsModalOpen(true); }}
                    className="bg-stone-100 text-stone-600 px-4 py-2 rounded-xl text-[10px] font-bold uppercase hover:bg-stone-200 transition-all"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- CUSTOM DELETE CONFIRMATION MODAL --- */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-[#1a2e1a]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-6">⚠️</div>
            <h3 className="text-xl font-black text-[#1a2e1a] uppercase tracking-tight">Remove Reservation</h3>
            <p className="text-stone-500 text-sm mt-3 leading-relaxed">
              Are you sure you want to reject and delete the reservation for <strong>{confirmDelete.reserved_for}</strong>? This action is permanent.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button onClick={() => setConfirmDelete(null)} className="py-4 bg-stone-100 text-stone-600 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-stone-200 transition-all">
                Cancel
              </button>
              <button onClick={() => deleteReservation(confirmDelete.reservation_id)} className="py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SIDE MANAGEMENT PANEL --- */}
      {isModalOpen && selectedRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md h-screen bg-white shadow-2xl p-10 animate-in slide-in-from-right duration-500 flex flex-col">
            <div className="flex justify-between items-center mb-10">
              <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Management Panel</span>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-red-500 transition-colors font-bold text-sm">✕ Close</button>
            </div>
            
            <h3 className="text-3xl font-black text-[#1a2e1a] uppercase tracking-tighter mb-2">{selectedRes.reserved_for}</h3>
            <p className="text-orange-600 text-[10px] font-black uppercase mb-8">{selectedRes.purpose}</p>
            
            <div className="space-y-3 mt-4">
              <button 
                onClick={() => updateStatus(selectedRes.reservation_id, 'Checked In')}
                className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
              >
                Confirm Check-In
              </button>
              <button 
                onClick={() => updateStatus(selectedRes.reservation_id, 'Completed')}
                className="w-full py-5 border-2 border-stone-100 text-stone-400 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] hover:bg-stone-50 transition-all"
              >
                Mark as Completed
              </button>
              
              <div className="pt-10">
                <p className="text-[9px] font-bold text-stone-400 uppercase text-center mb-4">Danger Zone</p>
                <button 
                  onClick={() => setConfirmDelete(selectedRes)}
                  className="w-full py-5 bg-red-50 text-red-500 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all border border-red-100"
                >
                  Reject & Delete
                </button>
              </div>
            </div>

            <div className="mt-auto pt-10 border-t border-stone-100">
               <div className="flex justify-between text-[10px] font-bold uppercase text-stone-400">
                  <span>Res ID:</span>
                  <span className="text-[#1a2e1a]">{selectedRes.reservation_id}</span>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}