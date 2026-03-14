"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function StaffSection() {
  const [staffList, setStaffList] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [newStaff, setNewStaff] = useState({ full_name: '', role: '' });
  const [assignment, setAssignment] = useState({ staff_id: '', event_id: '', duty: '' });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: staff } = await supabase.from('staff').select('*');
    const { data: events } = await supabase.from('event_bookings').select('event_id, event_name');
    const { data: assigns } = await supabase.from('staff_assignments').select(`
        duty,
        staff:staff_id(full_name),
        event:event_bookings_id(event_name)
      `);

    setStaffList(staff || []);
    setEventsList(events || []);
    setAssignments(assigns || []);
    setLoading(false);
  }

  // ACTION: Add New Employee to Database
  const handleAddStaff = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('staff').insert([newStaff]);
    if (error) alert(error.message);
    else {
      setNewStaff({ full_name: '', role: '' });
      fetchData(); // Refresh dropdowns
    }
  };

  // ACTION: Assign Staff to Event
  const handleAssign = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('staff_assignments').insert([{
      staff_id: assignment.staff_id,
      event_bookings_id: assignment.event_id,
      duty: assignment.duty
    }]);

    if (error) alert("Deployment Error: " + error.message);
    else {
      setAssignment({ staff_id: '', event_id: '', duty: '' });
      fetchData();
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-stone-400 font-bold uppercase text-[10px]">Updating Roster...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* COLUMN 1: REGISTER & ASSIGN (The Controls) */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* STEP 1: ADD NEW STAFF */}
        <div className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-sm">
          <h3 className="text-sm font-black text-[#1a2e1a] mb-4 uppercase tracking-widest">1. Register Staff</h3>
          <form onSubmit={handleAddStaff} className="space-y-3">
            <input 
              required
              placeholder="Full Name" 
              value={newStaff.full_name}
              onChange={e => setNewStaff({...newStaff, full_name: e.target.value})}
              className="w-full bg-stone-50 border-none rounded-xl p-3 text-sm"
            />
            <input 
              required
              placeholder="Role (e.g. Chef, Server)" 
              value={newStaff.role}
              onChange={e => setNewStaff({...newStaff, role: e.target.value})}
              className="w-full bg-stone-50 border-none rounded-xl p-3 text-sm"
            />
            <button className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#1a2e1a] transition-all">
              Add to Team
            </button>
          </form>
        </div>

        {/* STEP 2: ASSIGN TO EVENT */}
        <div className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-sm">
          <h3 className="text-sm font-black text-[#1a2e1a] mb-4 uppercase tracking-widest">2. Deploy Staff</h3>
          <form onSubmit={handleAssign} className="space-y-3">
            <select 
              required
              value={assignment.staff_id}
              onChange={e => setAssignment({...assignment, staff_id: e.target.value})}
              className="w-full bg-stone-50 border-none rounded-xl p-3 text-sm"
            >
              <option value="">Choose Staff...</option>
              {staffList.map(s => <option key={s.staff_id} value={s.staff_id}>{s.full_name} ({s.role})</option>)}
            </select>

            <select 
              required
              value={assignment.event_id}
              onChange={e => setAssignment({...assignment, event_id: e.target.value})}
              className="w-full bg-stone-50 border-none rounded-xl p-3 text-sm"
            >
              <option value="">Choose Event...</option>
              {eventsList.map(ev => <option key={ev.event_id} value={ev.event_id}>{ev.event_name}</option>)}
            </select>

            <input 
              required
              placeholder="Specific Duty" 
              value={assignment.duty}
              onChange={e => setAssignment({...assignment, duty: e.target.value})}
              className="w-full bg-stone-50 border-none rounded-xl p-3 text-sm"
            />
            <button className="w-full bg-[#1a2e1a] text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all">
              Confirm Deployment
            </button>
          </form>
        </div>
      </div>

      {/* COLUMN 2: THE ROSTER TABLE */}
      <div className="lg:col-span-8">
        <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-stone-50/50 border-b border-stone-100">
              <tr>
                <th className="px-8 py-5 text-[10px] uppercase font-black text-stone-400">Deployed Staff</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black text-stone-400">Assigned Event</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black text-stone-400">Duty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {assignments.map((as, i) => (
                <tr key={i} className="hover:bg-stone-50/50">
                  <td className="px-8 py-5 font-bold text-[#1a2e1a] text-sm">{as.staff?.full_name}</td>
                  <td className="px-8 py-5 text-stone-500 text-sm">{as.event?.event_name}</td>
                  <td className="px-8 py-5">
                    <span className="bg-orange-50 text-orange-600 text-[10px] font-black px-3 py-1 rounded-full uppercase italic">
                      {as.duty}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}