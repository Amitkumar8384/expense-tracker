import { useState } from 'react'
import { apiUrl } from '../lib/api'
import {
  FaCircleCheck,
  FaCircleExclamation,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaIndianRupeeSign,
  FaLock,
  FaUser,
  FaUserShield,
} from './Icons'

function isStrongPassword(password) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  )
}

function Login({ onLogin }) {

  const [mode, setMode] = useState('login')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function switchMode(newMode) {
    setMode(newMode)

    setName('')
    setEmail('')
    setPassword('')

    setError('')
    setSuccess('')
  }

  async function handleSubmit(e) {

    e.preventDefault()

    setError('')
    setSuccess('')

    if (mode === 'signup' && name.trim().length < 2) {
      setError('Please enter your name')
      return
    }

    if (!email.trim()) {
      setError('Please enter your email')
      return
    }

    if (!password) {
      setError('Please enter your password')
      return
    }

    if (mode === 'signup' && !isStrongPassword(password)) {
      setError('Use 8+ characters with uppercase, lowercase, number and special character')
      return
    }

    setLoading(true)

    try {

      const endpoint =
        mode === 'login'
          ? '/api/auth/login'
          : '/api/auth/signup'

      const body =
        mode === 'login'
          ? {
              email: email.trim(),
              password
            }
          : {
              name: name.trim(),
              email: email.trim(),
              password
            }

      const response = await fetch(
        apiUrl(endpoint),
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(body)
        }
      )

      const contentType = response.headers.get('content-type') || ''
      const data = contentType.includes('application/json')
        ? await response.json()
        : { message: `Login service returned ${response.status}` }

      if (!response.ok) {
        throw new Error(
          data.message ||
          `${mode === 'login' ? 'Login' : 'Signup'} failed`
        )
      }

      // LOGIN
      if (mode === 'login') {

        onLogin(data.user)

        return
      }

      // SIGNUP SUCCESS
      setSuccess(
        'Account created successfully! You can now login.'
      )

      setMode('login')
      setName('')
      setPassword('')

    } catch (error) {

      console.error(error)

      setError(
        error.message ||
        'Something went wrong'
      )

    } finally {

      setLoading(false)

    }
  }

  return (

    <div className="auth-page">

      <div className="auth-intro" aria-hidden="true">

        <div className="auth-intro-mark"><FaIndianRupeeSign aria-hidden="true" /></div>

        <p className="auth-intro-kicker">PERSONAL FINANCE, SIMPLIFIED</p>

        <h2>See your money clearly.</h2>

        <p className="auth-intro-copy">
          Track income, understand spending and make better decisions from one calm dashboard.
        </p>

        <div className="auth-intro-points">
          <span><b>↗</b> Live balance overview</span>
          <span><b>◌</b> Clear monthly reports</span>
          <span><b><FaCircleCheck aria-hidden="true" /></b> Private and secure</span>
        </div>

      </div>

      <div className="auth-card">

        {/* BRAND */}

        <div className="auth-brand">

          <div className="auth-logo">
            <FaIndianRupeeSign aria-hidden="true" />
          </div>

          <h1>Expense Tracker</h1>

          <p>
            Manage your money. Track your future.
          </p>

        </div>


        {/* TABS */}

        <div className="auth-tabs">

          <button
            type="button"
            className={
              mode === 'login'
                ? 'active'
                : ''
            }
            onClick={() =>
              switchMode('login')
            }
          >
            Login
          </button>

          <button
            type="button"
            className={
              mode === 'signup'
                ? 'active'
                : ''
            }
            onClick={() =>
              switchMode('signup')
            }
          >
            Create Account
          </button>

        </div>


        {/* TITLE */}

        <div className="auth-heading">

          <h2>
            {mode === 'login'
              ? 'Welcome back 👋'
              : 'Create your account'}
          </h2>

          <p>
            {mode === 'login'
              ? 'Login to continue to your dashboard'
              : 'Start managing your expenses today'}
          </p>

        </div>


        {/* MESSAGES */}

        {error && (
          <div className="auth-message auth-error">
            <span><FaCircleExclamation aria-hidden="true" /></span>
            {error}
          </div>
        )}

        {success && (
          <div className="auth-message auth-success">
            <span><FaCircleCheck aria-hidden="true" /></span>
            {success}
          </div>
        )}


        {/* FORM */}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          {/* NAME */}

          {mode === 'signup' && (

            <div className="auth-field">

              <label htmlFor="name">
                Full Name
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  <FaUser aria-hidden="true" />
                </span>

                <input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  autoComplete="name"
                  disabled={loading}
                />

              </div>

            </div>

          )}


          {/* EMAIL */}

          <div className="auth-field">

            <label htmlFor="email">
              Email Address
            </label>

            <div className="input-wrapper">

              <span className="input-icon">
                <FaEnvelope aria-hidden="true" />
              </span>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                autoComplete="email"
                disabled={loading}
              />

            </div>

          </div>


          {/* PASSWORD */}

          <div className="auth-field">

            <label htmlFor="password">
              Password
            </label>

            <div className="input-wrapper">

              <span className="input-icon">
                <FaLock aria-hidden="true" />
              </span>

              <input
                id="password"
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                autoComplete={
                  mode === 'login'
                    ? 'current-password'
                    : 'new-password'
                }
                disabled={loading}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                disabled={loading}
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
              >
                {showPassword ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
              </button>

            </div>

            {mode === 'signup' && (
              <small>
                Use 8+ characters with uppercase, lowercase, number and special character.
              </small>
            )}

          </div>


          {/* SUBMIT */}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >

            {loading ? (
              <>
                <span className="auth-spinner"></span>

                {mode === 'login'
                  ? 'Logging in...'
                  : 'Creating account...'}
              </>
            ) : (
              mode === 'login'
                ? 'Login to Dashboard'
                : 'Create Account'
            )}

          </button>

        </form>


        {/* SWITCH */}

        <div className="auth-switch">

          {mode === 'login'
            ? "Don't have an account?"
            : 'Already have an account?'}

          <button
            type="button"
            onClick={() =>
              switchMode(
                mode === 'login'
                  ? 'signup'
                  : 'login'
              )
            }
          >
            {mode === 'login'
              ? 'Create account'
              : 'Login'}
          </button>

        </div>


        {/* FOOTER */}

        <div className="auth-footer">
          <FaUserShield aria-hidden="true" /> Your account is protected with secure authentication.
        </div>

      </div>

    </div>
  )
}

export default Login
