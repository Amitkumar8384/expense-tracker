import { FaEye, FaEyeSlash } from './Icons'

function PasswordVisibilityButton({ visible, onClick, className, disabled = false }) {
  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
      aria-label={visible ? 'Hide password' : 'Show password'}
      aria-pressed={visible}
    >
      {visible ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
    </button>
  )
}

export default PasswordVisibilityButton
