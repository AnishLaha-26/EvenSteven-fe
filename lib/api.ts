import axios from 'axios'
import { config } from './config'
import { User } from '../contexts/auth-context'

const API_BASE_URL = config.API_BASE_URL

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('API Request - Token added:', !!token)
      console.log('API Request - URL:', config.url)
    } else {
      console.warn('API Request - No token found')
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
            refresh: refreshToken,
          })

          const newAccessToken = response.data.access
          localStorage.setItem('accessToken', newAccessToken)

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// API functions
export const authAPI = {
  // Register user
  register: async (email: string, firstName: string, lastName: string, password: string, password2: string) => {
    const response = await api.post('/auth/register/', {
      email,
      first_name: firstName,
      last_name: lastName,
      password,
      password2,
    })
    return response.data
  },

  // Login user
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login/', {
      email,
      password,
    })
    const { access } = response.data
    localStorage.setItem('accessToken', access)
    return response.data
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile/')
    return response.data
  },

  // Update user profile
  updateProfile: async (data: any) => {
    const response = await api.patch('/auth/profile/', data)
    return response.data
  },

  // Logout user
  logout: async (refreshToken: string) => {
    const response = await api.post('/auth/logout/', {
      refresh: refreshToken,
    })
    return response.data
  },

  // Refresh token
  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/token/refresh/', {
      refresh: refreshToken,
    })
    return response.data
  },
}

// Group API functions
export interface Group {
  id: number
  name: string
  description: string
  currency: string
  join_code: string
  members: User[]
  member_count?: number
  last_updated?: string
  user_balance?: number
}

export interface UserGroup {
  id: number
  name: string
  description: string
  currency: string
  member_count: number
  last_updated: string
  user_balance: number
}

export interface GroupMember {
  user_id: number
}

export interface GroupJoin {
  join_code: string
}

export const groupAPI = {
  createGroup: async (data: Omit<Group, 'id' | 'join_code' | 'members'>): Promise<Group> => {
    try {
      // First try the expected endpoint
      const response = await api.post('/groups/', data)
      return response.data
    } catch (error: any) {
      // If we get "Method not allowed", the backend doesn't support this endpoint
      if (error.response?.status === 405) {
        throw new Error('The backend API does not support group creation yet. The /groups/ endpoint does not allow POST requests. Please check with the backend team to implement the groups API endpoints.')
      }
      // Re-throw other errors
      throw error
    }
  },

  joinGroup: async (groupId: number, data: GroupJoin): Promise<Group> => {
    const response = await api.post(`/groups/${groupId}/join/`, data)
    return response.data
  },

  addGroupMember: async (groupId: number, data: GroupMember): Promise<Group> => {
    const response = await api.post(`/groups/${groupId}/add_member/`, data)
    return response.data
  },

  // Get user's groups with balance information
  getUserGroups: async (): Promise<UserGroup[]> => {
    try {
      const response = await api.get('/groups/user-groups/')
      return response.data
    } catch (error: any) {
      // If endpoint doesn't exist, return mock data for now
      console.warn('User groups endpoint not available, using mock data')
      return [
        {
          id: 1,
          name: 'Weekend Trip',
          description: 'Trip to the mountains',
          currency: 'USD',
          member_count: 3,
          last_updated: '2024-01-13T10:00:00Z',
          user_balance: 45.00
        },
        {
          id: 2,
          name: 'Roommate Expenses',
          description: 'Shared apartment costs',
          currency: 'USD',
          member_count: 2,
          last_updated: '2024-01-06T15:30:00Z',
          user_balance: -12.50
        },
        {
          id: 3,
          name: 'Office Lunch 🍕',
          description: 'Team lunch orders',
          currency: 'USD',
          member_count: 5,
          last_updated: '2024-01-05T12:00:00Z',
          user_balance: 0.00
        }
      ]
    }
  },

  // Get specific group details
  getGroup: async (groupId: number): Promise<Group> => {
    const response = await api.get(`/groups/${groupId}/`)
    return response.data
  },
}

export default api
