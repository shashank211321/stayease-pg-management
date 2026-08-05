import React, { useState } from 'react';
import { IconGuest, IconPlus, IconClose, IconUpload } from './Icons';
import { compressImage } from '../utils/imageCompressor';

export default function GuestManagement({
  rooms,
  guests,
  rentConfig,
  onCheckIn,
  onCheckOut,
  selectedGuestId,
  setSelectedGuestId,
  showCheckInModal,
  setShowCheckInModal,
  prefilledRoomNo,
  prefilledBedId
}) {
  const [activeSubTab, setActiveSubTab] = useState('active'); // 'active' or 'past'
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmergency, setFormEmergency] = useState('');
  const [formAadhaarNo, setFormAadhaarNo] = useState('');
  const [formAadhaarImage, setFormAadhaarImage] = useState('');
  const [formSharing, setFormSharing] = useState('2');
  const [formRoom, setFormRoom] = useState('');
  const [formBed, setFormBed] = useState('');
  const [formJoiningDate, setFormJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDeposit, setFormDeposit] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [formError, setFormError] = useState('');

  // Check-out date picker modal state
  const [showCheckoutDatePicker, setShowCheckoutDatePicker] = useState(false);
  const [checkoutDate, setCheckoutDate] = useState(new Date().toISOString().split('T')[0]);

  // Handle Aadhaar image change (uploading + resizing)
  const handleAadhaarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageUploading(true);
    setFormError('');
    try {
      const compressedBase64 = await compressImage(file, 600); // Max dimension 600px
      setFormAadhaarImage(compressedBase64);
    } catch (err) {
      console.error(err);
      setFormError('Failed to process Aadhaar image. Try another file.');
    } finally {
      setImageUploading(false);
    }
  };

  // Get list of rooms with vacancy matching sharing type
  const availableRoomBeds = React.useMemo(() => {
    const list = [];
    rooms.forEach(room => {
      if (room.sharing === parseInt(formSharing)) {
        room.beds.forEach(bed => {
          if (bed.guestId === null) {
            list.push({
              roomNo: room.roomNo,
              bedId: bed.id,
              floor: room.floor
            });
          }
        });
      }
    });
    return list;
  }, [rooms, formSharing]);

  // Prefill rooms when form values change
  React.useEffect(() => {
    if (prefilledRoomNo && prefilledBedId && showCheckInModal) {
      const targetRoom = rooms.find(r => r.roomNo === prefilledRoomNo);
      if (targetRoom) {
        setFormSharing(targetRoom.sharing.toString());
        setFormRoom(prefilledRoomNo);
        setFormBed(prefilledBedId);
      }
    } else {
      if (availableRoomBeds.length > 0) {
        setFormRoom(availableRoomBeds[0].roomNo);
        setFormBed(availableRoomBeds[0].bedId);
      } else {
        setFormRoom('');
        setFormBed('');
      }
    }
  }, [formSharing, showCheckInModal, prefilledRoomNo, prefilledBedId, rooms, availableRoomBeds]);

  const handleCheckInSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formName || !formPhone || !formAadhaarNo || !formRoom || !formBed) {
      setFormError('Please fill out all required fields.');
      return;
    }

    if (formPhone.length < 10) {
      setFormError('Phone number should be at least 10 digits.');
      return;
    }

    if (formAadhaarNo.length !== 12) {
      setFormError('Aadhaar number must be exactly 12 digits.');
      return;
    }

    const calculatedRent = rentConfig[formSharing] || 0;

    onCheckIn({
      name: formName,
      phone: formPhone,
      emergencyPhone: formEmergency,
      aadhaarNo: formAadhaarNo,
      aadhaarImage: formAadhaarImage,
      sharingType: parseInt(formSharing),
      roomNo: formRoom,
      bedId: formBed,
      joiningDate: formJoiningDate,
      monthlyRent: calculatedRent,
      deposit: parseFloat(formDeposit) || 0
    });

    // Reset Form
    setFormName('');
    setFormPhone('');
    setFormEmergency('');
    setFormAadhaarNo('');
    setFormAadhaarImage('');
    setFormSharing('2');
    setFormRoom('');
    setFormBed('');
    setFormDeposit('');
    setShowCheckInModal(false);
  };

  const handleCheckoutConfirm = () => {
    onCheckOut(selectedGuestId, checkoutDate);
    setShowCheckoutDatePicker(false);
    setSelectedGuestId(null);
  };

  const getSharingLabel = (type) => {
    switch (parseInt(type)) {
      case 1: return 'Single Share';
      case 2: return 'Double Share';
      case 3: return '3-Person Share';
      case 4: return '4-Person Share';
      default: return `${type} Share`;
    }
  };

  // Filter guests
  const filteredGuests = guests.filter(guest => {
    const isTabMatch = activeSubTab === 'active' ? guest.status === 'active' : guest.status === 'checked-out';
    const isSearchMatch = 
      guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.phone.includes(searchQuery) ||
      guest.roomNo.includes(searchQuery);
    return isTabMatch && isSearchMatch;
  });

  const selectedGuest = guests.find(g => g.id === selectedGuestId);

  return (
    <div className="space-y-6 text-left">
      {/* SaaS Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Guests Directory</h1>
          <p className="page-subtitle">Track current and past residents, Aadhaar records, and room details.</p>
        </div>
        <button 
          onClick={() => {
            setFormError('');
            setShowCheckInModal(true);
          }}
          className="btn btn-primary"
        >
          <IconPlus className="w-4 h-4" />
          Check-In Guest
        </button>
      </div>

      {/* Sub Tabs and Search Bar - Combined row */}
      <div className="filters-row">
        {/* Toggle Sub Tabs */}
        <div className="segmented-control filters-tabs">
          <button
            type="button"
            onClick={() => setActiveSubTab('active')}
            className={`segmented-item ${activeSubTab === 'active' ? 'active' : ''}`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('past')}
            className={`segmented-item ${activeSubTab === 'past' ? 'active' : ''}`}
          >
            Checked-Out
          </button>
        </div>

        {/* Search Bar Input */}
        <div className="relative filters-search">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search residents by name, phone, room number..."
            className="form-input py-2.5 px-4 text-xs"
          />
        </div>
      </div>

      {/* Guest Cards Grid - Wide Responsive Layout */}
      <div className="grid grid-cols-3 gap-4">
        {filteredGuests.length === 0 ? (
          <div className="col-span-3 text-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
            <IconGuest className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No resident records found matching your filters.</p>
          </div>
        ) : (
          filteredGuests.map(guest => (
            <div
              key={guest.id}
              onClick={() => setSelectedGuestId(guest.id)}
              className="card flex flex-col justify-between cursor-pointer border-slate-800 hover:border-slate-700 transition"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <IconGuest className="w-6 h-6" />
                  </div>
                  <span className="badge badge-indigo">
                    Room {guest.roomNo}
                  </span>
                </div>
                
                <h4 className="text-sm font-extrabold text-slate-200 truncate m-0">{guest.name}</h4>
                
                <div className="space-y-1.5 mt-3 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Phone:</span>
                    <span className="text-slate-200 font-semibold">{guest.phone}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Join Date:</span>
                    <span className="text-slate-200 font-semibold">{guest.joiningDate}</span>
                  </div>
                  {guest.leavingDate && (
                    <div className="flex justify-between text-rose-400">
                      <span>Left Date:</span>
                      <span className="font-bold">{guest.leavingDate}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-850 pt-3 mt-4 flex justify-between items-center text-xs">
                <span className="text-slate-500">Rent Value</span>
                <span className="text-emerald-400 font-extrabold">₹{guest.monthlyRent.toLocaleString('en-IN')}/mo</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Guest Details Overlay Drawer Modal */}
      {selectedGuest && (
        <div className="modal-overlay">
          <div className="w-full max-w-md modal-container">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">Resident Profile Card</h3>
              <button 
                onClick={() => setSelectedGuestId(null)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Profile Details Header */}
              <div className="flex items-center gap-4 bg-slate-800/20 p-4 rounded-xl border border-slate-800">
                <div className="p-3.5 rounded-full bg-indigo-600/10 text-indigo-400">
                  <IconGuest className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-200 m-0">{selectedGuest.name}</h4>
                  <p className="text-xs text-indigo-300 font-bold mt-1">Room {selectedGuest.roomNo} (Bed {selectedGuest.bedId.split('-')[1]})</p>
                </div>
              </div>

              {/* Resident Info details table */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-850">
                  <span className="text-slate-400">Phone Number</span>
                  <span className="text-slate-200 font-semibold">{selectedGuest.phone}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-850">
                  <span className="text-slate-400">Emergency Contact</span>
                  <span className="text-slate-200 font-semibold">{selectedGuest.emergencyPhone || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-850">
                  <span className="text-slate-400">Aadhaar Card No</span>
                  <span className="text-slate-200 font-semibold">{selectedGuest.aadhaarNo}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-850">
                  <span className="text-slate-400">Sharing Category</span>
                  <span className="text-slate-200 font-semibold">{getSharingLabel(selectedGuest.sharingType)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-850">
                  <span className="text-slate-400">Check-In Date</span>
                  <span className="text-slate-200 font-semibold">{selectedGuest.joiningDate}</span>
                </div>
                {selectedGuest.leavingDate && (
                  <div className="flex justify-between py-1.5 border-b border-slate-850">
                    <span className="text-slate-400">Check-Out Date</span>
                    <span className="text-rose-400 font-extrabold">{selectedGuest.leavingDate}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 border-b border-slate-850">
                  <span className="text-slate-400">Monthly Rent Contract</span>
                  <span className="text-emerald-400 font-extrabold">₹{selectedGuest.monthlyRent.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Aadhaar Uploaded Image Preview */}
              <div className="space-y-2">
                <span className="form-label block">Aadhaar Verification Proof</span>
                {selectedGuest.aadhaarImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-850 bg-slate-950 aspect-[1.6] flex items-center justify-center">
                    <img 
                      src={selectedGuest.aadhaarImage} 
                      alt="Aadhaar Card" 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="bg-slate-950 border border-slate-850 p-4 text-center rounded-xl text-xs text-slate-500 italic">
                    No Aadhaar verification document uploaded.
                  </div>
                )}
              </div>

              {/* Check-Out Action Button */}
              {selectedGuest.status === 'active' && (
                <div className="pt-2">
                  <button
                    onClick={() => setShowCheckoutDatePicker(true)}
                    className="btn btn-danger w-full py-2.5"
                  >
                    Check-Out Resident
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Check-Out Date Picker Modal Popup */}
      {showCheckoutDatePicker && (
        <div className="modal-overlay">
          <div className="w-full max-w-xs modal-container">
            <h4 className="text-sm font-bold text-slate-200 text-left m-0">Confirm Departure Date</h4>
            
            <div className="form-group text-left">
              <label className="form-label">Check-Out Date</label>
              <input
                type="date"
                value={checkoutDate}
                onChange={(e) => setCheckoutDate(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCheckoutDatePicker(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckoutConfirm}
                className="btn btn-danger flex-1"
              >
                Confirm Check-Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Check-In Modal Popup - Revamped to 2 columns on desktop */}
      {showCheckInModal && (
        <div className="modal-overlay">
          <div className="w-full max-w-xl modal-container">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">Resident Check-In Registration</h3>
              <button 
                onClick={() => setShowCheckInModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCheckInSubmit} className="space-y-4 text-left">
              {formError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3 py-2.5 rounded-xl font-semibold">
                  {formError}
                </div>
              )}

              {/* Row 1: Full Name */}
              <div className="form-group">
                <label className="form-label">Resident Name *</label>
                <input 
                  type="text" 
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Enter resident's full name"
                  className="form-input"
                  required
                />
              </div>

              {/* Row 2: Phone & Emergency Contact (2 Columns) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input 
                    type="tel" 
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Primary mobile number"
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Emergency Guardian Phone</label>
                  <input 
                    type="tel" 
                    value={formEmergency}
                    onChange={(e) => setFormEmergency(e.target.value)}
                    placeholder="Guardian mobile number"
                    className="form-input"
                  />
                </div>
              </div>

              {/* Row 3: Aadhaar card details */}
              <div className="form-group">
                <label className="form-label">Aadhaar Card Number *</label>
                <input 
                  type="text" 
                  maxLength="12"
                  value={formAadhaarNo}
                  onChange={(e) => setFormAadhaarNo(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 12-digit Aadhaar Number"
                  className="form-input"
                  required
                />
              </div>

              {/* Row 4: Aadhaar File Uploader */}
              <div className="form-group">
                <label className="form-label">Upload Aadhaar Document Proof *</label>
                <div className="file-uploader">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAadhaarUpload}
                    className="file-uploader-input"
                  />
                  {imageUploading ? (
                    <span className="text-xs text-indigo-400 font-bold">Resizing & Processing Photo...</span>
                  ) : formAadhaarImage ? (
                    <div className="flex items-center gap-3">
                      <img src={formAadhaarImage} alt="Preview" className="h-12 object-contain rounded-md" />
                      <span className="text-xs text-emerald-400 font-bold">Aadhaar Loaded Successfully ✓</span>
                    </div>
                  ) : (
                    <>
                      <IconUpload className="w-6 h-6 text-slate-500 mb-1" />
                      <span className="text-xs text-slate-400">Drag/Select verification photo (JPG, PNG)</span>
                    </>
                  )}
                </div>
              </div>

              {/* Row 5: Sharing & Bed Selection (2 Columns) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Sharing Option Preference</label>
                  <select 
                    value={formSharing}
                    onChange={(e) => setFormSharing(e.target.value)}
                    disabled={!!prefilledRoomNo}
                    className="form-select disabled:opacity-50"
                  >
                    <option value="1">Single Share (₹{rentConfig[1] || 0}/mo)</option>
                    <option value="2">Double Share (₹{rentConfig[2] || 0}/mo)</option>
                    <option value="3">3-Person Share (₹{rentConfig[3] || 0}/mo)</option>
                    <option value="4">4-Person Share (₹{rentConfig[4] || 0}/mo)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Room & Bed Allocation *</label>
                  {prefilledRoomNo && prefilledBedId ? (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-indigo-300 font-bold">
                      Room {prefilledRoomNo} • Bed {prefilledBedId.split('-')[1]}
                    </div>
                  ) : availableRoomBeds.length === 0 ? (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl px-3 py-2 text-xs text-center font-bold">
                      No Vacancies in {getSharingLabel(formSharing)}
                    </div>
                  ) : (
                    <select
                      value={`${formRoom}|${formBed}`}
                      onChange={(e) => {
                        const [rm, bd] = e.target.value.split('|');
                        setFormRoom(rm);
                        setFormBed(bd);
                      }}
                      className="form-select"
                      required
                    >
                      {availableRoomBeds.map(item => (
                        <option key={item.bedId} value={`${item.roomNo}|${item.bedId}`}>
                          Room {item.roomNo} (Bed {item.bedId.split('-')[1]})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Row 6: Joining Date & Security Deposit (2 Columns) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Joining Date *</label>
                  <input 
                    type="date" 
                    value={formJoiningDate}
                    onChange={(e) => setFormJoiningDate(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Security Deposit Amount (₹)</label>
                  <input 
                    type="number" 
                    value={formDeposit}
                    onChange={(e) => setFormDeposit(e.target.value)}
                    placeholder="Enter security deposit amount"
                    className="form-input"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-3 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setShowCheckInModal(false)}
                  className="btn btn-secondary flex-1 py-2.5"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={availableRoomBeds.length === 0 && !prefilledBedId}
                  className="btn btn-primary flex-1 py-2.5 disabled:opacity-50"
                >
                  Confirm Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
