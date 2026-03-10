"use client";
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function RoomBooking() {
  const [selectedRoom, setSelectedRoom] = useState('deluxe');
  const [loading, setLoading] = useState(false);
  
  // 1. ADDED: State for Form Inputs
  const [formData, setFormData] = useState({
    fullName: '',
    checkIn: '',
    checkOut: '',
    guests: 2
  });

  const rooms = [
    { id: 'deluxe', name: 'Deluxe Stone Cabin', price: 4500, features: ['King Bed', 'Mountain View', 'Breakfast'] },
    { id: 'family', name: 'Family Heritage Loft', price: 8500, features: ['2 Queen Beds', 'Private Deck', 'Kitchenette'] },
    { id: 'summit', name: 'The Summit Suite', price: 12000, features: ['Panoramic View', 'Outdoor Tub', 'Butler Service'] }
  ];

  const currentRoom = rooms.find(r => r.id === selectedRoom);

  // 2. ADDED: Submission Logic
  const handleConfirmReservation = async () => {
    if (!formData.fullName || !formData.checkIn || !formData.checkOut) {
      alert("Please fill in all details");
      return;
    }

    setLoading(true);
    try {
      // Step A: Insert into 'reservations' table
      const { data: resData, error: resError } = await supabase
        .from('reservations')
        .insert([{
          reserved_for: formData.fullName,
          purpose: 'Staycation',
          expected_guests: formData.guests,
          reservation_status: 'Pending',
          customer_reservation_date: new Date().toISOString().split('T')[0],
          total: currentRoom.price,
          balance: currentRoom.price
        }])
        .select()
        .single();

      if (resError) throw resError;

      // Step B: Insert into 'room_bookings' table using the new reservation_id
      const { error: roomError } = await supabase
        .from('room_bookings')
        .insert([{
          reservation_id: resData.reservation_id,
          room_type: currentRoom.name,
          check_in_date: formData.checkIn,
          check_out_date: formData.checkOut,
          total_price: currentRoom.price
        }]);

      if (roomError) throw roomError;

      alert("Reservation Successful! Redirecting...");
      window.location.reload(); // Refresh to clear form
    } catch (err) {
      console.error(err);
      alert("Booking failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="mb-12">
        <span className="text-orange-600 font-bold tracking-[0.3em] text-[10px] uppercase">Overnight Stay</span>
        <h2 className="text-5xl font-bold text-[#1a2e1a] mt-2 tracking-tight">Reserve Your Sanctuary</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-6">
          <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">Select Accommodations</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <button
                key={room.id}
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
                <h3 className="text-xl font-bold mb-4">{room.name}</h3>
                <ul className="space-y-2">
                  {room.features.map(f => (
                    <li key={f} className="text-[10px] opacity-70 flex items-center gap-2"><span>•</span> {f}</li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          {/* Form Inputs with onChange attached */}
          <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-stone-200/50 border border-stone-100 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">Check-In</label>
                <input 
                  type="date" 
                  onChange={(e) => setFormData({...formData, checkIn: e.target.value})}
                  className="w-full bg-stone-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-orange-500/20 outline-none" 
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">Check-Out</label>
                <input 
                  type="date" 
                  onChange={(e) => setFormData({...formData, checkOut: e.target.value})}
                  className="w-full bg-stone-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-orange-500/20 outline-none" 
                />
              </div>
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">Full Name</label>
                <input 
                  type="text" 
                  placeholder="Enter guest name" 
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full bg-stone-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-orange-500/20 outline-none" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-4">
          <div className="sticky top-32 bg-stone-100 rounded-[2.5rem] p-8 border border-stone-200">
            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-6">Booking Summary</h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-end">
                <span className="text-stone-500 text-sm">Accommodation</span>
                <span className="font-bold text-[#1a2e1a] text-right text-sm">{currentRoom.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 text-sm">Base Rate</span>
                <span className="font-bold text-[#1a2e1a]">₱{currentRoom.price.toLocaleString()}</span>
              </div>
            </div>
            <div className="pt-6 border-t border-stone-200 mb-8">
              <div className="flex justify-between items-center text-xl font-bold text-[#1a2e1a]">
                <span>Total</span>
                <span className="text-orange-600 underline underline-offset-8">₱{currentRoom.price.toLocaleString()}</span>
              </div>
            </div>
            <button 
              onClick={handleConfirmReservation}
              disabled={loading}
              className="w-full bg-[#1a2e1a] text-white py-5 rounded-[1.5rem] font-bold hover:bg-orange-600 transition-all shadow-xl active:scale-95 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Confirm Reservation"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}