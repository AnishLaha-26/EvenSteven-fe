"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Users, Moon, Sun, LogOut, Settings } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useSound } from "@/hooks/use-sound"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { groupAPI, UserGroup } from "@/lib/api"

export default function DashboardPage() {
  const { theme, toggleTheme } = useTheme()
  const { playClick } = useSound()
  const { user, logout } = useAuth()
  const [userGroups, setUserGroups] = useState<UserGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleThemeToggle = () => {
    playClick()
    toggleTheme()
  }

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    playClick()
    const button = e.currentTarget
    if (button) {
      button.classList.add("button-pulse")
      setTimeout(() => {
        if (button) {
          button.classList.remove("button-pulse")
        }
      }, 600)
    }
  }

  const handleLogout = async () => {
    playClick()
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Fetch user groups on component mount
  useEffect(() => {
    const fetchUserGroups = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const groups = await groupAPI.getUserGroups()
        setUserGroups(groups)
      } catch (error) {
        console.error('Error fetching user groups:', error)
        setError('Failed to load groups')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserGroups()
  }, [])

  // Format balance display with color coding
  const formatBalance = (balance: number) => {
    if (balance > 0) {
      return { text: `+$${balance.toFixed(2)}`, className: 'balance-positive' }
    } else if (balance < 0) {
      return { text: `-$${Math.abs(balance).toFixed(2)}`, className: 'balance-negative' }
    } else {
      return { text: '$0.00 ✨', className: 'balance-zero' }
    }
  }

  // Format time ago display
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) {
      return '1 day ago'
    } else if (diffDays <= 7) {
      return `${diffDays} days ago`
    } else if (diffDays <= 30) {
      const weeks = Math.floor(diffDays / 7)
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
    } else {
      const months = Math.floor(diffDays / 30)
      return months === 1 ? '1 month ago' : `${months} months ago`
    }
  }

  return (
    <ProtectedRoute>
      <div className="container">
      <div className="header">
        <h1>EvenSteven</h1>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button className="theme-toggle" onClick={handleThemeToggle}>
            {theme === "light" ? <Moon /> : <Sun />}
          </button>
          <button className="theme-toggle" onClick={handleLogout}>
            <LogOut />
          </button>
        </div>
      </div>

      <div className="main-content">
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div
            style={{
              width: "5rem",
              height: "5rem",
              backgroundColor: "var(--primary-green)",
              borderRadius: "1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
            }}
          >
            <img 
              src="/logo.png" 
              alt="EvenSteven Logo" 
              style={{
                width: "3.3rem",
                height: "3.3rem",
                objectFit: "contain",
              }}
            />
          </div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>
            Welcome back, {user?.first_name}!
          </h2>
          <p style={{ color: "var(--text-secondary)" }}>Create groups and track shared expenses with friends</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Link href="/create-group">
            <button className="button" onClick={handleButtonClick}>
              <Plus className="icon" />
              New Group
            </button>
          </Link>

          <Link href="/join-group">
            <button className="button button-secondary" onClick={handleButtonClick}>
              <Users className="icon" />
              Join Group
            </button>
          </Link>
        </div>

        <div style={{ marginTop: "3rem" }}>
          <h3 style={{ marginBottom: "1rem", color: "var(--text-primary)" }}>Your Groups</h3>

          {isLoading ? (
            <div className="card">
              <div style={{ 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center", 
                padding: "2rem",
                color: "var(--text-secondary)"
              }}>
                Loading your groups...
              </div>
            </div>
          ) : error ? (
            <div className="card">
              <div style={{ 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center", 
                padding: "2rem",
                color: "var(--text-secondary)"
              }}>
                {error}
              </div>
            </div>
          ) : userGroups.length === 0 ? (
            <div className="card">
              <div style={{ 
                display: "flex", 
                flexDirection: "column",
                alignItems: "center", 
                padding: "2rem",
                color: "var(--text-secondary)",
                textAlign: "center"
              }}>
                <Users size={48} style={{ marginBottom: "1rem", opacity: 0.5 }} />
                <p>You haven't joined any groups yet.</p>
                <p style={{ fontSize: "0.875rem" }}>Create a new group or join an existing one to get started!</p>
              </div>
            </div>
          ) : (
            userGroups.map((group) => {
              const balance = formatBalance(group.user_balance)
              const timeAgo = formatTimeAgo(group.last_updated)
              
              return (
                <Link key={group.id} href={`/group-dashboard/${group.id}`}>
                  <div className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <h4 style={{ marginBottom: "0.25rem" }}>{group.name}</h4>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                          {group.member_count} {group.member_count === 1 ? 'member' : 'members'} • {timeAgo}
                        </p>
                      </div>
                      <span className={balance.className}>{balance.text}</span>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>
      </div>
    </ProtectedRoute>
  )
}


r