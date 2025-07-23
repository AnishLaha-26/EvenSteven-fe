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

export interface TransactionUser {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
  name?: string
}

export interface Transaction {
  id: number
  description: string
  amount: string
  payer: TransactionUser
  participants: TransactionUser[]
  category: string
  date: string
  status: string
  created_at: string
  updated_at: string
  currency?: string
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

// Balance summary interfaces
export interface BalanceSummaryMember {
  id: number
  user: {
    id: number
    first_name: string
    last_name: string
    email: string
    name?: string
  }
  is_current_user: boolean
  balance_with_you: number
  status: 'owes_you' | 'you_owe' | 'settled' | 'you'
  role: 'admin' | 'member'
}

export interface BalanceSummary {
  group_id: number
  group_name: string
  currency: string
  net_balance: number
  members: BalanceSummaryMember[]
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

  // Get balance summary for a group
  getBalanceSummary: async (groupId: number): Promise<BalanceSummary> => {
    try {
      const response = await api.get(`/groups/${groupId}/balance-summary/`)
      const backendData = response.data
      
      // Transform backend response to match frontend interface
      const transformedData: BalanceSummary = {
        group_id: backendData.group_id,
        group_name: backendData.group_name,
        currency: backendData.currency,
        net_balance: parseFloat(backendData.your_net_balance),
        members: backendData.members
          .filter((member: any) => !member.is_current_user) // Filter out current user
          .map((member: any) => {
            // Parse the user name to extract first and last name
            const nameParts = member.user_name ? member.user_name.split(' ') : []
            const firstName = nameParts[0] || ''
            const lastName = nameParts.slice(1).join(' ') || ''
            
            return {
              id: member.user_id,
              user: {
                id: member.user_id,
                first_name: firstName,
                last_name: lastName,
                email: member.user_email,
                name: member.user_name
              },
              is_current_user: member.is_current_user,
              balance_with_you: parseFloat(member.balance_with_you),
              status: member.status,
              role: 'member' // Default role since backend doesn't provide this yet
            }
          })
      }
      
      console.log('✅ Transformed balance summary data:', transformedData)
      return transformedData
      
    } catch (error: any) {
      console.warn('Balance summary endpoint not available, using mock data')
      // Return mock data for development
      return {
        group_id: groupId,
        group_name: 'Mock Group',
        currency: 'USD',
        net_balance: 15.50,
        members: [
          {
            id: 2,
            user: {
              id: 2,
              first_name: 'Alice',
              last_name: 'Johnson',
              email: 'alice@example.com',
              name: 'Alice Johnson'
            },
            is_current_user: false,
            balance_with_you: 25.00,
            status: 'owes_you',
            role: 'member'
          },
          {
            id: 3,
            user: {
              id: 3,
              first_name: 'Bob',
              last_name: 'Smith',
              email: 'bob@example.com',
              name: 'Bob Smith'
            },
            is_current_user: false,
            balance_with_you: -15.00,
            status: 'you_owe',
            role: 'member'
          },
          {
            id: 4,
            user: {
              id: 4,
              first_name: 'Charlie',
              last_name: 'Brown',
              email: 'charlie@example.com',
              name: 'Charlie Brown'
            },
            is_current_user: false,
            balance_with_you: 0.00,
            status: 'settled',
            role: 'admin'
          }
        ]
      }
    }
  },
}

// Expense API functions
export interface ExpenseData {
  title: string
  amount: string
  paid_by: number
  date: string
  currency: string
}

export interface SplitData {
  user_id: number
  amount: number
  percentage?: number
}

export interface CreateExpensePayload {
  group: number  // Changed from group_id to group to match backend requirements
  description: string
  amount: string
  paid_by: number
  currency: string
  date: string
  splits: SplitData[]  // Made required since frontend always provides this
}

export interface Expense {
  id: number
  group_id: number
  description: string
  amount: number
  currency: string
  paid_by: {
    id: number
    first_name: string
    last_name: string
    email: string
  }
  date: string
  created_at: string
  splits?: SplitData[]
}

export const expenseAPI = {
  // Create new expense
  createExpense: async (data: CreateExpensePayload): Promise<Expense> => {
    try {
      console.log('🔄 Creating expense with data:', data)
      const response = await api.post('/expenses/', data)
      console.log('✅ Expense created successfully:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ Error creating expense:', error.response?.data || error.message)
      throw error
    }
  },

  // Get expenses for a group
  getGroupExpenses: async (groupId: number): Promise<Expense[]> => {
    try {
      const response = await api.get(`/groups/${groupId}/expenses/`)
      return response.data
    } catch (error: any) {
      console.warn('Group expenses endpoint not available, using mock data')
      return []
    }
  },

  // Get specific expense details
  getExpense: async (expenseId: number): Promise<Expense> => {
    try {
      const response = await api.get(`/expenses/${expenseId}/`)
      return response.data
    } catch (error: any) {
      console.error('Error fetching expense:', error)
      throw error
    }
  },

  // Update expense
  updateExpense: async (expenseId: number, data: Partial<CreateExpensePayload>): Promise<Expense> => {
    try {
      const response = await api.patch(`/expenses/${expenseId}/`, data)
      return response.data
    } catch (error: any) {
      console.error('Error updating expense:', error)
      throw error
    }
  },

  // Delete expense
  deleteExpense: async (expenseId: number): Promise<void> => {
    try {
      await api.delete(`/expenses/${expenseId}/`)
    } catch (error: any) {
      console.error('Error deleting expense:', error)
      throw error
    }
  },
}

// Payment API interfaces
export interface PaymentUser {
  id: number
  email: string
  first_name?: string
  last_name?: string
  name?: string
}

export interface Payment {
  id: number
  from_user: number
  from_user_email: string
  from_user_name: string
  to_user: number
  to_user_email: string
  to_user_name: string
  to_user_email_input?: string
  group?: number
  group_name?: string
  amount: number
  currency: string
  description?: string
  payment_date: string
  created_at: string
  updated_at: string
  is_current_user_sender: boolean
  is_current_user_receiver: boolean
  formatted_amount: string
  days_ago: number
}

export interface CreatePaymentPayload {
  from_user?: number
  to_user?: number
  to_user_email_input?: string
  group?: number
  amount: number
  currency?: string
  description?: string
  payment_date?: string
}

export interface PaymentStatistics {
  total_paid: number
  total_received: number
  payment_count_made: number
  payment_count_received: number
  recent_payments_made: number
  recent_payments_received: number
  net_balance: number
  currency_breakdown: {
    currency: string
    total_amount: number
    count: number
  }[]
}

export interface GroupPaymentSummary {
  group_id: number
  group_name: string
  member_balances: {
    user_id: number
    user_email: string
    user_name: string
    total_paid: number
    total_owed: number
    payments_made: number
    payments_received: number
    net_balance: number
  }[]
  total_expenses: number
  total_payments: number
  settlement_suggestions: {
    from_user_id: number
    from_user_name: string
    to_user_id: number
    to_user_name: string
    amount: number
  }[]
}

export interface PaymentFilters {
  group_id?: number
  date_from?: string
  date_to?: string
  amount_min?: number
  amount_max?: number
  search?: string
  ordering?: string
  page?: number
  page_size?: number
}

// Payment API functions
export const paymentAPI = {
  // Create new payment
  createPayment: async (data: CreatePaymentPayload): Promise<Payment> => {
    try {
      console.log('🔄 Creating payment with data:', data)
      const response = await api.post('/expenses/payments/', data)
      console.log('✅ Payment created successfully:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ Error creating payment:', error.response?.data || error.message)
      throw error
    }
  },

  // Get all payments for the current user
  getPayments: async (filters?: PaymentFilters): Promise<{ results: Payment[], count: number, next?: string, previous?: string }> => {
    try {
      const params = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString())
          }
        })
      }
      
      const url = `/expenses/payments/${params.toString() ? '?' + params.toString() : ''}`
      console.log('🔄 Fetching payments from:', url)
      const response = await api.get(url)
      console.log('✅ Payments fetched successfully:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ Error fetching payments:', error.response?.data || error.message)
      // Return mock data for development
      return {
        results: [
          {
            id: 1,
            from_user: 1,
            from_user_email: 'user@example.com',
            from_user_name: 'Current User',
            to_user: 2,
            to_user_email: 'alice@example.com',
            to_user_name: 'Alice Johnson',
            group: 1,
            group_name: 'Sample Group',
            amount: 25.50,
            currency: 'USD',
            description: 'Lunch payment',
            payment_date: '2024-01-15',
            created_at: '2024-01-15T12:00:00Z',
            updated_at: '2024-01-15T12:00:00Z',
            is_current_user_sender: true,
            is_current_user_receiver: false,
            formatted_amount: '25.50 USD',
            days_ago: 5
          },
          {
            id: 2,
            from_user: 3,
            from_user_email: 'bob@example.com',
            from_user_name: 'Bob Smith',
            to_user: 1,
            to_user_email: 'user@example.com',
            to_user_name: 'Current User',
            group: 1,
            group_name: 'Sample Group',
            amount: 15.00,
            currency: 'USD',
            description: 'Movie tickets',
            payment_date: '2024-01-10',
            created_at: '2024-01-10T18:30:00Z',
            updated_at: '2024-01-10T18:30:00Z',
            is_current_user_sender: false,
            is_current_user_receiver: true,
            formatted_amount: '15.00 USD',
            days_ago: 10
          }
        ],
        count: 2,
        next: undefined,
        previous: undefined
      }
    }
  },

  // Get specific payment details
  getPayment: async (paymentId: number): Promise<Payment> => {
    try {
      console.log('🔄 Fetching payment:', paymentId)
      const response = await api.get(`/expenses/payments/${paymentId}/`)
      console.log('✅ Payment fetched successfully:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ Error fetching payment:', error.response?.data || error.message)
      throw error
    }
  },

  // Update payment
  updatePayment: async (paymentId: number, data: Partial<CreatePaymentPayload>): Promise<Payment> => {
    try {
      console.log('🔄 Updating payment:', paymentId, data)
      const response = await api.patch(`/expenses/payments/${paymentId}/`, data)
      console.log('✅ Payment updated successfully:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ Error updating payment:', error.response?.data || error.message)
      throw error
    }
  },

  // Delete payment
  deletePayment: async (paymentId: number): Promise<void> => {
    try {
      console.log('🔄 Deleting payment:', paymentId)
      await api.delete(`/expenses/payments/${paymentId}/`)
      console.log('✅ Payment deleted successfully')
    } catch (error: any) {
      console.error('❌ Error deleting payment:', error.response?.data || error.message)
      throw error
    }
  },

  // Get payments for a specific group
  getGroupPayments: async (groupId: number, filters?: Omit<PaymentFilters, 'group_id'>): Promise<{ results: Payment[], count: number, next?: string, previous?: string }> => {
    try {
      const params = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString())
          }
        })
      }
      
      const url = `/expenses/payments/group/${groupId}/${params.toString() ? '?' + params.toString() : ''}`
      console.log('🔄 Fetching group payments from:', url)
      const response = await api.get(url)
      console.log('✅ Group payments fetched successfully:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ Error fetching group payments:', error.response?.data || error.message)
      // Return mock data for development
      return {
        results: [],
        count: 0,
        next: undefined,
        previous: undefined
      }
    }
  },

  // Get payment statistics
  getPaymentStatistics: async (): Promise<PaymentStatistics> => {
    try {
      console.log('🔄 Fetching payment statistics')
      const response = await api.get('/expenses/payments/statistics/')
      console.log('✅ Payment statistics fetched successfully:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ Error fetching payment statistics:', error.response?.data || error.message)
      // Return mock data for development
      return {
        total_paid: 150.75,
        total_received: 89.25,
        payment_count_made: 8,
        payment_count_received: 5,
        recent_payments_made: 3,
        recent_payments_received: 2,
        net_balance: -61.50,
        currency_breakdown: [
          { currency: 'USD', total_amount: 200.00, count: 10 },
          { currency: 'EUR', total_amount: 40.00, count: 3 }
        ]
      }
    }
  },

  // Get group payment summary with settlement suggestions
  getGroupPaymentSummary: async (groupId: number): Promise<GroupPaymentSummary> => {
    try {
      console.log('🔄 Fetching group payment summary for group:', groupId)
      const response = await api.get(`/expenses/payments/group/${groupId}/summary/`)
      console.log('✅ Group payment summary fetched successfully:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ Error fetching group payment summary:', error.response?.data || error.message)
      // Return mock data for development
      return {
        group_id: groupId,
        group_name: 'Sample Group',
        member_balances: [
          {
            user_id: 1,
            user_email: 'user@example.com',
            user_name: 'Current User',
            total_paid: 100.00,
            total_owed: 75.00,
            payments_made: 50.00,
            payments_received: 25.00,
            net_balance: 0.00
          },
          {
            user_id: 2,
            user_email: 'alice@example.com',
            user_name: 'Alice Johnson',
            total_paid: 50.00,
            total_owed: 50.00,
            payments_made: 25.00,
            payments_received: 50.00,
            net_balance: 25.00
          }
        ],
        total_expenses: 200.00,
        total_payments: 100.00,
        settlement_suggestions: [
          {
            from_user_id: 1,
            from_user_name: 'Current User',
            to_user_id: 2,
            to_user_name: 'Alice Johnson',
            amount: 25.00
          }
        ]
      }
    }
  },
}

export default api