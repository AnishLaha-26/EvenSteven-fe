"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { ArrowLeft, Moon, Sun, DollarSign, User, Calendar, List, BarChart3, Eye, Edit, Trash2 } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useSound } from "@/hooks/use-sound"
import { ProtectedRoute } from "@/components/protected-route"
import { paymentAPI, groupAPI, Payment, PaymentStatistics, CreatePaymentPayload } from "../../lib/api"
import { useAuth } from "../../contexts/auth-context"
import { useSearchParams, useRouter } from 'next/navigation'

function AddPaymentContent() {
  const { theme, toggleTheme } = useTheme()
  const { playClick, playSuccess } = useSound()
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const groupId = searchParams.get('groupId')
  
  // Form state
  const [amount, setAmount] = useState("")
  const [selectedRecipient, setSelectedRecipient] = useState("")
  const [selectedGroup, setSelectedGroup] = useState("")
  const [description, setDescription] = useState("")
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  
  // Data state
  const [groups, setGroups] = useState<any[]>([])
  const [allMembers, setAllMembers] = useState<any[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [statistics, setStatistics] = useState<PaymentStatistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // UI state
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'stats'>('create')
  const [showPaymentsList, setShowPaymentsList] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)

  useEffect(() => {
    if (user) {
      loadInitialData()
    }
  }, [user, groupId])

  const loadInitialData = async () => {
    try {
      const [groupsData, paymentsData, statsData] = await Promise.all([
        groupAPI.getUserGroups().catch(() => []),
        paymentAPI.getPayments({ page_size: 10 }).catch(() => ({ results: [], count: 0 })),
        paymentAPI.getPaymentStatistics().catch(() => null)
      ])
      
      setGroups(groupsData)
      setPayments(paymentsData.results)
      setStatistics(statsData)
      
      // Load members based on groupId parameter or all members if no groupId
      await loadAllMembers()
    } catch (error) {
      console.error('Error loading initial data:', error)
    }
  }

  const loadAllMembers = async () => {
    try {
      console.log('Loading members, groupId:', groupId, 'user:', user)
      
      if (groupId) {
        // Load members from specific group
        console.log('Loading group details for groupId:', groupId)
        const groupDetails = await groupAPI.getGroup(parseInt(groupId))
        console.log('Group details loaded:', groupDetails)
        const groupMembers: any[] = []
        
        if (groupDetails.memberships) {
          console.log('Group memberships found:', groupDetails.memberships.length)
          groupDetails.memberships.forEach(membership => {
            console.log('Processing membership:', membership)
            // Skip current user - check both ID and email for safety
            if (membership.user && (membership.user.id === user?.id || membership.user.email === user?.email)) {
              console.log('Skipping current user:', membership.user.email, 'ID:', membership.user.id)
              return
            }
            
            groupMembers.push({
              id: membership.user.id,
              name: membership.user.name || `${membership.user.first_name || ''} ${membership.user.last_name || ''}`.trim() || membership.user.email,
              email: membership.user.email,
              groups: [groupDetails.name]
            })
          })
        } else {
          console.log('No memberships found in group details')
        }
        
        console.log('Final group members:', groupMembers)
        setAllMembers(groupMembers)
        // Auto-select the group if groupId is provided
        setSelectedGroup(groupId)
      } else {
        // Load all members from user's groups (existing logic)
        const userGroups = await groupAPI.getUserGroups()
        const allUniqueMembers: any[] = []
        const memberMap = new Map()
        
        // Get detailed info for each group to access members
        for (const group of userGroups) {
          try {
            const groupDetails = await groupAPI.getGroup(group.id)
            if (groupDetails.memberships) {
              groupDetails.memberships.forEach(membership => {
                // Skip current user - check both ID and email for safety
                if (membership.user && (membership.user.id === user?.id || membership.user.email === user?.email)) return
                
                const userId = membership.user.id
                if (!memberMap.has(userId)) {
                  memberMap.set(userId, {
                    id: userId,
                    name: membership.user.name || `${membership.user.first_name || ''} ${membership.user.last_name || ''}`.trim() || membership.user.email,
                    email: membership.user.email,
                    groups: [group.name]
                  })
                } else {
                  // Add group to existing member
                  const existingMember = memberMap.get(userId)
                  if (!existingMember.groups.includes(group.name)) {
                    existingMember.groups.push(group.name)
                  }
                }
              })
            }
          } catch (error) {
            console.error(`Failed to load group ${group.id}:`, error)
          }
        }

        setAllMembers(Array.from(memberMap.values()))
      }
    } catch (error) {
      console.error('Failed to load group members:', error)
      console.error('Error details:', error)
      setAllMembers([])
      setError('Failed to load group members. Please try again.')
    }
  }

  const handleThemeToggle = () => {
    playClick()
    toggleTheme()
  }

  const handleRecordPayment = async () => {
    if (!amount || !selectedRecipient) {
      setError('Please fill in all required fields')
      return
    }

    if (parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Find the selected recipient's email
      const recipient = allMembers.find(member => member.id.toString() === selectedRecipient)
      if (!recipient) {
        setError('Please select a valid recipient')
        return
      }
      
      const paymentData: CreatePaymentPayload = {
        from_user: user?.id,
        to_user: recipient.id,
        to_user_email_input: recipient.email,
        amount: parseFloat(amount),
        currency: 'USD',
        description: description || undefined,
        payment_date: paymentDate,
        group: selectedGroup ? parseInt(selectedGroup) : undefined
      }

      await paymentAPI.createPayment(paymentData)
      
      playSuccess()
      setSuccess('Payment recorded successfully!')
      
      // Reset form
      setAmount('')
      setSelectedRecipient('')
      setSelectedGroup('')
      setDescription('')
      setPaymentDate(new Date().toISOString().split('T')[0])
      
      // Redirect to group dashboard if groupId is present
      if (groupId) {
        setTimeout(() => {
          router.push(`/group-dashboard/${groupId}`)
        }, 1500) // Short delay to show success message
      } else {
        // Reload data if staying on the page
        await loadInitialData()
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000)
      }
      
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to record payment')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePayment = async (paymentId: number) => {
    if (!confirm('Are you sure you want to delete this payment?')) {
      return
    }

    try {
      setLoading(true)
      await paymentAPI.deletePayment(paymentId)
      setSuccess('Payment deleted successfully!')
      await loadInitialData()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to delete payment')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <ProtectedRoute>
      <div className="container">
        <div className="header">
          <Link href={groupId ? `/group-dashboard/${groupId}` : "/dashboard"}>
            <button className="back-button" onClick={() => playClick()}>
              <ArrowLeft className="icon" />
            </button>
          </Link>
          <h1>Payments</h1>
          <button className="theme-toggle" onClick={handleThemeToggle}>
            {theme === "light" ? <Moon /> : <Sun />}
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="alert error" style={{ 
            padding: '0.75rem', 
            marginBottom: '1rem', 
            backgroundColor: 'var(--error-bg)', 
            color: 'var(--error-color)', 
            borderRadius: '0.5rem',
            border: '1px solid var(--error-border)'
          }}>
            {error}
          </div>
        )}
        
        {success && (
          <div className="alert success" style={{ 
            padding: '0.75rem', 
            marginBottom: '1rem', 
            backgroundColor: 'var(--success-bg)', 
            color: 'var(--success-color)', 
            borderRadius: '0.5rem',
            border: '1px solid var(--success-border)'
          }}>
            {success}
          </div>
        )}

        <div className="main-content">
          {/* Create Payment Tab */}
          {activeTab === 'create' && (
            <form onSubmit={(e) => { e.preventDefault(); handleRecordPayment(); }}>
              <div className="form-group">
                <label className="label">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="input"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onFocus={() => playClick()}
                  style={{ fontSize: "1.5rem", textAlign: "center" }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">Recipient *</label>
                <select
                  className="input"
                  value={selectedRecipient}
                  onChange={(e) => setSelectedRecipient(e.target.value)}
                  onFocus={() => playClick()}
                  required
                >
                  <option value="">Select a recipient...</option>
                  {allMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.email}) - {member.groups.join(', ')}
                    </option>
                  ))}
                </select>
                {allMembers.length === 0 && (
                  <p style={{ 
                    fontSize: '0.8rem', 
                    color: 'var(--text-secondary)', 
                    marginTop: '0.5rem',
                    fontStyle: 'italic'
                  }}>
                    No group members found. Join a group to see potential recipients.
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="label">Date</label>
                <input
                  type="date"
                  className="input"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  onFocus={() => playClick()}
                />
              </div>

              <button 
                type="submit" 
                className="button" 
                disabled={loading}
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                {loading ? 'Recording...' : 'Record Payment'}
              </button>
            </form>
          )}

          {/* Payment History Tab */}
          {activeTab === 'list' && (
            <div className="payments-list">
              <h2 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>Recent Payments</h2>
              
              {payments.length === 0 ? (
                <div className="empty-state" style={{ 
                  textAlign: 'center', 
                  padding: '2rem', 
                  color: 'var(--text-secondary)' 
                }}>
                  <DollarSign className="icon" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }} />
                  <p>No payments found</p>
                  <p style={{ fontSize: '0.9rem' }}>Create your first payment using the Add Payment tab</p>
                </div>
              ) : (
                <div className="payment-cards">
                  {payments.map((payment) => (
                    <div key={payment.id} className="payment-card" style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      marginBottom: '0.75rem',
                      backgroundColor: 'var(--card-bg)'
                    }}>
                      <div className="payment-header" style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        marginBottom: '0.5rem'
                      }}>
                        <div className="payment-info">
                          <div className="payment-amount" style={{
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            color: payment.is_current_user_sender ? 'var(--error-color)' : 'var(--success-color)'
                          }}>
                            {payment.is_current_user_sender ? '-' : '+'}
                            {formatCurrency(payment.amount, payment.currency)}
                          </div>
                          <div className="payment-participants" style={{
                            fontSize: '0.9rem',
                            color: 'var(--text-secondary)',
                            marginTop: '0.25rem'
                          }}>
                            {payment.is_current_user_sender 
                              ? `To: ${payment.to_user_name}` 
                              : `From: ${payment.from_user_name}`
                            }
                          </div>
                        </div>
                        
                        <div className="payment-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                          {payment.is_current_user_sender && (
                            <button
                              onClick={() => handleDeletePayment(payment.id)}
                              className="icon-button"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--error-color)',
                                cursor: 'pointer',
                                padding: '0.25rem'
                              }}
                              title="Delete payment"
                            >
                              <Trash2 className="icon" style={{ fontSize: '1rem' }} />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="payment-details" style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)'
                      }}>
                        {payment.description && (
                          <div className="payment-description" style={{ marginBottom: '0.25rem' }}>
                            {payment.description}
                          </div>
                        )}
                        <div className="payment-meta" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{payment.group_name || 'Personal'}</span>
                          <span>{formatDate(payment.payment_date)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="payment-statistics">
              <h2 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>Payment Statistics</h2>
              
              {statistics ? (
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div className="stat-card" style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    backgroundColor: 'var(--card-bg)',
                    textAlign: 'center'
                  }}>
                    <div className="stat-icon" style={{ marginBottom: '0.5rem' }}>
                      <DollarSign className="icon" style={{ color: 'var(--success-color)', fontSize: '1.5rem' }} />
                    </div>
                    <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-color)' }}>
                      {formatCurrency(statistics.total_received)}
                    </div>
                    <div className="stat-label" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      Total Received
                    </div>
                  </div>

                  <div className="stat-card" style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    backgroundColor: 'var(--card-bg)',
                    textAlign: 'center'
                  }}>
                    <div className="stat-icon" style={{ marginBottom: '0.5rem' }}>
                      <DollarSign className="icon" style={{ color: 'var(--error-color)', fontSize: '1.5rem' }} />
                    </div>
                    <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-color)' }}>
                      {formatCurrency(statistics.total_paid)}
                    </div>
                    <div className="stat-label" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      Total Paid
                    </div>
                  </div>

                  <div className="stat-card" style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    backgroundColor: 'var(--card-bg)',
                    textAlign: 'center'
                  }}>
                    <div className="stat-icon" style={{ marginBottom: '0.5rem' }}>
                      <User className="icon" style={{ color: 'var(--primary-color)', fontSize: '1.5rem' }} />
                    </div>
                    <div className="stat-value" style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 'bold', 
                      color: statistics.net_balance >= 0 ? 'var(--success-color)' : 'var(--error-color)'
                    }}>
                      {formatCurrency(statistics.net_balance)}
                    </div>
                    <div className="stat-label" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      Net Balance
                    </div>
                  </div>

                  <div className="stat-card" style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    backgroundColor: 'var(--card-bg)',
                    textAlign: 'center'
                  }}>
                    <div className="stat-icon" style={{ marginBottom: '0.5rem' }}>
                      <Calendar className="icon" style={{ color: 'var(--accent-color)', fontSize: '1.5rem' }} />
                    </div>
                    <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-color)' }}>
                      {statistics.recent_payments_made + statistics.recent_payments_received}
                    </div>
                    <div className="stat-label" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      Recent Activity (30 days)
                    </div>
                  </div>
                </div>
              ) : (
                <div className="loading-state" style={{ 
                  textAlign: 'center', 
                  padding: '2rem', 
                  color: 'var(--text-secondary)' 
                }}>
                  <BarChart3 className="icon" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }} />
                  <p>Loading statistics...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

// Loading component for Suspense fallback
function LoadingPaymentPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading payment page...</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

// Main export with Suspense boundary
export default function AddPaymentPage() {
  return (
    <Suspense fallback={<LoadingPaymentPage />}>
      <AddPaymentContent />
    </Suspense>
  )
}