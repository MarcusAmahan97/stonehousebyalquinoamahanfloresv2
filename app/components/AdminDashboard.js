"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ReservationsTable from './ReservationsTable';

export default function AdminDashboard() {
  const [view, setView] = useState('overview');

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'reservations', label: 'Reservations', icon: '📅' },
    { id: 'visits', label: 'Day Visits', icon: '☀️' },
    { id: 'events', label: 'Events & Catering', icon: '🥂' },
    { id: 'staff', label: 'Staffing', icon: '👥' },
  ];

  return (
    <div className="flex min-h-screen bg-[#fbfbfb]">
      {/* MODERN SIDEBAR */}
      <aside className="w-72 bg-[#1a2e1a] m-5 rounded-[2.5rem] p-8 text-white flex flex-col shadow-2xl fixed h-[calc(100vh-40px)]">
        <div className="mb-12 px-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-white">SH</div>
            <h1 className="text-xl font-black tracking-tighter uppercase">StoneHouse</h1>
          </div>
          <p className="text-[10px] text-stone-400 uppercase tracking-[0.3em] font-bold">Admin Portal</p>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 ${
                view === item.id 
                ? 'bg-white/10 text-orange-400 shadow-inner' 
                : 'hover:bg-white/5 text-stone-400 hover:text-stone-200'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm font-bold tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10">
          <button 
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-3 text-stone-400 hover:text-red-400 transition-colors text-xs font-bold uppercase tracking-widest"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 ml-80 p-10">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-4xl font-black text-[#1a2e1a] tracking-tight capitalize">
              {view === 'overview' ? 'Command Center' : view.replace('-', ' ')}
            </h2>
            <p className="text-stone-400 text-sm mt-1">Managing Stone House Highlands Operations.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-stone-100">
             <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-lg">👤</div>
             <div className="pr-4">
                <p className="text-xs font-black text-[#1a2e1a]">Admin Staff</p>
                <p className="text-[9px] text-green-500 font-bold uppercase tracking-tighter">Online</p>
             </div>
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {view === 'overview' && <StatsCards />}
          {view === 'reservations' && <ReservationsTable />}
          {view === 'visits' && <VisitsTable />}
          {view === 'events' && <EventsTable />}
          {view === 'staff' && (
            <div className="bg-white p-20 rounded-[3rem] text-center border border-dashed border-stone-200">
               <p className="text-stone-400 font-medium">Staff Assignment Module coming soon...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* --- INTERNAL SUB-COMPONENTS --- */

function StatsCards() {
  const stats = [
    { label: 'Total Revenue', value: '₱142,500', icon: '💰', trend: '+12%', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Active Stays', value: '08', icon: '🏠', trend: 'Full', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Upcoming Events', value: '03', icon: '🥂', trend: 'Prep', color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Day Visitors', value: '24', icon: '☀️', trend: 'Today', color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 hover:shadow-xl transition-all duration-500">
          <div className="flex justify-between items-start mb-6">
            <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center text-xl`}>
              {stat.icon}
            </div>
            <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase ${stat.bg} ${stat.color}`}>
              {stat.trend}
            </span>
          </div>
          <p className="text-stone-400 text-[10px] uppercase tracking-[0.2em] font-bold mb-1">{stat.label}</p>
          <h4 className="text-3xl font-black text-[#1a2e1a] tracking-tight">{stat.value}</h4>
        </div>
      ))}
    </div>
  );
}

function EventsTable() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      setLoading(true);
      // Ensure 'email' is included in the select query
      const { data, error } = await supabase
        .from('event_bookings')
        .select('*') 
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      setLoading(false);
    }
  }

  const updateStatus = async (eventObj, status) => {
    const idColumn = eventObj.event_id ? 'event_id' : eventObj.booking_id ? 'booking_id' : 'id';
    const actualId = eventObj[idColumn];

    const { error } = await supabase
      .from('event_bookings')
      .update({ event_status: status })
      .eq(idColumn, actualId);
    
    if (error) alert("Update Error: " + error.message);
    else fetchEvents();
  };

  if (loading) return <div className="p-20 text-center text-stone-400 animate-pulse uppercase text-[10px] font-bold tracking-widest">Loading inquiries...</div>;

  return (
    <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-stone-50 border-b border-stone-100">
          <tr>
            <th className="px-8 py-5 text-[10px] uppercase font-black text-stone-400 tracking-widest">Event</th>
            <th className="px-8 py-5 text-[10px] uppercase font-black text-stone-400 tracking-widest">Contact Info</th>
            <th className="px-8 py-5 text-[10px] uppercase font-black text-stone-400 tracking-widest">Date</th>
            <th className="px-8 py-5 text-[10px] uppercase font-black text-stone-400 tracking-widest">Pax</th>
            <th className="px-8 py-5 text-[10px] uppercase font-black text-stone-400 tracking-widest">Status</th>
            <th className="px-8 py-5 text-[10px] uppercase font-black text-stone-400 tracking-widest text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50">
          {events.length === 0 ? (
            <tr><td colSpan="6" className="p-20 text-center text-stone-400 italic">No inquiries found.</td></tr>
          ) : (
            events.map((ev) => (
              <tr key={ev.event_id || ev.id} className="hover:bg-stone-50/50 transition-colors">
                <td className="px-8 py-6">
                  <p className="font-bold text-[#1a2e1a] text-sm">{ev.event_name}</p>
                  <p className="text-[10px] text-orange-600 font-bold uppercase">{ev.event_type}</p>
                </td>
                <td className="px-8 py-6">
                  <p className="text-sm text-stone-600 font-medium">{ev.email || 'No Email Provided'}</p>
                </td>
                <td className="px-8 py-6 text-sm text-stone-500">{ev.event_date}</td>
                <td className="px-8 py-6 text-sm text-stone-500">{ev.guests} pax</td>
                <td className="px-8 py-6">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                    ev.event_status === 'Confirmed' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {ev.event_status}
                  </span>
                </td>
                <td className="px-8 py-6 text-right space-x-2">
                  <button onClick={() => updateStatus(ev, 'Confirmed')} className="text-emerald-600 font-bold text-[10px] uppercase hover:underline">Approve</button>
                  <button onClick={() => updateStatus(ev, 'Cancelled')} className="text-red-400 font-bold text-[10px] uppercase hover:underline">Decline</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function VisitsTable() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisits();
  }, []);

  async function fetchVisits() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .order('visit_date', { ascending: false });

      if (error) throw error;
      setVisits(data || []);
    } catch (err) {
      console.error('Fetch Error:', err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-20 text-center text-stone-400 animate-pulse uppercase text-[10px] font-bold tracking-widest">Fetching logs...</div>;

  return (
    <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-stone-50 border-b border-stone-100">
          <tr>
            <th className="px-8 py-5 text-[10px] uppercase font-black text-stone-400 tracking-widest">Visit Date</th>
            <th className="px-8 py-5 text-[10px] uppercase font-black text-stone-400 tracking-widest">Visitors</th>
            <th className="px-8 py-5 text-[10px] uppercase font-black text-stone-400 tracking-widest">Total Paid</th>
            <th className="px-8 py-5 text-[10px] uppercase font-black text-stone-400 tracking-widest text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50">
          {visits.length === 0 ? (
            <tr><td colSpan="4" className="p-20 text-center text-stone-400 italic">No day visits recorded.</td></tr>
          ) : (
            visits.map((v) => (
              <tr key={v.id || v.visit_id} className="hover:bg-stone-50/50 transition-colors">
                <td className="px-8 py-6 font-bold text-[#1a2e1a] text-sm">
                   {new Date(v.visit_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-8 py-6 text-sm text-stone-500">{v.number_of_visitors} Pax</td>
                <td className="px-8 py-6 text-sm font-bold text-emerald-600">₱{v.total_price?.toLocaleString()}</td>
                <td className="px-8 py-6 text-right">
                  <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">Paid</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}