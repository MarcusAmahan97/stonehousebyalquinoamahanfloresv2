"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ReservationsTable() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRes, setSelectedRes] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => { fetchReservations(); }, []);

  async function fetchReservations() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations') 
        .select('*'); // Later you might want to join with 'customers' to get the email

      if (error) alert("Error: " + error.message);
      else setReservations(data || []);
    } finally {
      setLoading(false);
    }
  }

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('reservations')
      .update({ reservation_status: newStatus }) // Column name from your SQL
      .eq('reservation_id', id); // ID name from your SQL

    if (error) alert(error.message);
    else {
      setIsModalOpen(false);
      fetchReservations();
    }
  };

  if (loading) return <div className="p-20 text-center text-stone-400 animate-pulse font-bold tracking-widest uppercase text-[10px]">Connecting...</div>;

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
                  <p className="font-bold text-[#1a2e1a] text-sm">{res.reserved_for}</p>
                  <p className="text-[10px] text-orange-600 font-bold uppercase">{res.reservation_status}</p>
                </td>
                <td className="px-8 py-6 text-sm text-stone-500">{res.purpose}</td>
                <td className="px-8 py-6 text-sm text-stone-500">{res.customer_reservation_date}</td>
                <td className="px-8 py-6 text-right">
                  <button 
                    onClick={() => { setSelectedRes(res); setIsModalOpen(true); }}
                    className="bg-[#1a2e1a] text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase hover:bg-orange-600 transition-all shadow-md"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- SIDE MANAGEMENT PANEL --- */}
      {isModalOpen && selectedRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md h-screen bg-white shadow-2xl p-10 animate-in slide-in-from-right duration-500">
            <button onClick={() => setIsModalOpen(false)} className="mb-8 text-stone-400">✕ Close</button>
            <h3 className="text-2xl font-black text-[#1a2e1a] mb-6">{selectedRes.reserved_for}</h3>
            
            <div className="space-y-4">
              <button 
                onClick={() => updateStatus(selectedRes.reservation_id, 'Checked In')}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest"
              >
                Mark as Checked In
              </button>
              <button 
                onClick={() => updateStatus(selectedRes.reservation_id, 'Completed')}
                className="w-full py-4 border-2 border-stone-100 text-stone-400 rounded-2xl font-bold uppercase text-[10px] tracking-widest"
              >
                Mark as Completed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}