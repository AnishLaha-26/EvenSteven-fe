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
    console.log('🔐 API Request Interceptor:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : null
    })
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('✅ Authorization header added')
    } else {
      console.warn('⚠️ No access token found in localStorage')
      console.log('Available localStorage keys:', Object.keys(localStorage))
    }
    return config
  },
  (error) => {
    console.error('❌ Request interceptor error:', error)
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
export interface GroupMember {
  id: number
  user: {
    id: number
    email: string
    name?: string
    first_name?: string
    last_name?: string
  }
  role: 'admin' | 'member'
  status: 'active' | 'pending'
  balance: number
  joined_at: string
}

export interface Group {
  id: number
  name: string
  description: string
  currency: string
  join_code: string
  members: GroupMember[]
  memberships?: GroupMember[]
  created_by?: {
    id: number
    email: string
    name: string
  }
  status?: string
  created_at?: string
  updated_at?: string
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

export interface GroupJoin {
  join_code: string
}

export interface Transaction {
  id: number
  description: string
  amount: number
  currency: string
  paid_by: {
    id: number
    first_name: string
    last_name: string
    email: string
  }
  created_at: string
  category?: string
}

export interface GroupMemberDetail {
  id: number
  user: {
    id: number
    first_name: string
    last_name: string
    email: string
  }
  group: number
  role: 'admin' | 'member'
  joined_at: string
  is_active: boolean
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

  // Join group by join code (finds group first, then joins)
  joinGroupByCode: async (joinCode: string): Promise<Group> => {
    try {
      console.log('🔍 Step 1: Finding group with join code:', joinCode)
      // First, try to find the group by join code using query parameter
      const findResponse = await api.get(`/groups/?join_code=${joinCode}`)
      console.log('📡 Find group response:', {
        status: findResponse.status,
        data: findResponse.data,
        isArray: Array.isArray(findResponse.data),
        length: Array.isArray(findResponse.data) ? findResponse.data.length : 'not array'
      })
      
      // Check if any groups were found
      if (!findResponse.data || (Array.isArray(findResponse.data) && findResponse.data.length === 0)) {
        throw new Error('Group not found with the provided join code')
      }
      
      // Get the group (assuming the API returns an array or single group)
      const group = Array.isArray(findResponse.data) ? findResponse.data[0] : findResponse.data
      console.log('🎯 Found group:', {
        id: group?.id,
        name: group?.name,
        hasId: !!group?.id,
        keys: Object.keys(group || {})
      })
      
      if (!group || !group.id) {
        throw new Error('Invalid group data received')
      }
      
      console.log('🔗 Step 2: Joining group with ID:', group.id)
      // Now join the group using the group ID
      const joinResponse = await api.post(`/groups/${group.id}/join/`, { join_code: joinCode })
      console.log('📡 Join group response:', {
        status: joinResponse.status,
        data: joinResponse.data,
        hasId: !!joinResponse.data?.id,
        keys: Object.keys(joinResponse.data || {})
      })
      
      // The join response might not include the full group data with ID
      // So we return the group data we found in step 1, which has the ID
      console.log('✅ Using group data from find step (has ID):', group.id)
      return group
      
    } catch (error: any) {
      console.error('Error in joinGroupByCode:', error)
      
      // Handle specific error cases
      if (error.message.includes('Group not found')) {
        throw error // Re-throw our custom error
      }
      
      if (error.response?.status === 404) {
        throw new Error('Group not found with the provided join code')
      }
      
      if (error.response?.status === 400) {
        // Handle specific 400 error messages from backend
        const errorData = error.response?.data
        if (errorData?.error === 'Join code is required') {
          throw new Error('Join code is required')
        } else if (errorData?.error === 'Invalid join code') {
          throw new Error('Invalid join code')
        } else if (errorData?.error === 'Already a member of this group') {
          throw new Error('Already a member of this group')
        } else {
          throw new Error('Invalid join code or you are already a member of this group')
        }
      }
      
      if (error.response?.status === 401) {
        throw new Error('You must be logged in to join a group')
      }
      
      throw new Error('Failed to join group. Please try again later.')
    }
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

  // Get recent transactions for a group
  getRecentTransactions: async (groupId: number): Promise<Transaction[]> => {
    try {
      const response = await api.get(`/groups/${groupId}/recent-transactions/`)
      return response.data
    } catch (error: any) {
      // If endpoint doesn't exist, return empty array (no placeholder data)
      console.warn('Recent transactions endpoint not available')
      return []
    }
  },

  // Update group details
  updateGroup: async (groupId: number, data: Partial<Omit<Group, 'id' | 'join_code' | 'members'>>): Promise<Group> => {
    const response = await api.put(`/groups/${groupId}/`, data)
    return response.data
  },

  // Partially update group details
  patchGroup: async (groupId: number, data: Partial<Omit<Group, 'id' | 'join_code' | 'members'>>): Promise<Group> => {
    const response = await api.patch(`/groups/${groupId}/`, data)
    return response.data
  },

  // Delete group
  deleteGroup: async (groupId: number): Promise<void> => {
    await api.delete(`/groups/${groupId}/`)
  },

  // Remove member from group (admin only)
  removeGroupMember: async (groupId: number, userId: number): Promise<void> => {
    await api.post(`/groups/${groupId}/remove_member/`, { user_id: userId })
  },

  // Leave group (for current user)
  leaveGroup: async (groupId: number): Promise<void> => {
    await api.post(`/groups/${groupId}/leave_group/`)
  },

  // Get group members
  getGroupMembers: async (): Promise<any[]> => {
    try {
      const response = await api.get('/groups/group-members/')
      return response.data
    } catch (error: any) {
      console.warn('Group members endpoint not available')
      return []
    }
  },

  // Get detailed info of user's groups
  getUserGroupsInfo: async (): Promise<UserGroup[]> => {
    try {
      const response = await api.get('/groups/user-groups-info/')
      return response.data
    } catch (error: any) {
      console.warn('User groups info endpoint not available, falling back to user-groups')
      return await groupAPI.getUserGroups()
    }
  },
}

export default api
