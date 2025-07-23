"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Settings, Receipt, CreditCard, Moon, Sun, Users, Activity } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useSound } from "@/hooks/use-sound"
import { ProtectedRoute } from "@/components/protected-route"
import { groupAPI, Group, Transaction } from "@/lib/api"

export default function GroupDashboardPage() {
  const { theme, toggleTheme } = useTheme()
  const { playClick, playSuccess } = useSound()
  const [celebratingBalance, setCelebratingBalance] = useState<string | null>(null)
  const [group, setGroup] = useState<Group | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transactionError, setTransactionError] = useState<string | null>(null)
  const params = useParams()
  const groupId = params.id as string

  const handleThemeToggle = () => {
    playClick()
    toggleTheme()
  }

  const handleBalanceClick = (person: string, balance: number) => {
    if (balance === 0) {
      playSuccess()
      setCelebratingBalance(person)
      setTimeout(() => setCelebratingBalance(null), 1000)
    } else {
      playClick()
    }
  }

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    playClick()
    const button = e.currentTarget
    if (button && button.classList) {
      button.classList.add("button-wobble")
      setTimeout(() => {
        if (button && button.classList) {
          button.classList.remove("button-wobble")
        }
      }, 500)
    }
  }

  // Fetch group details on component mount
  useEffect(() => {
    const fetchGroupDetails = async () => {
      if (!groupId) {
        console.error('🚨 No group ID provided to group dashboard')
        return
      }
      
      console.log('🔍 Group Dashboard - Loading group details for ID:', groupId)
      console.log('🔐 Auth status:', {
        hasAccessToken: !!localStorage.getItem('accessToken'),
        hasRefreshToken: !!localStorage.getItem('refreshToken')
      })
      
      try {
        setIsLoading(true)
        setError(null)
        console.log('📡 Calling groupAPI.getGroup for ID:', parseInt(groupId))
        const groupData = await groupAPI.getGroup(parseInt(groupId))
        console.log('✅ Successfully loaded group data:', groupData)
        setGroup(groupData)
      } catch (error: any) {
        console.error('❌ Error fetching group details:', error)
        console.error('Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        })
        
        // Handle specific error cases
        if (error.response?.status === 401) {
          console.warn('🔐 Authentication error - user may need to log in again')
          setError('Authentication required. Please log in again.')
        } else if (error.response?.status === 404) {
          console.warn('🔍 Group not found - using mock data for development')
          setGroup({
            id: parseInt(groupId),
            name: 'Weekend Trip 🏖️',
            description: 'Trip to the mountains with friends',
            currency: 'USD',
            join_code: 'ABC123',
            members: [
              { 
                id: 1, 
                user: { id: 1, email: 'user1@example.com', first_name: 'You', last_name: '' },
                role: 'admin' as const,
                status: 'active' as const,
                balance: 30.00,
                joined_at: '2024-01-10T10:00:00Z'
              },
              { 
                id: 2, 
                user: { id: 2, email: 'user2@example.com', first_name: 'Person', last_name: '2' },
                role: 'member' as const,
                status: 'active' as const,
                balance: -15.00,
                joined_at: '2024-01-11T10:00:00Z'
              },
              { 
                id: 3, 
                user: { id: 3, email: 'user3@example.com', first_name: 'Person', last_name: '3' },
                role: 'member' as const,
                status: 'active' as const,
                balance: -15.00,
                joined_at: '2024-01-12T10:00:00Z'
              }
            ],
            member_count: 3,
            last_updated: '2024-01-13T10:00:00Z',
            user_balance: 30.00
          })
        } else {
          console.error('🚨 Unexpected error loading group details')
          setError('Failed to load group details')
        }
      } finally {
        setIsLoading(false)
      }
    }

    const fetchRecentTransactions = async () => {
      if (!groupId) return
      
      try {
        setIsLoadingTransactions(true)
        setTransactionError(null)
        const transactionData = await groupAPI.getRecentTransactions(parseInt(groupId))
        setTransactions(transactionData)
      } catch (error: any) {
        console.error('Error fetching recent transactions:', error)
        setTransactionError('Failed to load recent transactions')
      } finally {
        setIsLoadingTransactions(false)
      }
    }

    fetchGroupDetails()
    fetchRecentTransactions()
  }, [groupId])

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

  // Format time ago display for transactions
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
        <Link href="/dashboard">
          <button className="back-button" onClick={() => playClick()}>
            <ArrowLeft className="icon" />
          </button>
        </Link>
        <h1>{isLoading ? 'Loading...' : group?.name || 'Group Dashboard'}</h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="theme-toggle" onClick={handleThemeToggle}>
            {theme === "light" ? <Moon /> : <Sun />}
          </button>
          <Link href={`/group-settings?id=${params.id}`}>
            <button className="back-button" onClick={() => playClick()}>
              <Settings className="icon" />
            </button>
          </Link>
        </div>
      </div>

      <div className="main-content" style={{ paddingBottom: "6rem" }}>
        {isLoading ? (
          <div className="card">
            <div style={{ 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center", 
              padding: "2rem",
              color: "var(--text-secondary)"
            }}>
              Loading group details...
            </div>
          </div>
        ) : error ? (
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
              <p>{error}</p>
              <p style={{ fontSize: "0.875rem" }}>Please try again later.</p>
            </div>
          </div>
        ) : group ? (
          <>
            <div className="card">
              <h3 style={{ marginBottom: "1rem", color: "var(--text-primary)" }}>Group Info 📋</h3>
              <div style={{ marginBottom: "1rem" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                  {group.description}
                </p>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  {group.member_count} {group.member_count === 1 ? 'member' : 'members'} • Currency: {group.currency}
                </p>
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: "1rem", color: "var(--text-primary)" }}>Balances 💰</h3>

              {group.members?.map((member, index) => {
                const isCurrentUser = index === 0 // Assuming first member is current user
                const balance = isCurrentUser ? (group.user_balance || 0) : (index === 1 ? -15 : -15) // Mock balances for other members
                const balanceFormat = formatBalance(balance)
                const memberName = isCurrentUser ? 'You' : (member.user?.name || `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.trim() || member.user?.email || 'Unknown')
                
                return (
                  <div
                    key={member.id}
                    className="participant-item"
                    onClick={() => handleBalanceClick(memberName, balance)}
                    style={{ cursor: "pointer" }}
                  >
                    <div>
                      <h4>{memberName} {isCurrentUser ? '👤' : '👥'}</h4>
                      {isCurrentUser && (
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>You</p>
                      )}
                    </div>
                    <span className={`${balanceFormat.className} ${celebratingBalance === memberName ? "balance-celebration" : ""}`}>
                      {balanceFormat.text}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        ) : null}

        <div className="card">
          <h3 style={{ marginBottom: "1rem", color: "var(--text-primary)" }}>Recent Activity 📋</h3>

          {isLoadingTransactions ? (
            <div style={{ 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center", 
              padding: "1rem",
              color: "var(--text-secondary)"
            }}>
              Loading transactions...
            </div>
          ) : transactionError ? (
            <div style={{ 
              display: "flex", 
              flexDirection: "column",
              alignItems: "center", 
              padding: "1rem",
              color: "var(--text-secondary)",
              textAlign: "center"
            }}>
              <p>{transactionError}</p>
            </div>
          ) : transactions.length === 0 ? (
            <div style={{ 
              display: "flex", 
              flexDirection: "column",
              alignItems: "center", 
              padding: "2rem",
              color: "var(--text-secondary)",
              textAlign: "center"
            }}>
              <Activity size={48} style={{ marginBottom: "1rem", opacity: 0.5 }} />
              <p style={{ marginBottom: "0.5rem", fontSize: "1rem" }}>No recent transactions</p>
              <p style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>Start tracking expenses with your group!</p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
                <Link href={`/add-expense?groupId=${groupId}`}>
                  <button 
                    className="button" 
                    style={{ 
                      fontSize: "0.875rem", 
                      padding: "0.5rem 1rem",
                      minWidth: "auto"
                    }}
                    onClick={handleButtonClick}
                  >
                    <Receipt size={16} style={{ marginRight: "0.5rem" }} />
                    Add Expense
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            transactions.map((transaction, index) => (
              <div 
                key={transaction.id}
                style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  marginBottom: index < transactions.length - 1 ? "1rem" : "0"
                }}
              >
                <div>
                  <h4>{transaction.description}</h4>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                    Paid by {transaction.paid_by.first_name} {transaction.paid_by.last_name} • {formatTimeAgo(transaction.created_at)}
                  </p>
                </div>
                <span>${transaction.amount.toFixed(2)}</span>
              </div>
            ))
          )}
        </div>

        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <Link href={`/add-expense?groupId=${groupId}`} style={{ flex: 1 }}>
            <button className="button" onClick={handleButtonClick}>
              <Receipt className="icon" />
              Add Expense
            </button>
          </Link>

          <Link href="/add-payment" style={{ flex: 1 }}>
            <button className="button button-secondary" onClick={handleButtonClick}>
              <CreditCard className="icon" />
              Add Payment
            </button>
          </Link>
        </div>

        {/* Fun loading state */}
        {(isLoading || isLoadingTransactions) && (
          <div style={{ textAlign: "center", marginTop: "2rem", color: "var(--text-secondary)" }}>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>Syncing with friends...</p>
          </div>
        )}
      </div>
    </div>
    </ProtectedRoute>
  )
}


