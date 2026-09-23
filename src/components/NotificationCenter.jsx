import { useEffect, useMemo, useState } from 'react'
import { FaBell, FaCalendarDays, FaCircleExclamation, FaRegClock, FaXmark } from './Icons'
import { apiUrl, getLocalDateString } from '../lib/api'

function NotificationCenter({ authFetch, expenses }) {
  const [budgets, setBudgets] = useState([])
  const [recurring, setRecurring] = useState([])
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('dismissedNotifications') || '[]'))
    } catch {
      return new Set()
    }
  })

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

    return items.filter(item => !dismissed.has(item.id))
  }, [budgets, recurring, dismissed])

  function dismissNotification(id) {
    setDismissed(previous => {
      const next = new Set(previous)
      next.add(id)
      localStorage.setItem('dismissedNotifications', JSON.stringify([...next]))
      return next
    })
  }

  function clearNotifications() {
    const ids = notifications.map(item => item.id)
    setDismissed(previous => {
      const next = new Set([...previous, ...ids])
      localStorage.setItem('dismissedNotifications', JSON.stringify([...next]))
      return next
    })
  }

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
            <div className="notification-heading-actions">
              <FaCalendarDays aria-hidden="true" />
              {notifications.length > 0 && <button type="button" className="notification-clear" onClick={clearNotifications}>Clear all</button>}
            </div>
          </div>
          {notifications.length === 0 ? (
            <div className="notification-empty"><FaBell aria-hidden="true" /><p>No new alerts</p></div>
          ) : notifications.map(item => (
            <div className={`notification-item ${item.tone}`} key={item.id}>
              <span className="notification-item-icon">{item.icon}</span>
              <div><strong>{item.title}</strong><p>{item.detail}</p></div>
              <button type="button" className="notification-dismiss" aria-label={`Remove ${item.title}`} onClick={() => dismissNotification(item.id)}><FaXmark aria-hidden="true" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default NotificationCenter