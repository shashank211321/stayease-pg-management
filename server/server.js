import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dns from 'dns';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
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
  getOtpConfig,
  saveOtpConfig,
  getPgConfig,
  savePgConfig,
  isPgConnected,
  resetDb,
  loadDemoDb
} from './database/db.js';

const app = express();
const PORT = process.env.PORT || 5000;

// In-memory OTP storage: email -> { otp, expires }
const activeOtps = new Map();

// Enable CORS
app.use(cors());

// Configure body parser limits for base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize the database connection (local files and PG if enabled)
initDb().then(() => {
  console.log('Database initialization resolved.');
}).catch(err => {
  console.error('Error during database initialization:', err);
});

// API Routes
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await getRooms();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve rooms' });
  }
});

app.post('/api/rooms', async (req, res) => {
  try {
    await saveRooms(req.body);
    res.json({ success: true, rooms: await getRooms() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save rooms' });
  }
});

app.get('/api/guests', async (req, res) => {
  try {
    const guests = await getGuests();
    res.json(guests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve guests' });
  }
});

app.post('/api/guests', async (req, res) => {
  try {
    await saveGuests(req.body);
    res.json({ success: true, guests: await getGuests() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save guests' });
  }
});

app.get('/api/payments', async (req, res) => {
  try {
    const payments = await getPayments();
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve payments' });
  }
});

app.post('/api/payments', async (req, res) => {
  try {
    await savePayments(req.body);
    res.json({ success: true, payments: await getPayments() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save payments' });
  }
});

app.get('/api/rent-config', async (req, res) => {
  try {
    const rentConfig = await getRentConfig();
    res.json(rentConfig);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve rent config' });
  }
});

app.post('/api/rent-config', async (req, res) => {
  try {
    await saveRentConfig(req.body);
    res.json({ success: true, rentConfig: await getRentConfig() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save rent config' });
  }
});

app.get('/api/payment-config', async (req, res) => {
  try {
    const paymentConfig = await getPaymentConfig();
    res.json(paymentConfig);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve payment config' });
  }
});

app.post('/api/payment-config', async (req, res) => {
  try {
    await savePaymentConfig(req.body);
    res.json({ success: true, paymentConfig: await getPaymentConfig() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save payment config' });
  }
});

app.get('/api/otp-config', async (req, res) => {
  try {
    const otpConfig = await getOtpConfig();
    res.json(otpConfig);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve OTP config' });
  }
});

app.post('/api/otp-config', async (req, res) => {
  try {
    await saveOtpConfig(req.body);
    res.json({ success: true, otpConfig: await getOtpConfig() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save OTP config' });
  }
});

// PostgreSQL Database configuration routes
app.get('/api/pg-config', async (req, res) => {
  try {
    const config = await getPgConfig();
    res.json({ config, connected: isPgConnected() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve PostgreSQL configuration' });
  }
});

app.post('/api/pg-config', async (req, res) => {
  try {
    const result = await savePgConfig(req.body);
    res.json({ success: result.success, connected: isPgConnected(), error: result.error });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to save PostgreSQL configuration' });
  }
});

app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email or phone number identifier is required.' });
  }

  const identifier = email.trim();
  const isEmail = identifier.includes('@');
  const isPhone = /^[0-9]{10}$/.test(identifier);

  if (!isEmail && !isPhone) {
    return res.status(400).json({ error: 'Please enter a valid email address or 10-digit phone number.' });
  }

  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    activeOtps.set(identifier.toLowerCase(), {
      otp: code,
      expires: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    const otpConfig = await getOtpConfig();

    if (isEmail && otpConfig.smtpEnabled && otpConfig.smtpHost && otpConfig.smtpUser && otpConfig.smtpPass) {
      const transporter = nodemailer.createTransport({
        host: otpConfig.smtpHost ? otpConfig.smtpHost.trim() : 'smtp.gmail.com',
        port: parseInt(otpConfig.smtpPort) || 465,
        secure: otpConfig.smtpSecure !== false,
        auth: {
          user: otpConfig.smtpUser ? otpConfig.smtpUser.trim() : '',
          pass: otpConfig.smtpPass ? otpConfig.smtpPass.trim().replace(/\s+/g, '') : ''
        },
        connectionTimeout: 10000,
        dnsLookup: (hostname, options, callback) => {
          dns.lookup(hostname, { ...options, family: 4 }, callback);
        }
      });

      const senderName = otpConfig.senderEmail ? otpConfig.senderEmail.split('@')[0] : 'StayEase PG';
      const mailOptions = {
        from: `"${senderName}" <${otpConfig.smtpUser}>`,
        to: email.trim(),
        subject: 'StayEase PG - Login OTP Verification Code',
        text: `Your StayEase PG verification code is ${code}. It will expire in 5 minutes.`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 20px auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
            <div style="text-align: center; margin-bottom: 25px;">
              <span style="background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; font-weight: bold; font-size: 20px; padding: 10px 18px; border-radius: 12px; display: inline-block;">StayEase PG</span>
            </div>
            <h2 style="color: #1e1b4b; font-size: 20px; text-align: center; margin-top: 0;">Verification Code</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6; text-align: center;">
              You requested a secure verification code to log in to the StayEase PG dashboard. Please enter this code in the input screen:
            </p>
            <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 18px; border-radius: 12px; text-align: center; margin: 25px 0;">
              <span style="font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #4f46e5; font-family: monospace;">${code}</span>
            </div>
            <p style="color: #64748b; font-size: 12px; text-align: center; line-height: 1.5; margin-bottom: 0;">
              This code will expire in <strong>5 minutes</strong>.<br />
              If you didn't request this email, you can safely ignore it.
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      res.json({ success: true, method: 'smtp' });
    } else {
      res.json({ success: true, method: 'simulated', code });
    }
  } catch (err) {
    console.error('Error sending OTP:', err);
    const activeEntry = activeOtps.get(req.body.email?.trim().toLowerCase());
    const fallbackCode = activeEntry ? activeEntry.otp : Math.floor(100000 + Math.random() * 900000).toString();
    const isPhoneNum = /^[0-9]{10}$/.test(req.body.email?.trim());
    res.json({ 
      success: true, 
      method: 'simulated', 
      code: fallbackCode,
      warning: isPhoneNum ? null : `Real-time SMTP send failed (${err.message}). Backup OTP code: ${fallbackCode} (Log in to update SMTP settings).`
    });
  }
});

app.post('/api/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email or phone number and OTP code are required.' });
  }

  const identifierKey = email.trim().toLowerCase();
  const record = activeOtps.get(identifierKey);

  if (!record) {
    return res.status(400).json({ error: 'No active verification code session found. Please request a new code.' });
  }

  if (Date.now() > record.expires) {
    activeOtps.delete(emailKey);
    return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
  }

  if (record.otp !== otp.trim()) {
    return res.status(400).json({ error: 'Incorrect verification code. Please check and try again.' });
  }

  activeOtps.delete(identifierKey);
  res.json({ success: true });
});

app.post('/api/test-smtp', async (req, res) => {
  const { config, testEmail } = req.body;
  if (!config || !testEmail) {
    return res.status(400).json({ error: 'SMTP configurations and destination email are required.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.smtpHost ? config.smtpHost.trim() : 'smtp.gmail.com',
      port: parseInt(config.smtpPort) || 465,
      secure: config.smtpSecure !== false,
      auth: {
        user: config.smtpUser ? config.smtpUser.trim() : '',
        pass: config.smtpPass ? config.smtpPass.trim().replace(/\s+/g, '') : ''
      },
      connectionTimeout: 10000,
      dnsLookup: (hostname, options, callback) => {
        dns.lookup(hostname, { ...options, family: 4 }, callback);
      }
    });

    const senderName = config.senderEmail ? config.senderEmail.split('@')[0] : 'StayEase PG';
    const mailOptions = {
      from: `"${senderName}" <${config.smtpUser}>`,
      to: testEmail.trim(),
      subject: 'StayEase PG - SMTP Connection Test Success!',
      text: 'Congratulations! Your outbound SMTP configuration works successfully and is ready to send secure OTP emails.',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 20px auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
          <div style="text-align: center; margin-bottom: 25px;">
            <span style="background-color: #10b981; color: white; font-weight: bold; font-size: 16px; padding: 8px 16px; border-radius: 12px; display: inline-block;">SMTP Connection Check</span>
          </div>
          <h2 style="color: #1e1b4b; font-size: 20px; text-align: center; margin-top: 0;">Test Email Successful!</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.6; text-align: center;">
            Your StayEase outbound SMTP configurations are correct. Verification OTP emails will now be reliably delivered to your residents and owners in real-time.
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-bottom: 0;">
            This is an automated system status check. Do not reply to this email.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (err) {
    console.error('SMTP testing error:', err);
    res.status(500).json({ error: `SMTP Connection failed: ${err.message}` });
  }
});

app.post('/api/reset', async (req, res) => {
  try {
    await resetDb();
    res.json({ success: true, message: 'Database reset to empty state.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

app.post('/api/load-demo', async (req, res) => {
  try {
    await loadDemoDb();
    res.json({ success: true, message: 'Demo data loaded successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load demo database' });
  }
});

// Serve static assets in production if compiled
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Backend API server running at http://localhost:${PORT}`);
});
