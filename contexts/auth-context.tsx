"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI } from '@/lib/api'

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, firstName: string, lastName: string, password: string, password2: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check if user is authenticated on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken')
      if (token) {
        try {
          const userData = await authAPI.getProfile()
          setUser(userData)
        } catch (error) {
          // Token might be expired, try to refresh
          const refreshToken = localStorage.getItem('refreshToken')
          if (refreshToken) {
            try {
              await authAPI.refreshToken(refreshToken)
              const userData = await authAPI.getProfile()
              setUser(userData)
            } catch (refreshError) {
              // Refresh failed, clear tokens
              localStorage.removeItem('accessToken')
              localStorage.removeItem('refreshToken')
            }
          }
        }
      }
      setLoading(false)
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password)
      
      // Store tokens
      localStorage.setItem('accessToken', response.access)
      localStorage.setItem('refreshToken', response.refresh)
      
      // Set user data
      setUser(response.user)
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed')
    }
  }

  const register = async (email: string, firstName: string, lastName: string, password: string, password2: string) => {
    try {
      const response = await authAPI.register(email, firstName, lastName, password, password2)
      
      // Store tokens
      localStorage.setItem('accessToken', response.access)
      localStorage.setItem('refreshToken', response.refresh)
      
      // Set user data
      setUser(response.user)
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error: any) {
      if (error.response?.data?.email) {
        throw new Error(error.response.data.email[0])
      } else if (error.response?.data?.password) {
        throw new Error(error.response.data.password[0])
      } else if (error.response?.data?.password2) {
        throw new Error(error.response.data.password2[0])
      } else if (error.response?.data?.non_field_errors) {
        throw new Error(error.response.data.non_field_errors[0])
      } else {
        throw new Error('Registration failed')
      }
    }
  }

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        await authAPI.logout(refreshToken)
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear tokens and user data
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      setUser(null)
      router.push('/login')
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      const updatedUser = await authAPI.updateProfile(data)
      setUser(updatedUser)
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Profile update failed')
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
