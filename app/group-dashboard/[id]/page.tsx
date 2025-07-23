"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Settings, Receipt, CreditCard, Moon, Sun, Users, Activity } from "lucide-react"
import { TransactionCard, TransactionCardSkeleton } from "@/components/transaction-card"
import { useTheme } from "@/components/theme-provider"
import { useSound } from "@/hooks/use-sound"
import { ProtectedRoute } from "@/components/protected-route"
import { groupAPI, Group, Transaction, BalanceSummary, BalanceSummaryMember } from "@/lib/api"

export default function GroupDashboardPage() {
  const { theme, toggleTheme } = useTheme()
  const { playClick, playSuccess } = useSound()
  const [celebratingBalance, setCelebratingBalance] = useState<string | null>(null)
  const [group, setGroup] = useState<Group | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [balanceSummary, setBalanceSummary] = useState<BalanceSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const [isLoadingBalances, setIsLoadingBalances] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transactionError, setTransactionError] = useState<string | null>(null)
  const [balanceError, setBalanceError] = useState<string | null>(null)
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

  // Fetch balance summary
  const fetchBalanceSummary = async () => {
    if (!groupId) {
      console.error('🚨 No group ID provided for balance summary')
      return
    }
    
    console.log('💰 Fetching balance summary for group:', groupId)
    
    try {
      setIsLoadingBalances(true)
      setBalanceError(null)
      const balanceData = await groupAPI.getBalanceSummary(parseInt(groupId))
      console.log('✅ Successfully loaded balance summary:', balanceData)
      setBalanceSummary(balanceData)
    } catch (error: any) {
      console.error('❌ Error fetching balance summary:', error)
      setBalanceError('Failed to load balance information')
    } finally {
      setIsLoadingBalances(false)
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
    fetchBalanceSummary()
  }, [groupId])

  // Format balance display with color coding
  const formatBalance = (balance: number) => {
    if (balance > 0) {
      return { text: `+$${balance.toFixed(2)}`, className: "balance-positive" }
    } else if (balance < 0) {
      return { text: `-$${Math.abs(balance).toFixed(2)}`, className: "balance-negative" }
    } else {
      return { text: "$0.00", className: "balance-zero" }
    }
  }

  // Format balance relationship text
  const formatBalanceRelationship = (member: BalanceSummaryMember) => {
    const memberName = member.user?.name || `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.trim() || member.user?.email || 'Unknown User'
    const amount = Math.abs(member.balance_with_you)
    
    switch (member.status) {
      case 'owes_you':
        return {
          text: `${memberName} owes you $${amount.toFixed(2)}`,
          className: 'balance-positive',
          actionButton: 'remind'
        }
      case 'you_owe':
        return {
          text: `You owe ${memberName} $${amount.toFixed(2)}`,
          className: 'balance-negative',
          actionButton: 'pay'
        }
      case 'settled':
        return {
          text: `Settled with ${memberName}`,
          className: 'balance-zero',
          actionButton: 'details'
        }
      default:
        return {
          text: `${memberName}`,
          className: 'balance-zero',
          actionButton: 'details'
        }
    }
  }

  // Group members by status for better organization
  const groupMembersByStatus = (members: BalanceSummaryMember[]) => {
    const owesYou = members.filter(m => m.status === 'owes_you')
    const youOwe = members.filter(m => m.status === 'you_owe')
    const settled = members.filter(m => m.status === 'settled')
    
    return { owesYou, youOwe, settled }
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
        <div className="group-header">
          <h1>{isLoading ? 'Loading...' : group?.name || 'Group Dashboard'}</h1>
          {group?.members && (
            <div className="member-count">
              <Users size={16} />
              <span>{group.members.length} member{group.members.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
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
                  Currency: {group.currency}
                </p>
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: "1rem", color: "var(--text-primary)" }}>Balances 💰</h3>

              {isLoadingBalances ? (
                <div style={{ 
                  display: "flex", 
                  justifyContent: "center", 
                  alignItems: "center", 
                  padding: "2rem",
                  color: "var(--text-secondary)"
                }}>
                  Loading balances...
                </div>
              ) : balanceError ? (
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column",
                  alignItems: "center", 
                  padding: "2rem",
                  color: "var(--text-secondary)",
                  textAlign: "center"
                }}>
                  <p>{balanceError}</p>
                </div>
              ) : balanceSummary ? (
                <>
                  {/* Net Balance Summary Card */}
                  <div style={{
                    background: "linear-gradient(135deg, var(--card-bg) 0%, var(--card-bg-secondary, var(--card-bg)) 100%)",
                    borderRadius: "16px",
                    padding: "2rem",
                    marginBottom: "2rem",
                    border: "1px solid var(--border-color)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                    textAlign: "center"
                  }}>
                    <h3 style={{ 
                      margin: "0 0 1rem 0", 
                      color: "var(--text-primary)",
                      fontSize: "1.125rem",
                      fontWeight: "600"
                    }}>Your Net Balance</h3>
                    
                    <div style={{ marginBottom: "0.75rem" }}>
                      <span className={formatBalance(balanceSummary.net_balance).className} style={{ 
                        fontSize: "2rem", 
                        fontWeight: "700",
                        letterSpacing: "-0.02em"
                      }}>
                        {formatBalance(balanceSummary.net_balance).text}
                      </span>
                      <span style={{ 
                        color: "var(--text-secondary)", 
                        fontSize: "1rem",
                        marginLeft: "0.5rem",
                        fontWeight: "500"
                      }}>
                        {balanceSummary.currency}
                      </span>
                    </div>
                    
                    <p style={{ 
                      color: "var(--text-secondary)", 
                      fontSize: "0.9rem",
                      margin: "0",
                      fontWeight: "500"
                    }}>
                      {balanceSummary.net_balance > 0 ? "💰 You are owed money overall" : 
                       balanceSummary.net_balance < 0 ? "💸 You owe money overall" : 
                       "✅ All settled up!"}
                    </p>
                  </div>

                  {/* Member Balance List */}
                  {(() => {
                    const otherMembers = balanceSummary.members.filter(member => !member.is_current_user)
                    const { owesYou, youOwe, settled } = groupMembersByStatus(otherMembers)
                    
                    if (otherMembers.length === 0) {
                      return (
                        <div style={{ 
                          display: "flex", 
                          flexDirection: "column",
                          alignItems: "center", 
                          padding: "2rem",
                          color: "var(--text-secondary)",
                          textAlign: "center"
                        }}>
                          <Users size={48} style={{ marginBottom: "1rem", opacity: 0.5 }} />
                          <p>No other members in this group yet</p>
                        </div>
                      )
                    }
                    
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {/* All members - show everyone with their actual balances */}
                        {otherMembers.map((member) => {
                          const memberName = member.user?.name || `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.trim() || 'Unknown User'
                          const balance = member.balance_with_you
                          const balanceFormatted = formatBalance(balance)
                          
                          return (
                            <div
                              key={member.id}
                              onClick={() => handleBalanceClick(memberName, balance)}
                              style={{ 
                                cursor: "pointer",
                                padding: "1rem 1.5rem",
                                backgroundColor: "var(--card-bg)",
                                borderRadius: "16px",
                                border: "1px solid var(--border-color)",
                                transition: "all 0.15s ease",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-1px)"
                                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.06)"
                                e.currentTarget.style.borderColor = "var(--primary-color)"
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)"
                                e.currentTarget.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.02)"
                                e.currentTarget.style.borderColor = "var(--border-color)"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <div style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "50%",
                                  backgroundColor: balance > 0 ? "var(--success-color)" : balance < 0 ? "var(--error-color)" : "var(--text-secondary)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "1rem",
                                  fontWeight: "600",
                                  color: "white",
                                  flexShrink: 0
                                }}>
                                  {memberName.charAt(0).toUpperCase()}
                                </div>
                                <h4 style={{ 
                                  margin: "0", 
                                  color: "var(--text-primary)",
                                  fontSize: "1rem",
                                  fontWeight: "600",
                                  letterSpacing: "-0.01em"
                                }}>
                                  {memberName}
                                </h4>
                              </div>
                              
                              <span 
                                className={`${balanceFormatted.className} ${celebratingBalance === memberName ? "balance-celebration" : ""}`} 
                                style={{
                                  fontSize: "1.125rem",
                                  fontWeight: "700",
                                  letterSpacing: "-0.02em",
                                  minWidth: "80px",
                                  textAlign: "right"
                                }}
                              >
                                {balanceFormatted.text}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()
                  }
                </>
              ) : (
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column",
                  alignItems: "center", 
                  padding: "2rem",
                  color: "var(--text-secondary)",
                  textAlign: "center"
                }}>
                  <Users size={48} style={{ marginBottom: "1rem", opacity: 0.5 }} />
                  <p>No balance information available</p>
                </div>
              )}
            </div>
          </>
        ) : null}

        <div className="card">
          <h3 style={{ marginBottom: "1rem", color: "var(--text-primary)" }}>Recent Activity 📋</h3>

          <div className="space-y-4">
            {isLoadingTransactions ? (
              // Show skeleton loaders while loading
              <>
                <TransactionCardSkeleton />
                <TransactionCardSkeleton />
                <TransactionCardSkeleton />
              </>
            ) : transactionError ? (
              <div className="text-center p-6 rounded-lg bg-red-50 dark:bg-red-900/20">
                <p className="text-red-600 dark:text-red-400">{transactionError}</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Activity size={48} className="mb-4 opacity-50" />
                <h4 className="text-lg font-medium mb-1">No recent transactions</h4>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Start tracking expenses with your group!</p>
                <Link href={`/add-expense?groupId=${groupId}`}>
                  <button 
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    onClick={handleButtonClick}
                  >
                    <Receipt size={16} className="mr-2" />
                    Add Expense
                  </button>
                </Link>
              </div>
            ) : (
              transactions.map((transaction) => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <Link href={`/add-expense?groupId=${groupId}`} style={{ flex: 1 }}>
            <button className="button" onClick={handleButtonClick}>
              <Receipt className="icon" />
              Add Expense
            </button>
          </Link>

          <Link href={`/add-payment?groupId=${groupId}`} style={{ flex: 1 }}>
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


