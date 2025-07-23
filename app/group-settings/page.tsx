"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Share2, Users, Trash2, Moon, Sun, UserMinus, LogOut, AlertTriangle, UserPlus, Edit3, Loader2 } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useSound } from "@/hooks/use-sound"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { groupAPI, Group, GroupMemberDetail } from "@/lib/api"

interface Member {
  id: number
  name: string
  email: string
  role: "admin" | "member"
  status: "active" | "pending"
  isCurrentUser: boolean
  userId: number
}

export default function GroupSettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const { playClick, playError, playSuccess } = useSound()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const groupId = searchParams.get('id')
  
  // Debug auth context
  console.log('Auth context debug:')
  console.log('- user:', user)
  console.log('- authLoading:', authLoading)
  console.log('- user?.id:', user?.id)
  
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRemoveDialog, setShowRemoveDialog] = useState<number | null>(null)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [isEditingGroup, setIsEditingGroup] = useState(false)
  const [editedGroupName, setEditedGroupName] = useState('')
  const [editedGroupDescription, setEditedGroupDescription] = useState('')

  // Load group data and members on component mount
  useEffect(() => {
    if (!groupId || authLoading) return
    if (!user) {
      console.log('No user found, redirecting to login')
      router.push('/login')
      return
    }
    
    const loadGroupData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('Loading group data for ID:', groupId)
        
        // Load group details
        const groupData = await groupAPI.getGroup(parseInt(groupId))
        console.log('Group data received:', groupData)
        
        setGroup(groupData)
        setEditedGroupName(groupData.name)
        setEditedGroupDescription(groupData.description)
        
        // Convert group memberships to our Member interface using correct API structure
        console.log('Processing memberships:', groupData.memberships)
        
        const memberData: Member[] = (groupData.memberships || []).map((member: any, index) => {
          console.log('Processing member:', member)
          
          // Backend now returns full member data with nested user object
          const memberId = member.id
          const userId = member.user?.id
          const isCurrentUser = userId === user?.id
          
          // Debug user ID comparison
          console.log('User ID comparison debug:')
          console.log('- member.user?.id:', userId)
          console.log('- user?.id from auth:', user?.id)
          console.log('- userId === user?.id:', isCurrentUser)
          console.log('- typeof userId:', typeof userId)
          console.log('- typeof user?.id:', typeof user?.id)
          
          // Extract user data from the API response
          let userName: string
          let userEmail: string
          let memberRole: 'admin' | 'member'
          
          if (member.user) {
            // We have user data from the API
            userName = member.user.name || `${member.user.first_name || ''} ${member.user.last_name || ''}`.trim() || `User ${userId}`
            userEmail = member.user.email || 'Email not available'
            memberRole = member.role || 'member'
          } else if (isCurrentUser && user) {
            // Fallback to auth context for current user
            userName = `${user.first_name} ${user.last_name}`
            userEmail = user.email
            memberRole = groupData.created_by?.id === user.id ? 'admin' : 'member'
          } else {
            // No user data available - show placeholder
            userName = `Member ${memberId}`
            userEmail = 'Email not available'
            memberRole = 'member'
          }
          
          const processedMember = {
            id: memberId,
            name: userName,
            email: userEmail,
            role: memberRole,
            status: 'active' as const,
            isCurrentUser: isCurrentUser,
            userId: userId || memberId
          }
          
          console.log('Processed member:', processedMember)
          return processedMember
        })
        
        console.log('Final member data:', memberData)
        
        // If no members found or API failed, make current user the admin
        if (memberData.length === 0 && user) {
          console.log('No members found, adding current user as admin')
          memberData.push({
            id: user.id,
            name: `${user.first_name || 'Current'} ${user.last_name || 'User'}`,
            email: user.email || 'No email',
            role: 'admin',
            status: 'active',
            isCurrentUser: true,
            userId: user.id
          })
        }
        
        setMembers(memberData)
      } catch (err: any) {
        console.error('Error loading group data:', err)
        setError(err.message || 'Failed to load group data')
        
        // Fallback to mock data for development
        setGroup({
          id: parseInt(groupId),
          name: 'Weekend Trip 🏖️',
          description: 'Trip to the mountains',
          currency: 'USD',
          join_code: 'ABC123',
          members: []
        })
        
        // Create mock data with current user as admin
        const mockMembers = [
          {
            id: user?.id || 1,
            name: user ? `${user.first_name} ${user.last_name}` : 'Current User',
            email: user?.email || 'current@example.com',
            role: 'admin' as const,
            status: 'active' as const,
            isCurrentUser: true,
            userId: user?.id || 1
          },
          {
            id: 2,
            name: 'Person 2',
            email: 'person2@example.com',
            role: 'member' as const,
            status: 'active' as const,
            isCurrentUser: false,
            userId: 2
          },
          {
            id: 3,
            name: 'Person 3',
            email: 'person3@example.com',
            role: 'member' as const,
            status: 'pending' as const,
            isCurrentUser: false,
            userId: 3
          }
        ]
        setMembers(mockMembers)
      } finally {
        setLoading(false)
      }
    }
    
    loadGroupData()
  }, [groupId, user, authLoading])

  const handleThemeToggle = () => {
    playClick()
    toggleTheme()
  }

  const handleShareCode = () => {
    playClick()
    if (group?.join_code) {
      navigator.clipboard.writeText(group.join_code)
      alert("Group code copied to clipboard!")
    }
  }

  const handleEditGroup = () => {
    playClick()
    setIsEditingGroup(true)
  }

  const handleSaveGroup = async () => {
    if (!group || !groupId) return
    
    try {
      playClick()
      const updatedGroup = await groupAPI.patchGroup(parseInt(groupId), {
        name: editedGroupName,
        description: editedGroupDescription
      })
      setGroup(updatedGroup)
      setIsEditingGroup(false)
      playSuccess()
    } catch (err: any) {
      console.error('Error updating group:', err)
      playError()
      alert('Failed to update group: ' + (err.message || 'Unknown error'))
    }
  }

  const handleCancelEdit = () => {
    playClick()
    setEditedGroupName(group?.name || '')
    setEditedGroupDescription(group?.description || '')
    setIsEditingGroup(false)
  }

  const handleAddMember = () => {
    playClick()
    setShowAddMemberDialog(true)
  }

  const handleAddMemberSubmit = async () => {
    if (!groupId || !newMemberEmail.trim()) return
    
    try {
      playClick()
      // Note: This assumes we have a way to get user ID by email
      // In a real implementation, you might need a separate endpoint to find users by email
      // For now, we'll show an error message
      alert('Adding members by email is not yet implemented. Please use the join code feature instead.')
      setShowAddMemberDialog(false)
      setNewMemberEmail('')
    } catch (err: any) {
      console.error('Error adding member:', err)
      playError()
      alert('Failed to add member: ' + (err.message || 'Unknown error'))
    }
  }

  const handleRemoveMember = (memberId: number) => {
    playClick()
    setShowRemoveDialog(memberId)
  }

  const confirmRemoveMember = async (memberId: number) => {
    if (!groupId || !memberId) return
    
    try {
      playSuccess()
      const member = members.find(m => m.id === memberId)
      if (member) {
        await groupAPI.removeGroupMember(parseInt(groupId), member.userId)
        setMembers(members.filter((member) => member.id !== memberId))
      }
      setShowRemoveDialog(null)
    } catch (err: any) {
      console.error('Error removing member:', err)
      playError()
      alert('Failed to remove member: ' + (err.message || 'Unknown error'))
    }
  }

  const handleLeaveGroup = () => {
    playClick()
    setShowLeaveDialog(true)
  }

  const confirmLeaveGroup = async () => {
    if (!groupId || !user) return
    
    try {
      playError()
      await groupAPI.leaveGroup(parseInt(groupId))
      setShowLeaveDialog(false)
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Error leaving group:', err)
      setShowLeaveDialog(false)
      
      // Handle specific backend error messages
      let errorMessage = 'Failed to leave group'
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      
      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setError(null)
      }, 5000)
    }
  }

  const handleDeleteGroup = () => {
    playClick()
    setShowDeleteDialog(true)
  }

  const confirmDeleteGroup = async () => {
    if (!groupId) return
    
    try {
      playError()
      await groupAPI.deleteGroup(parseInt(groupId))
      setShowDeleteDialog(false)
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Error deleting group:', err)
      alert('Failed to delete group: ' + (err.message || 'Unknown error'))
    }
  }

  const currentUser = members.find((member) => member.isCurrentUser)
  const isAdmin = currentUser?.role === "admin"
  
  // Debug admin detection
  console.log('Admin detection debug:')
  console.log('- members:', members)
  console.log('- currentUser:', currentUser)
  console.log('- currentUser.role:', currentUser?.role)
  console.log('- isAdmin:', isAdmin)

  if (!groupId) {
    return (
      <ProtectedRoute>
        <div className="container">
          <div className="header">
            <Link href="/dashboard">
              <button className="back-button" onClick={() => playClick()}>
                <ArrowLeft className="icon" />
              </button>
            </Link>
            <h1>Group Settings</h1>
          </div>
          <div className="main-content">
            <div className="card">
              <p style={{ color: "var(--error)" }}>No group ID provided</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container">
          <div className="header">
            <Link href="/dashboard">
              <button className="back-button" onClick={() => playClick()}>
                <ArrowLeft className="icon" />
              </button>
            </Link>
            <h1>Group Settings</h1>
            <button className="theme-toggle" onClick={handleThemeToggle}>
              {theme === "light" ? <Moon /> : <Sun />}
            </button>
          </div>
          <div className="main-content">
            <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
              <Loader2 className="icon" style={{ animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
              <p>Loading group settings...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container">
      <div className="header">
        <Link href={`/group-dashboard/${groupId}`}>
          <button className="back-button" onClick={() => playClick()}>
            <ArrowLeft className="icon" />
          </button>
        </Link>
        <h1>Group Settings</h1>
        <button className="theme-toggle" onClick={handleThemeToggle}>
          {theme === "light" ? <Moon /> : <Sun />}
        </button>
      </div>

      {error && (
        <div className="card" style={{ backgroundColor: "var(--error-bg)", border: "1px solid var(--error)", marginBottom: "1rem" }}>
          <p style={{ color: "var(--error)", margin: 0 }}>⚠️ {error}</p>
        </div>
      )}

      <div className="main-content">
        <div className="card">
          {isEditingGroup ? (
            <div>
              <input
                type="text"
                value={editedGroupName}
                onChange={(e) => setEditedGroupName(e.target.value)}
                className="input"
                style={{ marginBottom: "1rem" }}
                placeholder="Group name"
              />
              <textarea
                value={editedGroupDescription}
                onChange={(e) => setEditedGroupDescription(e.target.value)}
                className="input"
                style={{ marginBottom: "1rem", minHeight: "80px" }}
                placeholder="Group description"
              />
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="button button-secondary" style={{ flex: 1 }} onClick={handleCancelEdit}>
                  Cancel
                </button>
                <button className="button" style={{ flex: 1 }} onClick={handleSaveGroup}>
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              {isAdmin && (
                <button 
                  onClick={handleEditGroup}
                  style={{ 
                    position: "absolute",
                    top: "0",
                    right: "0",
                    background: "transparent",
                    border: "none",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    padding: "0.25rem",
                    borderRadius: "0.25rem",
                    transition: "all 0.2s ease",
                    zIndex: 1
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--text-primary)"
                    e.currentTarget.style.backgroundColor = "var(--hover-bg)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-secondary)"
                    e.currentTarget.style.backgroundColor = "transparent"
                  }}
                  title="Edit group"
                >
                  <Edit3 size={18} />
                </button>
              )}
              <div style={{ marginBottom: "1rem", paddingRight: isAdmin ? "2rem" : "0" }}>
                <h3 style={{ margin: 0, marginBottom: "0.5rem", fontSize: "1.25rem", fontWeight: "600" }}>{group?.name || 'Group Name'}</h3>
                <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.875rem" }}>
                  {group?.description || 'No description'}
                </p>
              </div>
              
              <div style={{ 
                backgroundColor: "var(--card-bg)", 
                border: "1px solid var(--border)",
                borderRadius: "0.5rem",
                padding: "0.75rem",
                marginBottom: "1rem"
              }}>
                <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.875rem" }}>
                  Group Code: <strong style={{ color: "var(--text-primary)", fontFamily: "monospace" }}>{group?.join_code || 'Loading...'}</strong>
                </p>
              </div>

              <button 
                className="button button-secondary" 
                onClick={handleShareCode}
                style={{ width: "100%", justifyContent: "center" }}
              >
                <Share2 size={16} style={{ marginRight: "0.5rem" }} />
                Share Group Code
              </button>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: "600" }}>Members ({members.length})</h3>
            
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {members.map((member, index) => (
              <div 
                key={member.id} 
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem",
                  backgroundColor: "var(--card-bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.75rem",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "500" }}>
                      {member.name}
                    </h4>
                    <span style={{ fontSize: "1rem" }}>
                      {member.isCurrentUser ? "👤" : "👥"}
                    </span>
                  </div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: 0, marginBottom: "0.25rem" }}>
                    {member.email}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem" }}>
                    <span style={{ 
                      color: member.role === "admin" ? "var(--primary)" : "var(--text-secondary)",
                      fontWeight: member.role === "admin" ? "600" : "400"
                    }}>
                      {member.role === "admin" ? "Admin" : "Member"}
                    </span>
                    {member.isCurrentUser && (
                      <span style={{ color: "var(--text-secondary)" }}>• You</span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span 
                    className={`status-badge ${member.status === "active" ? "status-settled" : "status-pending"}`}
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "0.375rem",
                      fontWeight: "500"
                    }}
                  >
                    {member.status === "active" ? "Active" : "Pending"}
                  </span>
                  {isAdmin && !member.isCurrentUser && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      style={{
                        background: "var(--error)",
                        color: "white",
                        border: "none",
                        borderRadius: "0.375rem",
                        padding: "0.5rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease",
                        minWidth: "2rem",
                        height: "2rem"
                      }}
                    >
                      <UserMinus size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
          
        <div className="card">
          <h3 style={{ marginBottom: "1.5rem", fontSize: "1.125rem", fontWeight: "600" }}>Actions</h3>

          <button
            className="button button-secondary"
            style={{ 
              marginBottom: "1.5rem", 
              color: "var(--warning)",
              width: "100%",
              justifyContent: "center"
            }}
            onClick={handleLeaveGroup}
          >
            <LogOut size={16} style={{ marginRight: "0.5rem" }} />
            Leave Group
          </button>

          {isAdmin && (
            <div style={{
              borderTop: "1px solid var(--border)",
              paddingTop: "1.5rem"
            }}>
              <h3 style={{ 
                marginBottom: "1rem", 
                color: "var(--error)",
                fontSize: "1rem",
                fontWeight: "600"
              }}>Danger Zone</h3>
              <button 
                className="button" 
                style={{ 
                  backgroundColor: "var(--error)",
                  width: "100%",
                  justifyContent: "center"
                }} 
                onClick={handleDeleteGroup}
              >
                <Trash2 size={16} style={{ marginRight: "0.5rem" }} />
                Delete Group
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Remove Member Dialog */}
      {showRemoveDialog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowRemoveDialog(null)}
        >
          <div
            className="card"
            style={{
              margin: "1rem",
              maxWidth: "300px",
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <AlertTriangle
                style={{ width: "3rem", height: "3rem", color: "var(--warning)", margin: "0 auto 1rem" }}
              />
              <h3 style={{ marginBottom: "0.5rem" }}>Remove Member</h3>
              <p style={{ color: "var(--text-secondary)" }}>
                Are you sure you want to remove {members.find((m) => m.id === showRemoveDialog)?.name} from the group?
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="button button-secondary" style={{ flex: 1 }} onClick={() => setShowRemoveDialog(null)}>
                Cancel
              </button>
              <button
                className="button"
                style={{ flex: 1, backgroundColor: "var(--error)" }}
                onClick={() => confirmRemoveMember(showRemoveDialog)}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Group Dialog */}
      {showLeaveDialog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowLeaveDialog(false)}
        >
          <div
            className="card"
            style={{
              margin: "1rem",
              maxWidth: "300px",
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <LogOut style={{ width: "3rem", height: "3rem", color: "var(--warning)", margin: "0 auto 1rem" }} />
              <h3 style={{ marginBottom: "0.5rem" }}>Leave Group</h3>
              <p style={{ color: "var(--text-secondary)" }}>
                Are you sure you want to leave? You'll need an invitation to rejoin.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="button button-secondary" style={{ flex: 1 }} onClick={() => setShowLeaveDialog(false)}>
                Cancel
              </button>
              <button
                className="button"
                style={{ flex: 1, backgroundColor: "var(--warning)" }}
                onClick={confirmLeaveGroup}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Dialog */}
      {showAddMemberDialog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowAddMemberDialog(false)}
        >
          <div
            className="card"
            style={{
              margin: "1rem",
              maxWidth: "400px",
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: "1rem" }}>
              <h3 style={{ marginBottom: "0.5rem" }}>Add Member</h3>
              <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
                Enter the email address of the person you want to add to the group.
              </p>
              <input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="input"
                placeholder="Email address"
                style={{ marginBottom: "1rem" }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className="button button-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowAddMemberDialog(false)
                  setNewMemberEmail('')
                }}
              >
                Cancel
              </button>
              <button
                className="button"
                style={{ flex: 1 }}
                onClick={handleAddMemberSubmit}
                disabled={!newMemberEmail.trim()}
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Dialog */}
      {showDeleteDialog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowDeleteDialog(false)}
        >
          <div
            className="card"
            style={{
              margin: "1rem",
              maxWidth: "300px",
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <Trash2 style={{ width: "3rem", height: "3rem", color: "var(--error)", margin: "0 auto 1rem" }} />
              <h3 style={{ marginBottom: "0.5rem" }}>Delete Group</h3>
              <p style={{ color: "var(--text-secondary)" }}>
                This action cannot be undone. All expenses and data will be permanently deleted.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className="button button-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </button>
              <button
                className="button"
                style={{ flex: 1, backgroundColor: "var(--error)" }}
                onClick={confirmDeleteGroup}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ProtectedRoute>
  )
}
