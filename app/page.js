"use client";
import { useState } from 'react';
import Header from './components/Header'; // Update the name here
import Home from './components/Home';
import DayVisit from './components/DayVisit';
import RoomBooking from './components/RoomBooking';
import EventCatering from './components/EventCatering';

export default function Page() {
  const [activeTab, setActiveTab] = useState('home');

  const renderView = () => {
    switch(activeTab) {
      case 'home': return <Home onStart={() => setActiveTab('stay')} />;
      case 'visit': return <DayVisit />;
      case 'stay': return <RoomBooking />;
      case 'event': return <EventCatering />;
      default: return <Home />;
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbf9]">
      {/* Top Navigation */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Full-width Content Area */}
      <main className="pt-24"> 
        {/* Home usually wants full width, other forms want a container */}
        <div className={activeTab === 'home' ? "w-full" : "max-w-5xl mx-auto p-12"}>
          {renderView()}
        </div>
      </main>
    </div>
  );
}