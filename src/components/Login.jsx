import React, { useState, useEffect, useRef } from 'react';
import { 
  IconMail, 
  IconShieldCheck, 
  IconRoom, 
  IconPayment, 
  IconGuest 
} from './Icons';
import { sendOtp, verifyOtp } from '../utils/db';

export default function Login({ otpConfig = {}, onLoginSuccess, onShowNotification }) {
  const [identifier, setIdentifier] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const otpRefs = useRef([]);

  // Resend Timer logic
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const validateIdentifier = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(identifier.trim())) {
      setErrorMsg('Please enter a valid Gmail / Email address.');
      return false;
    }
    return true;
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    if (!validateIdentifier()) return;

    setLoading(true);
    try {
      const res = await sendOtp(identifier.trim());
      setOtpSent(true);
      setResendTimer(30);
      setOtp(['', '', '', '', '', '']);

      if (res.method === 'smtp') {
        onShowNotification(
          `Verification code sent to your Gmail inbox at ${identifier}!`,
          'success'
        );
      } else {
        if (res.warning) {
          onShowNotification(res.warning, 'error');
        } else {
          onShowNotification(
            `StayEase Auth: Verification code is ${res.code}. (Simulated - Configure SMTP in settings)`,
            'success'
          );
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to dispatch verification code.');
      onShowNotification(err.message || 'Failed to dispatch verification code.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const enteredOtp = otp.join('');
    if (enteredOtp.length < 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(identifier.trim(), enteredOtp);
      onLoginSuccess();
    } catch (err) {
      setErrorMsg(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (element, index) => {
    const val = element.value;
    if (element.value && isNaN(val)) return;

    const newOtp = [...otp];
    newOtp[index] = val.substring(val.length - 1); // Get last typed char
    setOtp(newOtp);

    // Auto-focus next field
    if (val && index < 5) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Backspace: clear current or focus previous
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        otpRefs.current[index - 1].focus();
      } else if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (pastedData.length === 6 && !isNaN(pastedData)) {
      const pasteArray = pastedData.split('');
      setOtp(pasteArray);
      otpRefs.current[5].focus();
    }
  };

  return (
    <div className="login-container">
      {/* Visual Left Panel */}
      <div className="login-visual-panel">
        <div className="login-visual-content">
          <div className="login-brand-header">
            <div className="login-brand-logo">SE</div>
            <span className="login-brand-name">StayEase PG</span>
          </div>

          <div className="login-visual-hero">
            <h1 className="login-hero-title">Simplify Your PG Operations</h1>
            <p className="login-hero-subtitle">
              Manage residents, room allocations, payments, and Aadhaar KYC verification all in one premium dashboard.
            </p>

            <div className="login-features-list">
              <div className="login-feature-item">
                <div className="login-feature-icon-wrapper">
                  <IconRoom className="w-5 h-5" />
                </div>
                <div className="login-feature-text">
                  <h4 className="login-feature-title">Smart Bed Allocation</h4>
                  <p className="login-feature-desc">Visualize rooms capacity, floor arrangements, and allot vacant beds instantly.</p>
                </div>
              </div>

              <div className="login-feature-item">
                <div className="login-feature-icon-wrapper">
                  <IconPayment className="w-5 h-5" />
                </div>
                <div className="login-feature-text">
                  <h4 className="login-feature-title">Automated Billing & UPI</h4>
                  <p className="login-feature-desc">Monitor expected collections, record rental entries, and launch payment QR overlays.</p>
                </div>
              </div>

              <div className="login-feature-item">
                <div className="login-feature-icon-wrapper">
                  <IconGuest className="w-5 h-5" />
                </div>
                <div className="login-feature-text">
                  <h4 className="login-feature-title">KYC Document Compression</h4>
                  <p className="login-feature-desc">Upload, review, and auto-compress resident Aadhaar cards for database efficiency.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="login-visual-footer">
            &copy; 2026 StayEase PG Operations Management System. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="login-form-panel">
        <div className="login-form-card">
          <div className="login-header">
            <h2 className="login-title">Welcome Back</h2>
            <p className="login-subtitle">
              Verify your PG Owner credentials to access your dashboard
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3.5 py-2.5 rounded-xl mb-4 font-semibold text-center">
              {errorMsg}
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="form-group">
                <label className="form-label">
                  Gmail / Email Address
                </label>
                <div className="form-input-wrapper">
                  <IconMail className="w-5 h-5 form-input-icon" />
                  <input
                    type="email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. owner@gmail.com"
                    className="form-input form-input-with-icon"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full py-2.5 mt-2"
                disabled={loading}
              >
                {loading ? 'Sending Code...' : 'Get Verification Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="flex flex-col items-center justify-center p-3.5 bg-slate-900/40 rounded-xl border border-slate-800 space-y-1 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Verification code sent to
                </span>
                <span className="text-sm font-bold text-indigo-400 truncate max-w-full">
                  {identifier}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setErrorMsg('');
                  }}
                  className="btn btn-secondary py-1 px-3 text-[11px] rounded-lg mt-1 font-bold cursor-pointer"
                >
                  Change Email Address
                </button>
              </div>

              <div className="form-group">
                <label className="form-label text-center block w-full">
                  Enter 6-Digit OTP
                </label>
                <div className="otp-input-container" onPaste={handlePaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target, idx)}
                      onKeyDown={(e) => handleKeyDown(e, idx)}
                      ref={(el) => (otpRefs.current[idx] = el)}
                      className="otp-box"
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  className="btn btn-primary w-full py-2.5 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <IconShieldCheck className="w-4.5 h-4.5" />
                  {loading ? 'Verifying...' : 'Verify & Log In'}
                </button>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="btn btn-secondary w-full py-2 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl cursor-pointer"
                  disabled={loading || resendTimer > 0}
                >
                  {resendTimer > 0 ? `Resend Code (${resendTimer}s)` : 'Resend Verification Code'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
