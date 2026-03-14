"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function EventsTable() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Custom Alert/Confirm State
  const [confirmDelete, setConfirmDelete] = useState(null); 

  useEffect(() => { fetchEvents(); }, []);

  async function fetchEvents() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('event_bookings')
        .select(`*, reservations (*)`)
        .order('event_date', { ascending: true });
      if (error) throw error;
      setEvents(data || []);
    } catch (error) { 
      console.error(error.message); 
    } finally { 
      setLoading(false); 
    }
  }

  // Handle Approval
  const approveEvent = async (id) => {
    const { error } = await supabase
      .from('event_bookings')
      .update({ event_status: 'Confirmed' })
      .eq('event_id', id);
    
    if (error) console.error(error.message);
    else fetchEvents();
  };

  // Handle Permanent Deletion (Reject)
  const deleteEvent = async (id) => {
    const { error } = await supabase
      .from('event_bookings')
      .delete()
      .eq('event_id', id);
    
    if (error) {
        alert("Error deleting: " + error.message);
    } else {
        setConfirmDelete(null);
        setSelectedEvent(null);
        fetchEvents();
    }
  };

  if (loading) return (
    <div className="p-20 text-center animate-pulse uppercase text-[10px] font-bold tracking-widest text-stone-400">
      Loading event database...
    </div>
  );

  return (
    <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden relative">
      <table className="w-full text-left">
        <thead className="bg-stone-50 border-b border-stone-100 uppercase text-[10px] font-black text-stone-400 tracking-widest">
          <tr>
            <th className="px-8 py-5">Event & Type</th>
            <th className="px-8 py-5">Brief Details</th>
            <th className="px-8 py-5">Schedule</th>
            <th className="px-8 py-5">Status</th>
            <th className="px-8 py-5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50">
          {events.map((ev) => (
            <tr key={ev.event_id} className="hover:bg-stone-50/50 transition-colors">
              <td className="px-8 py-6">
                <p className="font-bold text-[#1a2e1a] text-sm uppercase">{ev.event_name}</p>
                <p className="text-[9px] text-orange-600 font-bold uppercase tracking-tighter">{ev.event_type}</p>
              </td>
              <td className="px-8 py-6 text-[11px] text-stone-500 line-clamp-2 max-w-[200px]">
                  {ev.details || 'No instructions.'}
              </td>
              <td className="px-8 py-6">
                <p className="text-xs font-bold text-stone-500 uppercase">{ev.event_date}</p>
                <p className="text-[10px] text-stone-400 font-bold uppercase">{ev.guests} Pax</p>
              </td>
              <td className="px-8 py-6">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                  ev.event_status === 'Confirmed' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {ev.event_status}
                </span>
              </td>
              <td className="px-8 py-6 text-right space-x-2">
                <button onClick={() => setSelectedEvent(ev)} className="bg-stone-100 text-stone-600 px-3 py-2 rounded-xl font-bold text-[9px] uppercase hover:bg-stone-200 transition-all">More Details</button>
                <button onClick={() => approveEvent(ev.event_id)} className="bg-[#1a2e1a] text-white px-3 py-2 rounded-xl font-bold text-[9px] uppercase hover:bg-orange-600 transition-all">Approve</button>
                <button onClick={() => setConfirmDelete(ev)} className="bg-red-50 text-red-500 px-3 py-2 rounded-xl font-bold text-[9px] uppercase border border-red-100 hover:bg-red-500 hover:text-white transition-all">Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* --- CUSTOM DELETE CONFIRMATION WINDOW --- */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-[#1a2e1a]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-6">⚠️</div>
            <h3 className="text-xl font-black text-[#1a2e1a] uppercase tracking-tight">Confirm Rejection</h3>
            <p className="text-stone-500 text-sm mt-3 leading-relaxed">
              Are you sure you want to reject <strong>{confirmDelete.event_name}</strong>? Removing request can't be undone and is permanent.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button onClick={() => setConfirmDelete(null)} className="py-4 bg-stone-100 text-stone-600 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-stone-200 transition-all">
                Cancel
              </button>
              <button onClick={() => deleteEvent(confirmDelete.event_id)} className="py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-200">
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EVENT BLUEPRINT MODAL --- */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-[#1a2e1a]/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] w-full max-w-5xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-[#1a2e1a] px-12 py-10 text-white flex justify-between items-center text-left">
              <div>
                <p className="text-orange-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Internal Specification</p>
                <h3 className="text-4xl font-black uppercase tracking-tighter leading-none">{selectedEvent.event_name}</h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all">✕</button>
            </div>
            
            <div className="p-12 text-left">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="md:col-span-2 space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="text-[9px] font-bold text-stone-400 uppercase block mb-1">Event Type</label>
                      <p className="text-sm font-black text-[#1a2e1a] uppercase">{selectedEvent.event_type}</p>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-stone-400 uppercase block mb-1">Date</label>
                      <p className="text-sm font-black text-[#1a2e1a] uppercase">{selectedEvent.event_date}</p>
                    </div>
                  </div>
                  <div className="bg-orange-50/50 border border-orange-100 p-8 rounded-[2rem]">
                    <h4 className="text-[11px] font-black uppercase text-orange-800 tracking-[0.2em] mb-4">Event Logistics & Catering Details</h4>
                    <div className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap font-medium">
                      {selectedEvent.details || "No specific details provided."}
                    </div>
                  </div>
                </div>

                <div className="space-y-6 text-left">
                  <div className="bg-stone-50 p-8 rounded-[2.5rem] border border-stone-100">
                    <h4 className="text-[11px] font-black uppercase text-stone-400 tracking-[0.2em] mb-6 text-left">Finance</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[9px] font-bold text-stone-400 uppercase block text-left">Total</label>
                        <p className="text-2xl font-black text-[#1a2e1a] text-left">₱{selectedEvent.reservations?.total?.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-red-400 uppercase block text-left">Balance</label>
                        <p className="text-2xl font-black text-red-500 text-left">₱{selectedEvent.reservations?.balance?.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-12 py-8 bg-stone-50 border-t border-stone-100 flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(selectedEvent)} className="px-6 py-4 bg-red-50 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                Reject Event
              </button>
              <button onClick={() => setSelectedEvent(null)} className="px-12 py-4 bg-[#1a2e1a] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl">
                Close Blueprint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}