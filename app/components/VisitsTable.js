"use client";
import { useState, useEffect } from 'react'; 
import { supabase } from '../lib/supabase';

export default function VisitsTable({ searchTerm }) { 
  const [visits, setVisits] = useState([]); 
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchVisits(); }, []);

  async function fetchVisits() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('visits')
        .select(`
          visit_id, visit_date, number_of_visitors,
          customers (full_name, age, contact_number, email),
          visit_details (visit_type, visit_details)
        `)
        .order('visit_date', { ascending: false });
      if (error) throw error;
      setVisits(data || []);
    } catch (err) { console.error(err.message); } finally { setLoading(false); }
  }

  const deleteVisit = async (id) => {
    if (!confirm("Are you sure?")) return;
    await supabase.from('visit_details').delete().eq('visit_id', id);
    const { error } = await supabase.from('visits').delete().eq('visit_id', id);
    if (error) alert(error.message);
    else fetchVisits();
  };

  // Logic: Filter by customer name or visit type
  const filteredVisits = visits.filter(v => {
    const customerName = v.customers?.full_name?.toLowerCase() || "";
    const visitType = v.visit_details?.[0]?.visit_type?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return customerName.includes(search) || visitType.includes(search);
  });

  if (loading) return <div className="p-20 text-center animate-pulse uppercase text-[10px] font-bold tracking-widest text-stone-400">Fetching logs...</div>;

  return (
    <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-stone-50 border-b border-stone-100 uppercase text-[10px] font-black text-stone-400 tracking-widest">
          <tr>
            <th className="px-8 py-5">Customer</th>
            <th className="px-8 py-5">Date</th>
            <th className="px-8 py-5">Type & Notes</th>
            <th className="px-8 py-5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50">
          {filteredVisits.map((v) => (
            <tr key={v.visit_id} className="hover:bg-stone-50/50">
              <td className="px-8 py-6">
                <p className="font-bold text-[#1a2e1a] text-sm">{v.customers?.full_name || 'Walk-in Guest'}</p>
                <p className="text-[10px] text-stone-400 uppercase">{v.number_of_visitors} Pax</p>
              </td>
              <td className="px-8 py-6 text-sm text-stone-500">
                {new Date(v.visit_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
              </td>
              <td className="px-8 py-6">
                <div className="max-w-[180px]">
                  <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2 rounded">{v.visit_details?.[0]?.visit_type || 'Standard'}</span>
                  <p className="text-[10px] text-stone-400 mt-1 truncate">{v.visit_details?.[0]?.visit_details}</p>
                </div>
              </td>
              <td className="px-8 py-6 text-right">
                <button onClick={() => deleteVisit(v.visit_id)} className="text-red-400 font-bold text-[10px] uppercase hover:underline">Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredVisits.length === 0 && (
        <div className="p-20 text-center text-stone-400 text-[10px] font-bold uppercase tracking-widest">No matching visits found.</div>
      )}
    </div>
  );
}