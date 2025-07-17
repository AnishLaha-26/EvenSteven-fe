"use client"

import React, { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { User, Mail } from 'lucide-react'

export const ProfileUpdate: React.FC = () => {
  const { user, updateProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await updateProfile(formData)
      setIsEditing(false)
    } catch (err: any) {
      setError(err.message || 'Profile update failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
    })
    setIsEditing(false)
    setError('')
  }

  if (!user) return null

  return (
    <div style={{
      padding: '1.5rem',
      backgroundColor: 'var(--surface)',
      borderRadius: '0.5rem',
      border: '1px solid var(--border)',
      marginBottom: '2rem'
    }}>
      <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Profile Information</h3>
      
      {error && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          color: '#dc2626',
          fontSize: '0.875rem',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}>
                <User size={18} style={{ color: 'var(--text-secondary)' }} />
              </div>
              <input
                type="text"
                name="first_name"
                placeholder="First name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                name="last_name"
                placeholder="Last name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: 'var(--primary-green)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <User size={16} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ color: 'var(--text-primary)' }}>
              {user.first_name} {user.last_name}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Mail size={16} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>{user.email}</span>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--primary-green)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Edit Profile
          </button>
        </div>
      )}
    </div>
  )
}
