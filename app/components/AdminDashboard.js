"use client";
import { useState } from 'react';
import RoomsTable from './RoomsTable'; 
import VisitsTable from './VisitsTable'; 
import ReservationsTable from './ReservationsTable';
import EventsTable from './EventsTable';
import StaffSection from './StaffSection';

export default function AdminDashboard() {
  const [view, setView] = useState('overview');
  const [searchTerm, setSearchTerm] = useState(''); // New state for search

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'rooms', label: 'Room Stays', icon: '🏠' },
    { id: 'reservations', label: 'Reservations', icon: '📅' },
    { id: 'visits', label: 'Day Visits', icon: '☀️' },
    { id: 'events', label: 'Events & Catering', icon: '🥂' },
    { id: 'staff', label: 'Staffing', icon: '👥' },
  ];

  return (
    <div className="flex min-h-screen bg-[#fbfbfb]">
      {/* SIDEBAR */}
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
              onClick={() => {
                setView(item.id);
                setSearchTerm(''); // Reset search when switching tabs
              }}
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
          
          <div className="flex items-center gap-6">
            {/* SEARCH BAR - Only shows if view is not 'overview' */}
            {view !== 'overview' && (
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg opacity-40 group-focus-within:opacity-100 transition-opacity">🔍</span>
                <input 
                  type="text"
                  placeholder={`Search ${view.replace('-', ' ')}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-stone-100 py-3 pl-12 pr-6 rounded-2xl shadow-sm outline-none focus:ring-2 ring-orange-400/20 w-80 text-sm transition-all font-medium text-[#1a2e1a]"
                />
              </div>
            )}

            <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-stone-100">
               <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-lg">👤</div>
               <div className="pr-4">
                  <p className="text-xs font-black text-[#1a2e1a]">Admin Staff</p>
                  <p className="text-[9px] text-green-500 font-bold uppercase tracking-tighter">Online</p>
               </div>
            </div>
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {view === 'overview' && <StatsCards />}
          
          {/* Pass searchTerm as a prop to your table components */}
          {view === 'rooms' && <RoomsTable searchTerm={searchTerm} />}
          {view === 'reservations' && <ReservationsTable searchTerm={searchTerm} />}
          {view === 'visits' && <VisitsTable searchTerm={searchTerm} />}
          {view === 'events' && <EventsTable searchTerm={searchTerm} />}
          {view === 'staff' && <StaffSection searchTerm={searchTerm} />}
        </div>
      </main>
    </div>
  );
}

/* --- STATS COMPONENT REMAINS UNCHANGED --- */
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