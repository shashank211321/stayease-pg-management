import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFilePath = path.join(__dirname, 'data', 'db.json');

// Load .env file from process.cwd() or parent directory
const loadEnv = () => {
  try {
    const searchPaths = [
      path.join(process.cwd(), '.env'),
      path.join(process.cwd(), '..', '.env'),
      path.join(__dirname, '..', '..', '.env')
    ];

    for (const envPath of searchPaths) {
      if (fs.existsSync(envPath)) {
        const envLines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
        for (const line of envLines) {
          if (line.trim().startsWith('#') || !line.trim()) continue;
          
          const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (match) {
            const key = match[1];
            let value = match[2] || '';
            if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
              value = value.substring(1, value.length - 1);
            } else if (value.length > 0 && value.charAt(0) === "'" && value.charAt(value.length - 1) === "'") {
              value = value.substring(1, value.length - 1);
            }
            if (!process.env[key]) {
              process.env[key] = value.trim();
            }
          }
        }
        console.log(`Loaded environment variables from: ${envPath}`);
        break;
      }
    }
  } catch (err) {
    console.warn('Could not load .env file:', err);
  }
};
loadEnv();

// In-memory PostgreSQL Pool state
let pgPool = null;
let pgConnected = false;

export const isPgConnected = () => pgConnected;

// Default configurations
const DEFAULT_OTP_CONFIG = {
  emailJsEnabled: false,
  emailJsServiceId: '',
  emailJsTemplateId: '',
  emailJsPublicKey: '',
  webhookEnabled: false,
  webhookUrl: '',
  smtpEnabled: false,
  smtpHost: 'smtp.gmail.com',
  smtpPort: 465,
  smtpSecure: true,
  smtpUser: '',
  smtpPass: '',
  senderEmail: ''
};

const DEFAULT_RENT_CONFIG = {
  1: 10000, // Single Share
  2: 7000,  // Double Share
  3: 5500,  // 3 Persons Share
  4: 4500   // 4 Persons Share
};

const DEFAULT_PAYMENT_CONFIG = {
  upiId: 'pgowner@paytm',
  merchantName: 'StayEase PG Services',
  billingDay: 5,
  currency: 'INR'
};

const DEFAULT_PG_CONFIG = {
  enabled: false,
  host: '',
  port: 5432,
  user: '',
  password: '',
  database: '',
  ssl: false
};

const INITIAL_ROOMS = [
  { id: '101', roomNo: '101', floor: '1st Floor', sharing: 1, beds: [{ id: '101-1', guestId: null }] },
  { id: '102', roomNo: '102', floor: '1st Floor', sharing: 2, beds: [{ id: '102-1', guestId: null }, { id: '102-2', guestId: null }] },
  { id: '103', roomNo: '103', floor: '1st Floor', sharing: 2, beds: [{ id: '103-1', guestId: null }, { id: '103-2', guestId: null }] },
  { id: '201', roomNo: '201', floor: '2nd Floor', sharing: 3, beds: [{ id: '201-1', guestId: null }, { id: '201-2', guestId: null }, { id: '201-3', guestId: null }] },
  { id: '202', roomNo: '202', floor: '2nd Floor', sharing: 3, beds: [{ id: '202-1', guestId: null }, { id: '202-2', guestId: null }, { id: '202-3', guestId: null }] },
  { id: '301', roomNo: '301', floor: '3rd Floor', sharing: 4, beds: [{ id: '301-1', guestId: null }, { id: '301-2', guestId: null }, { id: '301-3', guestId: null }, { id: '301-4', guestId: null }] },
  { id: '302', roomNo: '302', floor: '3rd Floor', sharing: 4, beds: [{ id: '302-1', guestId: null }, { id: '302-2', guestId: null }, { id: '302-3', guestId: null }, { id: '302-4', guestId: null }] }
];

