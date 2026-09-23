import { useEffect, useState } from 'react'
import { FaCalendarDays, FaCirclePlus, FaPlay, FaTrash } from './Icons'
import { apiUrl } from '../lib/api'

const CATEGORIES = ['Food', 'Shopping', 'Travel', 'Bills', 'Entertainment', 'Health', 'Salary', 'Other']

function PlanningPanel({ authFetch, onExpenseCreated }) {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [month, setMonth] = useState(currentMonth)
  const [budgets, setBudgets] = useState([])
  const [recurring, setRecurring] = useState([])
  const [budgetCategory, setBudgetCategory] = useState('Food')
  const [budgetLimit, setBudgetLimit] = useState('')
  const [recurringForm, setRecurringForm] = useState({ title: '', amount: '', type: 'expense', category: 'Bills', dayOfMonth: '1' })
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function fetchPlanningData() {
      const [budgetResponse, recurringResponse] = await Promise.all([
        authFetch(`${apiUrl('/api/budgets')}?month=${month}`),
        authFetch(apiUrl('/api/recurring')),
      ])

      if (cancelled) return
      if (budgetResponse?.ok) setBudgets(await budgetResponse.json())
      if (recurringResponse?.ok) setRecurring(await recurringResponse.json())
    }

    fetchPlanningData()
    return () => { cancelled = true }
  }, [authFetch, month])

  async function refreshPlanningData() {
    const [budgetResponse, recurringResponse] = await Promise.all([
      authFetch(`${apiUrl('/api/budgets')}?month=${month}`),
      authFetch(apiUrl('/api/recurring')),
    ])
    if (budgetResponse?.ok) setBudgets(await budgetResponse.json())
    if (recurringResponse?.ok) setRecurring(await recurringResponse.json())
  }

  async function saveBudget(event) {
    event.preventDefault()
    const response = await authFetch(apiUrl('/api/budgets'), {
      method: 'POST',
      body: JSON.stringify({ category: budgetCategory, monthlyLimit: Number(budgetLimit), month }),
    })
    if (response?.ok) {
      setBudgetLimit('')
      setMessage('Budget saved')
      refreshPlanningData()
    }
  }

  async function addRecurring(event) {
    event.preventDefault()
    const response = await authFetch(apiUrl('/api/recurring'), {
      method: 'POST',
      body: JSON.stringify({ ...recurringForm, amount: Number(recurringForm.amount), dayOfMonth: Number(recurringForm.dayOfMonth) }),
    })
    if (response?.ok) {
      setRecurringForm({ title: '', amount: '', type: 'expense', category: 'Bills', dayOfMonth: '1' })
      setMessage('Recurring transaction added')
      refreshPlanningData()
    }
  }

  async function runRecurring(id) {
    const response = await authFetch(apiUrl(`/api/recurring/${id}/run`), { method: 'POST' })
    if (response?.ok) {
      const expense = await response.json()
      onExpenseCreated(expense)
      setMessage('Transaction added from recurring template')
    }
  }

  async function removeRecurring(id) {
    const response = await authFetch(apiUrl(`/api/recurring/${id}`), { method: 'DELETE' })
    if (response?.ok) setRecurring(items => items.filter(item => item.id !== id))
  }

  return (
    <section className="planning-panel" aria-label="Budgets and recurring transactions">
      <div className="planning-header">
        <div>
          <span className="section-eyebrow">PLAN AHEAD</span>
          <h2>Budgets & recurring</h2>
          <p>Set monthly limits and save repeat payments.</p>
        </div>
        <label className="planning-month">
          <FaCalendarDays aria-hidden="true" />
          <span className="sr-only">Budget month</span>
          <input type="month" value={month} onChange={event => setMonth(event.target.value)} />
        </label>
      </div>

      {message && <p className="planning-message" role="status">{message}</p>}

      <div className="planning-grid">
        <div className="planning-card">
          <h3>Monthly budgets</h3>
          <form className="planning-form" onSubmit={saveBudget}>
            <select aria-label="Budget category" value={budgetCategory} onChange={event => setBudgetCategory(event.target.value)}>
              {CATEGORIES.filter(category => category !== 'Salary').map(category => <option key={category}>{category}</option>)}
            </select>
            <input aria-label="Monthly budget limit" type="number" min="1" placeholder="Limit" value={budgetLimit} onChange={event => setBudgetLimit(event.target.value)} required />
            <button type="submit"><FaCirclePlus aria-hidden="true" /> Save</button>
          </form>
          <div className="budget-list">
            {budgets.map(budget => {
              const limit = Number(budget.monthly_limit)
              const spent = Number(budget.spent)
              const percent = Math.min((spent / limit) * 100, 100)
              return <div className="budget-row" key={budget.id}>
                <div><strong>{budget.category}</strong><span>₹{spent.toLocaleString('en-IN')} / ₹{limit.toLocaleString('en-IN')}</span></div>
                <div className="budget-track"><span style={{ width: `${percent}%` }} /></div>
              </div>
            })}
          </div>
        </div>

        <div className="planning-card">
          <h3>Recurring transactions</h3>
          <form className="planning-form recurring-form" onSubmit={addRecurring}>
            <input aria-label="Recurring title" placeholder="Title" value={recurringForm.title} onChange={event => setRecurringForm({ ...recurringForm, title: event.target.value })} required />
            <input aria-label="Recurring amount" type="number" min="1" placeholder="Amount" value={recurringForm.amount} onChange={event => setRecurringForm({ ...recurringForm, amount: event.target.value })} required />
            <select aria-label="Recurring type" value={recurringForm.type} onChange={event => setRecurringForm({ ...recurringForm, type: event.target.value })}><option value="expense">Expense</option><option value="income">Income</option></select>
            <input aria-label="Day of month" type="number" min="1" max="31" placeholder="Day" value={recurringForm.dayOfMonth} onChange={event => setRecurringForm({ ...recurringForm, dayOfMonth: event.target.value })} required />
            <button type="submit"><FaCirclePlus aria-hidden="true" /> Add</button>
          </form>
          <div className="recurring-list">
            {recurring.map(item => <div className="recurring-row" key={item.id}>
              <div><strong>{item.title}</strong><span>Day {item.day_of_month} · ₹{Number(item.amount).toLocaleString('en-IN')}</span></div>
              <div><button type="button" className="icon-action" aria-label={`Add ${item.title} now`} onClick={() => runRecurring(item.id)}><FaPlay aria-hidden="true" /></button><button type="button" className="icon-action danger" aria-label={`Remove ${item.title}`} onClick={() => removeRecurring(item.id)}><FaTrash aria-hidden="true" /></button></div>
            </div>)}
          </div>
        </div>
      </div>
    </section>
  )
}

export default PlanningPanel
