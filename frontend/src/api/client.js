/**
 * Axios instance with automatic token refresh interceptor.
 *
 * Security notes for viva:
 * - Access token stored in memory (module-level variable), NOT localStorage.
 *   localStorage is accessible to any JS on the page, including injected
 *   scripts (XSS). Memory storage limits the blast radius of XSS attacks.
 * - Refresh token is sent in the Authorization header (not a cookie here)
 *   because we're calling our own API. In a stricter setup you'd use an
 *   HttpOnly cookie to prevent JS access entirely.
 * - The 401 interceptor retries the original request with a fresh access
 *   token automatically — transparent to calling code.
 */

import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

// ── In-memory token store ─────────────────────────────────────────────────
let accessToken = null
let refreshToken = localStorage.getItem('st_refresh') // refresh can live in localStorage

export function setTokens(access, refresh) {
  accessToken = access
  if (refresh) {
    refreshToken = refresh
    localStorage.setItem('st_refresh', refresh)
  }
}

export function clearTokens() {
  accessToken = null
  refreshToken = null
  localStorage.removeItem('st_refresh')
}

export function getAccessToken() { return accessToken }
export function getRefreshToken() { return refreshToken }

// ── Axios instance ────────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
})

// Attach access token to every request
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Transparent refresh on 401
let isRefreshing = false
let failedQueue = []

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        })
        const newAccess = data.access_token
        setTokens(newAccess, null)
        processQueue(null, newAccess)
        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearTokens()
        window.dispatchEvent(new Event('auth:logout'))
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)
