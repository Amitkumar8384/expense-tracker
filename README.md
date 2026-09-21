# 💰 Expense Tracker

A full-stack expense management application built with React, Node.js, Express, and MySQL.

The application allows users to securely manage their personal expenses, view financial summaries, analyze spending through charts, and generate PDF reports.

## 🚀 Live Demo

🌐 **Frontend:**  
https://expense-tracker-lyart-beta-32.vercel.app

🔗 **Backend API:**  
https://expense-tracker-c4xe.onrender.com

---

## ✨ Features

### 🔐 Authentication
- User Signup
- User Login
- JWT-based authentication
- Secure password hashing with bcrypt
- Protected API routes
- Logout functionality
- Change password

### 💸 Expense Management
- Add expenses
- Edit expenses
- Delete expenses
- View personal expenses
- Expense categories
- Income and expense tracking
- Date-based expense records

### 📊 Dashboard
- Total income
- Total expenses
- Current balance
- Expense statistics
- Spending overview

### 📈 Reports & Analytics
- Expense charts
- Category-wise analysis
- Income vs expense analysis
- Financial insights
- PDF report generation

### 👤 Profile
- User profile
- Account information
- Password management

### 📱 Responsive Design
- Desktop friendly
- Mobile friendly
- Responsive dashboard
- Works across different screen sizes

---

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- JavaScript
- CSS
- Recharts
- jsPDF
- jsPDF AutoTable

### Backend
- Node.js
- Express.js
- JWT
- bcryptjs
- CORS
- dotenv

### Database
- MySQL
- Aiven Cloud

### Deployment
- Vercel — Frontend
- Render — Backend
- Aiven — Database

---

## 🏗️ Project Architecture

```text
                    ┌─────────────────────┐
                    │       User          │
                    │   Mobile / Desktop  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React + Vite      │
                    │      Vercel         │
                    └──────────┬──────────┘
                               │
                         REST API / JWT
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Node.js + Express   │
                    │       Render        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      MySQL          │
                    │       Aiven         │
                    └─────────────────────┘
