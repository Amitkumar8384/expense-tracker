const mysql = require('mysql2/promise')
const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')

dotenv.config()

const app = express()
app.set('trust proxy', 1)

const PORT = process.env.PORT || 5000
const isProduction = process.env.NODE_ENV === 'production'
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const sessionCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
}

function isStrongPassword(password) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  )
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false
  }

  const [year, month, day] = date.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  )
}

function getUtcDateString() {
  return new Date().toISOString().slice(0, 10)
}

// ===============================
// CORS CONFIGURATION
// ===============================

app.use(
  cors({
    origin: function (origin, callback) {

      // Allow requests without origin
      // such as Postman or server-to-server requests
      if (!origin) {
        return callback(null, true)
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(
        new Error('Not allowed by CORS')
      )
    },

    methods: [
      'GET',
      'POST',
      'PUT',
      'DELETE'
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ],

    credentials: true
  })
)

app.use(express.json())

// ===============================
// MYSQL CONNECTION
// ===============================

const db = mysql.createPool({

  host: process.env.DB_HOST,

  user: process.env.DB_USER,

  password: process.env.DB_PASSWORD,

  database: process.env.DB_NAME,

  port: Number(process.env.DB_PORT),

  ssl: {
    ca: fs.readFileSync(
      path.join(__dirname, 'ca.pem')
    ),

    rejectUnauthorized: true
  },

  waitForConnections: true,

  connectionLimit: 10,

  queueLimit: 0
})

// ===============================
// TEST DATABASE
// ===============================

async function testDatabase() {

  try {

    const connection =
      await db.getConnection()

    console.log(
      'MySQL connected successfully'
    )

    connection.release()

  } catch (error) {

    console.error(
      'MySQL connection failed:',
      error.message
    )
  }
}

testDatabase()

// ===============================
// JWT AUTH MIDDLEWARE
// ===============================

function authenticateToken(
  req,
  res,
  next
) {

  const cookies = Object.fromEntries(
    (req.headers.cookie || '')
      .split(';')
      .filter(Boolean)
      .map((cookie) => {
        const separator = cookie.indexOf('=')
        return [
          cookie.slice(0, separator).trim(),
          decodeURIComponent(cookie.slice(separator + 1)),
        ]
      })
  )

  const token = cookies.session

  if (!token) {

    return res.status(401).json({
      message:
        'Access token required'
    })
  }

  try {

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      )

    req.user = decoded

    next()

  } catch {

    return res.status(403).json({
      message:
        'Invalid or expired token'
    })
  }
}

// ===============================
// SIGNUP
// ===============================

app.post(
  '/api/auth/signup',
  async (req, res) => {

    try {

      const {
        name,
        email,
        password
      } = req.body

      if (
        typeof name !== 'string' ||
        typeof email !== 'string' ||
        typeof password !== 'string'
      ) {

        return res.status(400).json({
          message:
            'Name, email and password are required'
        })
      }

      const cleanName =
        name.trim()

      const cleanEmail =
        email.trim().toLowerCase()

      if (
        cleanName.length < 2
      ) {

        return res.status(400).json({
          message:
            'Name must be at least 2 characters'
        })
      }

      if (!isValidEmail(cleanEmail)) {

        return res.status(400).json({
          message: 'Please provide a valid email address'
        })
      }

      if (!isStrongPassword(password)) {

        return res.status(400).json({
          message: 'Password must be 8+ characters and include uppercase, lowercase, number and special character'
        })
      }

      const [existingUser] =
        await db.query(
          'SELECT id FROM users WHERE email = ?',
          [cleanEmail]
        )

      if (
        existingUser.length > 0
      ) {

        return res.status(409).json({
          message:
            'Email already registered'
        })
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        )

      const [result] =
        await db.query(
          `
          INSERT INTO users
          (name, email, password)
          VALUES (?, ?, ?)
          `,
          [
            cleanName,
            cleanEmail,
            hashedPassword
          ]
        )

      const [newUser] =
        await db.query(
          `
          SELECT
            id,
            name,
            email,
            created_at
          FROM users
          WHERE id = ?
          `,
          [result.insertId]
        )

      res.status(201).json({
        message:
          'User registered successfully',

        user:
          newUser[0]
      })

    } catch (error) {

      console.error(error)

      res.status(500).json({
        message:
          'Failed to register user'
      })
    }
  }
)

// ===============================
// LOGIN
// ===============================

