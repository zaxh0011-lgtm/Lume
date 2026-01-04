import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://backend-nine-pi-24.vercel.app/api'

const api = axios.create({
  baseURL: API_BASE_URL,
})

//adding token to request automatically

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export { api }