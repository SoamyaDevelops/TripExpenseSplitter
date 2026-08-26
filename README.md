# 🏖️ TripSplit — College Friends Expense & Settlement Tracker

[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Build-Vite_6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Say goodbye to awkward *"who owes what"* math after college road trips! **TripSplit** is a clean, modern web application designed for group trips to effortlessly log expenses, divide costs equally among friends, track individual balances, and settle debts with the absolute minimum number of transactions.

---

## ✨ Features

- 👤 **Personal Portal ("What You Have To Do")**: Each member gets a dedicated portal showing:
  - Total money paid upfront by you
  - Your fair equal share of all trip expenses
  - Net balance status (*"You owe ₹X"* or *"You get back ₹Y"*)
  - Clear actionable list of pending payments with direct **Settle Up** buttons!
- 🍕 **Equal Expense Division**: Log any bill (Stay, Food, Transport, Activities, Misc), select who paid upfront, choose participants, and let the engine divide costs equally.
- ⚡ **Smart Settlement Engine**: Uses a greedy optimization algorithm to minimize total group transfers (e.g., reduces 10 confusing peer-to-peer debts down to just 2 direct payments).
- 🔑 **Supabase Auth & Guest Demo Mode**: Supports full user email/password signups + an instant guest test mode.
- 🗺️ **Trip Code Sharing**: Create trips with unique 6-character codes so college friends can join in one click.
- 🎉 **Celebration Effects**: Interactive confetti animations when debts are paid off.
- 🎨 **Human & Warm Aesthetic**: Modern, minimalist UI with warm slate backgrounds, `Plus Jakarta Sans` typography, and soft card shadows — zero neon or generic "AI type" visuals.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite 6
- **Styling**: Vanilla CSS with modern CSS Custom Properties / Design Tokens
- **Icons & Effects**: `lucide-react`, `canvas-confetti`
- **Backend & DB**: Supabase (PostgreSQL, Row Level Security, Auth Triggers)

---

## 🚀 Quick Start (Local Setup)

### 1. Clone the Repository

```bash
git clone https://github.com/SoamyaDevelops/TripExpenseSplitter.git
cd TripExpenseSplitter
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Local Development Server

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173/`.

---

## 🗃️ Supabase Database Setup

To link your own Supabase database:

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** -> **New Query**.
3. Copy the complete SQL script from [`schema.sql`](./schema.sql) (or click the **SQL Script** button in the app navbar).
4. Paste the script into the editor and click **RUN**.

This will automatically create all necessary tables (`profiles`, `trips`, `trip_members`, `expenses`, `expense_splits`, `settlements`), Row-Level Security (RLS) policies, and the user signup trigger function.

---

## 📂 Project Structure

```text
trip-expense-splitter/
├── schema.sql                   # Complete PostgreSQL setup script for Supabase
├── src/
│   ├── components/
│   │   ├── AddExpenseModal.jsx  # Expense creation form with equal split calculator
│   │   ├── Auth.jsx             # Login & Signup view with Supabase Auth
│   │   ├── ExpenseList.jsx      # Expense log with search, filters & details
│   │   ├── Navbar.jsx           # App header, active trip badge & profile dropdown
│   │   ├── PersonalPortal.jsx   # Individual summary cards & actionable tasks
│   │   ├── SettlementView.jsx   # Smart "Who Pays Whom" minimal transfer engine
│   │   ├── SqlScriptModal.jsx   # Modal with one-click copyable SQL setup script
│   │   └── TripSelector.jsx     # Trip creation & code joining drawer
│   ├── lib/
│   │   └── supabase.js          # Supabase client config & local persistence
│   ├── App.jsx                  # Main application state & tab routing
│   ├── App.css                  # Component layout styles & design tokens
│   ├── index.css                # Base CSS design tokens & animations
│   └── main.jsx                 # Entry point
└── README.md                    # Project documentation
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
