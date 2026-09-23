import { useState } from 'react'

function ExpenseForm({ onAddExpense }) {

  const [title, setTitle] = useState('')

  const [amount, setAmount] = useState('')

  const [type, setType] = useState('expense')

  const [category, setCategory] = useState('Food')
  const [isSaving, setIsSaving] = useState(false)


  async function handleSubmit(e) {

    e.preventDefault()


    // Validation

    if (!title.trim()) {
      alert('Please enter a title')
      return
    }


    if (!amount || Number(amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }


    // Send data to App

    setIsSaving(true)

    try {
      const saved = await onAddExpense(
        title.trim(),
        amount,
        type,
        category
      )

      if (!saved) return

      setTitle('')

      setAmount('')

      setType('expense')

      setCategory('Food')
    } finally {
      setIsSaving(false)
    }
  }


  return (

    <section>

      <h2>Add Transaction</h2>


      <form onSubmit={handleSubmit}>


        {/* Title */}

        <label className="sr-only" htmlFor="transaction-title">Transaction title</label>
        <input
          id="transaction-title"
          type="text"
          placeholder="Transaction title"
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          disabled={isSaving}
          required
        />


        {/* Amount */}

        <label className="sr-only" htmlFor="transaction-amount">Amount</label>
        <input
          id="transaction-amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) =>
            setAmount(e.target.value)
          }
          disabled={isSaving}
          required
        />


        {/* Type */}

        <label className="sr-only" htmlFor="transaction-type">Type</label>
        <select
          id="transaction-type"
          value={type}
          onChange={(e) =>
            setType(e.target.value)
          }
          disabled={isSaving}
        >

          <option value="expense">
            Expense
          </option>

          <option value="income">
            Income
          </option>

        </select>


        {/* Category */}

        <label className="sr-only" htmlFor="transaction-category">Category</label>
        <select
          id="transaction-category"
          value={category}
          onChange={(e) =>
            setCategory(e.target.value)
          }
          disabled={isSaving}
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


        {/* Submit */}

        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Add Transaction'}
        </button>

      </form>

    </section>

  )
}

export default ExpenseForm
