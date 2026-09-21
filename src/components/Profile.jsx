import { useEffect, useState } from 'react'
import './profile.css'

const API_URL =
  'https://expense-tracker-c4xe.onrender.com/api/auth/profile'

const PASSWORD_API =
  'https://expense-tracker-c4xe.onrender.com/api/auth/change-password'

function Profile({
  user,
  onLogout,
  onBack
}) {

  const [profile, setProfile] =
    useState(user || null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  // ==========================================
  // PASSWORD STATES
  // ==========================================

  const [currentPassword, setCurrentPassword] =
    useState('')

  const [newPassword, setNewPassword] =
    useState('')

  const [confirmPassword, setConfirmPassword] =
    useState('')

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false)

  const [showNewPassword, setShowNewPassword] =
    useState(false)

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false)

  const [passwordLoading, setPasswordLoading] =
    useState(false)

  const [passwordError, setPasswordError] =
    useState('')

  const [passwordSuccess, setPasswordSuccess] =
    useState('')

  // ==========================================
  // FETCH PROFILE
  // ==========================================

  useEffect(() => {

    async function fetchProfile() {

      try {

        const token =
          localStorage.getItem('token')

        if (!token) {

          setError(
            'Session expired. Please login again.'
          )

          return
        }

        const response =
          await fetch(API_URL, {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          })

        if (!response.ok) {
          throw new Error(
            'Failed to load profile'
          )
        }

        const data =
          await response.json()

        setProfile(data.user)

      } catch (err) {

        console.error(err)

        setError(
          'Unable to load your profile.'
        )

      } finally {

        setLoading(false)

      }

    }

    fetchProfile()

  }, [])

  // ==========================================
  // INITIALS
  // ==========================================

  const getInitials = (name = '') => {

    const parts =
      name
        .trim()
        .split(/\s+/)
        .filter(Boolean)

    if (!parts.length) {
      return 'U'
    }

    if (parts.length === 1) {
      return parts[0]
        .slice(0, 2)
        .toUpperCase()
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`
      .toUpperCase()

  }

  // ==========================================
  // DATE
  // ==========================================

  const formatDate = (date) => {

    if (!date) {
      return '—'
    }

    const value =
      new Date(date)

    if (
      Number.isNaN(
        value.getTime()
      )
    ) {
      return '—'
    }

    return value.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    )

  }

  // ==========================================
  // PASSWORD STRENGTH
  // ==========================================

  const getPasswordStrength = () => {

    if (!newPassword) {

      return {
        score: 0,
        label: '',
        className: ''
      }

    }

    let score = 0

    if (newPassword.length >= 8) {
      score++
    }

    if (/[A-Z]/.test(newPassword)) {
      score++
    }

    if (/[a-z]/.test(newPassword)) {
      score++
    }

    if (/[0-9]/.test(newPassword)) {
      score++
    }

    if (/[^A-Za-z0-9]/.test(newPassword)) {
      score++
    }

    if (score <= 2) {

      return {
        score,
        label: 'Weak',
        className: 'weak'
      }

    }

    if (score <= 4) {

      return {
        score,
        label: 'Medium',
        className: 'medium'
      }

    }

    return {
      score,
      label: 'Strong',
      className: 'strong'
    }

  }

  const passwordStrength =
    getPasswordStrength()

  // ==========================================
  // CHANGE PASSWORD
  // ==========================================

  async function handleChangePassword(event) {

    event.preventDefault()

    setPasswordError('')
    setPasswordSuccess('')

    // ===============================
    // REQUIRED
    // ===============================

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {

      setPasswordError(
        'Please fill in all password fields.'
      )

      return
    }

    // ===============================
    // LENGTH
    // ===============================

    if (newPassword.length < 8) {

      setPasswordError(
        'New password must be at least 8 characters.'
      )

      return
    }

    // ===============================
    // STRENGTH
    // ===============================

    if (
      !/[A-Z]/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[^A-Za-z0-9]/.test(newPassword)
    ) {

      setPasswordError(
        'Use uppercase, lowercase, number and special character.'
      )

      return
    }

    // ===============================
    // CONFIRM PASSWORD
    // ===============================

    if (
      newPassword !== confirmPassword
    ) {

      setPasswordError(
        'New password and confirm password do not match.'
      )

      return
    }

    // ===============================
    // TOKEN
    // ===============================

    const token =
      localStorage.getItem('token')

    if (!token) {

      setPasswordError(
        'Session expired. Please login again.'
      )

      return
    }

    try {

      setPasswordLoading(true)

      const response =
        await fetch(
          PASSWORD_API,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`
            },

            body: JSON.stringify({
              currentPassword,
              newPassword
            })
          }
        )

      const data =
        await response.json()

      if (!response.ok) {

        throw new Error(
          data.message ||
          'Unable to change password'
        )

      }

      // ===============================
      // SUCCESS
      // ===============================

      setPasswordSuccess(
        'Password changed successfully.'
      )

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

    } catch (err) {

      console.error(err)

      setPasswordError(
        err.message ||
        'Unable to change password.'
      )

    } finally {

      setPasswordLoading(false)

    }

  }

  const displayUser =
    profile || user

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <section className="profile-page">

        <div className="profile-loading-card">

          <div className="profile-loader" />

          <h3>
            Loading profile
          </h3>

          <p>
            Please wait a moment...
          </p>

        </div>

      </section>

    )

  }

  // ==========================================
  // ERROR
  // ==========================================

  if (
    error &&
    !displayUser
  ) {

    return (

      <section className="profile-page">

        <div className="profile-error-card">

          <div className="profile-error-icon">
            !
          </div>

          <h2>
            Something went wrong
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            className="profile-back-btn"
            onClick={onBack}
          >
            ← Back to Dashboard
          </button>

        </div>

      </section>

    )

  }

  return (

    <section className="profile-page">

      {/* ======================================
          TOP BAR
      ====================================== */}

      <div className="profile-topbar">

        <button
          type="button"
          className="profile-back-btn"
          onClick={onBack}
        >
          ← Dashboard
        </button>

        <span className="profile-page-label">
          Account Settings
        </span>

      </div>

      {/* ======================================
          PROFILE HERO
      ====================================== */}

      <div className="profile-hero">

        <div className="profile-hero-glow" />

        <div className="profile-avatar-large">
          {getInitials(
            displayUser?.name
          )}
        </div>

        <div className="profile-identity">

          <div className="profile-name-row">

            <h1>
              {displayUser?.name || 'User'}
            </h1>

            <span className="profile-verified">
              ✓ Verified
            </span>

          </div>

          <p>
            {displayUser?.email ||
              'No email available'}
          </p>

          <div className="profile-member">

            <span className="profile-status-dot" />

            Active account

          </div>

        </div>

      </div>

      {/* ======================================
          PROFILE GRID
      ====================================== */}

      <div className="profile-grid">

        {/* ====================================
            ACCOUNT INFORMATION
        ==================================== */}

        <div className="profile-main-card">

          <div className="profile-section-heading">

            <div>

              <span className="profile-eyebrow">
                PERSONAL
              </span>

              <h2>
                Account information
              </h2>

              <p>
                Your basic account details
              </p>

            </div>

          </div>

          <div className="profile-details">

            <div className="profile-detail">

              <div className="profile-detail-icon">
                👤
              </div>

              <div>

                <span>
                  Full name
                </span>

                <strong>
                  {displayUser?.name || '—'}
                </strong>

              </div>

            </div>

            <div className="profile-detail">

              <div className="profile-detail-icon">
                ✉
              </div>

              <div>

                <span>
                  Email address
                </span>

                <strong>
                  {displayUser?.email || '—'}
                </strong>

              </div>

            </div>

            <div className="profile-detail">

              <div className="profile-detail-icon">
                #
              </div>

              <div>

                <span>
                  Account ID
                </span>

                <strong>
                  #{displayUser?.id || '—'}
                </strong>

              </div>

            </div>

            <div className="profile-detail">

              <div className="profile-detail-icon">
                ◷
              </div>

              <div>

                <span>
                  Member since
                </span>

                <strong>
                  {formatDate(
                    displayUser?.created_at
                  )}
                </strong>

              </div>

            </div>

          </div>

        </div>

        {/* ====================================
            SECURITY CARD
        ==================================== */}

        <aside className="profile-side-card">

          <div className="profile-side-icon">
            🔐
          </div>

          <span className="profile-eyebrow">
            SECURITY
          </span>

          <h2>
            Your account is protected
          </h2>

          <p>
            Your account uses secure authentication
            and protected API access.
          </p>

          <div className="profile-security-row">

            <span>

              <i className="profile-security-dot" />

              Authentication

            </span>

            <strong>
              Secure
            </strong>

          </div>

          <div className="profile-security-row">

            <span>

              <i className="profile-security-dot" />

              Session

            </span>

            <strong>
              Protected
            </strong>

          </div>

        </aside>

      </div>

      {/* ======================================
          CHANGE PASSWORD
      ====================================== */}

      <div className="profile-password-card">

        <div className="profile-password-header">

          <div>

            <span className="profile-eyebrow">
              PASSWORD
            </span>

            <h2>
              Change your password
            </h2>

            <p>
              Update your password to keep your
              account secure.
            </p>

          </div>

          <div className="profile-password-icon">
            🔑
          </div>

        </div>

        {passwordError && (

          <div className="password-message password-message-error">
            <span>!</span>
            {passwordError}
          </div>

        )}

        {passwordSuccess && (

          <div className="password-message password-message-success">
            <span>✓</span>
            {passwordSuccess}
          </div>

        )}

        <form
          className="password-form"
          onSubmit={handleChangePassword}
        >

          {/* CURRENT PASSWORD */}

          <div className="password-field">

            <label>
              Current password
            </label>

            <div className="password-input-wrapper">

              <span className="password-field-icon">
                🔒
              </span>

              <input
                type={
                  showCurrentPassword
                    ? 'text'
                    : 'password'
                }
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(
                    event.target.value
                  )
                }
                placeholder="Enter current password"
                autoComplete="current-password"
              />

              <button
                type="button"
                className="password-show-btn"
                onClick={() =>
                  setShowCurrentPassword(
                    value => !value
                  )
                }
                aria-label={
                  showCurrentPassword
                    ? 'Hide password'
                    : 'Show password'
                }
              >
                {showCurrentPassword
                  ? '🙈'
                  : '👁️'}
              </button>

            </div>

          </div>

          {/* NEW PASSWORD */}

          <div className="password-field">

            <label>
              New password
            </label>

            <div className="password-input-wrapper">

              <span className="password-field-icon">
                🔑
              </span>

              <input
                type={
                  showNewPassword
                    ? 'text'
                    : 'password'
                }
                value={newPassword}
                onChange={(event) => {

                  setNewPassword(
                    event.target.value
                  )

                  setPasswordError('')
                  setPasswordSuccess('')

                }}
                placeholder="Enter new password"
                autoComplete="new-password"
              />

              <button
                type="button"
                className="password-show-btn"
                onClick={() =>
                  setShowNewPassword(
                    value => !value
                  )
                }
                aria-label={
                  showNewPassword
                    ? 'Hide password'
                    : 'Show password'
                }
              >
                {showNewPassword
                  ? '🙈'
                  : '👁️'}
              </button>

            </div>

            {newPassword && (

              <div className="password-strength">

                <div className="password-strength-top">

                  <span>
                    Password strength
                  </span>

                  <strong
                    className={
                      passwordStrength.className
                    }
                  >
                    {passwordStrength.label}
                  </strong>

                </div>

                <div className="password-strength-bars">

                  {[1, 2, 3, 4, 5].map(
                    (item) => (

                      <span
                        key={item}
                        className={
                          item <=
                          passwordStrength.score
                            ? passwordStrength.className
                            : ''
                        }
                      />

                    )
                  )}

                </div>

              </div>

            )}

          </div>

          {/* CONFIRM PASSWORD */}

          <div className="password-field">

            <label>
              Confirm new password
            </label>

            <div className="password-input-wrapper">

              <span className="password-field-icon">
                🔐
              </span>

              <input
                type={
                  showConfirmPassword
                    ? 'text'
                    : 'password'
                }
                value={confirmPassword}
                onChange={(event) => {

                  setConfirmPassword(
                    event.target.value
                  )

                  setPasswordError('')
                  setPasswordSuccess('')

                }}
                placeholder="Confirm new password"
                autoComplete="new-password"
              />

              <button
                type="button"
                className="password-show-btn"
                onClick={() =>
                  setShowConfirmPassword(
                    value => !value
                  )
                }
                aria-label={
                  showConfirmPassword
                    ? 'Hide password'
                    : 'Show password'
                }
              >
                {showConfirmPassword
                  ? '🙈'
                  : '👁️'}
              </button>

            </div>

          </div>

          {/* REQUIREMENTS */}

          <div className="password-requirements">

            <p>
              Password requirements
            </p>

            <div className="password-requirement-grid">

              <span
                className={
                  newPassword.length >= 8
                    ? 'valid'
                    : ''
                }
              >
                {newPassword.length >= 8
                  ? '✓'
                  : '○'}
                At least 8 characters
              </span>

              <span
                className={
                  /[A-Z]/.test(newPassword)
                    ? 'valid'
                    : ''
                }
              >
                {/[A-Z]/.test(newPassword)
                  ? '✓'
                  : '○'}
                Uppercase letter
              </span>

              <span
                className={
                  /[a-z]/.test(newPassword)
                    ? 'valid'
                    : ''
                }
              >
                {/[a-z]/.test(newPassword)
                  ? '✓'
                  : '○'}
                Lowercase letter
              </span>

              <span
                className={
                  /[0-9]/.test(newPassword)
                    ? 'valid'
                    : ''
                }
              >
                {/[0-9]/.test(newPassword)
                  ? '✓'
                  : '○'}
                Number
              </span>

              <span
                className={
                  /[^A-Za-z0-9]/.test(newPassword)
                    ? 'valid'
                    : ''
                }
              >
                {/[^A-Za-z0-9]/.test(newPassword)
                  ? '✓'
                  : '○'}
                Special character
              </span>

            </div>

          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            className="change-password-btn"
            disabled={passwordLoading}
          >

            {passwordLoading ? (
              <>
                <span className="password-btn-spinner" />
                Updating...
              </>
            ) : (
              <>
                🔐
                Update Password
              </>
            )}

          </button>

        </form>

      </div>

      {/* ======================================
          LOGOUT
      ====================================== */}

      <div className="profile-account-card">

        <div>

          <span className="profile-eyebrow">
            ACCOUNT
          </span>

          <h2>
            Sign out of your account
          </h2>

          <p>
            You can login again anytime with your
            account credentials.
          </p>

        </div>

        <button
          type="button"
          className="profile-logout-btn"
          onClick={onLogout}
        >

          <span>↪</span>

          Logout

        </button>

      </div>

      {error && (

        <p className="profile-soft-error">
          {error}
        </p>

      )}

    </section>

  )

}

export default Profile