// Helper to read database
function readDbFile() {
  try {
    if (!fs.existsSync(dbFilePath)) {
      // Create empty file
      const dir = path.dirname(dbFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(dbFilePath, JSON.stringify({}, null, 2), 'utf-8');
    }
    const raw = fs.readFileSync(dbFilePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read db file:', err);
    return {};
  }
}

// Helper to write database
function writeDbFile(data) {
  try {
    const dir = path.dirname(dbFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write db file:', err);
  }
}

// Create tables automatically if they do not exist
const createPgTables = async () => {
  if (!pgPool) return;
  const client = await pgPool.connect();
  try {
    // 1. rooms Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id VARCHAR(50) PRIMARY KEY,
        room_no VARCHAR(50) UNIQUE NOT NULL,
        floor VARCHAR(50),
        sharing INT NOT NULL,
        beds JSONB NOT NULL
      )
    `);

    // 2. guests Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS guests (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        emergency_phone VARCHAR(20),
        aadhaar_no VARCHAR(20),
        aadhaar_image TEXT,
        room_no VARCHAR(50),
        bed_id VARCHAR(50),
        joining_date VARCHAR(50),
        leaving_date VARCHAR(50),
        sharing_type INT,
        status VARCHAR(20),
        monthly_rent INT
      )
    `);

    // 3. payments Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(50) PRIMARY KEY,
        guest_id VARCHAR(50),
        guest_name VARCHAR(255),
        room_no VARCHAR(50),
        month VARCHAR(50),
        amount INT,
        status VARCHAR(20),
        payment_date VARCHAR(50),
        payment_method VARCHAR(50),
        transaction_id VARCHAR(100)
      )
    `);

    // 4. configs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS configs (
        key VARCHAR(50) PRIMARY KEY,
        value JSONB NOT NULL
      )
    `);
  } finally {
    client.release();
  }
};

