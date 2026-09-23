const configuredApiUrl = import.meta.env.VITE_API_URL

export const API_BASE_URL = (configuredApiUrl || (
  import.meta.env.DEV ? 'http://localhost:5000' : ''
))
  .replace(/\/$/, '')

export const apiUrl = (path) => `${API_BASE_URL}${path}`

export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
