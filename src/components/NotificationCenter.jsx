import { useEffect, useMemo, useState } from 'react'
import { FaBell, FaCalendarDays, FaCircleExclamation, FaRegClock } from './Icons'
import { apiUrl, getLocalDateString } from '../lib/api'

function NotificationCenter({ authFetch, expenses }) {
  const [budgets, setBudgets] = useState([])
  const [recurring, setRecurring] = useState([])
  const [open, setOpen] = useState(false)

  const month = getLocalDateString().slice(0, 7)

  useEffect(() => {
    let cancelled = false

    async function loadNotifications() {
      const [budgetResponse, recurringResponse] = await Promise.all([
        authFetch(`${apiUrl('/api/budgets')}?month=${month}`),
        authFetch(apiUrl('/api/recurring')),
      ])

      if (cancelled) return
      if (budgetResponse?.ok) setBudgets(await budgetResponse.json())
      if (recurringResponse?.ok) setRecurring(await recurringResponse.json())
    }

    loadNotifications()
    return () => { cancelled = true }
  }, [authFetch, expenses, month])

  const notifications = useMemo(() => {
    const items = budgets
      .filter(item => Number(item.spent) >= Number(item.monthly_limit))
      .map(item => ({
        id: `budget-${item.id}`,
        icon: <FaCircleExclamation aria-hidden="true" />,
        title: `${item.category} budget reached`,
        detail: `₹${Number(item.spent).toLocaleString('en-IN')} spent this month`,
        tone: 'warning',
      }))

    const today = new Date().getDate()
    recurring
      .filter(item => item.is_active && Number(item.day_of_month) >= today && Number(item.day_of_month) <= today + 3)
      .forEach(item => items.push({
        id: `recurring-${item.id}`,
        icon: <FaRegClock aria-hidden="true" />,
        title: `${item.title} is coming up`,
        detail: `Scheduled for day ${item.day_of_month}`,
        tone: 'info',
      }))

    return items
  }, [budgets, recurring])

  return (
    <div className="notification-center">
      <button
        type="button"
        className={`notification-trigger ${open ? 'is-active' : ''}`}
        onClick={() => setOpen(value => !value)}
        aria-label={`Notifications${notifications.length ? `, ${notifications.length} unread` : ''}`}
        aria-expanded={open}
      >
        <FaBell aria-hidden="true" />
        {notifications.length > 0 && <span className="notification-badge">{notifications.length}</span>}
      </button>

      {open && (
        <div className="notification-popover" role="region" aria-label="Notifications">
          <div className="notification-heading">
            <div><strong>Notifications</strong><span>{notifications.length ? `${notifications.length} updates` : 'All caught up'}</span></div>
            <FaCalendarDays aria-hidden="true" />
          </div>
          {notifications.length === 0 ? (
            <div className="notification-empty"><FaBell aria-hidden="true" /><p>No new alerts</p></div>
          ) : notifications.map(item => (
            <div className={`notification-item ${item.tone}`} key={item.id}>
              <span className="notification-item-icon">{item.icon}</span>
              <div><strong>{item.title}</strong><p>{item.detail}</p></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default NotificationCenter