import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Header from './components/Header'
import ExpenseForm from './components/ExpenseForm'
import ExpenseList from './components/ExpenseList'
import PlanningPanel from './components/PlanningPanel'
import NotificationCenter from './components/NotificationCenter'
import {
  FaChartColumn,
  FaHouse,
  FaMoon,
  FaRightFromBracket,
  FaSun,
  FaUser,
} from './components/Icons'
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

  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem('currentPage') || 'dashboard'
  })

  const navigateTo = useCallback((page) => {
    setCurrentPage(page)
    localStorage.setItem('currentPage', page)
  }, [])

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

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')
  const [sortBy, setSortBy] = useState('newest')


  // ===============================
  // EDIT
  // ===============================

  const [editingExpense, setEditingExpense] =
    useState(null)

  const editModalRef = useRef(null)

  useEffect(() => {
    if (!editingExpense) return undefined

    const firstField = editModalRef.current?.querySelector('input, select')
    firstField?.focus()

    function handleModalKeyDown(event) {
      if (event.key === 'Escape') {
        setEditingExpense(null)
        return
      }

      if (event.key !== 'Tab') return

      const focusable = Array.from(
        editModalRef.current?.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), select:not([disabled])'
        ) || []
      )

      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleModalKeyDown)
    return () => document.removeEventListener('keydown', handleModalKeyDown)
  }, [editingExpense])


  // ===============================
  // AUTHENTICATED REQUESTS
  // ===============================

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem('currentPage')

    setUser(null)
    setExpenses([])
    setCurrentPage('dashboard')
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

    const filtered = expenses.filter(item => {
      const matchesSearch =
        !normalizedSearch ||
        item.title?.toLowerCase().includes(normalizedSearch)

      const matchesCategory =
        categoryFilter === 'all' ||
        item.category === categoryFilter

      const itemDate = String(item.date).slice(0, 10)
      const matchesDateFrom = !dateFrom || itemDate >= dateFrom
      const matchesDateTo = !dateTo || itemDate <= dateTo
      const itemAmount = Number(item.amount) || 0
      const matchesType = typeFilter === 'all' || item.type === typeFilter
      const matchesMin = !amountMin || itemAmount >= Number(amountMin)
      const matchesMax = !amountMax || itemAmount <= Number(amountMax)

      return matchesSearch && matchesCategory && matchesDateFrom && matchesDateTo && matchesType && matchesMin && matchesMax
    })

    return filtered.sort((first, second) => {
      if (sortBy === 'oldest') return String(first.date).localeCompare(String(second.date))
      if (sortBy === 'highest') return Number(second.amount) - Number(first.amount)
      if (sortBy === 'lowest') return Number(first.amount) - Number(second.amount)
      return String(second.date).localeCompare(String(first.date))
    })
  }, [expenses, search, categoryFilter, dateFrom, dateTo, typeFilter, amountMin, amountMax, sortBy])


  // ===============================
  // CLEAR FILTERS
  // ===============================

  const clearFilters = useCallback(() => {
    setSearch('')
    setCategoryFilter('all')
    setDateFrom('')
    setDateTo('')
    setTypeFilter('all')
    setAmountMin('')
    setAmountMax('')
    setSortBy('newest')
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
  navigateTo('dashboard')
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

          <NotificationCenter
            authFetch={authFetch}
            expenses={expenses}
          />

          <button
            type="button"
            className={`home-btn ${currentPage === 'dashboard' ? 'is-active' : ''}`}
            onClick={() => navigateTo('dashboard')}
            aria-current={currentPage === 'dashboard' ? 'page' : undefined}
          >
            <FaHouse aria-hidden="true" /> Home
          </button>

          <button
  type="button"
  className={`profile-btn ${currentPage === 'profile' ? 'is-active' : ''}`}
  onClick={() => navigateTo('profile')}
  aria-current={currentPage === 'profile' ? 'page' : undefined}
>
  <FaUser aria-hidden="true" /> Profile
</button>

<button
  type="button"
  className={`reports-btn ${currentPage === 'reports' ? 'is-active' : ''}`}
  onClick={() => navigateTo('reports')}
  aria-current={currentPage === 'reports' ? 'page' : undefined}
>
  <FaChartColumn aria-hidden="true" /> Reports
</button>
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <FaSun aria-hidden="true" /> : <FaMoon aria-hidden="true" />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          <button
            type="button"
            className="logout-btn"
            onClick={handleLogout}
          >
            <FaRightFromBracket aria-hidden="true" /> Logout
          </button>

        </div>

      </div>

{/* ===============================
    PROFILE
=============================== */}

      <Suspense
        fallback={
          <div className="session-loading" role="status" aria-label="Loading page">
            <span className="auth-spinner" />
          </div>
        }
      >
{currentPage === 'profile' ? (

  <Profile
    user={user}
    onLogout={handleLogout}
  />

) : currentPage === 'reports' ? (

  <Reports
    expenses={expenses}
  />

) : (

  <>

    {/* ===============================
        LOADING
    =============================== */}

    {loading && (
      <div className="inline-loader" role="status" aria-label="Loading transactions">
        <span className="auth-spinner" />
      </div>
    )}

    {/* ===============================
        ERROR
    =============================== */}

    {error && (
      <div className="api-error" role="alert">
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

          <PlanningPanel
            authFetch={authFetch}
            onExpenseCreated={(expense) => {
              setExpenses(prevExpenses => [expense, ...prevExpenses])
            }}
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
                dateFrom ||
                dateTo ||
                typeFilter !== 'all' ||
                amountMin ||
                amountMax ||
                sortBy !== 'newest') && (

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

                <label htmlFor="filter-search">
                  Search
                </label>

                  <input
                    id="filter-search"
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

                <label htmlFor="filter-category">
                  Category
                </label>

                <select
                  id="filter-category"
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

                <label htmlFor="filter-date-from">
                  From date
                </label>

                <input
                  id="filter-date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) =>
                    setDateFrom(
                      e.target.value
                    )
                  }
                />

              </div>

              <div className="filter-field">
                <label htmlFor="filter-date-to">To date</label>
                <input
                  id="filter-date-to"
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>

              <div className="filter-field">
                <label htmlFor="filter-type">Type</label>
                <select id="filter-type" value={typeFilter} onChange={event => setTypeFilter(event.target.value)}>
                  <option value="all">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div className="filter-field">
                <label htmlFor="filter-min-amount">Min amount</label>
                <input id="filter-min-amount" type="number" min="0" placeholder="0" value={amountMin} onChange={event => setAmountMin(event.target.value)} />
              </div>

              <div className="filter-field">
                <label htmlFor="filter-max-amount">Max amount</label>
                <input id="filter-max-amount" type="number" min="0" placeholder="Any" value={amountMax} onChange={event => setAmountMax(event.target.value)} />
              </div>

              <div className="filter-field">
                <label htmlFor="filter-sort">Sort by</label>
                <select id="filter-sort" value={sortBy} onChange={event => setSortBy(event.target.value)}>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="highest">Highest amount</option>
                  <option value="lowest">Lowest amount</option>
                </select>
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

              <div
                className="edit-modal"
                ref={editModalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-transaction-title"
              >


                {/* MODAL HEADER */}

                <div className="modal-header">

                  <div>

                    <h2 id="edit-transaction-title">
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
                    aria-label="Close edit transaction dialog"
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

                    <label htmlFor="edit-title">
                      Transaction Title
                    </label>

                    <input
                      id="edit-title"
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

                    <label htmlFor="edit-amount">
                      Amount
                    </label>

                    <input
                      id="edit-amount"
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

                      <label htmlFor="edit-type">
                        Type
                      </label>

                      <select
                        id="edit-type"
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

                      <label htmlFor="edit-category">
                        Category
                      </label>

                      <select
                        id="edit-category"
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
