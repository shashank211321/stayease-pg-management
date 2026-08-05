import React, { useState, useEffect } from 'react';
import { 
  initDb, 
  getRooms, 
  saveRooms, 
  getGuests, 
  saveGuests, 
  getPayments, 
  savePayments, 
  getRentConfig, 
  saveRentConfig, 
  getPaymentConfig, 
  savePaymentConfig,
  getPgConfig,
  savePgConfig,
  getOtpConfig,
  saveOtpConfig,
  resetDb,
  loadDemoDb
} from './utils/db';
import { 
  IconDashboard, 
  IconRoom, 
  IconGuest, 
  IconPayment, 
  IconSettings,
  IconClose,
  IconSun,
  IconMoon,
  IconLogOut,
  IconCheck,
  IconInfo
} from './components/Icons';

// Sub components
import Dashboard from './components/Dashboard';
import RoomManagement from './components/RoomManagement';
import GuestManagement from './components/GuestManagement';
import Payments from './components/Payments';
import Settings from './components/Settings';
import Login from './components/Login';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem('owner_logged_in') === 'true'
  );
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('app_theme') || 'dark');
  const [rooms, setRooms] = useState([]);
  const [pgConfig, setPgConfig] = useState({});
  const [pgConnected, setPgConnected] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const [guests, setGuests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [rentConfig, setRentConfig] = useState({});
  const [paymentConfig, setPaymentConfig] = useState({});
  const [otpConfig, setOtpConfig] = useState({});

  // Form check-in prefills
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [prefilledRoomNo, setPrefilledRoomNo] = useState('');
  const [prefilledBedId, setPrefilledBedId] = useState('');
  const [selectedGuestId, setSelectedGuestId] = useState(null);

  // Toast notifications state
  const [toast, setToast] = useState(null);
  const [toastTimeoutId, setToastTimeoutId] = useState(null);

  const showNotification = (message, type = 'success') => {
    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
    }
    setToast({ message, type });
    const tId = setTimeout(() => {
      setToast(null);
      setToastTimeoutId(null);
    }, 3000);
    setToastTimeoutId(tId);
  };

  const handleLogout = () => {
    localStorage.removeItem('owner_logged_in');
    setIsLoggedIn(false);
    showNotification("Logged out successfully.", "info");
  };

  // Load state on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await initDb();
        const [roomsData, guestsData, paymentsData, rentConfigData, paymentConfigData, otpConfigData, pgConfigData] = await Promise.all([
          getRooms(),
          getGuests(),
          getPayments(),
          getRentConfig(),
          getPaymentConfig(),
          getOtpConfig(),
          getPgConfig()
        ]);
        setRooms(roomsData);
        setGuests(guestsData);
        setPayments(paymentsData);
        setRentConfig(rentConfigData);
        setPaymentConfig(paymentConfigData);
        setOtpConfig(otpConfigData);
        setPgConfig(pgConfigData.config || {});
        setPgConnected(pgConfigData.connected || false);
      } catch (err) {
        showNotification("Failed to load initial data from server", "error");
      }
    };
    loadData();
  }, []);

  // Handlers
  const handleAddRoom = async (roomData) => {
    const newId = `room-${Date.now()}`;
    const newBeds = Array.from({ length: roomData.sharing }, (_, idx) => ({
      id: `${roomData.roomNo}-${idx + 1}`,
      guestId: null
    }));

    const updatedRooms = [...rooms, {
      id: newId,
      roomNo: roomData.roomNo,
      floor: roomData.floor,
      sharing: roomData.sharing,
      beds: newBeds
    }];

    try {
      const saved = await saveRooms(updatedRooms);
      setRooms(saved);
      showNotification(`Room ${roomData.roomNo} successfully created!`, 'success');
    } catch (err) {
      showNotification("Failed to create room", "error");
    }
  };

  const handleDeleteRoom = async (roomId) => {
    const targetRoom = rooms.find(r => r.id === roomId);
    const updatedRooms = rooms.filter(r => r.id !== roomId);
    try {
      const saved = await saveRooms(updatedRooms);
      setRooms(saved);
      showNotification(`Room ${targetRoom?.roomNo || ''} successfully deleted.`, 'info');
    } catch (err) {
      showNotification("Failed to delete room", "error");
    }
  };

  const handleCheckIn = async (guestData) => {
    const newGuestId = `g-${Date.now()}`;
    const newGuest = {
      id: newGuestId,
      ...guestData,
      status: 'active',
      leavingDate: null
    };

    // 1. Add to guests list
    const updatedGuests = [...guests, newGuest];

    // 2. Allocate in room bed lists
    const updatedRooms = rooms.map(room => {
      if (room.roomNo === guestData.roomNo) {
        return {
          ...room,
          beds: room.beds.map(bed => {
            if (bed.id === guestData.bedId) {
              return { ...bed, guestId: newGuestId };
            }
            return bed;
          })
        };
      }
      return room;
    });

    // 3. Create a pending payment record for this month if it doesn't exist
    const currentMonth = "June 2026"; // hardcoded current system context
    const hasPayment = payments.some(p => p.guestId === newGuestId && p.month === currentMonth);
    let updatedPayments = [...payments];
    if (!hasPayment) {
      const newPayment = {
        id: `p-${Date.now()}`,
        guestId: newGuestId,
        guestName: guestData.name,
        roomNo: guestData.roomNo,
        month: currentMonth,
        amount: guestData.monthlyRent,
        status: 'Pending',
        paymentDate: '',
        paymentMethod: '',
        transactionId: ''
      };
      updatedPayments.push(newPayment);
    }

    try {
      const [savedGuests, savedRooms, savedPayments] = await Promise.all([
        saveGuests(updatedGuests),
        saveRooms(updatedRooms),
        savePayments(updatedPayments)
      ]);
      setGuests(savedGuests);
      setRooms(savedRooms);
      setPayments(savedPayments);
      showNotification(`${guestData.name} checked in to Room ${guestData.roomNo}!`, 'success');
    } catch (err) {
      showNotification("Failed to check in guest", "error");
    }
  };

  const handleCheckOut = async (guestId, leavingDate) => {
    const guest = guests.find(g => g.id === guestId);
    if (!guest) return;

    // 1. Mark status and date
    const updatedGuests = guests.map(g => {
      if (g.id === guestId) {
        return { ...g, status: 'checked-out', leavingDate };
      }
      return g;
    });

    // 2. Clear bed vacancy in rooms state
    const updatedRooms = rooms.map(room => {
      if (room.roomNo === guest.roomNo) {
        return {
          ...room,
          beds: room.beds.map(bed => {
            if (bed.guestId === guestId) {
              return { ...bed, guestId: null };
            }
            return bed;
          })
        };
      }
      return room;
    });

    try {
      const [savedGuests, savedRooms] = await Promise.all([
        saveGuests(updatedGuests),
        saveRooms(updatedRooms)
      ]);
      setGuests(savedGuests);
      setRooms(savedRooms);
      showNotification(`${guest.name} successfully checked out.`, 'info');
    } catch (err) {
      showNotification("Failed to check out guest", "error");
    }
  };

  const handleRecordPayment = async (paymentData) => {
    const currentMonth = paymentData.month;
    const existingIndex = payments.findIndex(p => p.guestId === paymentData.guestId && p.month === currentMonth);

    let updatedPayments;
    const today = new Date().toISOString().split('T')[0];

    if (existingIndex > -1) {
      // Update existing pending record
      updatedPayments = payments.map((p, idx) => {
        if (idx === existingIndex) {
          return {
            ...p,
            status: 'Paid',
            paymentDate: today,
            paymentMethod: paymentData.paymentMethod,
            transactionId: paymentData.transactionId
          };
        }
        return p;
      });
    } else {
      // Create new record
      const newPayment = {
        id: `p-${Date.now()}`,
        guestId: paymentData.guestId,
        guestName: paymentData.guestName,
        roomNo: paymentData.roomNo,
        month: currentMonth,
        amount: paymentData.amount,
        status: 'Paid',
        paymentDate: today,
        paymentMethod: paymentData.paymentMethod,
        transactionId: paymentData.transactionId
      };
      updatedPayments = [...payments, newPayment];
    }

    try {
      const saved = await savePayments(updatedPayments);
      setPayments(saved);
      showNotification(`Recorded ₹${paymentData.amount} payment for ${paymentData.guestName}!`, 'success');
    } catch (err) {
      showNotification("Failed to record payment", "error");
    }
  };

  const handleSaveRentConfig = async (newConfig) => {
    try {
      const saved = await saveRentConfig(newConfig);
      setRentConfig(saved);
      showNotification("Rent prices saved successfully!", "success");
    } catch (err) {
      showNotification("Failed to save rent configurations", "error");
    }
  };

  const handleSavePaymentConfig = async (newConfig) => {
    const updatedConfig = { ...paymentConfig, ...newConfig };
    try {
      const saved = await savePaymentConfig(updatedConfig);
      setPaymentConfig(saved);
      showNotification("UPI payment config updated!", "success");
    } catch (err) {
      showNotification("Failed to save payment configurations", "error");
    }
  };

  const handleSaveOtpConfig = async (newConfig) => {
    const updatedConfig = { ...otpConfig, ...newConfig };
    try {
      const saved = await saveOtpConfig(updatedConfig);
      setOtpConfig(saved);
      showNotification("Real-time OTP config updated!", "success");
    } catch (err) {
      showNotification("Failed to save OTP configurations", "error");
    }
  };

  const handleSavePgConfig = async (newConfig) => {
    const res = await savePgConfig(newConfig);
    if (res.success) {
      setPgConfig(newConfig);
      setPgConnected(res.connected);
      try {
        const [roomsData, guestsData, paymentsData] = await Promise.all([
          getRooms(),
          getGuests(),
          getPayments()
        ]);
        setRooms(roomsData);
        setGuests(guestsData);
        setPayments(paymentsData);
      } catch (e) {
        console.error('Failed to reload listings after database switch:', e);
      }
    } else {
      setPgConnected(false);
    }
    return res;
  };

  // Navigtion flow actions
  const openCheckInForm = (roomNo = '', bedId = '') => {
    setPrefilledRoomNo(roomNo);
    setPrefilledBedId(bedId);
    setShowCheckInModal(true);
    setActiveTab('guests');
  };

  const handleLoadDemo = async () => {
    try {
      await loadDemoDb();
      const [roomsData, guestsData, paymentsData, rentConfigData, paymentConfigData, otpConfigData] = await Promise.all([
        getRooms(),
        getGuests(),
        getPayments(),
        getRentConfig(),
        getPaymentConfig(),
        getOtpConfig()
      ]);
      setRooms(roomsData);
      setGuests(guestsData);
      setPayments(paymentsData);
      setRentConfig(rentConfigData);
      setPaymentConfig(paymentConfigData);
      setOtpConfig(otpConfigData);
      showNotification("Demo preview database successfully loaded!", "success");
    } catch (err) {
      showNotification("Failed to load demo preview database", "error");
    }
  };

  const viewGuestDetails = (guestId) => {
    setSelectedGuestId(guestId);
    setActiveTab('guests');
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            rooms={rooms}
            guests={guests}
            payments={payments}
            rentConfig={rentConfig}
            setActiveTab={setActiveTab}
            onOpenCheckIn={() => openCheckInForm('', '')}
          />
        );
      case 'rooms':
        return (
          <RoomManagement 
            rooms={rooms}
            guests={guests}
            onAddRoom={handleAddRoom}
            onDeleteRoom={handleDeleteRoom}
            onOpenCheckIn={openCheckInForm}
            onViewGuest={viewGuestDetails}
          />
        );
      case 'guests':
        return (
          <GuestManagement 
            rooms={rooms}
            guests={guests}
            rentConfig={rentConfig}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            selectedGuestId={selectedGuestId}
            setSelectedGuestId={setSelectedGuestId}
            showCheckInModal={showCheckInModal}
            setShowCheckInModal={setShowCheckInModal}
            prefilledRoomNo={prefilledRoomNo}
            prefilledBedId={prefilledBedId}
          />
        );
      case 'payments':
        return (
          <Payments 
            guests={guests}
            payments={payments}
            paymentConfig={paymentConfig}
            onSavePaymentConfig={handleSavePaymentConfig}
            onRecordPayment={handleRecordPayment}
          />
        );
      case 'settings':
        return (
          <Settings 
            rentConfig={rentConfig}
            onSaveRentConfig={handleSaveRentConfig}
            otpConfig={otpConfig}
            onSaveOtpConfig={handleSaveOtpConfig}
            pgConfig={pgConfig}
            pgConnected={pgConnected}
            onSavePgConfig={handleSavePgConfig}
            onResetDb={resetDb}
            onLoadDemo={handleLoadDemo}
            onShowNotification={showNotification}
          />
        );
      default:
        return <div className="text-slate-400 text-xs">Tab Under Construction</div>;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="app-container">
        {toast && (
          <div className={`toast-banner toast-${toast.type} flex items-center gap-3 p-3.5 rounded-2xl border backdrop-blur-md shadow-2xl`}>
            {toast.type === 'success' && <IconCheck className="w-4 h-4 text-white flex-shrink-0" />}
            {toast.type === 'error' && <IconClose className="w-4 h-4 text-white flex-shrink-0" />}
            {toast.type === 'info' && <IconInfo className="w-4 h-4 text-white flex-shrink-0" />}
            <div className="flex-1 text-xs font-bold text-white leading-snug">
              {toast.message}
            </div>
            <button onClick={() => setToast(null)} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer">
              <IconClose className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <Login 
          otpConfig={otpConfig}
          onLoginSuccess={() => {
            localStorage.setItem('owner_logged_in', 'true');
            setIsLoggedIn(true);
            showNotification("Welcome back! Logged in successfully.", "success");
          }} 
          onShowNotification={showNotification}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Toast Notification Banner */}
      {toast && (
        <div className={`toast-banner toast-${toast.type} flex items-center gap-3 p-3.5 rounded-2xl border backdrop-blur-md shadow-2xl`}>
          {toast.type === 'success' && <IconCheck className="w-4 h-4 text-white flex-shrink-0" />}
          {toast.type === 'error' && <IconClose className="w-4 h-4 text-white flex-shrink-0" />}
          {toast.type === 'info' && <IconInfo className="w-4 h-4 text-white flex-shrink-0" />}
          <div className="flex-1 text-xs font-bold text-white leading-snug">
            {toast.message}
          </div>
          <button onClick={() => setToast(null)} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer">
            <IconClose className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Mobile Sidebar Overlay Backdrop */}
      {sidebarOpen && (
        <div 
          className="sidebar-backdrop show" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="profile-avatar">SE</div>
          <span className="sidebar-logo-text font-bold">StayEase PG</span>
        </div>
        
        <div className="sidebar-menu">
          <button 
            onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
            className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <IconDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>

          <button 
            onClick={() => { setActiveTab('rooms'); setSidebarOpen(false); }}
            className={`sidebar-item ${activeTab === 'rooms' ? 'active' : ''}`}
          >
            <IconRoom className="w-5 h-5" />
            <span>Room Allotment</span>
          </button>

          <button 
            onClick={() => { setActiveTab('guests'); setSidebarOpen(false); }}
            className={`sidebar-item ${activeTab === 'guests' ? 'active' : ''}`}
          >
            <IconGuest className="w-5 h-5" />
            <span>Guests & Aadhaar</span>
          </button>

          <button 
            onClick={() => { setActiveTab('payments'); setSidebarOpen(false); }}
            className={`sidebar-item ${activeTab === 'payments' ? 'active' : ''}`}
          >
            <IconPayment className="w-5 h-5" />
            <span>Rent Payments</span>
          </button>

          <button 
            onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }}
            className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
          >
            <IconSettings className="w-5 h-5" />
            <span>Config Setup</span>
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="flex flex-col gap-3 w-full">
            <div className="sidebar-profile flex items-center justify-between w-full">
              <div className="flex items-center gap-2 min-w-0">
                <div className="profile-avatar bg-indigo-600">OW</div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-100 truncate">PG Owner</div>
                  <div className="text-[10px] text-slate-500 truncate">Logged In</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/30 text-rose-400 transition cursor-pointer"
                title="Log Out"
              >
                <IconLogOut className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-between items-center w-full border-t border-slate-800/40 pt-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Interface Theme</span>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-slate-900/40 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              >
                {theme === 'dark' ? <IconSun className="w-4 h-4 text-amber-400" /> : <IconMoon className="w-4 h-4 text-indigo-400" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile viewport header */}
      <div className="mobile-header">
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
        <span className="sidebar-logo-text font-bold">StayEase PG</span>
        <button 
          onClick={toggleTheme} 
          className="mobile-menu-btn p-1"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <IconSun className="w-5 h-5 text-amber-400" /> : <IconMoon className="w-5 h-5 text-indigo-400" />}
        </button>
      </div>

      {/* Main Viewport Workspace */}
      <div className="main-viewport" onClick={() => setSidebarOpen(false)}>
        {renderActiveTab()}
      </div>
    </div>
  );
}

