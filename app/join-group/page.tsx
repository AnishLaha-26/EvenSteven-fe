"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Moon, Sun, Loader2 } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useSound } from "@/hooks/use-sound"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { groupAPI } from "@/lib/api"

export default function JoinGroupPage() {
  const { theme, toggleTheme } = useTheme()
  const { playClick, playSuccess, playError } = useSound()
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Debug authentication status
  useEffect(() => {
    console.log('🔐 Join Group Page - Auth Status:', {
      isAuthenticated,
      user: user ? { id: user.id, email: user.email } : null,
      hasAccessToken: !!localStorage.getItem('accessToken'),
      hasRefreshToken: !!localStorage.getItem('refreshToken')
    })
  }, [isAuthenticated, user])

  const handleThemeToggle = () => {
    playClick()
    toggleTheme()
  }

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!code.trim()) {
      setError("Please enter a group code")
      playError()
      return
    }

    // Check authentication before making API call
    if (!isAuthenticated || !localStorage.getItem('accessToken')) {
      setError('You must be logged in to join a group. Please log in and try again.')
      playError()
      console.error('🔐 Authentication check failed:', {
        isAuthenticated,
        hasToken: !!localStorage.getItem('accessToken')
      })
      return
    }

    setIsLoading(true)
    setError("")

    console.log('🚀 Starting join group process for code:', code.trim())

    try {
      const group = await groupAPI.joinGroupByCode(code.trim())
      console.log('✅ Successfully joined group:', group)
      console.log('🔍 Group data structure:', {
        id: group?.id,
        name: group?.name,
        hasId: 'id' in group,
        keys: Object.keys(group || {})
      })
      
      playSuccess()
      
      // Check if group has an ID before redirecting
      if (group?.id) {
        console.log('🚀 Redirecting to group dashboard with ID:', group.id)
        router.push(`/group-dashboard/${group.id}`)
      } else {
        console.error('🚨 Group ID is missing from API response, cannot redirect')
        setError('Successfully joined group, but unable to navigate to dashboard. Please check your groups in the main dashboard.')
        // Fallback: redirect to main dashboard
        setTimeout(() => router.push('/dashboard'), 2000)
      }
    } catch (error: any) {
      console.error('Error joining group:', error)
      playError()
      
      // Use the specific error message from the API function
      if (error.message) {
        // The API function now handles specific backend error messages
        setError(error.message)
      } else {
        // Fallback for unexpected errors
        setError('Failed to join group. Please try again later.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="container">
      <div className="header">
        <Link href="/dashboard">
          <button className="back-button" onClick={() => playClick()}>
            <ArrowLeft className="icon" />
          </button>
        </Link>
        <h1>Join Group</h1>
        <button className="theme-toggle" onClick={handleThemeToggle}>
          {theme === "light" ? <Moon /> : <Sun />}
        </button>
      </div>

      <div className="main-content">
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>Enter the group code to join</p>
        </div>

        <form onSubmit={handleJoinGroup}>
          <div className="form-group">
            <label className="label">Group Code</label>
            <input
              type="text"
              className="input"
              placeholder="- - -  - - -"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onFocus={() => playClick()}
              disabled={isLoading}
              maxLength={6}
              style={{ 
                textAlign: "center", 
                fontSize: "1.5rem", 
                letterSpacing: "0.5rem",
                opacity: isLoading ? 0.6 : 1
              }}
            />
          </div>

          {error && (
            <div style={{ 
              color: "var(--error-color, #ef4444)", 
              textAlign: "center", 
              marginBottom: "1rem",
              fontSize: "0.875rem"
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="button" 
            disabled={isLoading || !code.trim()}
            style={{
              opacity: (isLoading || !code.trim()) ? 0.6 : 1,
              cursor: (isLoading || !code.trim()) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {isLoading && <Loader2 className="icon" style={{ animation: 'spin 1s linear infinite' }} />}
            {isLoading ? 'Joining...' : 'Join Group'}
          </button>
        </form>

        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Don't have a code? Ask the group creator to share it with you.
          </p>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  )
}
