"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Camera, Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useSound } from "@/hooks/use-sound"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { groupAPI, GroupMember, expenseAPI, CreateExpensePayload, SplitData } from "@/lib/api"

function AddExpensePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { playClick, playSuccess } = useSound()
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [paidBy, setPaidBy] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [groupId, setGroupId] = useState<string | null>(null)
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal')
  const [splits, setSplits] = useState<SplitData[]>([])
  const [selectedParticipants, setSelectedParticipants] = useState<Set<number>>(new Set())
  const [showSplitDetails, setShowSplitDetails] = useState(false)
  const [isCreatingExpense, setIsCreatingExpense] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const groupIdParam = searchParams.get('groupId')
    if (groupIdParam) {
      setGroupId(groupIdParam)
    }
  }, [searchParams])

  // Fetch group members when groupId is available
  useEffect(() => {
    const fetchGroupMembers = async () => {
      if (!groupId) return
      
      setIsLoadingMembers(true)
      try {
        const group = await groupAPI.getGroup(Number(groupId))
        console.log('Successfully loaded group data:', group)
        
        // Use 'memberships' instead of 'members' as per API response
        const members = group.memberships || group.members || []
        setGroupMembers(members)
        
        // Initialize equal splits for all members
        initializeEqualSplits(members)
        
        // Set current user as default if they are a member
        console.log('Current user from auth:', user)
        console.log('Members from group:', members)
        
        if (user && members.length > 0) {
          const currentUserMember = members.find(member => {
            console.log('Comparing user IDs:', member.user.id, 'vs', user.id)
            console.log('Comparing user emails:', member.user.email, 'vs', user.email)
            
            // Try to match by ID first, then fallback to email if ID is missing
            if (user.id && member.user.id === user.id) {
              return true
            }
            // Fallback to email matching if ID is not available
            return member.user.email === user.email
          })
          
          console.log('Found current user member:', currentUserMember)
          
          if (currentUserMember) {
            console.log('Setting paidBy to current user:', currentUserMember.user.id)
            setPaidBy(currentUserMember.user.id)
          } else {
            console.log('Current user not found in members, using first member:', members[0].user.id)
            // Fallback to first member if current user not found
            setPaidBy(members[0].user.id)
          }
        }
      } catch (error) {
        console.error('Error fetching group members:', error)
        setError('Failed to load group members')
        // Fallback to current user if available
        if (user) {
          setPaidBy(user.id)
        }
      } finally {
        setIsLoadingMembers(false)
      }
    }

    fetchGroupMembers()
  }, [groupId, user])

  // Initialize equal splits for all members
  const initializeEqualSplits = (members: GroupMember[]) => {
    const equalSplits = members.map(member => ({
      user_id: member.user.id,
      amount: 0, // Will be calculated when amount is entered
    }))
    setSplits(equalSplits)
    
    // Select all members by default
    const allMemberIds = new Set(members.map(member => member.user.id))
    setSelectedParticipants(allMemberIds)
  }

  // Update splits when amount changes or participants change
  useEffect(() => {
    if (amount && groupMembers.length > 0) {
      const amountNum = parseFloat(amount)
      if (!isNaN(amountNum)) {
        if (splitType === 'equal') {
          const totalAmount = parseFloat(amount) || 0
          const selectedMembers = groupMembers.filter(member => selectedParticipants.has(member.user.id))
          const numSelectedMembers = selectedMembers.length
          const equalAmount = numSelectedMembers > 0 ? totalAmount / numSelectedMembers : 0
          
          // Only create splits for selected participants
          const newSplits = selectedMembers.map(member => ({
            user_id: member.user.id,
            amount: equalAmount,
            percentage: numSelectedMembers > 0 ? (100 / numSelectedMembers) : 0
          }))
          setSplits(newSplits)
        }
      }
    }
  }, [amount, splitType, groupMembers.length, selectedParticipants])

  const handleBack = () => {
    playClick()
    if (groupId) {
      router.push(`/group-dashboard/${groupId}`)
    } else {
      router.push('/dashboard')
    }
  }

  const handleThemeToggle = () => {
    playClick()
    toggleTheme()
  }

  const handleSubmit = async () => {
    if (!title.trim() || !amount || !paidBy || !groupId) {
      setError('Please fill in all required fields')
      return
    }

    if (parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0')
      return
    }

    setIsCreatingExpense(true)
    setError(null)
    playClick()

    try {
      // Debug logging
      console.log('=== EXPENSE SUBMISSION DEBUG ===')
      console.log('Selected participants:', Array.from(selectedParticipants))
      console.log('All splits before filtering:', splits)
      
      const filteredSplits = splits.filter(split => selectedParticipants.has(split.user_id))
      console.log('Filtered splits (selected only):', filteredSplits)
      
      const expenseData: CreateExpensePayload = {
        group: Number(groupId),  
        description: title.trim(),
        amount: amount.replace(/[^0-9.-]+/g, ''), 
        paid_by: Number(paidBy),
        currency: 'USD', 
        date: new Date().toISOString().split('T')[0], 
        splits: filteredSplits.map(split => ({
          user_id: split.user_id,
          amount: Number(split.amount),
          percentage: split.percentage || 0
        })) || []
      }

      console.log('Final expense data being sent to backend:', expenseData)
      console.log('Number of splits being sent:', expenseData.splits.length)
      const createdExpense = await expenseAPI.createExpense(expenseData)
      console.log('Expense created successfully:', createdExpense)
      
      playSuccess()
      setIsSubmitting(true)
      
      // Show success message
      setTimeout(() => {
        setIsSubmitting(false)
        // Navigate back to group dashboard
        if (groupId) {
          router.push(`/group-dashboard/${groupId}`)
        } else {
          router.push('/dashboard')
        }
      }, 2000)
      
    } catch (error: any) {
      console.error('Error creating expense:', error)
      setError(error.response?.data?.detail || error.message || 'Failed to create expense')
      setIsCreatingExpense(false)
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAmount(value)

    if (value && Number.parseFloat(value) > 100) {
      const input = e.target
      if (input && input.classList) {
        input.classList.add("shake")
        setTimeout(() => {
          if (input && input.classList) {
            input.classList.remove("shake")
          }
        }, 500)
      }
    }
  }

  const handleCameraClick = () => {
    playClick()
  }

  const handleSplitTypeChange = (type: 'equal' | 'custom') => {
    playClick()
    setSplitType(type)
    
    if (type === 'equal') {
      // Recalculate equal splits for selected participants only
      const totalAmount = parseFloat(amount) || 0
      const selectedMembers = groupMembers.filter(member => selectedParticipants.has(member.user.id))
      const numSelectedMembers = selectedMembers.length
      const equalAmount = numSelectedMembers > 0 ? totalAmount / numSelectedMembers : 0
      
      // Only create splits for selected participants
      const newSplits = selectedMembers.map(member => ({
        user_id: member.user.id,
        amount: equalAmount,
        percentage: numSelectedMembers > 0 ? (100 / numSelectedMembers) : 0
      }))
      setSplits(newSplits)
    }
  }

  const handleCustomSplitChange = (userId: number, newAmount: string) => {
    const amountNum = parseFloat(newAmount) || 0
    setSplits(prevSplits => 
      prevSplits.map(split => 
        split.user_id === userId 
          ? { ...split, amount: amountNum }
          : split
      )
    )
  }

  const handleParticipantToggle = (userId: number) => {
    const newSelectedParticipants = new Set(selectedParticipants)
    if (newSelectedParticipants.has(userId)) {
      newSelectedParticipants.delete(userId)
    } else {
      newSelectedParticipants.add(userId)
    }
    setSelectedParticipants(newSelectedParticipants)
    
    // Recalculate splits immediately after participant selection changes
    if (amount && groupMembers.length > 0) {
      const totalAmount = parseFloat(amount) || 0
      const selectedMembers = groupMembers.filter(member => newSelectedParticipants.has(member.user.id))
      const numSelectedMembers = selectedMembers.length
      
      if (splitType === 'equal') {
        const equalAmount = numSelectedMembers > 0 ? totalAmount / numSelectedMembers : 0
        const newSplits = selectedMembers.map(member => ({
          user_id: member.user.id,
          amount: equalAmount,
          percentage: numSelectedMembers > 0 ? (100 / numSelectedMembers) : 0
        }))
        setSplits(newSplits)
      } else {
        // For custom splits, keep existing amounts for selected participants only
        const newSplits = selectedMembers.map(member => {
          const existingSplit = splits.find(s => s.user_id === member.user.id)
          return {
            user_id: member.user.id,
            amount: existingSplit?.amount || 0,
            percentage: existingSplit?.percentage || 0
          }
        })
        setSplits(newSplits)
      }
    }
  }

  const getTotalSplitAmount = () => {
    return splits
      .filter(split => selectedParticipants.has(split.user_id))
      .reduce((total, split) => total + (split.amount || 0), 0)
  }

  const getRemainingAmount = () => {
    const totalAmount = parseFloat(amount) || 0
    const splitTotal = getTotalSplitAmount()
    return totalAmount - splitTotal
  }

  return (
    <ProtectedRoute>
      <div className="container">
        <div className="header">
          <button className="back-button" onClick={handleBack}>
            <ArrowLeft className="icon" />
          </button>
          <h1>Add Expense 💸</h1>
          <div>
            <button className="theme-toggle" onClick={handleThemeToggle}>
              {theme === "light" ? <Moon /> : <Sun />}
            </button>
          </div>
        </div>

        <div className="main-content">
          {isSubmitting && (
            <div className="success-message">
              <span>🎉 Expense added successfully! 🎉</span>
            </div>
          )}

          <form>
            <div className="form-group">
              <label className="label">Title</label>
              <input
                type="text"
                className="input"
                placeholder="What was this expense for? 🤔"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={() => playClick()}
              />
            </div>

            <div className="form-group">
              <label className="label">Amount 💰</label>
              <input
                type="number"
                className="input"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                onFocus={() => playClick()}
                style={{ fontSize: "1.5rem", textAlign: "center" }}
              />
              {amount && Number.parseFloat(amount) > 100 && (
                <p style={{ color: "var(--warning)", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                  💸 That's a big expense! Are you sure?
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="label">Paid by</label>
              <select
                className="input"
                value={paidBy || ""}
                onChange={(e) => setPaidBy(Number(e.target.value))}
                onFocus={() => playClick()}
                disabled={isLoadingMembers}
              >
                {isLoadingMembers ? (
                  <option value="">Loading members...</option>
                ) : groupMembers.length > 0 ? (
                  groupMembers.map((member) => {
                    const isCurrentUser = user && member.user.id === user.id
                    const displayName = member.user.first_name && member.user.last_name 
                      ? `${member.user.first_name} ${member.user.last_name}`
                      : member.user.name || member.user.email
                    
                    return (
                      <option key={member.user.id} value={member.user.id}>
                        {displayName} {isCurrentUser ? '(You)' : ''} {isCurrentUser ? '👤' : '👥'}
                      </option>
                    )
                  })
                ) : (
                  <option value="">No members found</option>
                )}
              </select>
            </div>

       

            {/* Error Display */}
            {error && (
              <div style={{
                backgroundColor: "var(--error)",
                color: "white",
                padding: "1rem",
                borderRadius: "0.5rem",
                marginBottom: "1rem",
                fontSize: "0.875rem"
              }}>
                {error}
              </div>
            )}

            {/* Split Details Section */}
            <div className="form-group">
              <label className="label">Split Details</label>
              
              {/* Split Type Buttons */}
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <button
                  type="button"
                  className={`button ${splitType === 'equal' ? '' : 'button-secondary'}`}
                  onClick={() => handleSplitTypeChange('equal')}
                  style={{ flex: 1 }}
                >
                  Equal Split
                </button>
                <button
                  type="button"
                  className={`button ${splitType === 'custom' ? '' : 'button-secondary'}`}
                  onClick={() => handleSplitTypeChange('custom')}
                  style={{ flex: 1 }}
                >
                  Custom Split
                </button>
              </div>

              {/* Split Details */}
              {splits.length > 0 && (
                <div style={{
                  backgroundColor: "var(--card-background)",
                  padding: "1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid var(--border)",
                  marginBottom: "1rem"
                }}>
                  {/* Participant Selection */}
                  <div style={{ marginBottom: "1rem" }}>
                    <h4 style={{ marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: "600", color: "var(--text-secondary)" }}>
                      Who participated in this expense?
                    </h4>
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      padding: "0.75rem",
                      backgroundColor: "var(--background)",
                      borderRadius: "0.375rem",
                      border: "1px solid var(--border)"
                    }}>
                      {groupMembers.map(member => {
                        const displayName = member.user.name || `${member.user.first_name || ''} ${member.user.last_name || ''}`.trim() || member.user.email
                        const isCurrentUser = user && (member.user.id === user.id || member.user.email === user.email)
                        const isSelected = selectedParticipants.has(member.user.id)
                        
                        return (
                          <label
                            key={member.user.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              padding: "0.5rem",
                              borderRadius: "0.25rem",
                              cursor: "pointer",
                              backgroundColor: isSelected ? "rgba(34, 197, 94, 0.1)" : "transparent",
                              border: isSelected ? "1px solid var(--primary-green)" : "1px solid transparent",
                              transition: "all 0.2s ease"
                            }}
                            onClick={() => {
                              playClick()
                              handleParticipantToggle(member.user.id)
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleParticipantToggle(member.user.id)}
                              style={{
                                width: "16px",
                                height: "16px",
                                accentColor: "var(--primary-green)"
                              }}
                            />
                            <span style={{ 
                              fontSize: "0.875rem",
                              fontWeight: isSelected ? "600" : "400",
                              color: isSelected ? "var(--primary-green)" : "var(--text)"
                            }}>
                              {displayName} {isCurrentUser ? '(You)' : ''}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                  
                  <h4 style={{ margin: "0 0 1rem 0", fontSize: "0.875rem", fontWeight: "600" }}>
                    How should this be split?
                  </h4>
                  
                  {splits.filter(split => selectedParticipants.has(split.user_id)).map((split) => {
                    const member = groupMembers.find(m => m.user.id === split.user_id)
                    if (!member) return null
                    
                    const displayName = member.user.first_name && member.user.last_name 
                      ? `${member.user.first_name} ${member.user.last_name}`
                      : member.user.name || member.user.email
                    const isCurrentUser = user && member.user.id === user.id
                    
                    return (
                      <div key={split.user_id} style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.5rem 0",
                        borderBottom: "1px solid var(--border)"
                      }}>
                        <span style={{ fontSize: "0.875rem" }}>
                          {displayName} {isCurrentUser ? '(You)' : ''}
                        </span>
                        
                        {splitType === 'equal' ? (
                          <span style={{ 
                            fontSize: "0.875rem", 
                            fontWeight: "600",
                            color: "var(--primary-green)"
                          }}>
                            ${split.amount.toFixed(2)}
                          </span>
                        ) : (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={split.amount}
                            onChange={(e) => handleCustomSplitChange(split.user_id, e.target.value)}
                            onFocus={() => playClick()}
                            style={{
                              width: "80px",
                              padding: "0.25rem 0.5rem",
                              border: "1px solid var(--border)",
                              borderRadius: "0.25rem",
                              backgroundColor: "var(--background)",
                              color: "var(--text)",
                              fontSize: "0.875rem",
                              textAlign: "right"
                            }}
                          />
                        )}
                      </div>
                    )
                  })}
                  

                  
                  {/* Split Summary */}
                  <div style={{
                    marginTop: "1rem",
                    padding: "0.5rem 0",
                    borderTop: "1px solid var(--border)",
                    fontSize: "0.875rem"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Total Split:</span>
                      <span style={{ fontWeight: "600" }}>${getTotalSplitAmount().toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Total Amount:</span>
                      <span style={{ fontWeight: "600" }}>${(parseFloat(amount) || 0).toFixed(2)}</span>
                    </div>
                    {splitType === 'custom' && (
                      <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between",
                        color: getRemainingAmount() !== 0 ? "var(--error)" : "var(--primary-green)"
                      }}>
                        <span>Remaining:</span>
                        <span style={{ fontWeight: "600" }}>${getRemainingAmount().toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button 
              type="button" 
              className="button" 
              onClick={handleSubmit} 
              disabled={isSubmitting || isCreatingExpense || (splitType === 'custom' && getRemainingAmount() !== 0)}
            >
              {isSubmitting || isCreatingExpense ? (
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              ) : (
                "Create Expense 💸"
              )}
            </button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default function AddExpensePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddExpensePageContent />
    </Suspense>
  )
}
