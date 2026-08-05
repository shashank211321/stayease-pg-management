// We call the backend API instead of using localStorage.

export const initDb = async () => {
  // The server handles database initialization on startup.
  return Promise.resolve();
};

export const getRooms = async () => {
  const res = await fetch('/api/rooms');
  if (!res.ok) throw new Error('Failed to fetch rooms');
  return res.json();
};

export const saveRooms = async (rooms) => {
  const res = await fetch('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rooms)
  });
  if (!res.ok) throw new Error('Failed to save rooms');
  const data = await res.json();
  return data.rooms;
};

export const getGuests = async () => {
  const res = await fetch('/api/guests');
  if (!res.ok) throw new Error('Failed to fetch guests');
  return res.json();
};

export const saveGuests = async (guests) => {
  const res = await fetch('/api/guests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(guests)
  });
  if (!res.ok) throw new Error('Failed to save guests');
  const data = await res.json();
  return data.guests;
};

export const getRentConfig = async () => {
  const res = await fetch('/api/rent-config');
  if (!res.ok) throw new Error('Failed to fetch rent config');
  return res.json();
};

export const saveRentConfig = async (config) => {
  const res = await fetch('/api/rent-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) throw new Error('Failed to save rent config');
  const data = await res.json();
  return data.rentConfig;
};

export const getPaymentConfig = async () => {
  const res = await fetch('/api/payment-config');
  if (!res.ok) throw new Error('Failed to fetch payment config');
  return res.json();
};

export const savePaymentConfig = async (config) => {
  const res = await fetch('/api/payment-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) throw new Error('Failed to save payment config');
  const data = await res.json();
  return data.paymentConfig;
};

export const getPayments = async () => {
  const res = await fetch('/api/payments');
  if (!res.ok) throw new Error('Failed to fetch payments');
  return res.json();
};

export const savePayments = async (payments) => {
  const res = await fetch('/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payments)
  });
  if (!res.ok) throw new Error('Failed to save payments');
  const data = await res.json();
  return data.payments;
};

export const getOtpConfig = async () => {
  const res = await fetch('/api/otp-config');
  if (!res.ok) throw new Error('Failed to fetch OTP config');
  return res.json();
};

export const saveOtpConfig = async (config) => {
  const res = await fetch('/api/otp-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) throw new Error('Failed to save OTP config');
  const data = await res.json();
  return data.otpConfig;
};

export const getPgConfig = async () => {
  const res = await fetch('/api/pg-config');
  if (!res.ok) throw new Error('Failed to fetch PostgreSQL config');
  return res.json();
};

export const savePgConfig = async (config) => {
  const res = await fetch('/api/pg-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to save PostgreSQL config');
  }
  return res.json();
};


export const sendOtp = async (email) => {
  const res = await fetch('/api/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to send verification code');
  }
  return res.json();
};

export const verifyOtp = async (email, otp) => {
  const res = await fetch('/api/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Invalid verification code');
  }
  return res.json();
};

export const testSmtp = async (config, testEmail) => {
  const res = await fetch('/api/test-smtp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config, testEmail })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'SMTP Connection failed');
  }
  return res.json();
};

// Resets database back to default empty state on the server
export const resetDb = async () => {
  const res = await fetch('/api/reset', {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to reset database');
  return res.json();
};

// Populates database with standard demo testing data on the server
export const loadDemoDb = async () => {
  const res = await fetch('/api/load-demo', {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to load demo database');
  return res.json();
};
