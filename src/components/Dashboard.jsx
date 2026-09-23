import { useCallback, useMemo, useState } from 'react'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'
import {
  FaArrowTrendDown,
  FaArrowTrendUp,
  FaChartColumn,
  FaChartLine,
  FaChartPie,
  FaIndianRupeeSign,
} from './Icons'


const PIE_COLORS = [
  '#6366f1',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#64748b'
]

function formatMoney(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`
}

function MoneyTooltip({
    active,
    payload,
    label
  }) {

    if (
      !active ||
      !payload ||
      !payload.length
    ) {
      return null
    }

    return (

      <div className="analytics-tooltip">

        {label && (
          <strong>
            {label}
          </strong>
        )}

        {payload.map(
          (item, index) => (

            <div
              key={index}
              className="tooltip-row"
            >

              <span>
                {item.name}
              </span>

              <strong>
                {formatMoney(
                  item.value
                )}
              </strong>

            </div>

          )
        )}

      </div>

    )

  }


function Dashboard({ expenses = [] }) {

  // ==========================================
  // PERIOD
  // ==========================================

  const [period, setPeriod] = useState('all')


  // ==========================================
  // FORMAT MONEY
  // ==========================================

  function formatMoney(amount) {

    return `₹${Number(amount || 0).toLocaleString('en-IN')}`
    /*

    return `₹${Number(amount).toLocaleString(
      'en-IN'
    )}`

    */
  }


  // ==========================================
  // GET DATE
  // ==========================================

 function getExpenseDate(date) {

  if (!date) {
    return null
  }

  if (date instanceof Date) {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    )
  }

  const dateString =
    String(date).slice(0, 10)

  const [year, month, day] =
    dateString.split('-').map(Number)

  if (
    !year ||
    !month ||
    !day
  ) {
    return null
  }

  const parsedDate =
    new Date(
      year,
      month - 1,
      day
    )

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return null
  }

  return parsedDate
}


  // ==========================================
  // FILTER BY PERIOD
  // ==========================================

  const filterByPeriod = useCallback((items) => {
    if (period === 'all') {
      return items
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (period === 'month') {
      return items.filter(item => {
        const date = getExpenseDate(item.date)
        return (
          date &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear()
        )
      })
    }

    if (period === '7days' || period === '30days') {
      const startDate = new Date(today)
      startDate.setDate(
        today.getDate() - (period === '7days' ? 6 : 29)
      )

      return items.filter(item => {
        const date = getExpenseDate(item.date)
        return date && date >= startDate && date <= today
      })
    }

    if (period === 'year') {
      return items.filter(item => {
        const date = getExpenseDate(item.date)
        return date && date.getFullYear() === today.getFullYear()
      })
    }

    return items
  }, [period])


  // ==========================================
  // PERIOD DATA
  // ==========================================

  const periodExpenses = useMemo(
    () => filterByPeriod(expenses),
    [expenses, filterByPeriod]
  )


  // ==========================================
  // INCOME
  // ==========================================

  const { income, expense } = useMemo(() => {
    let incomeTotal = 0
    let expenseTotal = 0

    periodExpenses.forEach((item) => {
      const amount = Number(item.amount) || 0

      if (item.type === 'income') {
        incomeTotal += amount
      }

      if (item.type === 'expense') {
        expenseTotal += amount
      }
    })

    return {
      income: incomeTotal,
      expense: expenseTotal
    }
  }, [periodExpenses])


  // ==========================================
  // BALANCE
  // ==========================================

  const balance = income - expense


  // ==========================================
  // PERIOD LABEL
  // ==========================================

  function getPeriodLabel() {

    if (period === 'month') {
      return 'This Month'
    }

    if (period === '7days') {
      return 'Last 7 Days'
    }

    if (period === '30days') {
      return 'Last 30 Days'
    }

    if (period === 'year') {
      return 'This Year'
    }

    return 'All Time'

  }


  // ==========================================
  // CATEGORY ANALYTICS
  // ==========================================

  const categoryData = useMemo(() => {
    const categoryTotals = {}

    periodExpenses.forEach((item) => {
      if (item.type !== 'expense') {
        return
      }

      const category = item.category || 'Other'
      const amount = Number(item.amount) || 0

      categoryTotals[category] =
        (categoryTotals[category] || 0) + amount
    })

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [periodExpenses])


  // ==========================================
  // MONTHLY ANALYTICS
  // ==========================================

  const monthlyData = useMemo(() => {
    const monthlyTotals = {}

    const monthOrder = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ]

    periodExpenses.forEach((item) => {
      const date = getExpenseDate(item.date)

      if (!date) {
        return
      }

      const month = date.toLocaleString(
        'en-IN',
        {
          month: 'short'
        }
      )

      if (!monthlyTotals[month]) {
        monthlyTotals[month] = {
          month,
          income: 0,
          expense: 0
        }
      }

      const amount = Number(item.amount) || 0

      if (item.type === 'income') {
        monthlyTotals[month].income += amount
      }

      if (item.type === 'expense') {
        monthlyTotals[month].expense += amount
      }
    })

    return Object.values(monthlyTotals).sort(
      (a, b) =>
        monthOrder.indexOf(a.month) -
        monthOrder.indexOf(b.month)
    )
  }, [periodExpenses])


  // ==========================================
  // DAILY DATA
  // ==========================================

  const dailyData = useMemo(() => {
    const dailyTotals = {}

    periodExpenses.forEach((item) => {
      const date = getExpenseDate(item.date)

      if (!date) {
        return
      }

      const key = String(item.date).slice(0, 10)

      if (!dailyTotals[key]) {
        dailyTotals[key] = {
          date: key,
          label: date.toLocaleDateString(
            'en-IN',
            {
              day: '2-digit',
              month: 'short'
            }
          ),
          income: 0,
          expense: 0
        }
      }

      const amount = Number(item.amount) || 0

      if (item.type === 'income') {
        dailyTotals[key].income += amount
      }

      if (item.type === 'expense') {
        dailyTotals[key].expense += amount
      }
    })

    return Object.values(dailyTotals).sort(
      (a, b) =>
        new Date(a.date) -
        new Date(b.date)
    )
  }, [periodExpenses])


  // ==========================================
  // MAIN TREND DATA
  // ==========================================

  const trendData = useMemo(() => {
    return period === 'year' || period === 'all'
      ? monthlyData
      : dailyData
  }, [period, monthlyData, dailyData])


  // ==========================================
  // INCOME / EXPENSE CHART
  // ==========================================

  const comparisonData = useMemo(() => {
    return [
      {
        name: 'Income',
        amount: income
      },
      {
        name: 'Expense',
        amount: expense
      }
    ]
  }, [income, expense])


  // ==========================================
  // CUSTOM TOOLTIP
  // ==========================================




  // ==========================================
  // UI
  // ==========================================

  return (

    <section className="dashboard">


      {/* =====================================
          HEADER
      ===================================== */}

      <div className="dashboard-header">

        <div className="dashboard-title">

          <div className="dashboard-icon">
            <FaChartColumn aria-hidden="true" />
          </div>

          <div>

            <h2>
              Dashboard
            </h2>

            <p>
              Overview of your finances
            </p>

          </div>

        </div>


        <select
          className="dashboard-period"
          value={period}
          onChange={(e) =>
            setPeriod(e.target.value)
          }
        >

          <option value="month">
            This Month
          </option>

          <option value="7days">
            Last 7 Days
          </option>

          <option value="30days">
            Last 30 Days
          </option>

          <option value="year">
            This Year
          </option>

          <option value="all">
            All Time
          </option>

        </select>

      </div>


      {/* =====================================
          STAT CARDS
      ===================================== */}

      <div className="dashboard-stats">


        {/* BALANCE */}

        <div className="stat-card balance-card">

          <div className="stat-icon">
            <FaIndianRupeeSign aria-hidden="true" />
          </div>

          <div className="stat-content">

            <p>
              Total Balance
            </p>

            <h3>
              {formatMoney(balance)}
            </h3>

          </div>

        </div>


        {/* INCOME */}

        <div className="stat-card income-card">

          <div className="stat-icon">
            <FaArrowTrendUp aria-hidden="true" />
          </div>

          <div className="stat-content">

            <p>
              Total Income
            </p>

            <h3>
              {formatMoney(income)}
            </h3>

          </div>

        </div>


        {/* EXPENSE */}

        <div className="stat-card expense-card">

          <div className="stat-icon">
            <FaArrowTrendDown aria-hidden="true" />
          </div>

          <div className="stat-content">

            <p>
              Total Expense
            </p>

            <h3>
              {formatMoney(expense)}
            </h3>

          </div>

        </div>

      </div>


      {/* =====================================
          CHART GRID
      ===================================== */}

      <div className="analytics-grid">


        {/* =================================
            INCOME VS EXPENSE
        ================================= */}

        <div className="analytics-card">

          <div className="analytics-card-header">

            <div>

              <h3>
                Income vs Expense
              </h3>

              <p>
                {getPeriodLabel()}
              </p>

            </div>

          </div>


          <div className="analytics-chart">

            <ResponsiveContainer
              width="100%"
              height={300}
            >

              <BarChart
                data={comparisonData}
                margin={{
                  top: 20,
                  right: 10,
                  left: 0,
                  bottom: 5
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  tick={{
                    fontSize: 12
                  }}
                />

                <YAxis
                  tick={{
                    fontSize: 11
                  }}
                  tickFormatter={(value) =>
                    `₹${value.toLocaleString(
                      'en-IN'
                    )}`
                  }
                />

                <Tooltip
                  content={
                    <MoneyTooltip />
                  }
                />

                <Bar
                  dataKey="amount"
                  name="Amount"
                  radius={[
                    8,
                    8,
                    0,
                    0
                  ]}
                  fill="#6366f1"
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>


        {/* =================================
            CATEGORY BREAKDOWN
        ================================= */}

        <div className="analytics-card">

          <div className="analytics-card-header">

            <div>

              <h3>
                Expense by Category
              </h3>

              <p>
                Where your money is going
              </p>

            </div>

          </div>


          {categoryData.length > 0 ? (

            <div className="analytics-chart">

              <ResponsiveContainer
                width="100%"
                height={300}
              >

                <PieChart>

                  <Pie
                    data={categoryData}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={105}
                    innerRadius={55}
                    paddingAngle={3}
                  >

                    {categoryData.map(
                      (entry, index) => (

                        <Cell
                          key={
                            entry.category
                          }
                          fill={
                            PIE_COLORS[
                              index %
                              PIE_COLORS.length
                            ]
                          }
                        />

                      )
                    )}

                  </Pie>

                  <Tooltip
                    formatter={(value) =>
                      formatMoney(value)
                    }
                  />

                  <Legend />

                </PieChart>

              </ResponsiveContainer>

            </div>

          ) : (

            <div className="analytics-empty">

              <span>
                <FaChartPie aria-hidden="true" />
              </span>

              <p>
                No expense data available
              </p>

            </div>

          )}

        </div>


      </div>


      {/* =====================================
          SPENDING TREND
      ===================================== */}

      <div className="analytics-card trend-card">

        <div className="analytics-card-header">

          <div>

            <h3>
              Spending Trend
            </h3>

            <p>
              {period === 'year'
                ? 'Monthly income and expense'
                : period === 'all'
                  ? 'Monthly income and expense'
                  : 'Daily income and expense'}
            </p>

          </div>

        </div>


        {trendData.length > 0 ? (

          <div className="analytics-chart">

            <ResponsiveContainer
              width="100%"
              height={320}
            >

              <LineChart
                data={trendData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 0,
                  bottom: 5
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey={
                    period === 'year' ||
                    period === 'all'
                      ? 'month'
                      : 'label'
                  }
                  tick={{
                    fontSize: 11
                  }}
                />

                <YAxis
                  tick={{
                    fontSize: 11
                  }}
                  tickFormatter={(value) =>
                    `₹${value.toLocaleString(
                      'en-IN'
                    )}`
                  }
                />

                <Tooltip
                  content={
                    <MoneyTooltip />
                  }
                />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{
                    r: 3
                  }}
                  activeDot={{
                    r: 6
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="expense"
                  name="Expense"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{
                    r: 3
                  }}
                  activeDot={{
                    r: 6
                  }}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

        ) : (

          <div className="analytics-empty">

            <span>
              <FaChartLine aria-hidden="true" />
            </span>

            <p>
              No transaction data available
              for this period.
            </p>

          </div>

        )}

      </div>


      {/* =====================================
          TOP CATEGORIES
      ===================================== */}

      {categoryData.length > 0 && (

        <div className="analytics-card">

          <div className="analytics-card-header">

            <div>

              <h3>
                Top Spending Categories
              </h3>

              <p>
                Your highest expense categories
              </p>

            </div>

          </div>


          <div className="category-list">

            {categoryData
              .slice(0, 5)
              .map((item, index) => {

                const percentage =
                  expense > 0
                    ? (
                        item.amount /
                        expense
                      ) * 100
                    : 0

                return (

                  <div
                    className="category-row"
                    key={
                      item.category
                    }
                  >

                    <div className="category-info">

                      <div className="category-name">

                        <span
                          className="category-dot"
                          style={{
                            background:
                              PIE_COLORS[
                                index %
                                PIE_COLORS.length
                              ]
                          }}
                        />

                        <strong>
                          {item.category}
                        </strong>

                      </div>

                      <span>
                        {formatMoney(
                          item.amount
                        )}
                      </span>

                    </div>


                    <div className="category-progress">

                      <div
                        className="category-progress-bar"
                        style={{
                          width:
                            `${Math.min(
                              percentage,
                              100
                            )}%`,
                          background:
                            PIE_COLORS[
                              index %
                              PIE_COLORS.length
                            ]
                        }}
                      />

                    </div>


                    <div className="category-percent">

                      {percentage.toFixed(1)}%

                    </div>

                  </div>

                )

              })}

          </div>

        </div>

      )}


      {/* =====================================
          NO DATA
      ===================================== */}

      {periodExpenses.length === 0 && (

        <div className="dashboard-no-data">

          <div>
            <FaChartPie aria-hidden="true" />
          </div>

          <h3>
            No transactions found
          </h3>

          <p>
            Add some transactions to see
            your financial analytics.
          </p>

        </div>

      )}

    </section>

  )

}

export default Dashboard
