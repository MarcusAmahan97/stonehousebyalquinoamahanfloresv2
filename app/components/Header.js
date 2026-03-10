"use client";

export default function Header({ activeTab, setActiveTab }) {
  const isHome = activeTab === 'home';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 py-6 transition-all duration-500 ${
      isHome ? 'bg-transparent text-white' : 'bg-white/90 backdrop-blur-md text-[#1a2e1a] shadow-sm border-b border-slate-100'
    }`}>
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isHome ? 'bg-white text-[#1a2e1a]' : 'bg-[#1a2e1a] text-white'}`}>
          SH
        </div>
        <h1 className="text-xl font-black tracking-tighter">STONEHOUSE</h1>
      </div>

      <nav className="hidden md:flex items-center gap-10">
        {['home', 'visit', 'stay', 'event'].map((id) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`text-xs uppercase tracking-widest font-bold transition-all hover:text-orange-400 ${
              activeTab === id ? 'text-orange-500' : ''
            }`}
          >
            {id === 'stay' ? 'Overnight' : id}
          </button>
        ))}
      </nav>

      <button 
        onClick={() => setActiveTab('stay')}
        className={`px-6 py-2 rounded-full text-xs font-bold border-2 transition-all ${
          isHome 
          ? 'border-white hover:bg-white hover:text-[#1a2e1a]' 
          : 'border-[#1a2e1a] bg-[#1a2e1a] text-white hover:bg-orange-600 hover:border-orange-600'
        }`}
      >
        RESERVE
      </button>
    </header>
  );
}