app.post(
  '/api/auth/login',
  async (req, res) => {

    try {

      const {
        email,
        password
      } = req.body

      if (
        !email ||
        !password
      ) {

        return res.status(400).json({
          message:
            'Email and password are required'
        })
      }

      const [users] =
        await db.query(
          `
          SELECT *
          FROM users
          WHERE email = ?
          `,
          [
            email
              .trim()
              .toLowerCase()
          ]
        )

      if (
        users.length === 0
      ) {

        return res.status(401).json({
          message:
            'Invalid email or password'
        })
      }

      const user =
        users[0]

      const passwordMatch =
        await bcrypt.compare(
          password,
          user.password
        )

      if (!passwordMatch) {

        return res.status(401).json({
          message:
            'Invalid email or password'
        })
      }

      const token =
        jwt.sign(
          {
            id: user.id,
            email: user.email
          },

          process.env.JWT_SECRET,

          {
            expiresIn: '7d'
          }
        )

      res
        .cookie('session', token, sessionCookieOptions)
        .json({

        message:
          'Login successful',

        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
        })

    } catch (error) {

      console.error(error)

      res.status(500).json({
        message:
          'Failed to login'
      })
    }
  }
)

// ===============================
// LOGOUT
// ===============================

app.post('/api/auth/logout', (req, res) => {
  res
    .clearCookie('session', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    })
    .json({ message: 'Logged out successfully' })
})

// ===============================
// PROTECTED PROFILE
// ===============================

app.get(
  '/api/auth/profile',
  authenticateToken,
  async (req, res) => {

    try {

      const [users] =
        await db.query(
          `
          SELECT
            id,
            name,
            email,
            created_at
          FROM users
          WHERE id = ?
          `,
          [req.user.id]
        )

      if (
        users.length === 0
      ) {

        return res.status(404).json({
          message:
            'User not found'
        })
      }

      res.json({

        message:
          'Profile fetched successfully',

        user:
          users[0]
      })

    } catch (error) {

      console.error(error)

      res.status(500).json({
        message:
          'Failed to fetch profile'
      })
    }
  }
)

// ===============================
// GET USER EXPENSES
// ===============================

app.get(
  '/api/expenses',
  authenticateToken,
  async (req, res) => {

    try {

      const [expenses] =
        await db.query(
          `
          SELECT *
          FROM expenses
          WHERE user_id = ?
          ORDER BY id DESC
          `,
          [req.user.id]
        )

      res.json(expenses)

    } catch (error) {

      console.error(error)

      res.status(500).json({
        message:
          'Failed to fetch expenses'
      })
    }
  }
)

// ===============================
// ADD USER EXPENSE
// ===============================

app.post(
  '/api/expenses',
  authenticateToken,
  async (req, res) => {

    try {

      const {
        title,
        amount,
        type,
        category,
        date
      } = req.body

      const cleanTitle = typeof title === 'string' ? title.trim() : ''
      const cleanCategory = typeof category === 'string' && category.trim()
        ? category.trim()
        : 'Other'

      if (!cleanTitle || amount === undefined || !type) {

        return res.status(400).json({
          message:
            'Title, amount and type are required'
        })
      }

      const numericAmount =
        Number(amount)

      if (
        !Number.isFinite(
          numericAmount
        ) ||
        numericAmount <= 0
      ) {

        return res.status(400).json({
          message:
            'Amount must be greater than 0'
        })
      }

      if (
        type !== 'income' &&
        type !== 'expense'
      ) {

        return res.status(400).json({
          message:
            'Type must be income or expense'
        })
      }

      const expenseDate = date || getUtcDateString()

      if (!isValidDate(expenseDate)) {

        return res.status(400).json({
          message: 'Date must use the YYYY-MM-DD format and be a real calendar date'
        })
      }

      const [result] =
        await db.query(
          `
          INSERT INTO expenses
          (
            user_id,
            title,
            amount,
            type,
            category,
            date
          )
          VALUES (?, ?, ?, ?, ?, ?)
          `,
          [
            req.user.id,
            cleanTitle,
            numericAmount,
            type,
            cleanCategory,
            expenseDate
          ]
        )

      const [newExpense] =
        await db.query(
          `
          SELECT *
          FROM expenses
          WHERE id = ?
          `,
          [result.insertId]
        )

      res.status(201).json(
        newExpense[0]
      )

    } catch (error) {

      console.error(error)

      res.status(500).json({
        message:
          'Failed to add expense'
      })
    }
  }
)

// ===============================
// UPDATE USER EXPENSE
// ===============================

