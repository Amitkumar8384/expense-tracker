import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Header from './components/Header'
import ExpenseForm from './components/ExpenseForm'
import ExpenseList from './components/ExpenseList'
import { apiUrl, getLocalDateString } from './lib/api'

const Profile = lazy(() => import('./components/Profile'))
const Reports = lazy(() => import('./components/Reports'))

const EXPENSES_API_URL = apiUrl('/api/expenses')
const PROFILE_API_URL = apiUrl('/api/auth/profile')
const LOGOUT_API_URL = apiUrl('/api/auth/logout')
function App() {

  // ===============================
  // USER
  // ===============================

  const [user, setUser] = useState(null)
  const [sessionChecking, setSessionChecking] = useState(true)

  // ===============================
  // PROFILE PAGE
  // ===============================

  const [showProfile, setShowProfile] = useState(() => {
    return localStorage.getItem('currentPage') === 'profile'
  })

  const [showReports, setShowReports] = useState(() => {
    return localStorage.getItem('currentPage') === 'reports'
  })

  // ===============================
  // THEME
  // ===============================

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme(prevTheme =>
      prevTheme === 'dark' ? 'light' : 'dark'
    )
  }

  // ===============================
  // EXPENSES
  // ===============================

  const [expenses, setExpenses] = useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')


  // ===============================
  // FILTERS
  // ===============================

  const [search, setSearch] =
    useState('')

  const [categoryFilter, setCategoryFilter] =
    useState('all')

  const [dateFilter, setDateFilter] =
    useState('')


  // ===============================
  // EDIT
  // ===============================

  const [editingExpense, setEditingExpense] =
    useState(null)


  // ===============================
  // AUTHENTICATED REQUESTS
  // ===============================

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem('currentPage')

    setUser(null)
    setExpenses([])
    setShowProfile(false)
    setShowReports(false)
  }, [])

  const authFetch = useCallback(
    async (url, options = {}) => {
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          ...(options.body ? { 'Content-Type': 'application/json' } : {}),
          ...(options.headers || {}),
        },
      })

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized()
        return null
      }

      return response
    },
    [handleUnauthorized]
  )


  // ===============================
  // LOGOUT
  // ===============================

  const handleLogout = useCallback(async () => {
    try {
      await fetch(LOGOUT_API_URL, {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      handleUnauthorized()
    }
  }, [handleUnauthorized])

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      try {
        const response = await fetch(PROFILE_API_URL, {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          if (!cancelled) setUser(data.user)
        }
      } catch (error) {
        console.error('Unable to restore session:', error)
      } finally {
        if (!cancelled) setSessionChecking(false)
      }
    }

    restoreSession()
    return () => { cancelled = true }
  }, [])

  // ===============================
  // GET EXPENSES
  // ===============================

  useEffect(() => {
    let cancelled = false

    async function fetchExpenses() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')

        const response = await authFetch(EXPENSES_API_URL)

        if (!response) return

        if (!response.ok) {
          throw new Error('Failed to fetch expenses')
        }

        const data = await response.json()

        if (!cancelled) {
          setExpenses(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error)
          setError('Unable to connect to backend server')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchExpenses()

    return () => {
      cancelled = true
    }
  }, [user, authFetch])


  // ===============================
  // ADD EXPENSE
  // ===============================

  const addExpense = useCallback(
    async (title, amount, type, category) => {
      try {
        const newExpense = {
          title: title.trim(),
          amount: Number(amount),
          type,
          category,
          date: getLocalDateString(),
        }

        const response = await authFetch(EXPENSES_API_URL, {
          method: 'POST',
          body: JSON.stringify(newExpense),
        })

        if (!response) return

        if (!response.ok) {
          throw new Error('Failed to add expense')
        }

        const savedExpense = await response.json()

        setExpenses(prevExpenses => [
          savedExpense,
          ...prevExpenses,
        ])
        return true
      } catch (error) {
        console.error(error)
        alert('Unable to save transaction')
        return false
      }
    },
    [authFetch]
  )


  // ===============================
  // DELETE EXPENSE
  // ===============================

  const deleteExpense = useCallback(
    async (id) => {
      try {
        const response = await authFetch(`${EXPENSES_API_URL}/${id}`, {
          method: 'DELETE',
        })

        if (!response) return

        if (!response.ok) {
          throw new Error('Failed to delete expense')
        }

        setExpenses(prevExpenses =>
          prevExpenses.filter(expense => expense.id !== id)
        )
      } catch (error) {
        console.error(error)
        alert('Unable to delete transaction')
      }
    },
    [authFetch]
  )


  // ===============================
  // OPEN EDIT MODAL
  // ===============================

  const editExpense = useCallback(
    id => {
      const expense = expenses.find(expense => expense.id === id)

      if (expense) {
        setEditingExpense(expense)
      }
    },
    [expenses]
  )


  // ===============================
  // UPDATE EXPENSE
  // ===============================
const updateExpense = useCallback(
  async updatedExpense => {
    try {
      const expenseDate = updatedExpense.date
        ? String(updatedExpense.date).slice(0, 10)
        : getLocalDateString()

      const response = await authFetch(`${EXPENSES_API_URL}/${updatedExpense.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: updatedExpense.title,
          amount: Number(updatedExpense.amount),
          type: updatedExpense.type,
          category: updatedExpense.category,
          date: expenseDate,
        }),
      })

      if (!response) return

      if (!response.ok) {
        const errorText = await response.text()

        console.error(
          'UPDATE FAILED:',
          response.status,
          errorText
        )

        alert(`Unable to update transaction (${response.status})`)
        return
      }

      let savedExpense = updatedExpense
      const responseText = await response.text()

      if (responseText) {
        try {
          savedExpense = JSON.parse(responseText)
        } catch {
          console.warn('Backend returned non-JSON response')
        }
      }

      setExpenses(prevExpenses =>
        prevExpenses.map(expense =>
          expense.id === updatedExpense.id
            ? {
                ...expense,
                ...savedExpense,
                id: updatedExpense.id,
              }
            : expense
        )
      )

      setEditingExpense(null)
    } catch (error) {
      console.error('UPDATE ERROR:', error)
      alert('Unable to update transaction')
    }
  },
  [authFetch]
)

  // ===============================
  // CLOSE EDIT MODAL
  // ===============================

  const closeEditModal = useCallback(() => {
    setEditingExpense(null)
  }, [])


  // ===============================
  // FILTERS
  // ===============================

  const filteredExpenses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return expenses.filter(item => {
      const matchesSearch =
        !normalizedSearch ||
        item.title?.toLowerCase().includes(normalizedSearch)

      const matchesCategory =
        categoryFilter === 'all' ||
        item.category === categoryFilter

      const matchesDate =
        !dateFilter ||
        item.date === dateFilter

      return matchesSearch && matchesCategory && matchesDate
    })
  }, [expenses, search, categoryFilter, dateFilter])


  // ===============================
  // CLEAR FILTERS
  // ===============================

  const clearFilters = useCallback(() => {
    setSearch('')
    setCategoryFilter('all')
    setDateFilter('')
  }, [])


  // ===============================
  // LOGIN SCREEN
  // ===============================

  if (sessionChecking) {
    return (
      <div className="session-loading" role="status" aria-label="Loading">
        <span className="auth-spinner" />
      </div>
    )
  }

  if (!user) {

    return (
      <Login
       onLogin={(loggedInUser) => {
  setUser(loggedInUser)
  setShowProfile(false)
  setShowReports(false)
  localStorage.setItem('currentPage', 'dashboard')
}}
      />
    )

  }


  // ===============================
  // MAIN APP
  // ===============================

  return (

    <div className={`app app-${theme}`}>

      {/* ===============================
          HEADER
      =============================== */}

      <Header />


      {/* ===============================
          USER BAR
      =============================== */}

      <div className="user-bar">

        <div>

          <strong>
            Welcome, {user.name}
          </strong>

          <span>
            {user.email}
          </span>

        </div>


        <div className="user-actions">

          <button
            type="button"
            className={`home-btn ${!showProfile && !showReports ? 'is-active' : ''}`}
            onClick={() => {
              setShowProfile(false)
              setShowReports(false)
              localStorage.setItem('currentPage', 'dashboard')
            }}
            aria-current={!showProfile && !showReports ? 'page' : undefined}
          >
            🏠 Home
          </button>

          <button
  type="button"
  className={`profile-btn ${showProfile ? 'is-active' : ''}`}
  onClick={() => {
    setShowProfile(true)
    localStorage.setItem(
      'currentPage',
      'profile'
    )
  }}
  aria-current={showProfile ? 'page' : undefined}
>
  👤 Profile
</button>

<button
  type="button"
  className={`reports-btn ${showReports ? 'is-active' : ''}`}
  onClick={() => {
    setShowReports(true)
    setShowProfile(false)
    localStorage.setItem(
      'currentPage',
      'reports'
    )
  }}
  aria-current={showReports ? 'page' : undefined}
>
  📊 Reports
</button>
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          <button
            type="button"
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </div>

{/* ===============================
    PROFILE
=============================== */}

<Suspense fallback={<div className="api-message">Loading page...</div>}>
{showProfile ? (

  <Profile
    user={user}
    onLogout={handleLogout}
    onBack={() => {
      setShowProfile(false)
      localStorage.setItem(
        'currentPage',
        'dashboard'
      )
    }}
  />

) : showReports ? (

  <Reports
    expenses={expenses}
    onBack={() => {
      setShowReports(false)
      localStorage.setItem(
        'currentPage',
        'dashboard'
      )
    }}
  />

) : (

  <>

    {/* ===============================
        LOADING
    =============================== */}

    {loading && (
      <div className="api-message">
        Loading transactions...
      </div>
    )}

    {/* ===============================
        ERROR
    =============================== */}

    {error && (
      <div className="api-error">
        {error}
      </div>
    )}

    {/* ===============================
        DASHBOARD
    =============================== */}

    <Dashboard
      expenses={expenses}
    />

          {/* ===============================
              ADD FORM
          =============================== */}

          <ExpenseForm
            onAddExpense={addExpense}
          />


          {/* ===============================
              FILTERS
          =============================== */}

          <section className="filters">

            <div className="filters-header">

              <div>

                <h2>
                  Filter Transactions
                </h2>

                <p>
                  Search and filter your
                  transactions
                </p>

              </div>


              {(search ||
                categoryFilter !== 'all' ||
                dateFilter) && (

                <button
                  type="button"
                  className="clear-filter"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>

              )}

            </div>


            <div className="filter-controls">

              {/* SEARCH */}

              <div className="filter-field">

                <label>
                  Search
                </label>

                <input
                  type="text"
                  placeholder="Search transaction..."
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                />

              </div>


              {/* CATEGORY */}

              <div className="filter-field">

                <label>
                  Category
                </label>

                <select
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(
                      e.target.value
                    )
                  }
                >

                  <option value="all">
                    All Categories
                  </option>

                  <option value="Food">
                    Food
                  </option>

                  <option value="Shopping">
                    Shopping
                  </option>

                  <option value="Travel">
                    Travel
                  </option>

                  <option value="Bills">
                    Bills
                  </option>

                  <option value="Entertainment">
                    Entertainment
                  </option>

                  <option value="Health">
                    Health
                  </option>

                  <option value="Salary">
                    Salary
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

              </div>


              {/* DATE */}

              <div className="filter-field">

                <label>
                  Date
                </label>

                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) =>
                    setDateFilter(
                      e.target.value
                    )
                  }
                />

              </div>

            </div>


            <div className="filter-result">

              Showing{' '}

              <strong>
                {filteredExpenses.length}
              </strong>

              {' '}of{' '}

              <strong>
                {expenses.length}
              </strong>

              {' '}transactions

            </div>

          </section>


          {/* ===============================
              TRANSACTIONS
          =============================== */}

          <ExpenseList
            expenses={filteredExpenses}
            onDelete={deleteExpense}
            onEdit={editExpense}
          />


          {/* ===============================
              EDIT MODAL
          =============================== */}

          {editingExpense && (

            <div className="modal-overlay">

              <div className="edit-modal">


                {/* MODAL HEADER */}

                <div className="modal-header">

                  <div>

                    <h2>
                      Edit Transaction
                    </h2>

                    <p>
                      Update your transaction
                      details
                    </p>

                  </div>


                  <button
                    type="button"
                    className="modal-close"
                    onClick={
                      closeEditModal
                    }
                  >
                    ×
                  </button>

                </div>


                {/* EDIT FORM */}

                <form
                  onSubmit={async (e) => {

                    e.preventDefault()

                    const formData =
                      new FormData(
                        e.currentTarget
                      )


                    const title =
                      formData
                        .get('title')
                        .trim()


                    const amount =
                      Number(
                        formData.get(
                          'amount'
                        )
                      )


                    const type =
                      formData.get(
                        'type'
                      )


                    const category =
                      formData.get(
                        'category'
                      )


                    if (!title) {

                      alert(
                        'Please enter a title'
                      )

                      return

                    }


                    if (
                      !amount ||
                      amount <= 0
                    ) {

                      alert(
                        'Please enter a valid amount'
                      )

                      return

                    }


                    await updateExpense({

                      ...editingExpense,

                      title,

                      amount,

                      type,

                      category

                    })

                  }}
                >


                  {/* TITLE */}

                  <div className="modal-field">

                    <label>
                      Transaction Title
                    </label>

                    <input
                      name="title"
                      type="text"
                      defaultValue={
                        editingExpense.title
                      }
                      placeholder="e.g. Grocery"
                    />

                  </div>


                  {/* AMOUNT */}

                  <div className="modal-field">

                    <label>
                      Amount
                    </label>

                    <input
                      name="amount"
                      type="number"
                      min="1"
                      defaultValue={
                        editingExpense.amount
                      }
                      placeholder="Enter amount"
                    />

                  </div>


                  {/* TYPE + CATEGORY */}

                  <div className="modal-grid">


                    {/* TYPE */}

                    <div className="modal-field">

                      <label>
                        Type
                      </label>

                      <select
                        name="type"
                        defaultValue={
                          editingExpense.type
                        }
                      >

                        <option value="expense">
                          Expense
                        </option>

                        <option value="income">
                          Income
                        </option>

                      </select>

                    </div>


                    {/* CATEGORY */}

                    <div className="modal-field">

                      <label>
                        Category
                      </label>

                      <select
                        name="category"
                        defaultValue={
                          editingExpense.category ||
                          'Other'
                        }
                      >

                        <option value="Food">
                          Food
                        </option>

                        <option value="Shopping">
                          Shopping
                        </option>

                        <option value="Travel">
                          Travel
                        </option>

                        <option value="Bills">
                          Bills
                        </option>

                        <option value="Entertainment">
                          Entertainment
                        </option>

                        <option value="Health">
                          Health
                        </option>

                        <option value="Salary">
                          Salary
                        </option>

                        <option value="Other">
                          Other
                        </option>

                      </select>

                    </div>

                  </div>


                  {/* ACTIONS */}

                  <div className="modal-actions">

                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={
                        closeEditModal
                      }
                    >
                      Cancel
                    </button>


                    <button
                      type="submit"
                      className="save-btn"
                    >
                      Save Changes
                    </button>

                  </div>

                </form>

              </div>

            </div>

          )}

        </>

      )}
</Suspense>

    </div>

  )

}

export default App
