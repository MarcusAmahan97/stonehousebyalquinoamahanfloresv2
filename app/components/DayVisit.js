"use client";
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function DayVisit() {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [notification, setNotification] = useState({ show: false, title: '', message: '', type: 'info' });
  
  const [formData, setFormData] = useState({
    full_name: '',
    birthdate: '',
    contact_number: '',
    email: '',
    visit_date: '',
    guests: 1,
    visit_type: 'Standard',
    notes: ''
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

    if (!formData.full_name || !formData.visit_date || !formData.birthdate) {
      return showAlert("Missing Info", "Please fill in all required fields.");
    }

    const vDate = new Date(formData.visit_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (vDate < today) {
      return showAlert("Invalid Date", "The visit date cannot be in the past.");
    }

    if (age < 18) {
      return showAlert("Age Restriction", "You must be 18 above to book.");
    }

    if (!formData.contact_number.startsWith("09") || formData.contact_number.length !== 11) {
      return showAlert("Invalid Number", "Contact number must start with 09 and be 11 digits.");
    }

    setShowConfirm(true);
  };

  const executeBooking = async () => {
    setShowConfirm(false);
    setLoading(true);

    try {
      // 1. Create Customer
      const { data: customer, error: custError } = await supabase
        .from('customers')
        .insert([{ 
          full_name: formData.full_name, 
          age: age,
          contact_number: formData.contact_number,
          email: formData.email || '',
          customer_category: 'Day Visit',
          created_at: new Date().toISOString()
        }])
        .select().single();

      if (custError) throw custError;

      // 2. Create Visit
      const totalPrice = formData.guests * 500; 
      const { data: visit, error: visitError } = await supabase
        .from('visits')
        .insert([{
          customer_id: customer.customer_id,
          number_of_visitors: parseInt(formData.guests),
          visit_date: formData.visit_date,
          total_price: totalPrice,
          balance: totalPrice, // Set balance as the total price
          status: 'Confirmed'   // Set status to Confirmed
        }])
        .select().single();

      if (visitError) throw visitError;

      // 3. Create Visit Details
      await supabase.from('visit_details').insert([{
        visit_id: visit.visit_id,
        visit_type: formData.visit_type,
        visit_details: formData.notes || "No special requests"
      }]);

      showAlert("Success!", "Your day visit has been recorded.", "success");
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
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-4xl mx-auto p-10 bg-white rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-stone-100">
      <div className="mb-10">
        <span className="text-orange-600 font-bold tracking-[0.3em] text-[10px] uppercase">Casual Experience</span>
        <h2 className="text-4xl font-bold text-[#1a2e1a] mt-2 tracking-tight">Day Visit Booking</h2>
      </div>
      
      <form onSubmit={triggerConfirm} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-3">
          <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">Full Name</label>
          <input 
            required
            placeholder="Juan Dela Cruz" 
            className="bg-stone-50 p-4 rounded-2xl outline-none focus:ring-2 ring-stone-100 focus:bg-white transition-all"
            onChange={e => setFormData({...formData, full_name: e.target.value})} 
          />
        </div>
        
        <div className="flex flex-col gap-3">
          <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">Birthday</label>
          <input 
            required
            type="date" 
            className="bg-stone-50 p-4 rounded-2xl outline-none focus:ring-2 ring-stone-100 focus:bg-white transition-all"
            onChange={e => setFormData({...formData, birthdate: e.target.value})} 
          />
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">Contact Number</label>
          <input 
            required
            type="text"
            placeholder="09XXXXXXXXX" 
            value={formData.contact_number}
            className="bg-stone-50 p-4 rounded-2xl outline-none focus:ring-2 ring-stone-100 focus:bg-white transition-all"
            onChange={handleContactChange} 
          />
        </div>
        
        <div className="flex flex-col gap-3">
          <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">Email (Optional)</label>
          <input 
            type="email"
            placeholder="example@gmail.com" 
            className="bg-stone-50 p-4 rounded-2xl outline-none focus:ring-2 ring-stone-100 focus:bg-white transition-all"
            onChange={e => setFormData({...formData, email: e.target.value})} 
          />
        </div>

        <div className="flex flex-col gap-3 group">
          <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1 group-focus-within:text-orange-600 transition-colors">Date of Visit</label>
          <div className="relative">
            <input 
              required
              type="date" 
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-stone-50 p-4 rounded-2xl outline-none focus:ring-2 ring-stone-100 focus:bg-white transition-all"
              onChange={e => setFormData({...formData, visit_date: e.target.value})} 
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">Number of Guests</label>
          <input 
            required
            type="number" 
            min="1"
            value={formData.guests}
            className="bg-stone-50 p-4 rounded-2xl outline-none focus:ring-2 ring-stone-100 focus:bg-white transition-all"
            onChange={e => setFormData({...formData, guests: Math.max(1, parseInt(e.target.value) || 1)})} 
          />
        </div>

        <div className="md:col-span-2 flex flex-col gap-3">
          <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">Type of Visit</label>
          <select 
            className="bg-stone-50 p-4 rounded-2xl outline-none focus:ring-2 ring-stone-100 focus:bg-white transition-all appearance-none"
            onChange={e => setFormData({...formData, visit_type: e.target.value})}
          >
            <option value="Standard">Standard Day Trip</option>
            <option value="Corporate">Corporate Event</option>
            <option value="Educational">Educational</option>
          </select>
        </div>

        <div className="md:col-span-2 flex flex-col gap-3">
          <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">Special Notes</label>
          <textarea 
            placeholder="Any special requests..." 
            className="bg-stone-50 p-4 rounded-2xl outline-none h-32 focus:ring-2 ring-stone-100 focus:bg-white transition-all resize-none"
            onChange={e => setFormData({...formData, notes: e.target.value})}
          />
        </div>

        <button 
          type="submit"
          disabled={loading || (age !== null && age < 18)}
          className="md:col-span-2 w-full mt-4 bg-[#1a2e1a] text-white py-5 rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-xl active:scale-95 disabled:bg-stone-200"
        >
          {loading ? "Processing..." : "Confirm Reservation"}
        </button>
      </form>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl transform animate-in zoom-in-95 duration-300">
            <div className="text-center">
              <div className="bg-stone-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"><span className="text-3xl">🎫</span></div>
              <h3 className="text-2xl font-bold text-[#1a2e1a] mb-2">Confirm Visit</h3>
              <p className="text-stone-500 text-sm mb-8 leading-relaxed">Ready to book your Day Visit for <span className="font-bold">{formData.guests} guest(s)</span>?</p>
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