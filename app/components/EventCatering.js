"use client";
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function EventCatering() {
  const [eventType, setEventType] = useState('Wedding');
  const [loading, setLoading] = useState(false);
  
  // Modal States
  const [showConfirm, setShowConfirm] = useState(false);
  const [notification, setNotification] = useState({ show: false, title: '', message: '', type: 'info' });
  
  // Menu packages
  const menuPackages = [
    { package_id: 1, package_name: 'Classic Filipino Buffet', price_per_package: 450 },
    { package_id: 2, package_name: 'Highland Grill Special', price_per_package: 650 },
    { package_id: 3, package_name: 'Premium Wedding Feast', price_per_package: 850 }
  ];

  const [formData, setFormData] = useState({
    full_name: '',
    event_name: '',
    birthdate: '',
    contact_number: '',
    email: '',
    date: '',
    guests: '',
    package_id: '',
    event_details: '' 
  });

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
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

  const selectedPkg = menuPackages.find(p => p.package_id == formData.package_id);
  const totalAmount = (selectedPkg?.price_per_package || 0) * (parseInt(formData.guests) || 0);
  const downpaymentRequired = totalAmount * 0.50;

  const eventStyles = [
    { id: 'Wedding', name: 'Weddings & Elopements', icon: '💍', desc: 'Intimate mountain ceremonies with panoramic views.' },
    { id: 'Corporate', name: 'Corporate Retreats', icon: '💼', desc: 'Strategic sessions in a tranquil, distraction-free environment.' },
    { id: 'Private', name: 'Private Celebrations', icon: '🎂', desc: 'Birthdays, anniversaries, and family reunions.' }
  ];

  const showAlert = (title, message, type = 'error') => {
    setNotification({ show: true, title, message, type });
  };

  const triggerConfirm = (e) => {
    e.preventDefault();
    if (!formData.date || !formData.package_id || !formData.full_name || !formData.event_name || !formData.birthdate || !formData.event_details) {
      return showAlert("Missing Information", "Please fill in all required fields to proceed.");
    }
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) return showAlert("Invalid Date", "Event date cannot be in the past.");
    if (isUnderage) return showAlert("Age Restriction", "You must be 18 years or older to book.");
    if (!formData.contact_number.startsWith("09") || formData.contact_number.length !== 11) {
      return showAlert("Invalid Number", "Contact number must start with 09 and contain 11 digits.");
    }
    setShowConfirm(true);
  };

  const executeBooking = async () => {
    setShowConfirm(false);
    setLoading(true);

    try {
      // STEP 0: Sync Menu Package
      if (selectedPkg) {
        const { error: syncError } = await supabase
          .from('menu_packages')
          .upsert({ 
            package_id: selectedPkg.package_id, 
            package_name: selectedPkg.package_name,
            price_per_package: selectedPkg.price_per_package 
          }, { onConflict: 'package_id' });
        
        if (syncError) throw new Error("Could not sync menu package: " + syncError.message);
      }

      // 1. Create Customer with created_at logic
      const { data: customer, error: custError } = await supabase
        .from('customers')
        .insert([{ 
          full_name: formData.full_name, 
          age: age,
          contact_number: formData.contact_number,
          email: formData.email ? formData.email.trim() : '',
          customer_category: 'Event Client',
          created_at: new Date().toISOString() // Restored created_at logic
        }])
        .select().single();
      if (custError) throw custError;

      // 2. Create Reservation
      const total = totalAmount;
      const { data: res, error: resErr } = await supabase
        .from('reservations')
        .insert([{
          customer_id: customer.customer_id,
          reserved_for: formData.full_name, 
          purpose: eventType,
          expected_guests: parseInt(formData.guests) || 0,
          reservation_status: 'Pending Payment',
          total: total,
          balance: total, // Initial balance is the full amount until payment is processed
          downpayment: downpaymentRequired,
          customer_reservation_date: formData.date
        }])
        .select().single();
      if (resErr) throw resErr;

      // 3. Create Event Booking
      const { data: event, error: eventErr } = await supabase
        .from('event_bookings')
        .insert([{
          event_name: formData.event_name,
          event_type: eventType,
          event_date: formData.date,
          guests: parseInt(formData.guests) || 0,
          event_status: 'Inquiry',
          reservation_id: res.reservation_id,
          details: formData.event_details,
          venue_room: 'Not Yet Assigned'
        }])
        .select().single();
      if (eventErr) throw eventErr;

      // 4. Create Catering Order
      const { data: order, error: orderErr } = await supabase
        .from('catering_orders')
        .insert([{
          total_amount: total,
          event_id: event.event_id
        }])
        .select().single();
      if (orderErr) throw orderErr;

      // 5. Link Package
      const { error: pkgErr } = await supabase
        .from('catering_package_items')
        .insert([{
          catering_order_id: order.catering_order_id,
          package_id: parseInt(formData.package_id),
          quantity: parseInt(formData.guests) || 0
        }]);
      if (pkgErr) throw pkgErr;

      showAlert("Inquiry Sent!", "Your booking and catering order have been recorded.", 'success');
    } catch (err) {
      showAlert("Database Error", err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseNotification = () => {
    if (notification.type === 'success') window.location.reload();
    setNotification({ ...notification, show: false });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20 px-4 max-w-6xl mx-auto">
      <div className="mb-16 text-center">
        <span className="text-orange-600 font-bold tracking-[0.4em] text-[10px] uppercase">Bespoke Gatherings</span>
        <h2 className="text-5xl md:text-6xl font-bold text-[#1a2e1a] mt-4 tracking-tight">Events at Stone House</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {eventStyles.map((style) => (
          <button
            key={style.id}
            type="button"
            onClick={() => setEventType(style.id)}
            className={`p-8 rounded-[2.5rem] text-left transition-all duration-500 border-2 ${
              eventType === style.id 
              ? 'bg-[#1a2e1a] border-[#1a2e1a] text-white shadow-2xl scale-[1.02]' 
              : 'bg-white border-stone-100 text-[#1a2e1a] hover:border-stone-200'
            }`}
          >
            <div className="text-3xl mb-4">{style.icon}</div>
            <h3 className="text-xl font-bold mb-2">{style.name}</h3>
            <p className={`text-xs leading-relaxed ${eventType === style.id ? 'text-stone-300' : 'text-stone-500'}`}>{style.desc}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-stone-100 max-w-4xl mx-auto">
        <form onSubmit={triggerConfirm} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Full Name</label>
            <input required type="text" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="w-full bg-stone-50 border-none rounded-2xl p-4 outline-none" placeholder="Juan Dela Cruz" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Event Name</label>
            <input required type="text" value={formData.event_name} onChange={(e) => setFormData({...formData, event_name: e.target.value})} className="w-full bg-stone-50 border-none rounded-2xl p-4 outline-none" placeholder="e.g. Birthday Celebration" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Birthday</label>
            <input 
              required 
              type="date" 
              value={formData.birthdate} 
              onChange={(e) => setFormData({...formData, birthdate: e.target.value})} 
              className={`w-full bg-stone-50 border-2 rounded-2xl p-4 outline-none transition-all ${isUnderage ? 'border-red-200 ring-2 ring-red-50' : 'border-transparent'}`} 
            />
            {isUnderage && <p className="text-[10px] text-red-600 font-bold ml-1 animate-pulse">⚠️ Minimum 18 years old.</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Contact Number</label>
            <input required type="text" value={formData.contact_number} onChange={handleContactChange} className="w-full bg-stone-50 border-none rounded-2xl p-4 outline-none" placeholder="09XXXXXXXXX" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Event Date</label>
            <input 
              required 
              type="date" 
              min={new Date().toISOString().split('T')[0]}
              value={formData.date} 
              onChange={(e) => setFormData({...formData, date: e.target.value})} 
              className="w-full bg-stone-50 border-none rounded-2xl p-4 outline-none" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Number of Guests</label>
            <input required type="number" min="1" value={formData.guests} onChange={(e) => setFormData({...formData, guests: e.target.value})} className="w-full bg-stone-50 border-none rounded-2xl p-4 outline-none" placeholder="0" />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Catering Package</label>
            <select required value={formData.package_id} onChange={(e) => setFormData({...formData, package_id: e.target.value})} className="w-full bg-stone-50 border-none rounded-2xl p-4 outline-none appearance-none cursor-pointer">
              <option value="">-- Select Package --</option>
              {menuPackages.map(pkg => (<option key={pkg.package_id} value={pkg.package_id}>{pkg.package_name} (₱{pkg.price_per_package}/pax)</option>))}
            </select>
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Event Details</label>
            <textarea required value={formData.event_details} onChange={(e) => setFormData({...formData, event_details: e.target.value})} className="w-full bg-stone-50 border-none rounded-2xl p-4 outline-none min-h-[120px] resize-none" placeholder="Please describe your event..." />
          </div>        

          <div className="md:col-span-2 bg-[#1a2e1a] p-8 rounded-[2.5rem] text-white flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase text-stone-400 font-bold">Total Quote</p>
              <h3 className="text-3xl font-black text-orange-400">₱{totalAmount.toLocaleString()}</h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-stone-400 font-bold uppercase">50% Downpayment</p>
              <p className="text-xl font-bold text-white">₱{downpaymentRequired.toLocaleString()}</p>
            </div>
          </div>

          <button 
            disabled={loading || isUnderage} 
            className="md:col-span-2 w-full bg-[#1a2e1a] text-white py-6 rounded-[2rem] font-bold hover:bg-orange-600 transition-all shadow-xl disabled:bg-stone-300 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Submit Inquiry"}
          </button>
        </form>
      </div>

      {/* Modals remain the same */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-[#1a2e1a] mb-2">Confirm Booking</h3>
              <p className="text-stone-500 text-sm mb-8">Ready to submit "{formData.event_name}"?</p>
              <div className="flex flex-col gap-3">
                <button onClick={executeBooking} className="w-full bg-[#1a2e1a] text-white py-4 rounded-2xl font-bold hover:bg-orange-600 transition-all">Yes, Submit Inquiry</button>
                <button onClick={() => setShowConfirm(false)} className="w-full bg-stone-100 text-stone-600 py-4 rounded-2xl font-bold hover:bg-stone-200 transition-all">No, let me check</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {notification.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl text-center">
            <h3 className="text-2xl font-bold text-[#1a2e1a] mb-2">{notification.title}</h3>
            <p className="text-stone-500 text-sm mb-8">{notification.message}</p>
            <button onClick={handleCloseNotification} className="w-full bg-[#1a2e1a] text-white py-4 rounded-2xl font-bold">
              {notification.type === 'success' ? 'Back to Home' : 'Understood'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}