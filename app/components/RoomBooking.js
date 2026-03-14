"use client";
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function RoomBooking() {
  const [selectedRoom, setSelectedRoom] = useState('deluxe');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [notification, setNotification] = useState({ show: false, title: '', message: '', type: 'info' });
  
  const [formData, setFormData] = useState({
    fullName: '',
    birthdate: '',
    contact_number: '',
    email: '',
    checkIn: '',
    checkOut: '',
    guests: 0,
    guestNames: '' 
  });

  const rooms = [
    { id: 'deluxe', name: 'Deluxe Stone Cabin', price: 4500, maxGuests: 4, features: ['King Bed', 'Mountain View', 'Breakfast'] },
    { id: 'family', name: 'Family Heritage Loft', price: 8500, maxGuests: 6, features: ['2 Queen Beds', 'Private Deck', 'Kitchenette'] },
    { id: 'summit', name: 'The Summit Suite', price: 12000, maxGuests: 10, features: ['Panoramic View', 'Outdoor Tub', 'Butler Service'] }
  ];

  const currentRoom = rooms.find(r => r.id === selectedRoom);

  const calculateAge = (date) => {
    if (!date) return null;
    const today = new Date();
    const birth = new Date(date);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const age = calculateAge(formData.birthdate);
  const isUnderage = age !== null && age < 18;

  const handleContactChange = (e) => {
    const val = e.target.value.replace(/\D/g, ''); 
    if (val.length <= 11) {
      setFormData({ ...formData, contact_number: val });
    }
  };

  const showAlert = (title, message, type = 'error') => {
    setNotification({ show: true, title, message, type });
  };

  const triggerConfirm = (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.checkIn || !formData.checkOut || !formData.birthdate) {
      return showAlert("Missing Information", "Please fill in all required fields.");
    }

    const cin = new Date(formData.checkIn);
    const cout = new Date(formData.checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (cin < today) {
      return showAlert("Invalid Date", "Check-in date cannot be in the past.");
    }
    if (cin >= cout) {
      return showAlert("Invalid Stay Duration", "Check-out must be at least one day after check-in.");
    }

    if (isUnderage) {
      return showAlert("Age Restriction", "You must be 18 or above to book.");
    }

    if (!formData.contact_number.startsWith("09") || formData.contact_number.length !== 11) {
      return showAlert("Invalid Number", "Contact number must start with 09 and be 11 digits.");
    }

    if (formData.guests > currentRoom.maxGuests) {
      return showAlert("Guest Limit Exceeded", `The ${currentRoom.name} allows a maximum of ${currentRoom.maxGuests} additional guests.`);
    }

    if (formData.guests >= 1 && !formData.guestNames.trim()) {
      return showAlert("Companion Details Required", "Please provide the names of your guests.");
    }

    setShowConfirm(true);
  };

  const executeBooking = async () => {
    setShowConfirm(false);
    setLoading(true);

    try {
      const { data: customer, error: custErr } = await supabase
        .from('customers')
        .insert([{
          full_name: formData.fullName,
          age: age,
          contact_number: formData.contact_number,
          email: formData.email ? formData.email.trim() : '',
          customer_category: 'Staycation', 
          created_at: new Date().toISOString()
        }])
        .select().single();

      if (custErr) throw custErr;

      const { data: resData, error: resError } = await supabase
        .from('reservations')
        .insert([{
          customer_id: customer.customer_id,
          reserved_for: formData.fullName,
          purpose: 'Staycation',
          expected_guests: formData.guests,
          reservation_status: 'Pending Payment',
          customer_reservation_date: new Date().toISOString().split('T')[0],
          total: currentRoom.price,
          downpayment: 0,
          balance: currentRoom.price
        }])
        .select().single();

      if (resError) throw resError;

      const { error: roomError } = await supabase
        .from('room_bookings')
        .insert([{
          reservation_id: resData.reservation_id,
          room_type: currentRoom.name,
          number_of_rooms: 1,
          check_in_date: formData.checkIn,
          check_out_date: formData.checkOut,
          total_price: currentRoom.price
        }]);

      if (roomError) throw roomError;

      if (formData.guestNames.trim()) {
        const { error: guestError } = await supabase
          .from('reservation_guests')
          .insert([{
            reservation_id: resData.reservation_id,
            customer_id: customer.customer_id,
            guests_names: formData.guestNames.trim()
          }]);
        if (guestError) throw guestError;
      }

      showAlert("Reservation Successful!", "Your sanctuary has been reserved. We will contact you shortly.", "success");

    } catch (err) {
      showAlert("Booking failed", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseNotification = () => {
    const isSuccess = notification.type === 'success';
    setNotification({ ...notification, show: false });
    if (isSuccess) window.location.reload();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20 px-4 max-w-6xl mx-auto">
      <div className="mb-12">
        <span className="text-orange-600 font-bold tracking-[0.3em] text-[10px] uppercase">Overnight Stay</span>
        <h2 className="text-5xl font-bold text-[#1a2e1a] mt-2 tracking-tight">Reserve Your Sanctuary</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => setSelectedRoom(room.id)}
                className={`text-left p-6 rounded-[2rem] transition-all duration-500 border-2 ${
                  selectedRoom === room.id 
                  ? 'bg-[#1a2e1a] border-[#1a2e1a] text-white shadow-2xl scale-[1.02]' 
                  : 'bg-white border-stone-100 text-[#1a2e1a] hover:border-stone-200'
                }`}
              >
                <p className={`text-[10px] font-bold uppercase tracking-tighter mb-4 ${selectedRoom === room.id ? 'text-orange-400' : 'text-orange-600'}`}>
                  ₱{room.price.toLocaleString()} / night
                </p>
                <h3 className="text-xl font-bold mb-2">{room.name}</h3>
                <p className="text-[9px] mb-4 opacity-80 uppercase tracking-widest font-bold">Max {room.maxGuests} Guests</p>
                <ul className="space-y-2">
                  {room.features.map(f => (
                    <li key={f} className="text-[10px] opacity-70 flex items-center gap-2"><span>•</span> {f}</li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-stone-200/50 border border-stone-100 mt-8">
            <form onSubmit={triggerConfirm} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">Full Name</label>
                <input required type="text" placeholder="Enter guest name" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full bg-stone-50 border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-stone-100 transition-all" />
              </div>

              {/* BIRTHDATE INPUT WITH ERROR MESSAGE */}
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">Birthday</label>
                <input 
                  required 
                  type="date" 
                  value={formData.birthdate} 
                  onChange={(e) => setFormData({...formData, birthdate: e.target.value})} 
                  className={`w-full bg-stone-50 border-2 rounded-2xl p-4 outline-none transition-all ${isUnderage ? 'border-red-200 ring-2 ring-red-50' : 'border-transparent'}`} 
                />
                {isUnderage && (
                  <p className="text-[10px] text-red-600 font-bold ml-1 animate-bounce">
                    ⚠️ You must be 18 years old or above to book.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">Contact Number</label>
                <input required type="text" value={formData.contact_number} onChange={handleContactChange} className="w-full bg-stone-50 border-none rounded-2xl p-4 outline-none placeholder:text-stone-300" placeholder="09XXXXXXXXX" />
              </div>

              <div className="space-y-3 group">
                <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1 group-focus-within:text-orange-600 transition-colors">Check-In</label>
                <div className="relative">
                  <input 
                    required 
                    type="date" 
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.checkIn} 
                    onChange={(e) => setFormData({...formData, checkIn: e.target.value})} 
                    className="w-full bg-stone-50 border-2 border-transparent rounded-2xl p-4 outline-none focus:bg-white focus:border-orange-100 transition-all font-medium text-[#1a2e1a]" 
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">📅</span>
                </div>
              </div>

              <div className="space-y-3 group">
                <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1 group-focus-within:text-orange-600 transition-colors">Check-Out</label>
                <div className="relative">
                  <input 
                    required 
                    type="date" 
                    min={formData.checkIn || new Date().toISOString().split('T')[0]}
                    value={formData.checkOut} 
                    onChange={(e) => setFormData({...formData, checkOut: e.target.value})} 
                    className="w-full bg-stone-50 border-2 border-transparent rounded-2xl p-4 outline-none focus:bg-white focus:border-orange-100 transition-all font-medium text-[#1a2e1a]" 
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">🗝️</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">Additional Guests</label>
                <input required type="number" min="0" max={currentRoom.maxGuests} value={formData.guests} onChange={(e) => setFormData({...formData, guests: parseInt(e.target.value) || 0})} className="w-full bg-stone-50 border-none rounded-2xl p-4 outline-none" />
              </div>

              <div className="space-y-3 group">
                <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1 transition-colors group-focus-within:text-[#1a2e1a]">
                  Guest Names {formData.guests >= 1 && <span className="text-orange-600 font-black">*</span>}
                </label>
                <input 
                  type="text" 
                  placeholder={formData.guests >= 1 ? "Required: Companion Names" : "Optional (if alone)"} 
                  value={formData.guestNames} 
                  onChange={(e) => setFormData({...formData, guestNames: e.target.value})} 
                  className={`w-full bg-stone-50 border-2 border-transparent rounded-2xl p-4 outline-none transition-all focus:bg-white ${formData.guests >= 1 && !formData.guestNames ? 'ring-2 ring-orange-100 border-orange-200' : 'focus:border-stone-200'}`} 
                />
              </div>

              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">Email Address (Optional)</label>
                <input type="email" placeholder="yourname@gmail.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-orange-50/30 border border-orange-100/50 rounded-2xl p-4 outline-none focus:bg-white transition-all" />
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="sticky top-32 bg-stone-100 rounded-[2.5rem] p-8 border border-stone-200">
            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-6">Booking Summary</h3>
            <div className="space-y-4 mb-8 text-sm">
              <div className="flex justify-between items-end">
                <span className="text-stone-500">Room</span>
                <span className="font-bold text-[#1a2e1a] text-right">{currentRoom.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Base Rate</span>
                <span className="font-bold text-[#1a2e1a]">₱{currentRoom.price.toLocaleString()}</span>
              </div>
              {formData.checkIn && formData.checkOut && (
                 <div className="flex justify-between text-[10px] uppercase font-bold text-orange-600">
                    <span>Stay Duration</span>
                    <span>
                      {Math.ceil((new Date(formData.checkOut) - new Date(formData.checkIn)) / (1000 * 60 * 60 * 24))} Night(s)
                    </span>
                 </div>
              )}
            </div>
            
            <div className="pt-6 border-t border-stone-200 mb-8">
              <div className="flex justify-between items-center text-xl font-bold text-[#1a2e1a]">
                <span>Total</span>
                <span className="text-orange-600 underline underline-offset-8">₱{currentRoom.price.toLocaleString()}</span>
              </div>
            </div>

            {/* SIDEBAR AGE WARNING */}
            {isUnderage && (
              <div className="bg-red-50 p-4 rounded-2xl mb-6 border border-red-100">
                <p className="text-[11px] text-red-600 font-bold uppercase text-center leading-tight">
                  Registration Blocked: Minimum age is 18 years old.
                </p>
              </div>
            )}

            <button 
              type="button"
              onClick={triggerConfirm}
              disabled={loading || isUnderage}
              className="w-full bg-[#1a2e1a] text-white py-5 rounded-[1.5rem] font-bold hover:bg-orange-600 transition-all shadow-xl active:scale-95 disabled:bg-stone-300 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Confirm Reservation"}
            </button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl transform animate-in zoom-in-95 duration-300">
            <div className="text-center">
              <div className="bg-stone-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"><span className="text-3xl">🛏️</span></div>
              <h3 className="text-2xl font-bold text-[#1a2e1a] mb-2">Confirm Reservation</h3>
              <p className="text-stone-500 text-sm mb-8 leading-relaxed">Confirm stay for <span className="font-bold">"{currentRoom.name}"</span>?</p>
              <div className="flex flex-col gap-3">
                <button onClick={executeBooking} className="w-full bg-[#1a2e1a] text-white py-4 rounded-2xl font-bold hover:bg-orange-600 transition-all">Yes, Confirm</button>
                <button onClick={() => setShowConfirm(false)} className="w-full bg-stone-100 text-stone-600 py-4 rounded-2xl font-bold hover:bg-stone-200 transition-all">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {notification.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-stone-100 transform animate-in zoom-in-95 duration-300">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${notification.type === 'success' ? 'bg-green-50' : 'bg-orange-50'}`}>
                <span className="text-3xl">{notification.type === 'success' ? '✅' : '⚠️'}</span>
              </div>
              <h3 className="text-2xl font-bold text-[#1a2e1a] mb-2">{notification.title}</h3>
              <p className="text-stone-500 text-sm mb-8 leading-relaxed">{notification.message}</p>
              <button onClick={handleCloseNotification} className="w-full bg-[#1a2e1a] text-white py-4 rounded-2xl font-bold hover:bg-orange-600 transition-all">
                {notification.type === 'success' ? 'Great!' : 'Understood'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}