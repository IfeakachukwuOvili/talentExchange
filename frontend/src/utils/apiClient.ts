import axios from 'axios'

// Add TypeScript interfaces for better type safety
interface ServiceData {
  name: string
  description: string
  price: number
  duration: number
  category: string
  isActive?: boolean
  workingHours?: {
    [key: string]: {
      enabled: boolean
      start: string
      end: string
    }
  }
}

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to include token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Add request logging in development
    if (import.meta.env.DEV) {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
        data: config.data,
        params: config.params
      })
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor for consistent error handling
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Log error for debugging
    console.error('API Error:', error.response?.data || error.message)
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)


// Auth API calls - REWRITTEN to use apiClient
export const authAPI = {
  // Customer login
  login: async (email: string, password: string) => {
    // Use apiClient which automatically adds the correct /api prefix
    const response = await apiClient.post('/auth/login', { email, password })
    
    if (!response.data.token || !response.data.user) {
      throw new Error('Invalid login response from server')
    }
    
    return response.data
  },

  // Provider login
  providerLogin: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/provider/login', { email, password })
    
    if (!response.data.token || !response.data.user) {
      throw new Error('Invalid login response from server')
    }
    
    return response.data
  },
  
  register: async (name: string, email: string, password: string) => {
    const response = await apiClient.post('/auth/register', { name, email, password })
    return response.data
  },
  providerRegister: async (name: string, email: string, password: string) => {
    const response = await apiClient.post('/auth/provider/register', { name, email, password })
    return response.data
  }
}

// Services API calls
export const servicesAPI = {
  getServices: async (category?: string) => {
    const response = await apiClient.get('/services', { params: { category } })
    return response.data
  },
  
  getAvailableSlots: async (serviceId: string, date: string) => {
    // FIX: Use a template literal to correctly build the URL with the serviceId
    const response = await apiClient.get(`/services/${serviceId}/slots`, { params: { date } })
    return response.data
  }
}

// Bookings API calls
export const bookingsAPI = {
  createBooking: async (serviceId: string, date: string, startTime: string, notes?: string) => {
    const response = await apiClient.post('/bookings', { serviceId, date, startTime, notes })
    return response.data
  },
  
  getUserBookings: async () => {
    const response = await apiClient.get('/bookings')
    return response.data
  }
}

// Provider API calls
export const providerAPI = {
  getServices: async () => {
    const response = await apiClient.get('/provider/services')
    return response.data
  },
  
  createService: async (serviceData: ServiceData) => {
    const response = await apiClient.post('/provider/create-services', serviceData)
    
    if (response.data.success === false) {
      throw new Error(response.data.message || 'Failed to create service')
    }
    
    return response.data
  },
  
  updateService: async (serviceId: string, serviceData: Partial<ServiceData>) => {
    const response = await apiClient.put(`/provider/services/${serviceId}`, serviceData)
    
    if (response.data.success === false) {
      throw new Error(response.data.message || 'Failed to update service')
    }
    
    return response.data
  },
  
  deleteService: async (serviceId: string) => {
    const response = await apiClient.delete(`/provider/services/${serviceId}`)
    
    if (response.data.success === false) {
      throw new Error(response.data.message || 'Failed to delete service')
    }
    
    return response.data
  },
  
  getBookings: async () => {
    const response = await apiClient.get('/provider/bookings')
    return response.data
  }
}