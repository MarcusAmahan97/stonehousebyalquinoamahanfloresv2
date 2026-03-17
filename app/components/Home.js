"use client";

export default function Home({ onStart }) {
  return (
    <div className="flex flex-col bg-[#fbfbf9]">
      {/* HERO SECTION - Picture is Back */}
      <section className="relative min-h-screen -mt-24 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2070')` }}
        >
          {/* Darker overlay to make white text pop */}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Content - Positioned to be fully visible below the header */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-6 pt-24">
          <span className="text-orange-400 font-bold tracking-[0.5em] text-[10px] uppercase mb-6 drop-shadow-md">
            Buda-Bukidnon Boundary, Philippines
          </span>
          <h1 className="text-6xl md:text-8xl font-bold mb-8 tracking-tighter text-white drop-shadow-2xl">
            Staycation <br />
            <span className="text-orange-400 italic font-serif leading-tight">somewhere special</span>
          </h1>
          <button 
            onClick={onStart}
            className="group px-14 py-5 bg-white text-[#1a2e1a] font-bold rounded-full hover:bg-orange-500 hover:text-white transition-all shadow-2xl active:scale-95 flex items-center gap-3"
          >
            BOOK YOUR STAY
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>

        {/* Wave Transition to About Section */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
          <svg className="relative block w-full h-[80px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C41.7,33.53,151.78,67.75,321.39,56.44Z" className="fill-[#fbfbf9]"></path>
          </svg>
        </div>
      </section>

      {/* ABOUT US SECTION - No-Pic Wireframe */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          
          {/* Image Composition Section */}
          <div className="relative aspect-[4/5]">
            {/* Main Image (pic1.jpg) */}
            <div className="w-full h-full bg-stone-100 rounded-[3rem] border border-stone-200 overflow-hidden">
              <img 
                src="/images/pic1.jpg" 
                alt="Stone House Architecture" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Floating Accent Image (pic2.jpg) */}
            <div className="absolute -bottom-6 -right-6 w-64 h-64 bg-stone-200 rounded-[2rem] border-[10px] border-[#fbfbf9] shadow-xl hidden md:block overflow-hidden">
              <img 
                src="/images/pic2.jpg" 
                alt="Stone House Detail" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Text Content Section */}
          <div className="space-y-12">
            <div className="space-y-4">
              <h2 className="text-5xl md:text-6xl font-bold text-[#1a2e1a] leading-[1.1] tracking-tight">
                Built by Nature, <br/>Refining the Escape.
              </h2>
              <div className="w-20 h-1 bg-orange-500 rounded-full"></div>
            </div>
            
            <p className="text-stone-600 text-xl leading-relaxed font-light">
              Founded on the belief that nature is the best architect, Stone House was built using locally sourced river stones and sustainable timber. Nestled 4,000 feet above sea level.
            </p>

            <div className="flex gap-12 pt-8 border-t border-stone-200">
              <div>
                <p className="text-3xl font-bold text-[#1a2e1a]">4k ft</p>
                <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mt-1">Elevation</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[#1a2e1a]">12</p>
                <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mt-1">Private Units</p>
              </div>
            </div>

            <button className="text-[#1a2e1a] font-bold text-xs tracking-[0.2em] border-b-2 border-stone-200 pb-2 hover:border-orange-500 transition-all uppercase">
              The Stone House Story
            </button>
          </div>

        </div>
      </section>
    </div>
  );
}