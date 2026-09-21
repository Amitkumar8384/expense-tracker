# 💰 Expense Tracker

A full-stack expense management application built with **React, Node.js, Express.js, and MySQL**.

Expense Tracker helps users securely manage their income and expenses, track their financial activity, analyze spending through interactive charts, and generate PDF reports.

---

## 🌐 Live Application

### 🚀 Frontend
https://expense-tracker-lyart-beta-32.vercel.app

### ⚙️ Backend API
https://expense-tracker-c4xe.onrender.com

---

## ✨ Features

### 🔐 Authentication

- User registration
- User login
- JWT-based authentication
- Secure password hashing with bcrypt
- Protected API routes
- Logout functionality
- Change password
- User-specific expense data

### 💸 Expense Management

- Add new expenses
- Edit existing expenses
- Delete expenses
- Track income
- Track expenses
- Expense categories
- Expense dates
- Personal expense history
- Automatic financial calculations

### 📊 Dashboard

- Total income
- Total expenses
- Current balance
- Expense summary
- Financial overview
- Spending statistics

### 📈 Reports & Analytics

- Interactive charts
- Category-wise expense analysis
- Income vs expense analysis
- Financial statistics
- Monthly/overall spending insights
- PDF report generation
- Downloadable expense reports

### 👤 Profile

- View user profile
- Account information
- Change password
- Secure authentication

### 📱 Responsive UI

- Desktop responsive design
- Mobile responsive design
- Tablet support
- Mobile-friendly dashboard
- Responsive expense management

---

# 🛠️ Tech Stack

## Frontend

- React
- Vite
- JavaScript
- CSS
- Recharts
- jsPDF
- jsPDF AutoTable

## Backend

- Node.js
- Express.js
- MySQL2
- JWT
- bcryptjs
- CORS
- dotenv

## Database

- MySQL
- Aiven Cloud

## Deployment

- Vercel — Frontend
- Render — Backend
- Aiven — Database

---

# 🏗️ Application Architecture

```text
                    ┌─────────────────────┐
                    │        USER         │
                    │   Mobile / Desktop  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React + Vite      │
                    │      Vercel         │
                    │     Frontend        │
                    └──────────┬──────────┘
                               │
                         REST API + JWT
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Node.js + Express │
                    │       Render        │
                    │       Backend       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │       MySQL         │
                    │       Aiven         │
                    │      Database       │
                    └─────────────────────┘
