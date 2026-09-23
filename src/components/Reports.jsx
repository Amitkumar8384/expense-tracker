import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'

import './reports.css'
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'


function Reports({ expenses = [], onBack }) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()

    return `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}`
  })

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Number(amount) || 0)
  }

  const formatDate = (date) => {
    if (!date) return '—'

    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  // Selected month ke expenses
  const monthExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (!expense.date) return false

      return String(expense.date).slice(0, 7) === selectedMonth
    })
  }, [expenses, selectedMonth])

  // Export selected month as CSV
  const exportCSV = () => {
    if (monthExpenses.length === 0) {
      alert('No transactions available to export.')
      return
    }

    const headers = [
      'Title',
      'Category',
      'Date',
      'Type',
      'Amount'
    ]

    const rows = monthExpenses.map((expense) => [
      expense.title || '',
      expense.category || 'Other',
      expense.date || '',
      expense.type || '',
      expense.amount || 0
    ])

    const csvContent = [
      headers,
      ...rows
    ]
      .map((row) =>
        row
          .map((value) =>
            `"${String(value).replace(/"/g, '""')}"`
          )
          .join(',')
      )
      .join('\n')

    const blob = new Blob(
      [csvContent],
      { type: 'text/csv;charset=utf-8;' }
    )

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `expense-report-${selectedMonth}.csv`

    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)
  }

  // Export selected month as professional PDF
  const exportPDF = () => {
    if (monthExpenses.length === 0) {
      alert('No transactions available to export.')
      return
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = doc.internal.pageSize.getWidth()

    const formatPDFMoney = (amount) => {
      return `INR ${new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 0
      }).format(Number(amount) || 0)}`
    }

    const generatedDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })

    // Document metadata
    doc.setProperties({
      title: `Expense Report - ${selectedMonthName}`,
      subject: 'Monthly Expense Report',
      author: 'Expense Tracker',
      creator: 'Expense Tracker'
    })

    // Header
    doc.setFillColor(15, 23, 42)
    doc.rect(0, 0, pageWidth, 42, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.text('Expense Tracker', 16, 17)

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text('Monthly Financial Report', 16, 26)

    doc.setFontSize(10)
    doc.text(`${selectedMonthName}  •  Generated ${generatedDate}`, 16, 34)

    // Summary heading
    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('Monthly Summary', 16, 56)

    // Summary cards
    const cardY = 62
    const cardGap = 5
    const cardWidth = (pageWidth - 32 - cardGap * 2) / 3
    const cardHeight = 27

    const cards = [
      {
        label: 'Total Income',
        value: formatPDFMoney(totalIncome)
      },
      {
        label: 'Total Expenses',
        value: formatPDFMoney(totalExpense)
      },
      {
        label: 'Balance',
        value: formatPDFMoney(balance)
      }
    ]

    cards.forEach((card, index) => {
      const x = 16 + index * (cardWidth + cardGap)

      doc.setFillColor(248, 250, 252)
      doc.setDrawColor(226, 232, 240)
      doc.roundedRect(x, cardY, cardWidth, cardHeight, 3, 3, 'FD')

      doc.setTextColor(100, 116, 139)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.text(card.label, x + 6, cardY + 9)

      doc.setTextColor(15, 23, 42)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text(card.value, x + 6, cardY + 19)
    })

    // Transaction count
    doc.setTextColor(71, 85, 105)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(
      `${monthExpenses.length} transaction${monthExpenses.length === 1 ? '' : 's'} in ${selectedMonthName}`,
      16,
      99
    )

    // Category breakdown
    let sectionY = 110

    if (categoryData.length > 0) {
      doc.setTextColor(15, 23, 42)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('Category Breakdown', 16, sectionY)

      const categoryRows = categoryData.map((item) => {
        const percentage =
          totalExpense > 0
            ? ((item.amount / totalExpense) * 100).toFixed(1)
            : '0.0'

        return [
          item.category,
          formatPDFMoney(item.amount),
          `${percentage}%`
        ]
      })

      autoTable(doc, {
        startY: sectionY + 5,
        margin: { left: 16, right: 16 },
        head: [['Category', 'Amount', 'Share']],
        body: categoryRows,
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 3.5,
          textColor: [30, 41, 59],
          lineColor: [226, 232, 240],
          lineWidth: 0.2
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 90 },
          1: { halign: 'right', cellWidth: 45 },
          2: { halign: 'right', cellWidth: 35 }
        }
      })

      sectionY = doc.lastAutoTable.finalY + 12
    }

    // Transactions
    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('Transactions', 16, sectionY)

    const transactionRows = monthExpenses.map((expense) => [
      String(expense.title || 'Untitled'),
      String(expense.category || 'Other'),
      formatDate(expense.date),
      expense.type === 'income' ? 'Income' : 'Expense',
      `${expense.type === 'income' ? '+' : '-'}${formatPDFMoney(expense.amount)}`
    ])

    autoTable(doc, {
      startY: sectionY + 5,
      margin: { top: 15, right: 16, bottom: 18, left: 16 },
      head: [['Title', 'Category', 'Date', 'Type', 'Amount']],
      body: transactionRows,
      theme: 'striped',
      styles: {
        font: 'helvetica',
        fontSize: 8.5,
        cellPadding: 3.2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 48 },
        1: { cellWidth: 38 },
        2: { cellWidth: 31 },
        3: { cellWidth: 28 },
        4: { cellWidth: 35, halign: 'right' }
      },
      didParseCell: (data) => {
        if (
          data.section === 'body' &&
          data.column.index === 3
        ) {
          if (data.cell.raw === 'Income') {
            data.cell.styles.textColor = [5, 150, 105]
            data.cell.styles.fontStyle = 'bold'
          } else {
            data.cell.styles.textColor = [225, 29, 72]
            data.cell.styles.fontStyle = 'bold'
          }
        }

        if (
          data.section === 'body' &&
          data.column.index === 4
        ) {
          const row = transactionRows[data.row.index]

          if (row && row[3] === 'Income') {
            data.cell.styles.textColor = [5, 150, 105]
          } else {
            data.cell.styles.textColor = [225, 29, 72]
          }

          data.cell.styles.fontStyle = 'bold'
        }
      },
      didDrawPage: () => {
        const pageHeight = doc.internal.pageSize.getHeight()

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139)

        doc.text(
          'Expense Tracker • Monthly Report',
          16,
          pageHeight - 8
        )

        doc.text(
          `Page ${doc.internal.getNumberOfPages()}`,
          pageWidth - 16,
          pageHeight - 8,
          { align: 'right' }
        )
      }
    })

    doc.save(`expense-report-${selectedMonth}.pdf`)
  }

  const reportSummary = useMemo(() => {
    let totalIncome = 0
    let totalExpense = 0
    const categories = {}

    monthExpenses.forEach((expense) => {
      const amount = Number(expense.amount || 0)

      if (expense.type === 'income') {
        totalIncome += amount
        return
      }

      if (expense.type === 'expense') {
        totalExpense += amount
        const category = expense.category || 'Other'

        categories[category] =
          (categories[category] || 0) +
          amount
      }
    })

    const categoryData = Object.entries(categories)
      .map(([category, amount]) => ({
        category,
        amount
      }))
      .sort((a, b) => b.amount - a.amount)

    return {
      totalIncome,
      totalExpense,
      categoryData,
    }
  }, [monthExpenses])

  const { totalIncome, totalExpense, categoryData } = reportSummary
  const balance = totalIncome - totalExpense

  const selectedMonthName = new Date(
    `${selectedMonth}-01T00:00:00`
  ).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  })

  const chartData = useMemo(() => {
  return [
    {
      name: selectedMonthName,
      Income: totalIncome,
      Expenses: totalExpense,
      Balance: balance
    }
  ]
}, [
  selectedMonthName,
  totalIncome,
  totalExpense,
  balance
])

  return (
    <section className="reports-page">

      {/* HEADER */}
      <div className="reports-header">
          <button
            type="button"
            className="reports-back-btn"
            onClick={onBack}
          >
            ← Home
          </button>

        <div>
          <span className="reports-eyebrow">
            FINANCIAL REPORT
          </span>

          <h1>
            Monthly Expense Report
          </h1>

          <p>
            Track your income, expenses and spending
            for the selected month.
          </p>
        </div>

        <div className="reports-month-picker">

          <label htmlFor="report-month">
            Select Month
          </label>

          <input
            id="report-month"
            type="month"
            value={selectedMonth}
            onChange={(e) =>
              setSelectedMonth(e.target.value)
            }
          />

        </div>
        <button
  type="button"
  className="export-btn"
  onClick={exportCSV}
>
  ↓ Export CSV
</button>

        <button
          type="button"
          className="export-btn export-pdf-btn"
          onClick={exportPDF}
        >
          ↓ Export PDF
        </button>

      </div>


      {/* SUMMARY CARDS */}
      <div className="reports-summary">

        <div className="report-stat income">
          <span className="report-stat-icon">
            ↑
          </span>

          <div>
            <span>Total Income</span>
            <strong>
              {formatMoney(totalIncome)}
            </strong>
          </div>
        </div>


        <div className="report-stat expense">
          <span className="report-stat-icon">
            ↓
          </span>

          <div>
            <span>Total Expenses</span>
            <strong>
              {formatMoney(totalExpense)}
            </strong>
          </div>
        </div>


        <div className="report-stat balance">
          <span className="report-stat-icon">
            ₹
          </span>

          <div>
            <span>Monthly Balance</span>

            <strong
              className={
                balance >= 0
                  ? 'positive'
                  : 'negative'
              }
            >
              {formatMoney(balance)}
            </strong>
          </div>
        </div>

      </div>


      {/* CONTENT */}
      <div className="reports-grid">
        <div className="reports-card reports-chart-card">

  <div className="reports-card-header">

    <div>
      <span className="reports-eyebrow">
        MONTHLY PERFORMANCE
      </span>

      <h2>
        Income vs Expenses
      </h2>
    </div>

    <span className="reports-month-label">
      {selectedMonthName}
    </span>

  </div>

  <div className="reports-chart">
    <ResponsiveContainer
      width="100%"
      height={300}
    >
      <BarChart
        data={chartData}
        margin={{
          top: 10,
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
        />

        <YAxis />

        <Tooltip />

        <Legend />

        <Bar
          dataKey="Income"
          fill="#10b981"
          radius={[6, 6, 0, 0]}
        />

        <Bar
          dataKey="Expenses"
          fill="#f43f5e"
          radius={[6, 6, 0, 0]}
        />

      </BarChart>
    </ResponsiveContainer>
  </div>

</div>

        {/* CATEGORY */}
        <div className="reports-card">

          <div className="reports-card-header">

            <div>
              <span className="reports-eyebrow">
                BREAKDOWN
              </span>

              <h2>
                Category Spending
              </h2>
            </div>

            <span className="reports-month-label">
              {selectedMonthName}
            </span>

          </div>


          {categoryData.length === 0 ? (

            <div className="reports-empty">
              <div>📊</div>

              <h3>
                No expense data
              </h3>

              <p>
                No expenses found for this month.
              </p>
            </div>

          ) : (

            <div className="category-list">

              {categoryData.map((item) => {

                const percentage =
                  totalExpense > 0
                    ? (item.amount / totalExpense) * 100
                    : 0

                return (
                  <div
                    className="category-item"
                    key={item.category}
                  >

                    <div className="category-info">

                      <span>
                        {item.category}
                      </span>

                      <strong>
                        {formatMoney(item.amount)}
                      </strong>

                    </div>

                    <div className="category-progress">

                      <div
                        style={{
                          width: `${percentage}%`
                        }}
                      />

                    </div>

                    <small>
                      {percentage.toFixed(1)}%
                    </small>

                  </div>
                )
              })}

            </div>

          )}

        </div>


        {/* MONTH OVERVIEW */}
        <div className="reports-card">

          <div className="reports-card-header">

            <div>
              <span className="reports-eyebrow">
                OVERVIEW
              </span>

              <h2>
                {selectedMonthName}
              </h2>
            </div>

          </div>


          <div className="report-overview">

            <div>
              <span>Income</span>
              <strong className="income-text">
                {formatMoney(totalIncome)}
              </strong>
            </div>

            <div>
              <span>Expenses</span>
              <strong className="expense-text">
                {formatMoney(totalExpense)}
              </strong>
            </div>

            <div>
              <span>Transactions</span>
              <strong>
                {monthExpenses.length}
              </strong>
            </div>

            <div>
              <span>Categories</span>
              <strong>
                {categoryData.length}
              </strong>
            </div>

          </div>

        </div>

      </div>


      {/* TRANSACTIONS */}
      <div className="reports-card reports-transactions">

        <div className="reports-card-header">

          <div>
            <span className="reports-eyebrow">
              TRANSACTIONS
            </span>

            <h2>
              Monthly Transactions
            </h2>
          </div>

          <span className="reports-count">
            {monthExpenses.length} records
          </span>

        </div>


        {monthExpenses.length === 0 ? (

          <div className="reports-empty">
            <div>🧾</div>

            <h3>
              No transactions
            </h3>

            <p>
              There are no transactions for
              {` ${selectedMonthName}`}.
            </p>
          </div>

        ) : (

          <div className="reports-table-wrapper">

            <table className="reports-table">

              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>

                {monthExpenses.map((expense) => (

                  <tr key={expense.id}>

                    <td>
                      <strong>
                        {expense.title}
                      </strong>
                    </td>

                    <td>
                      {expense.category || 'Other'}
                    </td>

                    <td>
                      {formatDate(expense.date)}
                    </td>

                    <td>
                      <span
                        className={
                          expense.type === 'income'
                            ? 'report-type income'
                            : 'report-type expense'
                        }
                      >
                        {expense.type}
                      </span>
                    </td>

                    <td
                      className={
                        expense.type === 'income'
                          ? 'amount-income'
                          : 'amount-expense'
                      }
                    >
                      {expense.type === 'income'
                        ? '+'
                        : '-'}
                      {formatMoney(expense.amount)}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </section>
  )
}

export default Reports
