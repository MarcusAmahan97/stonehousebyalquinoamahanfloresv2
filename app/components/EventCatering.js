"use client";
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function EventCatering() {
  const [eventType, setEventType] = useState('wedding');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    date: '',
    guests: '',
    email: '',
    details: ''
  });

  const eventStyles = [
    { id: 'wedding', name: 'Weddings & Elopements', icon: '💍', desc: 'Intimate mountain ceremonies with panoramic views.' },
    { id: 'corporate', name: 'Corporate Retreats', icon: '💼', desc: 'Strategic sessions in a tranquil, distraction-free environment.' },
    { id: 'private', name: 'Private Celebrations', icon: '🎂', desc: 'Birthdays, anniversaries, and family reunions.' }
  ];

  const handleInquiry = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.email) return alert("Please provide a date and email.");

    setLoading(true);

    const { error } = await supabase
      .from('event_bookings')
      .insert([{
        event_name: `${eventType.toUpperCase()} - Inquiry`,
        event_type: eventType,
        event_date: formData.date,
        guests: parseInt(formData.guests) || 0,
        event_status: 'Inquiry',
        email: formData.email,     // NOW SAVING
        details: formData.details   // NOW SAVING
      }]);

    if (error) {
      alert("Database Error: " + error.message);
    } else {
      alert("Inquiry Sent! We will contact you at " + formData.email);
      setFormData({ date: '', guests: '', email: '', details: '' });
    }
    setLoading(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
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
            <p className={`text-xs leading-relaxed ${eventType === style.id ? 'text-stone-300' : 'text-stone-500'}`}>
              {style.desc}
            </p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-stone-100 max-w-4xl mx-auto">
        <form onSubmit={handleInquiry} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Proposed Date</label>
            <input required type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full bg-stone-50 border-none rounded-2xl p-4" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Pax</label>
            <input type="number" value={formData.guests} onChange={(e) => setFormData({...formData, guests: e.target.value})} className="w-full bg-stone-50 border-none rounded-2xl p-4" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Contact Email</label>
            <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-stone-50 border-none rounded-2xl p-4" placeholder="your@email.com" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Vision & Details</label>
            <textarea rows="4" value={formData.details} onChange={(e) => setFormData({...formData, details: e.target.value})} className="w-full bg-stone-50 border-none rounded-2xl p-4" placeholder="Tell us about your event..."></textarea>
          </div>
          <button disabled={loading} className="md:col-span-2 w-full bg-[#1a2e1a] text-white py-6 rounded-[2rem] font-bold hover:bg-orange-600 transition-all shadow-xl disabled:opacity-50">
            {loading ? "Sending..." : "Submit Inquiry"}
          </button>
        </form>
      </div>
    </div>
  );
}