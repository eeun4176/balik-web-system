# B.A.L.I.K. — BulSU Automated Lost Item Keeper

## Merged Full-Stack System (Node.js + SQLite)

This is the **unified project** combining the user dashboard, admin panel, and AI chatbot into a single Node.js application.

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. (Optional) Configure Email & AI

Create a `.env` file in the project root:

```env
PORT=3000
SESSION_SECRET=your-secret-key-here

# Email (for OTP sending)
MAIL_USER=your-gmail@gmail.com
MAIL_PASS=your-app-password

# Mistral AI chatbot
MISTRAL_API_KEY=w6wS2RXI8f2I1IjbDB9FEaTR1PWCFayq
AGENT_ID=ag_019c9025025775f792f2f5f444aec7b3
```

### 3. Start the Server

```bash
npm start
```

### 4. Open in Browser

- **User Portal:** http://localhost:3000/
- **Admin Panel:** http://localhost:3000/admin/

---

## 🔑 Default Credentials

### Admin Login

- **Username:** `admin`
- **Password:** `admin123`
    > ⚠️ Change this immediately in Admin → Settings after first login!

### User Registration

Regular users register through the user portal at `/login_register.html`.

---

## 📁 Project Structure

```
balik-system/
├── server.js              # Main Express server
├── package.json           # Dependencies
├── database/
│   ├── db.js              # SQLite schema + seeding (unified)
│   └── balik.db           # SQLite database file (auto-created)
├── routes/
│   ├── auth.js            # User login, register, OTP
│   ├── admin.js           # Admin API (session-protected)
│   ├── reports.js         # Lost/Found reports
│   ├── claims.js          # Claims
│   ├── items.js           # Items lookup
│   ├── users.js           # User profiles
│   ├── lookup.js          # Dropdowns (locations, categories)
│   └── upload.js          # Photo uploads
├── client/                # User-facing HTML pages
│   ├── login_register.html
│   ├── index.html         # User dashboard
│   ├── search.html
│   ├── account.html
│   ├── report-lost-page.html
│   ├── report-found-page.html
│   └── ...
├── admin/
│   └── index.html         # Admin SPA (all admin views)
├── assets/                # CSS, JS, images
├── images/                # App images
├── uploads/               # Uploaded item photos
└── .env                   # Environment config (create this)
```

---

## 🔐 How Login Routing Works

The login page (`/login_register.html`) handles both user and admin login:

1. User enters their email/password
2. The server checks if the email matches an **admin username** first
3. If admin → session is created and user is redirected to `/admin/`
4. If regular user → localStorage token is set and user is redirected to `index.html`

---

## 🤖 AI Chatbot

The chatbot widget appears on all user-facing pages (bottom-right, below the scroll-up button).

- **Auto-opens** with a greeting on first visit (after 3 seconds)
- Powered by **Mistral AI** via `/api/chat`
- Chat history is saved in `localStorage`
- The chatbot greets users and explains its capabilities automatically

---

## 🗄️ Database Schema (SQLite)

All tables live in a single `database/balik.db` file:

| Table               | Purpose                                     |
| ------------------- | ------------------------------------------- |
| `users`             | Regular user profiles                       |
| `accounts`          | Login credentials (email + hashed password) |
| `admins`            | Admin accounts (username + hashed password) |
| `reports`           | Lost/Found item reports                     |
| `claims`            | Claim requests on found items               |
| `notifications`     | Admin notifications                         |
| `activity_logs`     | Admin activity audit trail                  |
| `affiliations`      | Student/Faculty/Staff types                 |
| `categories`        | Item categories                             |
| `locations`         | Campus buildings                            |
| `rooms`             | Rooms within buildings                      |
| `offices`           | Campus offices                              |
| `programs`          | Academic programs                           |
| `departments`       | Academic departments                        |
| `sections`          | Class sections                              |
| `otp_verifications` | Email OTP codes                             |

---

## 👨‍💼 Admin Panel Features

The admin panel (`/admin/`) includes:

- **Dashboard** — Stats overview, reports table with filters, bulk actions
- **Claims** — Approve/reject claim requests
- **Users** — View and manage registered users
- **Notifications** — System notifications
- **History** — Activity audit log
- **Report** — Generate reports
- **Settings** — Change admin credentials

---

## 🧩 Key Features

- ✅ Single unified SQLite database
- ✅ Admin login redirects to admin panel; regular users go to user dashboard
- ✅ Vantage-style admin UI (sidebar, topbar, data tables)
- ✅ AI chatbot on all user pages with auto-greeting
- ✅ Session-based admin auth + localStorage user auth
- ✅ Photo uploads for items and profiles
- ✅ OTP email verification for user registration
- ✅ Full CRUD for reports, claims, users
