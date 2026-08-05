import React, { useState } from 'react';
import { 
  IconPayment, 
  IconCheck, 
  IconClose, 
  IconSettings, 
  IconUpload, 
  IconSmartphone, 
  IconArrowRight, 
  IconCopy 
} from './Icons';
import { compressImage } from '../utils/imageCompressor';

export default function Payments({
  guests,
  payments,
  paymentConfig,
  onSavePaymentConfig,
  onRecordPayment
}) {
  const [selectedMonth, setSelectedMonth] = useState('June 2026');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'Paid', 'Pending'

  // Payment configuration states
  const [configUpiId, setConfigUpiId] = useState(paymentConfig.upiId);
  const [configMerchantName, setConfigMerchantName] = useState(paymentConfig.merchantName);
  const [configBillingDay, setConfigBillingDay] = useState(paymentConfig.billingDay);
  const [configQrCodeImage, setConfigQrCodeImage] = useState(paymentConfig.upiQrCodeImage || '');
  
  const [qrUploading, setQrUploading] = useState(false);
  const [qrError, setQrError] = useState('');

  // Payment Collection process states
  const [activeCollection, setActiveCollection] = useState(null); // Guest object to collect for
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI', 'Cash'
  const [txnId, setTxnId] = useState('');
  
  // App redirection states
  const [redirectionApp, setRedirectionApp] = useState(null);
  const [showRedirectionScreen, setShowRedirectionScreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrType, setQrType] = useState('dynamic'); // 'dynamic' or 'custom'

  // Handle QR image upload
  const handleQrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setQrUploading(true);
    setQrError('');
    try {
      // Compress to 400px max width/height to fit comfortably in localStorage (~20-30kb base64)
      const compressedBase64 = await compressImage(file, 400);
      setConfigQrCodeImage(compressedBase64);
    } catch (err) {
      console.error(err);
      setQrError('Failed to process QR code image.');
    } finally {
      setQrUploading(false);
    }
  };

  // Handle configuration save
  const handleConfigSubmit = (e) => {
    e.preventDefault();
    onSavePaymentConfig({
      upiId: configUpiId.trim(),
      merchantName: configMerchantName.trim(),
      billingDay: parseInt(configBillingDay),
      upiQrCodeImage: configQrCodeImage
    });
    setShowConfigModal(false);
  };

  // Compile billing records for selected month.
  const activeResidents = guests.filter(g => {
    const joinDate = new Date(g.joiningDate);
    const billingMonthYear = selectedMonth;
    
    // Simplistic monthly active check
    const [monthName, yearStr] = billingMonthYear.split(' ');
    const monthIndex = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(monthName);
    const checkDate = new Date(parseInt(yearStr), monthIndex, 28); // Check near end of month

    if (g.status === 'checked-out' && g.leavingDate) {
      const leaveDate = new Date(g.leavingDate);
      return joinDate <= checkDate && leaveDate >= new Date(parseInt(yearStr), monthIndex, 1);
    }
    
    return joinDate <= checkDate;
  });

  const billingRecords = activeResidents.map(resident => {
    const payment = payments.find(p => p.guestId === resident.id && p.month === selectedMonth);
    return {
      guest: resident,
      payment: payment || null,
      status: payment ? payment.status : 'Pending',
      amount: resident.monthlyRent
    };
  });

  // Filter records
  const filteredRecords = billingRecords.filter(record => {
    if (filterStatus === 'all') return true;
    return record.status === filterStatus;
  });

  // Generate UPI payment details with dynamic room and month details
  const getUpiUrl = (name, roomNo, amount) => {
    const cleanMerchant = paymentConfig.merchantName.replace(/[^a-zA-Z0-9 ]/g, '');
    const cleanNote = `Rent_Room${roomNo}_${name.replace(/[^a-zA-Z0-9]/g, '')}_${selectedMonth.replace(' ', '_')}`;
    return `upi://pay?pa=${encodeURIComponent(paymentConfig.upiId)}&pn=${encodeURIComponent(cleanMerchant)}&am=${amount}&tn=${encodeURIComponent(cleanNote)}&cu=INR`;
  };

  const getQrCodeUrl = (upiUrl) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;
  };

  // Generate App-Specific deep link parameters for direct mobile trigger
  const getAppSpecificUpiUrl = (appName, upiUrl) => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (!isAndroid) return upiUrl; // Default iOS / Safari handling uses OS chooser for upi://

    const baseData = upiUrl.replace('upi://pay?', '');
    switch (appName) {
      case 'Google Pay':
        return `intent://pay?${baseData}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
      case 'PhonePe':
        return `intent://pay?${baseData}#Intent;scheme=upi;package=com.phonepe.app;end`;
      case 'Paytm':
        return `intent://pay?${baseData}#Intent;scheme=upi;package=net.one97.paytm;end`;
      case 'BHIM':
        return `intent://pay?${baseData}#Intent;scheme=upi;package=in.org.npci.upiapp;end`;
      default:
        return upiUrl;
    }
  };

  const handleUpiAppPay = (appName, amount, name, roomNo) => {
    const upiUrl = getUpiUrl(name, roomNo, amount);
    const deepLink = getAppSpecificUpiUrl(appName, upiUrl);
    setRedirectionApp(appName);
    setShowRedirectionScreen(true);
    
    // Redirect browser/webview
    window.location.href = deepLink;
  };

  const handleRecordPaymentSubmit = (e) => {
    e.preventDefault();
    if (!activeCollection) return;

    onRecordPayment({
      guestId: activeCollection.guest.id,
      guestName: activeCollection.guest.name,
      roomNo: activeCollection.guest.roomNo,
      month: selectedMonth,
      amount: activeCollection.amount,
      paymentMethod,
      transactionId: paymentMethod === 'UPI' ? txnId : ''
    });

    // Reset collection panel
    setActiveCollection(null);
    setTxnId('');
    setShowRedirectionScreen(false);
    setRedirectionApp(null);
  };

  const copyUpiLink = (name, roomNo, amount) => {
    const upiUrl = getUpiUrl(name, roomNo, amount);
    navigator.clipboard.writeText(upiUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 text-left">
      {/* SaaS Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Rent Collections</h1>
          <p className="page-subtitle">Invoice monthly rent payments, verify transaction receipts, and configure UPI gateway details.</p>
        </div>
        <button 
          onClick={() => {
            setConfigUpiId(paymentConfig.upiId || '');
            setConfigMerchantName(paymentConfig.merchantName || '');
            setConfigBillingDay(paymentConfig.billingDay || 5);
            setConfigQrCodeImage(paymentConfig.upiQrCodeImage || '');
            setQrError('');
            setShowConfigModal(true);
          }}
          className="btn btn-secondary flex items-center gap-2"
          title="Payment Configurations"
        >
          <IconSettings className="w-4 h-4 text-indigo-400" />
          UPI Billing Settings
        </button>
      </div>

      {/* Selector & Statistics Cards - Responsive Layout Wrapper */}
      <div className="collections-header-row">
        {/* Month Picker dropdown */}
        <div className="form-group period-selector-card">
          <label className="form-label text-xs">Select Period</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="form-select py-2.5"
          >
            <option value="May 2026">May 2026</option>
            <option value="June 2026">June 2026</option>
            <option value="July 2026">July 2026</option>
          </select>
        </div>

        {/* Stats Summary Area */}
        <div className="card stats-summary-card py-4 text-center justify-around">
          <div>
            <span className="form-label block mb-0.5 text-[10px]">Total Invoiced</span>
            <span className="text-lg font-extrabold text-slate-200">
              ₹{billingRecords.reduce((sum, r) => sum + r.amount, 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="border-l border-r border-slate-800">
            <span className="form-label block mb-0.5 text-[10px] text-emerald-400">Total Collected</span>
            <span className="text-lg font-extrabold text-emerald-400">
              ₹{billingRecords.filter(r => r.status === 'Paid').reduce((sum, r) => sum + r.amount, 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div>
            <span className="form-label block mb-0.5 text-[10px] text-rose-400">Total Pending</span>
            <span className="text-lg font-extrabold text-rose-400">
              ₹{billingRecords.filter(r => r.status === 'Pending').reduce((sum, r) => sum + r.amount, 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'Paid', 'Pending'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
          >
            {status === 'all' ? 'All Invoices' : `${status} Invoices`}
          </button>
        ))}
      </div>

      {/* Resident Billing List - Responsive SaaS Grid */}
      <div className="grid grid-cols-3 gap-4">
        {filteredRecords.length === 0 ? (
          <div className="col-span-3 text-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
            <IconPayment className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No payment records found matching this status filter.</p>
          </div>
        ) : (
          filteredRecords.map(record => (
            <div 
              key={record.guest.id}
              className="card flex flex-col justify-between border-slate-800 hover:border-slate-700 transition"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-sm font-extrabold text-slate-200 truncate m-0">{record.guest.name}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-850 text-indigo-300">
                    Room {record.guest.roomNo}
                  </span>
                </div>
                
                <div className="text-xs text-slate-400 space-y-1.5 mt-2">
                  <div className="flex justify-between">
                    <span>Rent Due:</span>
                    <span className="text-slate-200 font-semibold">₹{record.amount.toLocaleString('en-IN')}</span>
                  </div>
                  {record.status === 'Paid' && (
                    <div className="space-y-1 bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-lg text-emerald-400 font-semibold text-[10px] mt-3">
                      <div className="flex items-center gap-1">
                        <IconCheck className="w-3.5 h-3.5" />
                        <span>Collected on {record.payment?.paymentDate}</span>
                      </div>
                      <div className="text-slate-400 pl-4">Method: {record.payment?.paymentMethod}</div>
                      {record.payment?.transactionId && (
                        <div className="text-slate-400 pl-4 truncate">Txn ID: {record.payment?.transactionId}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-850 pt-3 mt-4 flex justify-between items-center">
                <span className="text-xs text-slate-500">Invoice Status</span>
                {record.status === 'Paid' ? (
                  <span className="badge badge-success">
                    Paid
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setActiveCollection(record);
                      setPaymentMethod('UPI');
                      setShowRedirectionScreen(false);
                      setRedirectionApp(null);
                      setQrType('dynamic');
                    }}
                    className="btn btn-success py-1.5 px-3.5 text-xs font-bold rounded-xl"
                  >
                    Collect Rent
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment Configuration Modal Popup */}
      {showConfigModal && (
        <div className="modal-overlay">
          <div className="w-full max-w-sm modal-container">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">UPI Billing Setup</h3>
              <button 
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfigSubmit} className="space-y-4 text-left">
              {qrError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3 py-2 rounded-xl">
                  {qrError}
                </div>
              )}

              <div className="form-group">
                <label className="form-label text-xs">PG Owner UPI ID *</label>
                <input 
                  type="text" 
                  value={configUpiId}
                  onChange={(e) => setConfigUpiId(e.target.value)}
                  placeholder="e.g. hosteler@paytm, user@ybl"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label text-xs">Merchant / Recipient Name *</label>
                <input 
                  type="text" 
                  value={configMerchantName}
                  onChange={(e) => setConfigMerchantName(e.target.value)}
                  placeholder="e.g. StayEase PG Owner"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label text-xs">Monthly Billing Cycle Day</label>
                <input 
                  type="number" 
                  min="1"
                  max="28"
                  value={configBillingDay}
                  onChange={(e) => setConfigBillingDay(e.target.value)}
                  className="form-input"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Invoices generated automatically on this day.</span>
              </div>

              {/* Admin QR Code Upload Box */}
              <div className="form-group">
                <label className="form-label text-xs">Owner Static UPI QR Code (Optional)</label>
                <div className="flex gap-3 items-center mt-1">
                  <div className="file-uploader flex-1">
                    <IconUpload className="w-5 h-5 text-indigo-400 mb-1" />
                    <span className="text-[10px] text-slate-350 font-bold">
                      {qrUploading ? 'Processing...' : configQrCodeImage ? 'Replace QR Code' : 'Upload QR Image'}
                    </span>
                    <span className="text-[8px] text-slate-500 mt-0.5">Will be compressed dynamically</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleQrUpload} 
                      className="file-uploader-input" 
                      disabled={qrUploading}
                    />
                  </div>
                  
                  {configQrCodeImage && (
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                      <img 
                        src={configQrCodeImage} 
                        alt="Uploaded QR Preview" 
                        className="w-16 h-16 object-contain rounded-lg border border-slate-800 bg-white p-1"
                      />
                      <button
                        type="button"
                        onClick={() => setConfigQrCodeImage('')}
                        className="text-[9px] text-rose-400 font-extrabold hover:underline"
                      >
                        Remove QR
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowConfigModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1"
                  disabled={qrUploading}
                >
                  Save Setup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Rent & UPI Payment Modal Popup */}
      {activeCollection && (
        <div className="modal-overlay">
          <div className="w-full max-w-sm modal-container">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">
                {showRedirectionScreen ? 'UPI App Redirect' : 'Collect Resident Rent'}
              </h3>
              <button 
                onClick={() => {
                  setActiveCollection(null);
                  setTxnId('');
                  setShowRedirectionScreen(false);
                  setRedirectionApp(null);
                }}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            {/* Resident Detail Card */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl text-left space-y-1">
              <div className="text-xs text-indigo-300 font-bold">{activeCollection.guest.name}</div>
              <div className="text-[10px] text-slate-400">
                Room {activeCollection.guest.roomNo} • Cycle: {selectedMonth}
              </div>
              <div className="text-base font-extrabold text-emerald-400 pt-1">
                Amount Due: ₹{activeCollection.amount.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Redirection screen overlay view */}
            {showRedirectionScreen ? (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <IconSmartphone className="w-6 h-6" />
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-200">Payment Request Sent</h4>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Opening <strong>{redirectionApp}</strong>. Complete the payment of <span className="font-semibold text-emerald-400">₹{activeCollection.amount}</span>.
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-850 text-left text-[9px] text-slate-400 space-y-1 leading-normal">
                  <span className="font-bold text-indigo-300 block text-[10px]">What to do next:</span>
                  <p>1. Pay the amount in your UPI mobile application.</p>
                  <p>2. Copy the 12-digit transaction ID or reference number.</p>
                  <p>3. Return here and enter the number below to mark as paid.</p>
                </div>

                <form onSubmit={handleRecordPaymentSubmit} className="space-y-3 text-left">
                  <div className="form-group">
                    <label className="form-label text-[10px]">Transaction Ref ID (from UPI App) *</label>
                    <input 
                      type="text" 
                      value={txnId}
                      onChange={(e) => setTxnId(e.target.value)}
                      placeholder="e.g. 12-digit reference number"
                      className="form-input text-xs"
                      required
                    />
                  </div>

                  <div className="flex gap-2.5 pt-1">
                    <button 
                      type="button"
                      onClick={() => {
                        setShowRedirectionScreen(false);
                        setRedirectionApp(null);
                      }}
                      className="btn btn-secondary py-2 flex-1 text-xs"
                    >
                      Go Back
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-success py-2 flex-1 text-xs font-bold"
                    >
                      Confirm Paid
                    </button>
                  </div>

                  <div className="text-center pt-2">
                    <button 
                      type="button"
                      onClick={() => {
                        const upiUrl = getUpiUrl(activeCollection.guest.name, activeCollection.amount);
                        window.location.href = getAppSpecificUpiUrl(redirectionApp, upiUrl);
                      }}
                      className="text-[9px] text-indigo-400 hover:underline font-extrabold"
                    >
                      UPI app didn't open? Tap here to retry launch.
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              // Standard Scanner / Cash Collect options
              <>
                {/* Choose Payment Method Tab */}
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition ${
                      paymentMethod === 'UPI' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    UPI Payment Apps
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Cash')}
                    className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition ${
                      paymentMethod === 'Cash' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-350'
                    }`}
                  >
                    Cash Collected
                  </button>
                </div>

                <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-left">
                  {paymentMethod === 'UPI' ? (
                    <div className="space-y-4 text-center">
                      
                      {/* Toggle QR Type if Custom QR uploaded */}
                      {paymentConfig.upiQrCodeImage && (
                        <div className="flex bg-slate-950/60 p-0.5 rounded-lg border border-slate-850 mb-3 max-w-[280px] mx-auto">
                          <button
                            type="button"
                            onClick={() => setQrType('dynamic')}
                            className={`flex-1 text-center py-1 text-[10px] font-bold rounded transition ${
                              qrType === 'dynamic' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-300'
                            }`}
                          >
                            Prefilled QR
                          </button>
                          <button
                            type="button"
                            onClick={() => setQrType('custom')}
                            className={`flex-1 text-center py-1 text-[10px] font-bold rounded transition ${
                              qrType === 'custom' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-300'
                            }`}
                          >
                            Custom QR
                          </button>
                        </div>
                      )}

                      {/* Render QR code */}
                      <div className="bg-white p-3 rounded-xl inline-block shadow-lg mx-auto border border-slate-200">
                        <img 
                          src={
                            qrType === 'custom' && paymentConfig.upiQrCodeImage 
                              ? paymentConfig.upiQrCodeImage 
                              : getQrCodeUrl(getUpiUrl(activeCollection.guest.name, activeCollection.guest.roomNo, activeCollection.amount))
                          }
                          alt="UPI QR Code Payment Scan"
                          className="w-40 h-40 object-contain mx-auto"
                        />
                      </div>
                      
                      <div className="text-[10px] text-slate-400 leading-normal max-w-[280px] mx-auto">
                        {qrType === 'custom' && paymentConfig.upiQrCodeImage ? (
                          <span className="text-amber-400 font-semibold">Custom Static QR: Guest must manually enter ₹{activeCollection.amount} in their app.</span>
                        ) : (
                          <span className="text-emerald-400 font-semibold">Prefilled QR: Automatically pre-fills ₹{activeCollection.amount} for Room {activeCollection.guest.roomNo} ({selectedMonth}).</span>
                        )}
                      </div>

                      {/* Redirect and Pay via Apps option */}
                      <div className="border-t border-slate-850 pt-3 text-left space-y-2">
                        <span className="form-label text-[10px] block text-slate-300 font-bold">Or select a UPI app to pay directly:</span>
                        
                        {/* Apps Grid */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpiAppPay('Google Pay', activeCollection.amount, activeCollection.guest.name, activeCollection.guest.roomNo)}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 hover:bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-250 hover:border-slate-700 transition"
                          >
                            <span>Google Pay</span>
                            <IconArrowRight className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleUpiAppPay('PhonePe', activeCollection.amount, activeCollection.guest.name, activeCollection.guest.roomNo)}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 hover:bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-250 hover:border-slate-700 transition"
                          >
                            <span>PhonePe</span>
                            <IconArrowRight className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleUpiAppPay('Paytm', activeCollection.amount, activeCollection.guest.name, activeCollection.guest.roomNo)}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 hover:bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-250 hover:border-slate-700 transition"
                          >
                            <span>Paytm</span>
                            <IconArrowRight className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleUpiAppPay('BHIM', activeCollection.amount, activeCollection.guest.name, activeCollection.guest.roomNo)}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 hover:bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-250 hover:border-slate-700 transition"
                          >
                            <span>BHIM UPI</span>
                            <IconArrowRight className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                        </div>

                        {/* General deep link for any UPI */}
                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => handleUpiAppPay('UPI Chooser', activeCollection.amount, activeCollection.guest.name, activeCollection.guest.roomNo)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-[10px] font-extrabold text-indigo-400 transition"
                          >
                            <IconSmartphone className="w-3.5 h-3.5" />
                            Open Default UPI App
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => copyUpiLink(activeCollection.guest.name, activeCollection.guest.roomNo, activeCollection.amount)}
                            className="p-2 rounded-xl bg-slate-950/40 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
                            title="Copy UPI Deep Link String"
                          >
                            <IconCopy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {copiedLink && (
                          <div className="text-[9px] text-emerald-400 font-bold text-center mt-1">
                            UPI payment URL copied to clipboard!
                          </div>
                        )}
                      </div>

                      {/* Manual txn ID collection as fallback input */}
                      <div className="text-left pt-3 border-t border-slate-850 form-group">
                        <label className="form-label text-[10px]">UPI Transaction ID / Ref No</label>
                        <input 
                          type="text" 
                          value={txnId}
                          onChange={(e) => setTxnId(e.target.value)}
                          placeholder="Enter 12-digit transaction ID"
                          className="form-input text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-850 text-center">
                      <p className="text-xs text-slate-350 m-0 leading-relaxed">
                        You are recording a manual cash collection of <span className="font-bold text-emerald-400">₹{activeCollection.amount.toLocaleString('en-IN')}</span> from {activeCollection.guest.name}.
                      </p>
                      <p className="text-[10px] text-slate-500 italic m-0">
                        This registers payment instantly without external gateways check.
                      </p>
                    </div>
                  )}

                  <div className="pt-2 flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => {
                        setActiveCollection(null);
                        setTxnId('');
                        setShowRedirectionScreen(false);
                      }}
                      className="btn btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-success flex-1 font-bold"
                    >
                      Confirm Paid
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