// Initialize connection pool
export const initializePgPool = async (config) => {
  if (pgPool) {
    try {
      await pgPool.end();
    } catch (e) {
      console.error('Error closing PG pool:', e);
    }
    pgPool = null;
    pgConnected = false;
  }

  if (!config || !config.enabled || !config.host || !config.database) {
    return { success: false, error: 'PostgreSQL connection disabled or incomplete.' };
  }

  try {
    const poolConfig = {
      host: config.host.trim(),
      port: parseInt(config.port) || 5432,
      user: config.user ? config.user.trim() : '',
      password: config.password ? config.password.trim() : '',
      database: config.database.trim(),
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

    if (config.ssl) {
      poolConfig.ssl = { rejectUnauthorized: false };
    }

    const pool = new Pool(poolConfig);
    
    // Connect & test
    const client = await pool.connect();
    client.release();

    pgPool = pool;
    pgConnected = true;

    await createPgTables();
    return { success: true };
  } catch (err) {
    console.error('Failed to establish PG connection:', err);
    pgPool = null;
    pgConnected = false;
    return { success: false, error: err.message };
  }
};

// Initialize local database structure & PG if enabled
export const initDb = async () => {
  let db = {};
  if (fs.existsSync(dbFilePath)) {
    try {
      db = JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
    } catch (e) {
      db = {};
    }
  }

  let updated = false;
  if (!db.rooms) {
    db.rooms = INITIAL_ROOMS;
    updated = true;
  }
  if (!db.guests) {
    db.guests = [];
    updated = true;
  }
  if (!db.rentConfig) {
    db.rentConfig = DEFAULT_RENT_CONFIG;
    updated = true;
  }
  if (!db.paymentConfig) {
    db.paymentConfig = DEFAULT_PAYMENT_CONFIG;
    updated = true;
  }
  if (!db.payments) {
    db.payments = [];
    updated = true;
  }
  if (!db.otpConfig) {
    db.otpConfig = DEFAULT_OTP_CONFIG;
    updated = true;
  }
  if (!db.pgConfig) {
    db.pgConfig = DEFAULT_PG_CONFIG;
    updated = true;
  }

  if (updated) {
    writeDbFile(db);
  }

  const pgConfigToUse = await getPgConfig();
  if (pgConfigToUse && pgConfigToUse.enabled) {
    await initializePgPool(pgConfigToUse);
  }
};

export const getRooms = async () => {
  if (pgConnected && pgPool) {
    try {
      const res = await pgPool.query('SELECT * FROM rooms ORDER BY room_no ASC');
      return res.rows.map(r => ({
        id: r.id,
        roomNo: r.room_no,
        floor: r.floor,
        sharing: r.sharing,
        beds: r.beds
      }));
    } catch (err) {
      console.error('Failed to get rooms from PG, falling back to local file:', err);
    }
  }
  const db = readDbFile();
  return db.rooms || [];
};

export const saveRooms = async (rooms) => {
  if (pgConnected && pgPool) {
    try {
      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM rooms');
        for (const room of rooms) {
          await client.query(
            'INSERT INTO rooms (id, room_no, floor, sharing, beds) VALUES ($1, $2, $3, $4, $5)',
            [room.id, room.roomNo, room.floor, room.sharing, JSON.stringify(room.beds)]
          );
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
      return;
    } catch (err) {
      console.error('Failed to save rooms to PG, falling back to local file:', err);
    }
  }
  const db = readDbFile();
  db.rooms = rooms;
  writeDbFile(db);
};

export const getGuests = async () => {
  if (pgConnected && pgPool) {
    try {
      const res = await pgPool.query('SELECT * FROM guests');
      return res.rows.map(g => ({
        id: g.id,
        name: g.name,
        phone: g.phone,
        emergencyPhone: g.emergency_phone,
        aadhaarNo: g.aadhaar_no,
        aadhaarImage: g.aadhaar_image,
        roomNo: g.room_no,
        bedId: g.bed_id,
        joiningDate: g.joining_date,
        leavingDate: g.leaving_date,
        sharingType: g.sharing_type,
        status: g.status,
        monthlyRent: g.monthly_rent
      }));
    } catch (err) {
      console.error('Failed to get guests from PG, falling back to local file:', err);
    }
  }
  const db = readDbFile();
  return db.guests || [];
};

export const saveGuests = async (guests) => {
  if (pgConnected && pgPool) {
    try {
      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM guests');
        for (const g of guests) {
          await client.query(
            `INSERT INTO guests (id, name, phone, emergency_phone, aadhaar_no, aadhaar_image, room_no, bed_id, joining_date, leaving_date, sharing_type, status, monthly_rent) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [g.id, g.name, g.phone, g.emergencyPhone, g.aadhaarNo, g.aadhaarImage, g.roomNo, g.bedId, g.joiningDate, g.leavingDate, g.sharingType, g.status, g.monthlyRent]
          );
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
      return;
    } catch (err) {
      console.error('Failed to save guests to PG, falling back to local file:', err);
    }
  }
  const db = readDbFile();
  db.guests = guests;
  writeDbFile(db);
};

export const getRentConfig = async () => {
  if (pgConnected && pgPool) {
    try {
      const res = await pgPool.query('SELECT value FROM configs WHERE key = $1', ['rentConfig']);
      if (res.rows.length > 0) {
        return res.rows[0].value;
      }
      return DEFAULT_RENT_CONFIG;
    } catch (err) {
      console.error('Failed to get rent config from PG, falling back to local file:', err);
    }
  }
  const db = readDbFile();
  return db.rentConfig || DEFAULT_RENT_CONFIG;
};

export const saveRentConfig = async (config) => {
  if (pgConnected && pgPool) {
    try {
      await pgPool.query(
        'INSERT INTO configs (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
        ['rentConfig', JSON.stringify(config)]
      );
      return;
    } catch (err) {
      console.error('Failed to save rent config to PG, falling back to local file:', err);
    }
  }
  const db = readDbFile();
  db.rentConfig = config;
  writeDbFile(db);
};

export const getPaymentConfig = async () => {
  if (pgConnected && pgPool) {
    try {
      const res = await pgPool.query('SELECT value FROM configs WHERE key = $1', ['paymentConfig']);
      if (res.rows.length > 0) {
        return res.rows[0].value;
      }
      return DEFAULT_PAYMENT_CONFIG;
    } catch (err) {
      console.error('Failed to get payment config from PG, falling back to local file:', err);
    }
  }
  const db = readDbFile();
  return db.paymentConfig || DEFAULT_PAYMENT_CONFIG;
};

export const savePaymentConfig = async (config) => {
  if (pgConnected && pgPool) {
    try {
      await pgPool.query(
        'INSERT INTO configs (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
        ['paymentConfig', JSON.stringify(config)]
      );
      return;
    } catch (err) {
      console.error('Failed to save payment config to PG, falling back to local file:', err);
    }
  }
  const db = readDbFile();
  db.paymentConfig = config;
  writeDbFile(db);
};

export const getPayments = async () => {
  if (pgConnected && pgPool) {
    try {
      const res = await pgPool.query('SELECT * FROM payments');
      return res.rows.map(p => ({
        id: p.id,
        guestId: p.guest_id,
        guestName: p.guest_name,
        roomNo: p.room_no,
        month: p.month,
        amount: p.amount,
        status: p.status,
        paymentDate: p.payment_date,
        paymentMethod: p.payment_method,
        transactionId: p.transaction_id
      }));
    } catch (err) {
      console.error('Failed to get payments from PG, falling back to local file:', err);
    }
  }
  const db = readDbFile();
  return db.payments || [];
};

export const savePayments = async (payments) => {
  if (pgConnected && pgPool) {
    try {
      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM payments');
        for (const p of payments) {
          await client.query(
            `INSERT INTO payments (id, guest_id, guest_name, room_no, month, amount, status, payment_date, payment_method, transaction_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [p.id, p.guestId, p.guestName, p.roomNo, p.month, p.amount, p.status, p.paymentDate, p.paymentMethod, p.transactionId]
          );
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
      return;
    } catch (err) {
      console.error('Failed to save payments to PG, falling back to local file:', err);
    }
  }
  const db = readDbFile();
  db.payments = payments;
  writeDbFile(db);
};

export const getOtpConfig = async () => {
  let config = DEFAULT_OTP_CONFIG;
  if (pgConnected && pgPool) {
    try {
      const res = await pgPool.query('SELECT value FROM configs WHERE key = $1', ['otpConfig']);
      if (res.rows.length > 0) {
        config = res.rows[0].value;
      }
    } catch (err) {
      console.error('Failed to get OTP config from PG, falling back to local file:', err);
      const db = readDbFile();
      config = db.otpConfig || DEFAULT_OTP_CONFIG;
    }
  } else {
    const db = readDbFile();
    config = db.otpConfig || DEFAULT_OTP_CONFIG;
  }

  // Environment variable override fallback
  if (process.env.SMTP_HOST || process.env.SMTP_USER || process.env.SMTP_PASS) {
    return {
      ...config,
      smtpEnabled: process.env.SMTP_ENABLED !== 'false',
      smtpHost: process.env.SMTP_HOST || config.smtpHost,
      smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : config.smtpPort,
      smtpSecure: process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : config.smtpSecure,
      smtpUser: process.env.SMTP_USER || config.smtpUser,
      smtpPass: process.env.SMTP_PASS || config.smtpPass,
      senderEmail: process.env.SMTP_SENDER || config.senderEmail
    };
  }

  return config;
};

export const saveOtpConfig = async (config) => {
  if (pgConnected && pgPool) {
    try {
      await pgPool.query(
        'INSERT INTO configs (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
        ['otpConfig', JSON.stringify(config)]
      );
      return;
    } catch (err) {
      console.error('Failed to save OTP config to PG, falling back to local file:', err);
    }
  }
  const db = readDbFile();
  db.otpConfig = config;
  writeDbFile(db);
};

export const getPgConfig = async () => {
  // Check environment variables override
  const envEnabled = process.env.DB_ENABLED === 'true' || !!process.env.DATABASE_URL || !!process.env.DB_HOST;
  if (envEnabled) {
    let envConfig = { ...DEFAULT_PG_CONFIG, enabled: true };
    if (process.env.DATABASE_URL) {
      try {
        const url = new URL(process.env.DATABASE_URL);
        envConfig.host = url.hostname;
        envConfig.port = parseInt(url.port) || 5432;
        envConfig.user = decodeURIComponent(url.username);
        envConfig.password = decodeURIComponent(url.password);
        envConfig.database = decodeURIComponent(url.pathname.substring(1));
        envConfig.ssl = process.env.DATABASE_URL.includes('sslmode=require') || process.env.DATABASE_URL.includes('sslmode=prefer') || process.env.DB_SSL === 'true';
      } catch (e) {
        console.error('Failed to parse DATABASE_URL environment variable:', e);
      }
    } else {
      envConfig.host = process.env.DB_HOST || '';
      envConfig.port = parseInt(process.env.DB_PORT) || 5432;
      envConfig.user = process.env.DB_USER || '';
      envConfig.password = process.env.DB_PASSWORD || '';
      envConfig.database = process.env.DB_DATABASE || process.env.DB_NAME || '';
      envConfig.ssl = process.env.DB_SSL === 'true';
    }
    return envConfig;
  }

  const db = readDbFile();
  return db.pgConfig || DEFAULT_PG_CONFIG;
};

export const savePgConfig = async (config) => {
  const db = readDbFile();
  db.pgConfig = config;
  writeDbFile(db);
  return await initializePgPool(config);
};

// Resets database back to default empty state
export const resetDb = async () => {
  if (pgConnected && pgPool) {
    try {
      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM rooms');
        await client.query('DELETE FROM guests');
        await client.query('DELETE FROM payments');
        for (const room of INITIAL_ROOMS) {
          await client.query(
            'INSERT INTO rooms (id, room_no, floor, sharing, beds) VALUES ($1, $2, $3, $4, $5)',
            [room.id, room.roomNo, room.floor, room.sharing, JSON.stringify(room.beds)]
          );
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
      return;
    } catch (err) {
      console.error('Failed to reset PG database:', err);
    }
  }
  const cleanDb = {
    rooms: INITIAL_ROOMS,
    guests: [],
    rentConfig: DEFAULT_RENT_CONFIG,
    paymentConfig: DEFAULT_PAYMENT_CONFIG,
    payments: [],
    otpConfig: DEFAULT_OTP_CONFIG,
    pgConfig: getPgConfig()
  };
  writeDbFile(cleanDb);
};

// Populates database with standard demo testing data
export const loadDemoDb = async () => {
  const demoRooms = [
    { id: '101', roomNo: '101', floor: '1st Floor', sharing: 1, beds: [{ id: '101-1', guestId: 'g1' }] },
    { id: '102', roomNo: '102', floor: '1st Floor', sharing: 2, beds: [{ id: '102-1', guestId: 'g2' }, { id: '102-2', guestId: null }] },
    { id: '103', roomNo: '103', floor: '1st Floor', sharing: 2, beds: [{ id: '103-1', guestId: null }, { id: '103-2', guestId: null }] },
    { id: '201', roomNo: '201', floor: '2nd Floor', sharing: 3, beds: [{ id: '201-1', guestId: 'g3' }, { id: '201-2', guestId: null }, { id: '201-3', guestId: null }] },
    { id: '202', roomNo: '202', floor: '2nd Floor', sharing: 3, beds: [{ id: '202-1', guestId: null }, { id: '202-2', guestId: null }, { id: '202-3', guestId: null }] },
    { id: '301', roomNo: '301', floor: '3rd Floor', sharing: 4, beds: [{ id: '301-1', guestId: 'g4' }, { id: '301-2', guestId: 'g5' }, { id: '301-3', guestId: null }, { id: '301-4', guestId: null }] },
    { id: '302', roomNo: '302', floor: '3rd Floor', sharing: 4, beds: [{ id: '302-1', guestId: null }, { id: '302-2', guestId: null }, { id: '302-3', guestId: null }, { id: '302-4', guestId: null }] }
  ];

  const demoGuests = [
    {
      id: 'g1',
      name: 'Aarav Mehta',
      phone: '9876543210',
      emergencyPhone: '9876543219',
      aadhaarNo: '123456789012',
      aadhaarImage: '/aadhaar_mock.png',
      roomNo: '101',
      bedId: '101-1',
      joiningDate: '2026-06-05',
      leavingDate: null,
      sharingType: 1,
      status: 'active',
      monthlyRent: 10000
    },
    {
      id: 'g2',
      name: 'Rahul Sharma',
      phone: '8765432109',
      emergencyPhone: '8765432100',
      aadhaarNo: '987654321098',
      aadhaarImage: '/aadhaar_mock.png',
      roomNo: '102',
      bedId: '102-1',
      joiningDate: '2026-06-10',
      leavingDate: null,
      sharingType: 2,
      status: 'active',
      monthlyRent: 7000
    },
    {
      id: 'g3',
      name: 'Aditya Sen',
      phone: '7654321098',
      emergencyPhone: '7654321090',
      aadhaarNo: '456789012345',
      aadhaarImage: '/aadhaar_mock.png',
      roomNo: '201',
      bedId: '201-1',
      joiningDate: '2026-06-12',
      leavingDate: null,
      sharingType: 3,
      status: 'active',
      monthlyRent: 5500
    },
    {
      id: 'g4',
      name: 'Vikram Singh',
      phone: '6543210987',
      emergencyPhone: '6543210980',
      aadhaarNo: '789012345678',
      aadhaarImage: '/aadhaar_mock.png',
      roomNo: '301',
      bedId: '301-1',
      joiningDate: '2026-06-15',
      leavingDate: null,
      sharingType: 4,
      status: 'active',
      monthlyRent: 4500
    },
    {
      id: 'g5',
      name: 'Karan Malhotra',
      phone: '9888777666',
      emergencyPhone: '9888777660',
      aadhaarNo: '345678901234',
      aadhaarImage: '/aadhaar_mock.png',
      roomNo: '301',
      bedId: '301-2',
      joiningDate: '2026-06-18',
      leavingDate: null,
      sharingType: 4,
      status: 'active',
      monthlyRent: 4500
    }
  ];

  const demoPayments = [
    { id: 'p1', guestId: 'g1', guestName: 'Aarav Mehta', roomNo: '101', month: 'June 2026', amount: 10000, status: 'Paid', paymentDate: '2026-06-03', paymentMethod: 'UPI', transactionId: 'TXN1029384756' },
    { id: 'p2', guestId: 'g2', guestName: 'Rahul Sharma', roomNo: '102', month: 'June 2026', amount: 7000, status: 'Paid', paymentDate: '2026-06-04', paymentMethod: 'Cash', transactionId: '' },
    { id: 'p3', guestId: 'g3', guestName: 'Aditya Sen', roomNo: '201', month: 'June 2026', amount: 5500, status: 'Pending', paymentDate: '', paymentMethod: '', transactionId: '' },
    { id: 'p4', guestId: 'g4', guestName: 'Vikram Singh', roomNo: '301', month: 'June 2026', amount: 4500, status: 'Paid', paymentDate: '2026-06-05', paymentMethod: 'UPI', transactionId: 'TXN5647382910' },
    { id: 'p5', guestId: 'g5', guestName: 'Karan Malhotra', roomNo: '301', month: 'June 2026', amount: 4500, status: 'Pending', paymentDate: '', paymentMethod: '', transactionId: '' }
  ];

  if (pgConnected && pgPool) {
    try {
      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM rooms');
        await client.query('DELETE FROM guests');
        await client.query('DELETE FROM payments');
        for (const room of demoRooms) {
          await client.query(
            'INSERT INTO rooms (id, room_no, floor, sharing, beds) VALUES ($1, $2, $3, $4, $5)',
            [room.id, room.roomNo, room.floor, room.sharing, JSON.stringify(room.beds)]
          );
        }
        for (const g of demoGuests) {
          await client.query(
            `INSERT INTO guests (id, name, phone, emergency_phone, aadhaar_no, aadhaar_image, room_no, bed_id, joining_date, leaving_date, sharing_type, status, monthly_rent) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [g.id, g.name, g.phone, g.emergencyPhone, g.aadhaarNo, g.aadhaarImage, g.roomNo, g.bedId, g.joiningDate, g.leavingDate, g.sharingType, g.status, g.monthlyRent]
          );
        }
        for (const p of demoPayments) {
          await client.query(
            `INSERT INTO payments (id, guest_id, guest_name, room_no, month, amount, status, payment_date, payment_method, transaction_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [p.id, p.guestId, p.guestName, p.roomNo, p.month, p.amount, p.status, p.paymentDate, p.paymentMethod, p.transactionId]
          );
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
      return;
    } catch (err) {
      console.error('Failed to load demo data in PG:', err);
    }
  }

  const db = readDbFile();
  db.rooms = demoRooms;
  db.guests = demoGuests;
  db.payments = demoPayments;
  writeDbFile(db);
};
