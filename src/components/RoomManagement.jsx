import React, { useState } from 'react';
import { IconRoom, IconPlus, IconTrash, IconClose } from './Icons';

export default function RoomManagement({ 
  rooms, 
  guests, 
  onAddRoom, 
  onDeleteRoom, 
  onOpenCheckIn,
  onViewGuest
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRoomNo, setNewRoomNo] = useState('');
  const [newFloor, setNewFloor] = useState('1st Floor');
  const [newSharing, setNewSharing] = useState(2);
  const [errorMsg, setErrorMsg] = useState('');

  const [filterSharing, setFilterSharing] = useState('all');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newRoomNo.trim()) {
      setErrorMsg('Please enter a room number.');
      return;
    }
    
    // Check if room number already exists
    if (rooms.some(r => r.roomNo === newRoomNo.trim())) {
      setErrorMsg('Room number already exists.');
      return;
    }

    onAddRoom({
      roomNo: newRoomNo.trim(),
      floor: newFloor,
      sharing: parseInt(newSharing)
    });

    // Reset and close
    setNewRoomNo('');
    setNewFloor('1st Floor');
    setNewSharing(2);
    setErrorMsg('');
    setShowAddModal(false);
  };

  const getSharingLabel = (type) => {
    switch (parseInt(type)) {
      case 1: return 'Single';
      case 2: return 'Double';
      case 3: return '3-Person';
      case 4: return '4-Person';
      default: return `${type} Share`;
    }
  };

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    if (filterSharing === 'all') return true;
    return room.sharing === parseInt(filterSharing);
  });

  return (
    <div className="space-y-6 text-left">
      {/* SaaS Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Room Allotment ({rooms.length})</h1>
          <p className="page-subtitle">Inspect rooms capacity, manage floor layouts, and register beds vacancy.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <IconPlus className="w-4 h-4" />
          Add New Room
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1-5 overflow-x-auto pb-1">
        {['all', 1, 2, 3, 4].map(type => (
          <button
            key={type}
            onClick={() => setFilterSharing(type)}
            className={`filter-btn ${filterSharing === type ? 'active' : ''}`}
          >
            {type === 'all' ? 'All Rooms' : `${getSharingLabel(type)} Share`}
          </button>
        ))}
      </div>

      {/* Room Cards Grid - Wide Responsive SaaS Grid */}
      <div className="grid grid-cols-3 gap-4">
        {filteredRooms.length === 0 ? (
          <div className="col-span-3 text-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
            <IconRoom className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No rooms configured in this pricing sharing category.</p>
          </div>
        ) : (
          filteredRooms.map(room => {
            const occupiedInRoom = room.beds.filter(b => b.guestId !== null).length;
            const isFull = occupiedInRoom === room.sharing;

            return (
              <div 
                key={room.id} 
                className={`card flex flex-col justify-between transition duration-300 ${
                  isFull ? 'border-rose-500/20 bg-rose-950/5' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Room card header info */}
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-slate-200">Room {room.roomNo}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950 border border-slate-850 text-slate-400">
                          {room.floor}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {getSharingLabel(room.sharing)} Sharing Room
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`badge ${isFull ? 'badge-danger' : 'badge-success'}`}>
                        {isFull ? 'FULL' : `${room.sharing - occupiedInRoom} Vacant`}
                      </span>
                      
                      {occupiedInRoom === 0 && (
                        <button 
                          onClick={() => onDeleteRoom(room.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/5 transition"
                          title="Delete Room"
                        >
                          <IconTrash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Beds layout mapping */}
                  <div className="mt-5 space-y-2">
                    {room.beds.map((bed, idx) => {
                      const guest = guests.find(g => g.id === bed.guestId && g.status === 'active');
                      
                      if (guest) {
                        return (
                          <div 
                            key={bed.id}
                            onClick={() => onViewGuest(guest.id)}
                            className="flex items-center gap-3 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-xl cursor-pointer transition"
                          >
                            <div className="p-1 rounded bg-indigo-500/20 text-indigo-400 flex-shrink-0 text-center w-7 font-bold text-[10px]">
                              B{idx + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-slate-200 truncate">{guest.name}</div>
                              <div className="text-[9px] text-slate-400 truncate">{guest.phone}</div>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div 
                            key={bed.id}
                            onClick={() => onOpenCheckIn(room.roomNo, bed.id)}
                            className="flex items-center gap-3 bg-slate-950/40 hover:bg-emerald-500/5 border border-dashed border-slate-800 hover:border-emerald-500/30 p-2.5 rounded-xl cursor-pointer transition group"
                          >
                            <div className="p-1 rounded bg-slate-900 group-hover:bg-emerald-500/10 text-slate-500 group-hover:text-emerald-400 flex-shrink-0 text-center w-7 font-bold text-[10px]">
                              B{idx + 1}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-500 group-hover:text-emerald-400">Vacant Bed</div>
                              <div className="text-[9px] text-slate-600 group-hover:text-emerald-500/80">Tap to allot bed</div>
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Room Modal Popup */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="w-full max-w-sm modal-container">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 m-0">
                <IconRoom className="w-4 h-4 text-indigo-400" />
                Add New PG Room
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3 py-2 rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Room Number *</label>
                <input 
                  type="text" 
                  value={newRoomNo}
                  onChange={(e) => setNewRoomNo(e.target.value)}
                  placeholder="e.g. 104, 203A"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Floor Location</label>
                <select 
                  value={newFloor}
                  onChange={(e) => setNewFloor(e.target.value)}
                  className="form-select"
                >
                  <option value="Ground Floor">Ground Floor</option>
                  <option value="1st Floor">1st Floor</option>
                  <option value="2nd Floor">2nd Floor</option>
                  <option value="3rd Floor">3rd Floor</option>
                  <option value="4th Floor">4th Floor</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Sharing Capacity (Beds)</label>
                <select 
                  value={newSharing}
                  onChange={(e) => setNewSharing(e.target.value)}
                  className="form-select"
                >
                  <option value="1">Single Share Room</option>
                  <option value="2">Double Share Room</option>
                  <option value="3">3-Persons Share Room</option>
                  <option value="4">4-Persons Share Room</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1"
                >
                  Save Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
