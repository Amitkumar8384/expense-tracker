import {
  FaChartColumn,
  FaMinus,
  FaPen,
  FaPlus,
  FaTrash,
} from './Icons'

function ExpenseList({
  expenses,
  onDelete,
  onEdit
}) {

  return (
    <section className="transactions-section">

      <div className="transactions-header">

        <div>

          <h2>
            Transactions
          </h2>

          <p>
            Your recent income and expenses
          </p>

        </div>

        <span className="transaction-count">
          {expenses.length}
        </span>

      </div>


      {expenses.length === 0 ? (

        <div className="empty-state">

          <div className="empty-icon">
            <FaChartColumn aria-hidden="true" />
          </div>

          <h3>
            No transactions found
          </h3>

          <p>
            Add a transaction or change
            your filters.
          </p>

        </div>

      ) : (

        <div className="transactions-list">

          {expenses.map((expense) => (

            <div
              className="transaction"
              key={expense.id}
            >

              {/* LEFT */}

              <div className="transaction-info">

                <div
                  className={`transaction-icon ${
                    expense.type === 'income'
                      ? 'income-icon'
                      : 'expense-icon'
                  }`}
                >
                  {expense.type === 'income'
                    ? <FaPlus aria-hidden="true" />
                    : <FaMinus aria-hidden="true" />}
                </div>


                <div>

                  <h3>
                    {expense.title}
                  </h3>

                  <div className="transaction-meta">

                    <span>
                      {expense.category ||
                        'Other'}
                    </span>

                    <span>
                      {new Date(expense.date).toLocaleDateString('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
})}
                    </span>

                  </div>

                </div>

              </div>


              {/* RIGHT */}

              <div className="transaction-actions">

                <p
                  className={
                    expense.type === 'income'
                      ? 'income-amount'
                      : 'expense-amount'
                  }
                >

                  {expense.type === 'income'
                    ? <FaPlus aria-hidden="true" />
                    : <FaMinus aria-hidden="true" />}

                  ₹
                  {Number(
                    expense.amount
                  ).toLocaleString('en-IN')}

                </p>


                <button
                  type="button"
                  className="edit-btn"
                  onClick={() =>
                    onEdit(expense.id)
                  }
                >
                  <FaPen aria-hidden="true" /> Edit
                </button>


                <button
                  type="button"
                  className="delete-btn"
                  onClick={() => {

                    const confirmed =
                      window.confirm(
                        'Delete this transaction?'
                      )

                    if (confirmed) {
                      onDelete(expense.id)
                    }

                  }}
                >
                  <FaTrash aria-hidden="true" /> Delete
                </button>

              </div>

            </div>

          ))}

        </div>

      )}

    </section>
  )
}

export default ExpenseList