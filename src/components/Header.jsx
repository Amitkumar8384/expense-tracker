function Header({ theme, onToggleTheme }) {
  return (
    <header className="app-header">
      <div className="app-header-copy">
        <h1>Expense Tracker</h1>
        <p>Track your income and expenses</p>
      </div>
      <button
        type="button"
        className="theme-toggle-btn"
        onClick={onToggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        aria-pressed={theme === 'dark'}
      >
        <span className={`theme-mode-label ${theme === 'light' ? 'is-active' : ''}`} aria-hidden="true">
          LIGHT MODE
        </span>
        <span className="theme-toggle-track" aria-hidden="true">
          <span className="theme-toggle-thumb" />
        </span>
        <span className={`theme-mode-label ${theme === 'dark' ? 'is-active' : ''}`} aria-hidden="true">
          DARK MODE
        </span>
      </button>
    </header>
  )
}

export default Header