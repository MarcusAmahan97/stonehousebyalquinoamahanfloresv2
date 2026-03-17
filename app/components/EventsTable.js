"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function EventsTable({ searchTerm }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  const [confirmReject, setConfirmReject] = useState(null);
  const [confirmApprove, setConfirmApprove] = useState(null);
  const [showFinishedWarning, setShowFinishedWarning] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('event_bookings')
        .select(`*, reservations (reservation_id, balance, reservation_status)`)
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Fetch error:", error.message);
    } finally {
      setLoading(false);
    }
  }

  const approveEvent = async (id) => {
    try {
      const { error } = await supabase
        .from('event_bookings')
        .update({ event_status: 'Preparation' })
        .eq('event_id', id);

      if (error) throw error;
      setConfirmApprove(null);
      fetchEvents();
    } catch (error) {
      alert("Approval failed: " + error.message);
    }
  };

  const rejectEvent = async (id) => {
    try {
      const { error } = await supabase
        .from('event_bookings')
        .update({ event_status: 'Rejected' })
        .eq('event_id', id);

      if (error) throw error;
      setConfirmReject(null);
      fetchEvents();
    } catch (error) {
      alert("Rejection failed: " + error.message);
    }
  };

  const updateOperationalStatus = async (id, newStatus) => {
    try {
      setStatusUpdateLoading(true);
      const { error: eventError } = await supabase
        .from('event_bookings')
        .update({ event_status: newStatus })
        .eq('event_id', id);

      if (eventError) throw eventError;

      const currentRes = selectedEvent.reservations;
      if (newStatus === 'Finished' && currentRes?.balance <= 0) {
        await supabase
          .from('reservations')
          .update({ reservation_status: 'Completed' })
          .eq('reservation_id', currentRes.reservation_id);
      }

      setShowFinishedWarning(false);
      setSelectedEvent(null);
      fetchEvents();
    } catch (error) {
      alert("Status update failed: " + error.message);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'Finished': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Ongoing': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Preparation': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Rejected': return 'bg-red-50 text-red-600 border-red-100';
      case 'Inquiry': return 'bg-stone-100 text-stone-500 border-stone-200';
      default: return 'bg-stone-50 text-stone-400 border-stone-100';
    }
  };

  const filteredEvents = events.filter(ev => 
    ev.event_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ev.event_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-20 text-center animate-pulse text-[10px] font-black text-stone-400 uppercase tracking-widest">Accessing Event Registry...</div>;

  return (
    <div className="relative">
      <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-stone-50 border-b border-stone-100">
            <tr className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
              <th className="px-8 py-5">Event Detail</th>
              <th className="px-8 py-5 text-center">Schedule</th>
              <th className="px-8 py-5 text-center">Status</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {filteredEvents.map((ev) => {
              const currentStatus = ev.event_status || 'Inquiry';
              return (
                <tr key={ev.event_id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <p className="font-bold text-[#1a2e1a] text-sm uppercase">{ev.event_name}</p>
                    <p className="text-[9px] text-orange-600 font-bold uppercase">{ev.event_type}</p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <p className="text-xs font-bold text-stone-600 uppercase">{ev.event_date}</p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${getStatusStyles(currentStatus)}`}>
                      {currentStatus}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end items-center gap-2">
                      {/* Show Accept/Reject only if status is Inquiry */}
                      {currentStatus === 'Inquiry' && (
                        <>
                          <button 
                            onClick={() => setConfirmApprove(ev)} 
                            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase hover:bg-emerald-700 transition-all"
                          >
                            Accept
                          </button>
                          <button 
                            onClick={() => setConfirmReject(ev)} 
                            className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-bold uppercase hover:bg-red-100 transition-all"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {/* Blueprint is accessible unless Rejected */}
                      {currentStatus !== 'Rejected' && (
                        <button 
                          onClick={() => setSelectedEvent(ev)} 
                          className="bg-stone-100 text-stone-600 px-4 py-2 rounded-xl text-[10px] font-bold uppercase hover:bg-stone-200 transition-all"
                        >
                          Blueprint
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* --- ACCEPTANCE MODAL (Pop-up as requested) --- */}
      {confirmApprove && (
        <div className="fixed inset-0 bg-[#1a2e1a]/80 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 shadow-2xl text-center border border-stone-100">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-black">!</div>
            <h3 className="text-xl font-black text-[#1a2e1a] uppercase">Confirm Acceptance?</h3>
            <p className="text-stone-500 text-sm mt-3 leading-relaxed">
              Once you accept this event, <strong>it cannot be undone</strong>. The booking will be finalized and guest payments will continue.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button onClick={() => setConfirmApprove(null)} className="py-4 bg-stone-100 text-stone-600 rounded-2xl font-bold text-[10px] uppercase">Cancel</button>
              <button onClick={() => approveEvent(confirmApprove.event_id)} className="py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-emerald-200">Yes, Accept</button>
            </div>
          </div>
        </div>
      )}

      {/* --- REJECTION MODAL --- */}
      {confirmReject && (
        <div className="fixed inset-0 bg-[#1a2e1a]/80 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 shadow-2xl text-center border border-stone-100">
            <h3 className="text-xl font-black text-[#1a2e1a] uppercase">Reject Inquiry?</h3>
            <p className="text-stone-500 text-sm mt-3 leading-relaxed">
              Are you sure you want to reject <strong>{confirmReject.event_name}</strong>? The record will remain but be marked as Rejected.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button onClick={() => setConfirmReject(null)} className="py-4 bg-stone-100 text-stone-600 rounded-2xl font-bold text-[10px] uppercase">Cancel</button>
              <button onClick={() => rejectEvent(confirmReject.event_id)} className="py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-red-200">Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* --- FINISHED WARNING --- */}
      {showFinishedWarning && (
        <div className="fixed inset-0 bg-[#1a2e1a]/80 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 shadow-2xl text-center">
            <h3 className="text-xl font-black text-[#1a2e1a] uppercase">Finish Event?</h3>
            <p className="text-stone-500 text-sm mt-3 leading-relaxed">
              Marking this as Finished will close the reservation if the balance is ₱0.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button onClick={() => setShowFinishedWarning(false)} className="py-4 bg-stone-100 text-stone-600 rounded-2xl font-bold text-[10px] uppercase">Wait</button>
              <button onClick={() => updateOperationalStatus(selectedEvent.event_id, "Finished")} className="py-4 bg-[#1a2e1a] text-white rounded-2xl font-black text-[10px] uppercase">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* --- BLUEPRINT MODAL --- */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-[#1a2e1a]/95 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[3.5rem] w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col h-[80vh]">
            <div className="bg-[#1a2e1a] px-12 py-10 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-4xl font-black uppercase tracking-tighter">{selectedEvent.event_name}</h3>
                <div className="flex items-center gap-4 mt-3">
                  {/* Status Dropdown inside Blueprint - Only for accepted events */}
                  {selectedEvent.event_status !== 'Inquiry' && (
                    <div className="relative">
                      <select 
                        disabled={statusUpdateLoading || selectedEvent.event_status === 'Finished'}
                        value={selectedEvent.event_status}
                        onChange={(e) => {
                          if (e.target.value === 'Finished') setShowFinishedWarning(true);
                          else updateOperationalStatus(selectedEvent.event_id, e.target.value);
                        }}
                        className="appearance-none bg-white text-[#1a2e1a] text-[10px] font-black uppercase px-6 py-2 rounded-xl outline-none pr-12 disabled:opacity-50"
                      >
                        <option value="Preparation">Preparation</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Finished">Finished</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-[#1a2e1a]/40">▼</div>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="p-4 text-white/40 hover:text-white font-bold">✕</button>
            </div>
            
            <div className="p-12 overflow-y-auto grow">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-stone-50 border border-stone-100 p-10 rounded-[2.5rem]">
                    <h4 className="text-[11px] font-black text-stone-400 uppercase tracking-widest mb-6 border-b border-stone-200 pb-2">Event Specifications</h4>
                    <p className="text-stone-700 leading-relaxed font-medium">{selectedEvent.details || "No special instructions provided for this event."}</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-[#f9f9f8] p-10 rounded-[2.5rem] border border-stone-200/50">
                    <h4 className="text-[11px] font-black text-stone-400 uppercase tracking-widest mb-4">Financial Overview</h4>
                    <p className="text-3xl font-black text-[#1a2e1a]">₱{selectedEvent.reservations?.balance?.toLocaleString() || "0"}</p>
                    <p className="text-[9px] font-bold text-stone-400 uppercase mt-1">Outstanding Balance</p>

                    <div className="mt-10 pt-6 border-t border-stone-200 space-y-4">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Completion Checklist</p>
                      <div className="flex items-center justify-between">
                         <span className="text-[11px] font-bold text-stone-600">Balance is ₱0</span>
                         <span className={selectedEvent.reservations?.balance <= 0 ? "text-emerald-500 font-bold text-xs" : "text-stone-300 font-bold text-xs"}>
                           {selectedEvent.reservations?.balance <= 0 ? "✓" : "○"}
                         </span>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-[11px] font-bold text-stone-600">Status is Finished</span>
                         <span className={selectedEvent.event_status === 'Finished' ? "text-emerald-500 font-bold text-xs" : "text-stone-300 font-bold text-xs"}>
                           {selectedEvent.event_status === 'Finished' ? "✓" : "○"}
                         </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-12 py-8 bg-stone-50 border-t border-stone-100 flex justify-end shrink-0">
              <button onClick={() => setSelectedEvent(null)} className="px-10 py-4 bg-[#1a2e1a] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-stone-200">
                Exit Blueprint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}