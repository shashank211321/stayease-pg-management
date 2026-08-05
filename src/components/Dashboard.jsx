import React from 'react';
import { IconRoom, IconGuest, IconPayment, IconSettings, IconArrowRight, IconBuilding } from './Icons';

export default function Dashboard({ 
  rooms, 
  guests, 
  payments, 
  rentConfig, 
  setActiveTab,
  onOpenCheckIn
}) {
  // Calculations
  const totalRooms = rooms.length;
  const activeGuests = guests.filter(g => g.status === 'active');
  const totalBeds = rooms.reduce((sum, r) => sum + r.sharing, 0);
  const occupiedBeds = activeGuests.length;
  const vacantBeds = totalBeds - occupiedBeds;

  // Room space availability status
  let fullRoomsCount = 0;
  let partialRoomsCount = 0;

  rooms.forEach(room => {
    const occupiedInRoom = room.beds.filter(b => b.guestId !== null).length;
    if (occupiedInRoom === room.sharing) {
      fullRoomsCount++;
    } else if (occupiedInRoom === 0) {
      partialRoomsCount++; // An empty room is also a room with space!
    } else {
      partialRoomsCount++;
    }
  });

  // Rent collected this month (June 2026 as standard dashboard state in mock)
  const currentMonth = "June 2026";
  const monthlyPayments = payments.filter(p => p.month === currentMonth);
  const collectedRent = monthlyPayments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const pendingRent = monthlyPayments
    .filter(p => p.status === 'Pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalExpectedRent = collectedRent + pendingRent;

  // Room category summary details
  const categoryCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  rooms.forEach(r => {
    categoryCounts[r.sharing] += r.sharing; // Total capacity in that share type
  });

  const categoryOccupied = { 1: 0, 2: 0, 3: 0, 4: 0 };
  activeGuests.forEach(g => {
    if (categoryOccupied[g.sharingType] !== undefined) {
      categoryOccupied[g.sharingType]++;
    }
  });

  const getSharingLabel = (type) => {
    switch (parseInt(type)) {
      case 1: return 'Single Share';
      case 2: return 'Double Share';
      case 3: return '3-Person Share';
      case 4: return '4-Person Share';
      default: return `${type} Share`;
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* SaaS Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">StayEase Dashboard</h1>
          <p className="page-subtitle">Real-time PG occupancy, room vacancy status, and rent collection metrics.</p>
        </div>
        <button 
          onClick={onOpenCheckIn}
          className="btn btn-primary"
        >
          <IconGuest className="w-4 h-4" />
          Check-In Guest
        </button>
      </div>

      {/* Hero Illustration Card */}
      <div className="card bg-gradient-to-r from-slate-900 via-indigo-950/25 to-slate-900 border-indigo-500/10 p-6 overflow-hidden relative hero-banner">
        <div className="flex-1 space-y-2 z-10 text-left">
          <h2 className="text-lg font-extrabold text-slate-100 m-0">StayEase PG Dashboard</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md">
            Manage paying guest operations, track occupant details, log monthly payments via static/dynamic QR codes, and verify Aadhaar credentials instantly.
          </p>
          <div className="pt-2">
            <button onClick={onOpenCheckIn} className="btn btn-primary py-1.5 px-4 text-xs font-bold rounded-xl">
              Quick Allot Bed
            </button>
          </div>
        </div>
        <div className="hero-banner-icon-wrapper z-10">
          <IconBuilding className="w-10 h-10 text-indigo-400" />
        </div>
      </div>

      {/* Main KPI Stats Grid - Wide Layout */}
      <div className="grid grid-cols-3 gap-4">
        {/* KPI: Total Rooms */}
        <div className="card flex items-center justify-between">
          <div>
            <span className="form-label block mb-1">Total Rooms</span>
            <div className="text-3xl font-extrabold text-slate-100">{totalRooms}</div>
            <div className="text-xs text-slate-400 mt-1 flex gap-2">
              <span className="text-rose-400 font-semibold">{fullRoomsCount} Full</span>
              <span className="text-emerald-400 font-semibold">{partialRoomsCount} Vacant</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-indigo-500/10 text-indigo-400">
            <IconRoom className="w-8 h-8" />
          </div>
        </div>

        {/* KPI: Total Guests */}
        <div className="card flex items-center justify-between">
          <div>
            <span className="form-label block mb-1">Beds Occupancy</span>
            <div className="text-3xl font-extrabold text-slate-100">
              {occupiedBeds} <span className="text-sm font-normal text-slate-400">/ {totalBeds} Beds</span>
            </div>
            <div className="text-xs text-emerald-400 mt-1 font-semibold">
              {vacantBeds} Beds Free to Allot
            </div>
          </div>
          <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-400">
            <IconGuest className="w-8 h-8" />
          </div>
        </div>

        {/* KPI: Monthly Rent Collection */}
        <div className="card flex items-center justify-between">
          <div>
            <span className="form-label block mb-1">{currentMonth} Collections</span>
            <div className="text-2xl font-extrabold text-emerald-400">
              ₹{collectedRent.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Expected: <span className="text-slate-200 font-semibold">₹{totalExpectedRent.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-violet-500/10 text-violet-400">
            <IconPayment className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Dynamic Occupancy Status Banner */}
      <div className="card bg-gradient-to-r from-indigo-900/20 to-violet-900/20 border-indigo-500/20 relative overflow-hidden">
        <div className="flex justify-between items-center mb-2 text-sm font-semibold">
          <span className="text-slate-200">Overall Occupancy Progress</span>
          <span className="text-indigo-400">{Math.round((occupiedBeds / totalBeds) * 100) || 0}% Filled</span>
        </div>
        <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-900">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500" 
            style={{ width: `${(occupiedBeds / totalBeds) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Empty Database Welcomer Hint */}
      {occupiedBeds === 0 && (
        <div className="card bg-violet-600/10 border-violet-500/20 space-y-2">
          <h4 className="text-sm font-bold text-violet-400 m-0">Clean Slate Active Mode</h4>
          <p className="text-xs text-slate-300 leading-normal">
            Welcome to StayEase! Your database is currently empty and waiting for real residents. You can:
          </p>
          <ul className="text-xs text-slate-400 pl-5 list-disc space-y-1">
            <li>Go to the <strong>Room Allotment</strong> tab to verify beds configuration or create new rooms.</li>
            <li>Click <strong>Check-In Guest</strong> above to add a new resident with Aadhaar files.</li>
            <li>If you are checking the application features, go to <strong>Config Setup</strong> and click <strong>Load Demo Preview Data</strong>!</li>
          </ul>
        </div>
      )}

      {/* Two Column Layout Block for Details */}
      <div className="grid grid-cols-2 gap-6">
        {/* Card: Rooms Space & Availability */}
        <div className="card space-y-4">
          <h3 className="text-sm font-bold text-slate-200 m-0 border-b border-slate-800 pb-2">Room Space Capacity</h3>
          
          <div className="flex gap-4 items-center">
            <div className="flex-1 text-center bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl">
              <div className="text-2xl font-bold text-rose-400">{fullRoomsCount}</div>
              <div className="text-xs text-slate-400 mt-1">Fully Occupied</div>
            </div>
            
            <div className="flex-1 text-center bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
              <div className="text-2xl font-bold text-emerald-400">{partialRoomsCount}</div>
              <div className="text-xs text-slate-400 mt-1">Available Rooms</div>
            </div>
          </div>

          <button 
            onClick={() => setActiveTab('rooms')} 
            className="btn-dashboard-action"
          >
            <IconRoom className="w-4 h-4" />
            <span>Manage Rooms & Bed Allotments</span>
            <IconArrowRight className="w-4 h-4 btn-arrow" />
          </button>
        </div>

        {/* Card: Rent Pricing Configurations */}
        <div className="card space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-slate-200 m-0">Category Pricing Estimates</h3>
            <button 
              onClick={() => setActiveTab('settings')}
              className="btn-inline-configure"
            >
              <IconSettings className="w-3.5 h-3.5" />
              <span>Configure Prices</span>
            </button>
          </div>

          <div className="space-y-2">
            {[1, 2, 3, 4].map(type => {
              const price = rentConfig[type] || 0;
              const totalCap = categoryCounts[type] || 0;
              const occ = categoryOccupied[type] || 0;
              const estMonthly = price * occ;

              return (
                <div key={type} className="flex justify-between items-center bg-slate-800/20 border border-slate-800/40 p-2.5 rounded-xl">
                  <div>
                    <div className="text-xs font-bold text-slate-200">{getSharingLabel(type)}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Beds Filled: {occ} / {totalCap}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-indigo-300">₹{price.toLocaleString('en-IN')}/mo</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">
                      Est. Rent: <span className="font-semibold text-slate-300">₹{estMonthly.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
