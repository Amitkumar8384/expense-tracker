function Summary({ balance, income, expense }) {

  return (
    <section className="summary">

      <h2>Overview</h2>

      <div className="balance">
        <p>Current Balance</p>
        <h3>₹{balance.toLocaleString('en-IN')}</h3>
      </div>

      <div className="summary-cards">

        <div>
          <p>Income</p>
          <strong>
            ₹{income.toLocaleString('en-IN')}
          </strong>
        </div>

        <div>
          <p>Expense</p>
          <strong>
            ₹{expense.toLocaleString('en-IN')}
          </strong>
        </div>

      </div>

    </section>
  )
}

export default Summary