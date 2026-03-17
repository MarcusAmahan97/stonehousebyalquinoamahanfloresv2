"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function RoomsTable({ searchTerm }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDetails, setSelectedDetails] = useState(null);
  
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    type: "neutral" 
  });

  useEffect(() => { fetchRooms(); }, []);

  async function fetchRooms() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('room_bookings')
        .select(`*, reservations(*, reservation_guests(*))`)
        .order('check_in_date', { ascending: true });
      
      if (error) throw error;
      setRooms(data || []);
    } catch (err) { 
      console.error(err.message); 
    } finally { 
      setLoading(false); 
    }
  }

  const triggerConfirm = (title, message, type, action) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: async () => {
        await action();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  async function updateStatus(reservationId, bookingId, newStatus, additionalBookingData = {}) {
    try {
      const { error: resError } = await supabase
        .from('reservations')
        .update({ reservation_status: newStatus })
        .eq('reservation_id', reservationId);
      
      if (resError) throw resError;

      if (Object.keys(additionalBookingData).length > 0) {
        const { error: bookError } = await supabase
          .from('room_bookings')
          .update(additionalBookingData)
          .eq('booking_id', bookingId);
        
        if (bookError) throw bookError;
      }

      fetchRooms();
      if (selectedDetails) setSelectedDetails(null); 
    } catch (err) { 
      alert("Update failed: " + err.message); 
    }
  }

  async function handleDelete(bookingId) {
    try {
      const { error } = await supabase.from('room_bookings').delete().eq('booking_id', bookingId);
      if (error) throw error;
      fetchRooms();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  }

  const filteredRooms = rooms.filter(r => {
    const guest = r.reservations?.reserved_for?.toLowerCase() || "";
    const type = r.room_type?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return guest.includes(search) || type.includes(search);
  });

  if (loading) return <div className="p-20 text-center animate-pulse uppercase text-[10px] font-bold tracking-widest text-stone-400">Loading stays...</div>;

  return (
    <div className="relative">
      <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-stone-50 border-b border-stone-100 uppercase text-[10px] font-black text-stone-400 tracking-widest">
            <tr>
              <th className="px-8 py-5">Guest Details</th>
              <th className="px-8 py-5">Accommodation</th>
              <th className="px-8 py-5">Status & Finance</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {filteredRooms.map((r) => {
              const res = r.reservations;
              const status = res?.reservation_status;
              const hasCheckedOut = !!r.real_check_out_date;

              return (
                <tr key={r.booking_id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-8 py-6">
                    {r.real_check_in_date && (
                      <p className="text-[8px] font-black text-blue-500 uppercase mb-1">
                        In: {new Date(r.real_check_in_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    )}
                    {r.real_check_out_date && (
                      <p className="text-[8px] font-black text-emerald-500 uppercase mb-1">
                        Out: {new Date(r.real_check_out_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    )}
                    <p className="font-bold text-[#1a2e1a] text-sm uppercase leading-none">{res?.reserved_for || 'Guest'}</p>
                    <button onClick={() => setSelectedDetails(r)} className="text-[9px] font-black text-blue-500 uppercase mt-2 hover:underline">
                      More Details
                    </button>
                  </td>

                  <td className="px-8 py-6">
                    <p className="text-xs font-bold text-stone-600">{r.room_type}</p>
                    <p className="text-[10px] text-stone-400 font-bold uppercase">{r.check_in_date} — {r.check_out_date}</p>
                  </td>

                  <td className="px-8 py-6">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                      status === 'Checked In' ? 'bg-blue-100 text-blue-700' :
                      status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 
                      status === 'Fully Paid' ? 'bg-blue-50 text-blue-600' :
                      status === 'Pending Payment' ? 'bg-red-50 text-red-600' :
                      'bg-stone-100 text-stone-500'
                    }`}>
                      {status || 'Confirmed'}
                    </span>
                    <p className="text-xs font-black text-[#1a2e1a] mt-1">₱{r.total_price?.toLocaleString()}</p>
                  </td>

                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end items-center gap-3">
                      
                      {!r.real_check_in_date && !hasCheckedOut && (
                        <button 
                            onClick={() => triggerConfirm(
                            "Confirm Check-In",
                            `Mark ${res?.reserved_for} as Checked In?`,
                            "neutral",
                            () => updateStatus(res.reservation_id, r.booking_id, 'Checked In', { 
                                real_check_in_date: new Date().toISOString() 
                            })
                            )}
                            className="bg-[#1a2e1a] text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-black transition-all"
                        >
                            Check-In
                        </button>
                      )}

                      {status === 'Checked In' && (
                        <button 
                            onClick={() => triggerConfirm(
                            "Confirm Checkout",
                            `Process checkout for ${res?.reserved_for}?`,
                            "neutral",
                            () => {
                            // If balance is 0 or less, mark as Completed; otherwise, Pending Payment
                            const nextStatus = (res.balance <= 0) ? 'Completed' : 'Pending Payment';
                            updateStatus(res.reservation_id, r.booking_id, nextStatus, { 
                                real_check_out_date: new Date().toISOString() 
                            });
                            }
                            )}
                            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-blue-700 transition-all"
                        >
                            Checkout
                        </button>
                      )}
                      
                      <button onClick={() => triggerConfirm("Delete Booking", "This action cannot be undone.", "danger", () => handleDelete(r.booking_id))} className="text-stone-300 hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* --- CONFIRMATION MODAL WINDOW --- */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2rem] max-w-sm w-full p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className={`text-lg font-black uppercase tracking-tighter mb-2 ${confirmModal.type === 'danger' ? 'text-red-600' : 'text-[#1a2e1a]'}`}>{confirmModal.title}</h3>
            <p className="text-stone-500 text-sm font-medium mb-8 leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} className="flex-1 px-6 py-3 rounded-xl border border-stone-100 text-[10px] font-black uppercase text-stone-400">Cancel</button>
              <button onClick={confirmModal.onConfirm} className={`flex-1 px-6 py-3 rounded-xl text-[10px] font-black uppercase text-white ${confirmModal.type === 'danger' ? 'bg-red-500' : 'bg-[#1a2e1a]'}`}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MORE DETAILS SLIDE-OVER --- */}
      {selectedDetails && (
        <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-10 flex flex-col gap-8 animate-in slide-in-from-right duration-300 overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-[#1a2e1a] uppercase tracking-tighter">Stay Details</h2>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{selectedDetails.reservations?.reserved_for}</p>
              </div>
              <button onClick={() => setSelectedDetails(null)} className="text-stone-300 hover:text-stone-600 text-2xl">×</button>
            </div>

            <div className="space-y-6">
              <section>
                <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">Registered Guests</h3>
                <div className="bg-stone-50 rounded-2xl p-4 space-y-2">
                  {selectedDetails.reservations?.reservation_guests?.length > 0 ? (
                    selectedDetails.reservations.reservation_guests.map((g, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                        <p className="text-xs font-bold text-stone-600 uppercase">{g.guests_names}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] font-bold text-stone-400 uppercase italic">No additional guests listed.</p>
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">Timeline</h3>
                <div className="grid grid-cols-1 gap-3 text-xs font-bold">
                  <div className="p-4 bg-stone-50 rounded-2xl">
                    <p className="text-[9px] font-black text-stone-400 uppercase mb-1">Actual Check-In</p>
                    {selectedDetails.real_check_in_date ? new Date(selectedDetails.real_check_in_date).toLocaleString() : "Not Checked In Yet"}
                  </div>
                  <div className="p-4 bg-stone-50 rounded-2xl">
                    <p className="text-[9px] font-black text-stone-400 uppercase mb-1">Actual Check-Out</p>
                    {selectedDetails.real_check_out_date ? new Date(selectedDetails.real_check_out_date).toLocaleString() : "Stay in Progress"}
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">Finance</h3>
                <div className="border border-stone-100 rounded-3xl overflow-hidden text-sm">
                   <div className="p-4 flex justify-between border-b border-stone-50">
                    <span className="text-stone-500 font-bold uppercase text-[10px]">Room Subtotal</span>
                    <span className="font-black">₱{selectedDetails.total_price?.toLocaleString()}</span>
                  </div>
                  <div className={`p-4 flex justify-between ${selectedDetails.reservations?.balance > 0 ? 'bg-red-50/30' : 'bg-emerald-50/30'}`}>
                    <span className={`${selectedDetails.reservations?.balance > 0 ? 'text-red-600' : 'text-emerald-600'} font-bold uppercase text-[10px]`}>Balance Due</span>
                    <span className={`font-black ${selectedDetails.reservations?.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>₱{selectedDetails.reservations?.balance?.toLocaleString()}</span>
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-auto flex flex-col gap-3">
              {selectedDetails.reservations?.reservation_status === 'Checked In' && (
                <button 
                  onClick={() => triggerConfirm(
                    "Confirm Checkout",
                    `Finalize stay for ${selectedDetails.reservations?.reserved_for}?`,
                    "neutral",
                    () => {
                      // Logic: If balance is paid, mark as Completed; otherwise, Pending Payment
                      const nextStatus = (selectedDetails.reservations.balance <= 0) ? 'Completed' : 'Pending Payment';
                      updateStatus(selectedDetails.reservations.reservation_id, selectedDetails.booking_id, nextStatus, { real_check_out_date: new Date().toISOString() });
                    }
                  )}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                >
                  Confirm Checkout
                </button>
              )}
              
              {!selectedDetails.real_check_in_date && !selectedDetails.real_check_out_date && (
                <button 
                  onClick={() => triggerConfirm(
                    "Confirm Check-In",
                    `Check-in ${selectedDetails.reservations?.reserved_for} now?`,
                    "neutral",
                    () => updateStatus(selectedDetails.reservations.reservation_id, selectedDetails.booking_id, 'Checked In', { real_check_in_date: new Date().toISOString() })
                  )}
                  className="w-full bg-[#1a2e1a] text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                >
                  Process Check-In
                </button>
              )}
              
              <button onClick={() => setSelectedDetails(null)} className="w-full border border-stone-200 text-stone-400 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Close Panel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}