app.put(
  '/api/expenses/:id',
  authenticateToken,
  async (req, res) => {

    try {

      const id =
        Number(req.params.id)

      const {
        title,
        amount,
        type,
        category,
        date
      } = req.body

      const cleanTitle = typeof title === 'string' ? title.trim() : ''
      const cleanCategory = typeof category === 'string' && category.trim()
        ? category.trim()
        : 'Other'

      if (!Number.isInteger(id) || id <= 0) {

        return res.status(400).json({
          message: 'Expense id must be a positive integer'
        })
      }

      if (!cleanTitle || amount === undefined || !type || !date) {

        return res.status(400).json({
          message:
            'Title, amount, type and date are required'
        })
      }

      const numericAmount =
        Number(amount)

      if (
        !Number.isFinite(
          numericAmount
        ) ||
        numericAmount <= 0
      ) {

        return res.status(400).json({
          message:
            'Amount must be greater than 0'
        })
      }

      if (
        type !== 'income' &&
        type !== 'expense'
      ) {

        return res.status(400).json({
          message:
            'Type must be income or expense'
        })
      }

      if (!isValidDate(date)) {

        return res.status(400).json({
          message: 'Date must use the YYYY-MM-DD format and be a real calendar date'
        })
      }

      const [result] =
        await db.query(
          `
          UPDATE expenses
          SET
            title = ?,
            amount = ?,
            type = ?,
            category = ?,
            date = ?
          WHERE
            id = ?
            AND user_id = ?
          `,
          [
            cleanTitle,
            numericAmount,
            type,
            cleanCategory,
            date,
            id,
            req.user.id
          ]
        )

      if (
        result.affectedRows === 0
      ) {

        return res.status(404).json({
          message:
            'Expense not found'
        })
      }

      const [updatedExpense] =
        await db.query(
          `
          SELECT *
          FROM expenses
          WHERE id = ?
          AND user_id = ?
          `,
          [
            id,
            req.user.id
          ]
        )

      res.json(
        updatedExpense[0]
      )

    } catch (error) {

      console.error(error)

      res.status(500).json({
        message:
          'Failed to update expense'
      })
    }
  }
)

// ===============================
// DELETE USER EXPENSE
// ===============================

app.delete(
  '/api/expenses/:id',
  authenticateToken,
  async (req, res) => {

    try {

      const id =
        Number(req.params.id)

      if (!Number.isInteger(id) || id <= 0) {

        return res.status(400).json({
          message: 'Expense id must be a positive integer'
        })
      }

      const [result] =
        await db.query(
          `
          DELETE FROM expenses
          WHERE
            id = ?
            AND user_id = ?
          `,
          [
            id,
            req.user.id
          ]
        )

      if (
        result.affectedRows === 0
      ) {

        return res.status(404).json({
          message:
            'Expense not found'
        })
      }

      res.json({
        message:
          'Expense deleted successfully'
      })

    } catch (error) {

      console.error(error)

      res.status(500).json({
        message:
          'Failed to delete expense'
      })
    }
  }
)

// ===============================
// CHANGE PASSWORD
// ===============================

app.put(
  '/api/auth/change-password',
  authenticateToken,
  async (req, res) => {

    try {

      const {
        currentPassword,
        newPassword
      } = req.body

      if (
        !currentPassword ||
        !newPassword
      ) {

        return res.status(400).json({
          message:
            'Current password and new password are required'
        })
      }

      if (
        newPassword.length < 8
      ) {

        return res.status(400).json({
          message:
            'New password must be at least 8 characters'
        })
      }

      if (!isStrongPassword(newPassword)) {

        return res.status(400).json({
          message:
            'Password must contain uppercase, lowercase, number and special character'
        })
      }

      const [users] =
        await db.query(
          `
          SELECT id, password
          FROM users
          WHERE id = ?
          `,
          [req.user.id]
        )

      if (
        users.length === 0
      ) {

        return res.status(404).json({
          message:
            'User not found'
        })
      }

      const user =
        users[0]

      const passwordMatch =
        await bcrypt.compare(
          currentPassword,
          user.password
        )

      if (!passwordMatch) {

        return res.status(401).json({
          message:
            'Current password is incorrect'
        })
      }

      const samePassword =
        await bcrypt.compare(
          newPassword,
          user.password
        )

      if (samePassword) {

        return res.status(400).json({
          message:
            'New password must be different from current password'
        })
      }

      const hashedPassword =
        await bcrypt.hash(
          newPassword,
          10
        )

      await db.query(
        `
        UPDATE users
        SET password = ?
        WHERE id = ?
        `,
        [
          hashedPassword,
          req.user.id
        ]
      )

      res.json({
        message:
          'Password changed successfully'
      })

    } catch (error) {

      console.error(error)

      res.status(500).json({
        message:
          'Failed to change password'
      })
    }
  }
)

// ===============================
// ROOT
// ===============================

app.get('/', (req, res) => {

  res.json({
    message:
      'Expense Tracker API is running'
  })
})

app.use((error, req, res, next) => {
  console.error(error)

  if (res.headersSent) {
    return next(error)
  }

  const status = error.status === 400 || error.type === 'entity.parse.failed'
    ? 400
    : 500

  res.status(status).json({
    message: status === 400
      ? 'Invalid request'
      : 'Internal server error'
  })
})

// ===============================
// START SERVER
// ===============================

app.listen(
  PORT,
  () => {

    console.log(
      `Server running on http://localhost:${PORT}`
    )
  }
)
