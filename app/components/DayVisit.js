"use client";
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function DayVisit() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    visit_date: '',
    guests: 1,
    package: 'Standard Day Pass (₱500/pax)',
    notes: ''
  });

const handleDayVisitSubmit = async () => {
    if (!formData.visit_date) return alert("Please select a date");
    setLoading(true);

    const totalPrice = formData.guests * 500; 

    const { error } = await supabase
      .from('visits')
      .insert([{
        // customer_id: 1,  <-- REMOVE OR COMMENT THIS LINE OUT
        number_of_visitors: formData.guests,
        visit_date: formData.visit_date,
        total_price: totalPrice
      }]);

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Day Visit Reserved! See you at the Highlands.");
      window.location.reload();
    }
    setLoading(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="mb-12 text-center md:text-left">
        <span className="text-orange-600 font-bold tracking-[0.3em] text-[10px] uppercase">Experience the Highlands</span>
        <h2 className="text-5xl font-bold text-[#1a2e1a] mt-2 tracking-tight">Day Visit Reservation</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-stone-200/50 border border-stone-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">Visit Date</label>
                <input 
                  type="date" 
                  onChange={(e) => setFormData({...formData, visit_date: e.target.value})}
                  className="w-full bg-stone-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-orange-500/20 outline-none text-[#1a2e1a]" 
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">Number of Guests</label>
                <input 
                  type="number" 
                  min="1" 
                  placeholder="0" 
                  onChange={(e) => setFormData({...formData, guests: e.target.value})}
                  className="w-full bg-stone-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-orange-500/20 outline-none text-[#1a2e1a]" 
                />
              </div>
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">Choose your Package</label>
                <select 
                  onChange={(e) => setFormData({...formData, package: e.target.value})}
                  className="w-full bg-stone-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-orange-500/20 outline-none appearance-none text-[#1a2e1a]"
                >
                  <option>Standard Day Pass (₱500/pax)</option>
                  <option>Picnic Package (₱1,500)</option>
                  <option>Hiking & Dine (₱1,200/pax)</option>
                </select>
              </div>
            </div>
            <button 
              onClick={handleDayVisitSubmit}
              disabled={loading}
              className="w-full mt-10 bg-[#1a2e1a] text-white py-5 rounded-[1.5rem] font-bold hover:bg-orange-600 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Sending..." : "Confirm Day Visit"}
            </button>
          </div>
        </div>
        {/* ... Rules Sidebar stays the same ... */}
      </div>
    </div>
  );
}