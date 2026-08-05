import React, { useState } from 'react';
import { IconSettings, IconCheck, IconInfo, IconMail, IconPhone, IconShieldCheck, IconClose } from './Icons';
import { testSmtp } from '../utils/db';

export default function Settings({ 
  rentConfig, 
  onSaveRentConfig, 
  otpConfig = {},
  onSaveOtpConfig,
  pgConfig = {},
  pgConnected = false,
  onSavePgConfig,
  onResetDb,
  onLoadDemo,
  onShowNotification
}) {
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    confirmType: 'danger',
    onConfirm: null
  });

  const notify = (msg, type = 'success') => {
    if (onShowNotification) {
      onShowNotification(msg, type);
    } else {
      console.log(`[${type}] ${msg}`);
    }
  };
  const [rentSingle, setRentSingle] = useState(rentConfig[1] || 10000);
  const [rentDouble, setRentDouble] = useState(rentConfig[2] || 7000);
  const [rentTriple, setRentTriple] = useState(rentConfig[3] || 5500);
  const [rentQuad, setRentQuad] = useState(rentConfig[4] || 4500);
  
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [otpSaveSuccess, setOtpSaveSuccess] = useState(false);

  // PostgreSQL configurations state
  const [pgEnabled, setPgEnabled] = useState(pgConfig.enabled || false);
  const [pgHost, setPgHost] = useState(pgConfig.host || '');
  const [pgPort, setPgPort] = useState(pgConfig.port || 5432);
  const [pgUser, setPgUser] = useState(pgConfig.user || '');
  const [pgPassword, setPgPassword] = useState(pgConfig.password || '');
  const [pgDatabase, setPgDatabase] = useState(pgConfig.database || '');
  const [pgSsl, setPgSsl] = useState(pgConfig.ssl || false);
  
  const [pgSaveSuccess, setPgSaveSuccess] = useState(false);
  const [pgError, setPgError] = useState('');
  const [pgLoading, setPgLoading] = useState(false);

  const handlePgSubmit = async (e) => {
    e.preventDefault();
    setPgLoading(true);
    setPgError('');
    setPgSaveSuccess(false);

    try {
      const res = await onSavePgConfig({
        enabled: pgEnabled,
        host: pgHost,
        port: parseInt(pgPort) || 5432,
        user: pgUser,
        password: pgPassword,
        database: pgDatabase,
        ssl: pgSsl
      });

      if (res.success) {
        setPgSaveSuccess(true);
        notify("PostgreSQL settings updated and connected successfully!", "success");
        setTimeout(() => setPgSaveSuccess(false), 3000);
      } else {
        setPgError(res.error || 'Failed to connect to PostgreSQL.');
        notify("PostgreSQL connection test failed: " + (res.error || ''), "error");
      }
    } catch (err) {
      setPgError(err.message || 'An error occurred while saving PostgreSQL configuration.');
      notify("PostgreSQL Save Failed: " + (err.message || ''), "error");
    } finally {
      setPgLoading(false);
    }
  };

  // OTP credentials state
  const [emailJsEnabled, setEmailJsEnabled] = useState(otpConfig.emailJsEnabled || false);
  const [emailJsServiceId, setEmailJsServiceId] = useState(otpConfig.emailJsServiceId || '');
  const [emailJsTemplateId, setEmailJsTemplateId] = useState(otpConfig.emailJsTemplateId || '');
  const [emailJsPublicKey, setEmailJsPublicKey] = useState(otpConfig.emailJsPublicKey || '');
  
  const [webhookEnabled, setWebhookEnabled] = useState(otpConfig.webhookEnabled || false);
  const [webhookUrl, setWebhookUrl] = useState(otpConfig.webhookUrl || '');

  // SMTP credentials state
  const [smtpEnabled, setSmtpEnabled] = useState(otpConfig.smtpEnabled || false);
  const [smtpHost, setSmtpHost] = useState(otpConfig.smtpHost || 'smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(otpConfig.smtpPort || 465);
  const [smtpSecure, setSmtpSecure] = useState(otpConfig.smtpSecure !== false);
  const [smtpUser, setSmtpUser] = useState(otpConfig.smtpUser || '');
  const [smtpPass, setSmtpPass] = useState(otpConfig.smtpPass || '');
  const [senderEmail, setSenderEmail] = useState(otpConfig.senderEmail || '');

  const [testEmail, setTestEmail] = useState('');
  const [testSmtpEmail, setTestSmtpEmail] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);

  const handleSaveOtp = (e) => {
    e.preventDefault();
    onSaveOtpConfig({
      emailJsEnabled,
      emailJsServiceId,
      emailJsTemplateId,
      emailJsPublicKey,
      webhookEnabled,
      webhookUrl,
      smtpEnabled,
      smtpHost,
      smtpPort: parseInt(smtpPort) || 465,
      smtpSecure,
      smtpUser,
      smtpPass,
      senderEmail
    });
    setOtpSaveSuccess(true);
    setTimeout(() => setOtpSaveSuccess(false), 3000);
  };

  const handleTestSmtpConnection = async () => {
    if (!smtpHost || !smtpUser || !smtpPass) {
      notify("Please fill all SMTP Server details (Host, User, Pass) before testing.", "error");
      return;
    }
    if (!testSmtpEmail) {
      notify("Please enter a destination email address for the test.", "error");
      return;
    }
    setTestingSmtp(true);
    try {
      await testSmtp({
        smtpHost,
        smtpPort: parseInt(smtpPort) || 465,
        smtpSecure,
        smtpUser,
        smtpPass,
        senderEmail
      }, testSmtpEmail);
      notify("Test SMTP connection email sent successfully! Please check your Gmail inbox.", "success");
    } catch (err) {
      notify(`SMTP Test Connection Failed: ${err.message}`, "error");
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleTestEmail = async () => {
    if (!emailJsServiceId || !emailJsTemplateId || !emailJsPublicKey) {
      notify("Please fill all EmailJS fields before testing.", "error");
      return;
    }
    if (!testEmail) {
      notify("Please enter a destination email address for the test.", "error");
      return;
    }
    setTestingEmail(true);
    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: emailJsServiceId,
          template_id: emailJsTemplateId,
          user_id: emailJsPublicKey,
          template_params: {
            to_email: testEmail,
            otp_code: '999999',
            notes: 'Test verification code from StayEase settings.'
          }
        })
      });
      if (response.ok) {
        notify("Test Email sent successfully! Please check your inbox (including spam).", "success");
      } else {
        const text = await response.text();
        notify(`Failed to send test email: ${text}`, "error");
      }
    } catch (err) {
      notify(`Error during test email: ${err.message}`, "error");
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      notify("Please enter a Webhook URL before testing.", "error");
      return;
    }
    setTestingWebhook(true);
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: '9876543210',
          type: 'phone',
          otp: '888888',
          is_test: true,
          timestamp: new Date().toISOString()
        })
      });
      if (response.ok) {
        notify("Webhook test payload POSTed successfully!", "success");
      } else {
        notify(`Webhook responded with status code: ${response.status}`, "error");
      }
    } catch (err) {
      notify(`Webhook test failed: ${err.message}`, "error");
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveRentConfig({
      1: parseInt(rentSingle),
      2: parseInt(rentDouble),
      3: parseInt(rentTriple),
      4: parseInt(rentQuad)
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetConfirm = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Clear Database (Clean Slate)',
      message: 'Warning! This will erase all guest listings, room occupancy records, and reset payments to a clean blank state. Are you sure you want to proceed?',
      confirmText: 'Clear Database',
      confirmType: 'danger',
      onConfirm: async () => {
        try {
          await onResetDb();
          notify("Database cleared successfully.", "success");
          setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
          notify("Failed to clear database: " + err.message, "error");
        }
      }
    });
  };

  const handleLoadDemoConfirm = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Load Sandbox Demo Data',
      message: 'This will overwrite your current settings and load default rooms, guests, and payment history for preview. Proceed?',
      confirmText: 'Load Demo Data',
      confirmType: 'primary',
      onConfirm: async () => {
        try {
          await onLoadDemo();
          notify("Demo sandbox data loaded successfully!", "success");
          setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
          notify("Failed to load demo data: " + err.message, "error");
        }
      }
    });
  };

  return (
    <div className="space-y-6 text-left">
      {/* SaaS Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Configuration Setup</h1>
          <p className="page-subtitle">Configure base rents per sharing capacity, adjust monthly pg parameters, and reset data.</p>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 font-bold">
          <IconCheck className="w-4 h-4" />
          Rent configuration saved successfully!
        </div>
      )}

      {/* Form: Base Rental Pricing Configurations */}
      <form onSubmit={handleSubmit} className="card space-y-4">
        <h3 className="text-sm font-bold text-slate-200 m-0 flex items-center gap-2 border-b border-slate-800 pb-2">
          <IconSettings className="w-4 h-4 text-violet-400" />
          Category Rent Pricing (Monthly)
        </h3>
        
        <p className="text-xs text-slate-400 leading-normal">
          Set the default base monthly rents for rooms based on their sharing size. Newly registered guests will inherit these parameters automatically.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Single Share Room (₹)</label>
            <input
              type="number"
              value={rentSingle}
              onChange={(e) => setRentSingle(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Double Share Room (₹)</label>
            <input
              type="number"
              value={rentDouble}
              onChange={(e) => setRentDouble(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">3-Persons Share Room (₹)</label>
            <input
              type="number"
              value={rentTriple}
              onChange={(e) => setRentTriple(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">4-Persons Share Room (₹)</label>
            <input
              type="number"
              value={rentQuad}
              onChange={(e) => setRentQuad(e.target.value)}
              className="form-input"
              required
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="btn btn-primary w-full"
          >
            Save Rent Prices
          </button>
        </div>
      </form>

      {/* Form: PostgreSQL Database Connection */}
      <form onSubmit={handlePgSubmit} className="card space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <h3 className="text-sm font-bold text-slate-200 m-0 flex items-center gap-2">
            <IconSettings className="w-4 h-4 text-indigo-400" />
            PostgreSQL Database Connection Setup
          </h3>
          <span className={`badge ${pgConnected ? 'badge-success' : 'badge-danger'}`}>
            {pgConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        <p className="text-xs text-slate-400 leading-normal">
          Configure a real-time PostgreSQL database connection. Once connected and verified, all operations will execute directly on your live database tables instead of local JSON storage.
        </p>

        {pgSaveSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 font-bold">
            <IconCheck className="w-4 h-4" />
            PostgreSQL configurations verified and saved successfully!
          </div>
        )}

        {pgError && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3.5 py-2.5 rounded-xl font-bold">
            Connection Failed: {pgError}
          </div>
        )}

        <div className="flex items-center gap-2 pb-2">
          <label className="switch-container">
            <input 
              type="checkbox" 
              checked={pgEnabled}
              onChange={(e) => setPgEnabled(e.target.checked)}
              className="switch-input"
            />
            <div className="switch-track">
              <div className="switch-thumb"></div>
            </div>
            <span className="text-xs font-bold text-slate-350">Enable PostgreSQL Connection</span>
          </label>
        </div>

        {pgEnabled && (
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Database Host *</label>
              <input
                type="text"
                value={pgHost}
                onChange={(e) => setPgHost(e.target.value)}
                placeholder="e.g. localhost or postgres.neon.tech"
                className="form-input"
                required={pgEnabled}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Database Port *</label>
              <input
                type="number"
                value={pgPort}
                onChange={(e) => setPgPort(e.target.value)}
                placeholder="e.g. 5432"
                className="form-input"
                required={pgEnabled}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Database User</label>
              <input
                type="text"
                value={pgUser}
                onChange={(e) => setPgUser(e.target.value)}
                placeholder="e.g. postgres"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Database Password</label>
              <input
                type="password"
                value={pgPassword}
                onChange={(e) => setPgPassword(e.target.value)}
                placeholder="Database password"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Database Name *</label>
              <input
                type="text"
                value={pgDatabase}
                onChange={(e) => setPgDatabase(e.target.value)}
                placeholder="e.g. stayease_db"
                className="form-input"
                required={pgEnabled}
              />
            </div>

            <div className="form-group flex items-center justify-start h-full pt-6">
              <label className="switch-container">
                <input 
                  type="checkbox" 
                  checked={pgSsl}
                  onChange={(e) => setPgSsl(e.target.checked)}
                  className="switch-input"
                />
                <div className="switch-track">
                  <div className="switch-thumb"></div>
                </div>
                <span className="text-xs font-bold text-slate-350">Enable SSL (Required for Neon/Supabase)</span>
              </label>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={pgLoading}
          >
            {pgLoading ? 'Testing Outbound Connection...' : 'Test & Save PG Connection'}
          </button>
        </div>
      </form>

      {/* Info Card */}
      <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-xl flex gap-3 text-slate-350">
        <div className="text-indigo-400 flex-shrink-0 mt-0.5">
          <IconInfo className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-200 m-0">Dynamic Calculations</h4>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
            Your expected invoicing counters and occupancy projections on the main dashboard automatically adjust calculations immediately based on the category rents set here.
          </p>
        </div>
      </div>

      {/* Success Notification for OTP settings */}
      {otpSaveSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 font-bold">
          <IconCheck className="w-4 h-4" />
          Real-time OTP settings saved successfully!
        </div>
      )}

      {/* Form: OTP Configuration */}
      <form onSubmit={handleSaveOtp} className="card space-y-4">
        <h3 className="text-sm font-bold text-slate-200 m-0 flex items-center gap-2 border-b border-slate-800 pb-2">
          <IconShieldCheck className="w-4 h-4 text-emerald-400" />
          Real-Time OTP Verification Settings
        </h3>
        
        <p className="text-xs text-slate-400 leading-normal">
          Configure outbound integrations to send active verification codes in real-time. Unconfigured channels default to local simulation.
        </p>

        {/* SMTP Outbound Email Block */}
        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <IconMail className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-200 font-sans">SMTP / Gmail actual OTP Email</span>
            </div>
            <label className="switch-container">
              <input
                type="checkbox"
                checked={smtpEnabled}
                onChange={(e) => setSmtpEnabled(e.target.checked)}
                className="switch-input"
              />
              <div className="switch-track">
                <span className="switch-thumb"></span>
              </div>
            </label>
          </div>

          {smtpEnabled && (
            <div className="space-y-3 pt-2 border-t border-slate-850">
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label text-[10px]">SMTP Host</label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    className="form-input text-xs"
                    placeholder="smtp.gmail.com"
                    required={smtpEnabled}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label text-[10px]">SMTP Port</label>
                  <input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    className="form-input text-xs"
                    placeholder="465"
                    required={smtpEnabled}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label text-[10px]">SMTP User (Gmail Address)</label>
                  <input
                    type="email"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    className="form-input text-xs"
                    placeholder="your-email@gmail.com"
                    required={smtpEnabled}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label text-[10px]">SMTP Password (App Password)</label>
                  <input
                    type="password"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    className="form-input text-xs"
                    placeholder="xxxx xxxx xxxx xxxx"
                    required={smtpEnabled}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label text-[10px]">Sender Email/Name (Optional)</label>
                  <input
                    type="text"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    className="form-input text-xs"
                    placeholder="StayEase PG <sender@gmail.com>"
                  />
                </div>
                <div className="form-group flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer py-2">
                    <input
                      type="checkbox"
                      checked={smtpSecure}
                      onChange={(e) => setSmtpSecure(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
                    />
                    <span className="text-[10px] text-slate-350 font-bold">Use SSL/TLS Secure</span>
                  </label>
                </div>
              </div>

              <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800 text-[10px] text-slate-400 leading-normal">
                <strong>Gmail Setup Tip:</strong> Use SMTP Host <code>smtp.gmail.com</code> and Port <code>465</code>. Enable 2-step verification on your Google account and generate an <strong>App Password</strong> under Account Security settings. Do not use your primary Google account password.
              </div>

              {/* Test SMTP connection */}
              <div className="flex gap-2 items-end pt-1 border-t border-slate-850/60">
                <div className="form-group flex-1">
                  <label className="form-label text-[10px]">Test Destination Email</label>
                  <input
                    type="email"
                    value={testSmtpEmail}
                    onChange={(e) => setTestSmtpEmail(e.target.value)}
                    className="form-input text-xs"
                    placeholder="name@gmail.com"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTestSmtpConnection}
                  disabled={testingSmtp}
                  className="btn btn-secondary py-2.5 text-xs font-semibold px-4 cursor-pointer"
                >
                  {testingSmtp ? 'Testing...' : 'Test SMTP Connection'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* EmailJS Block */}
        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <IconMail className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-bold text-slate-200 font-sans">Email OTP (via EmailJS)</span>
            </div>
            <label className="switch-container">
              <input
                type="checkbox"
                checked={emailJsEnabled}
                onChange={(e) => setEmailJsEnabled(e.target.checked)}
                className="switch-input"
              />
              <div className="switch-track">
                <span className="switch-thumb"></span>
              </div>
            </label>
          </div>

          {emailJsEnabled && (
            <div className="space-y-3 pt-2 border-t border-slate-850">
              <div className="grid grid-cols-3 gap-3">
                <div className="form-group">
                  <label className="form-label text-[10px]">Service ID</label>
                  <input
                    type="text"
                    value={emailJsServiceId}
                    onChange={(e) => setEmailJsServiceId(e.target.value)}
                    className="form-input text-xs"
                    placeholder="service_xxxx"
                    required={emailJsEnabled}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label text-[10px]">Template ID</label>
                  <input
                    type="text"
                    value={emailJsTemplateId}
                    onChange={(e) => setEmailJsTemplateId(e.target.value)}
                    className="form-input text-xs"
                    placeholder="template_xxxx"
                    required={emailJsEnabled}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label text-[10px]">Public Key</label>
                  <input
                    type="text"
                    value={emailJsPublicKey}
                    onChange={(e) => setEmailJsPublicKey(e.target.value)}
                    className="form-input text-xs"
                    placeholder="user_xxxx / key_xxxx"
                    required={emailJsEnabled}
                  />
                </div>
              </div>

              <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800 text-[10px] text-slate-400 leading-normal">
                <strong>Note:</strong> Ensure your EmailJS template defines parameters to map target email to <code>{"{{to_email}}"}</code> and verification code to <code>{"{{otp_code}}"}</code>.
              </div>

              {/* Test Email JS */}
              <div className="flex gap-2 items-end pt-1">
                <div className="form-group flex-1">
                  <label className="form-label text-[10px]">Test Destination Email</label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="form-input text-xs"
                    placeholder="name@gmail.com"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={testingEmail}
                  className="btn btn-secondary py-2 text-xs font-semibold px-4"
                >
                  {testingEmail ? 'Sending...' : 'Test Email'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Webhook Block */}
        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <IconPhone className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-bold text-slate-200">SMS / Custom Webhook Endpoint</span>
            </div>
            <label className="switch-container">
              <input
                type="checkbox"
                checked={webhookEnabled}
                onChange={(e) => setWebhookEnabled(e.target.checked)}
                className="switch-input"
              />
              <div className="switch-track">
                <span className="switch-thumb"></span>
              </div>
            </label>
          </div>

          {webhookEnabled && (
            <div className="space-y-3 pt-2 border-t border-slate-850">
              <div className="form-group">
                <label className="form-label text-[10px]">Webhook URL (POST)</label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="form-input text-xs"
                  placeholder="https://api.example.com/otp"
                  required={webhookEnabled}
                />
              </div>

              <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800 text-[10px] text-slate-400 leading-normal">
                Dispatches a <strong>POST JSON</strong> payload with <code>{"{ to, type, otp, timestamp }"}</code> to support external messaging bridges or Zapier / Make connectors.
              </div>

              <button
                type="button"
                onClick={handleTestWebhook}
                disabled={testingWebhook}
                className="btn btn-secondary py-2 text-xs font-semibold w-full"
              >
                {testingWebhook ? 'Firing HTTP POST...' : 'Test Webhook Payload'}
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full"
        >
          Save OTP Credentials
        </button>
      </form>



      {/* Reusable Styled Confirmation Modal Dialog */}
      {confirmModal.isOpen && (
        <div className="modal-overlay">
          <div className="w-full max-w-md modal-container text-left">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 m-0">
                <IconInfo className={`w-4 h-4 ${confirmModal.confirmType === 'danger' ? 'text-rose-400' : 'text-indigo-400'}`} />
                {confirmModal.title}
              </h3>
              <button 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed m-0">
              {confirmModal.message}
            </p>

            <div className="pt-2 flex gap-3">
              <button 
                type="button" 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="btn btn-secondary flex-1 py-2 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={async () => {
                  const action = confirmModal.onConfirm;
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  if (action) await action();
                }}
                className={`btn ${confirmModal.confirmType === 'danger' ? 'btn-danger' : 'btn-primary'} flex-1 py-2 text-xs font-bold cursor-pointer`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
