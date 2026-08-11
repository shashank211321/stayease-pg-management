# Graph Report - C:\Users\DELL\project  (2026-08-05)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 167 nodes · 323 edges · 12 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- database/db.js
- App.jsx
- server/package.json
- scripts
- Icons.jsx
- devDependencies
- Payments.jsx
- .oxlintrc.json
- RoomManagement.jsx
- Login.jsx
- react

## God Nodes (most connected - your core abstractions)
1. `App()` - 18 edges
2. `readDbFile()` - 16 edges
3. `writeDbFile()` - 11 edges
4. `react` - 10 edges
5. `scripts` - 9 edges
6. `IconClose()` - 6 edges
7. `initDb()` - 5 edges
8. `getPgConfig()` - 5 edges
9. `savePgConfig()` - 5 edges
10. `IconRoom()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `GuestManagement()` --references--> `react`  [EXTRACTED]
  src/components/GuestManagement.jsx → package.json
- `App()` --calls--> `getGuests()`  [EXTRACTED]
  src/App.jsx → src/utils/db.js
- `App()` --calls--> `getOtpConfig()`  [EXTRACTED]
  src/App.jsx → src/utils/db.js
- `App()` --calls--> `getPaymentConfig()`  [EXTRACTED]
  src/App.jsx → src/utils/db.js
- `App()` --calls--> `getPayments()`  [EXTRACTED]
  src/App.jsx → src/utils/db.js

## Import Cycles
- None detected.

## Communities (12 total, 0 thin omitted)

### Community 0 - "database/db.js"
Cohesion: 0.12
Nodes (35): createPgTables(), dbFilePath, DEFAULT_OTP_CONFIG, DEFAULT_PAYMENT_CONFIG, DEFAULT_PG_CONFIG, DEFAULT_RENT_CONFIG, __dirname, __filename (+27 more)

### Community 1 - "App.jsx"
Cohesion: 0.23
Nodes (20): App(), Settings(), getGuests(), getOtpConfig(), getPaymentConfig(), getPayments(), getPgConfig(), getRentConfig() (+12 more)

### Community 2 - "server/package.json"
Cohesion: 0.10
Nodes (20): cors, express, nodemailer, nodemon, pg, dependencies, cors, express (+12 more)

### Community 3 - "scripts"
Cohesion: 0.10
Nodes (20): lucide-react, dependencies, lucide-react, react, react-dom, name, private, scripts (+12 more)

### Community 4 - "Icons.jsx"
Cohesion: 0.18
Nodes (9): IconCheck(), IconDashboard(), IconInfo(), IconLogOut(), IconMail(), IconMoon(), IconPhone(), IconSettings() (+1 more)

### Community 5 - "devDependencies"
Cohesion: 0.15
Nodes (13): concurrently, oxlint, devDependencies, concurrently, oxlint, @types/react, @types/react-dom, vite (+5 more)

### Community 6 - "Payments.jsx"
Cohesion: 0.31
Nodes (7): GuestManagement(), IconArrowRight(), IconCopy(), IconSmartphone(), IconUpload(), Payments(), compressImage()

### Community 7 - ".oxlintrc.json"
Cohesion: 0.25
Nodes (7): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, warn

### Community 8 - "RoomManagement.jsx"
Cohesion: 0.33
Nodes (5): IconClose(), IconPlus(), IconRoom(), IconTrash(), RoomManagement()

### Community 9 - "Login.jsx"
Cohesion: 0.47
Nodes (5): IconGuest(), IconShieldCheck(), Login(), sendOtp(), verifyOtp()

### Community 10 - "react"
Cohesion: 0.40
Nodes (4): react, Dashboard(), IconBuilding(), IconPayment()

## Knowledge Gaps
- **50 isolated node(s):** `$schema`, `oxc`, `react/rules-of-hooks`, `warn`, `name` (+45 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GuestManagement()` connect `Payments.jsx` to `App.jsx`, `scripts`?**
  _High betweenness centrality (0.179) - this node is a cross-community bridge._
- **Why does `react` connect `scripts` to `Payments.jsx`?**
  _High betweenness centrality (0.178) - this node is a cross-community bridge._
- **What connects `$schema`, `oxc`, `react/rules-of-hooks` to the rest of the system?**
  _50 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `database/db.js` be split into smaller, more focused modules?**
  _Cohesion score 0.12091038406827881 - nodes in this community are weakly interconnected._
- **Should `server/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._