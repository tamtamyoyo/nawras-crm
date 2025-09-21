import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import Settings from './Settings'
import { useAuth } from '../hooks/useAuthHook'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '../lib/supabase-client'

// Mock dependencies
vi.mock('../hooks/useAuthHook')
vi.mock('@/hooks/use-toast')
vi.mock('../lib/supabase-client')

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  aud: 'authenticated',
  app_metadata: {},
  user_metadata: {},
  role: 'authenticated',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockProfile = {
  id: 'user-1',
  full_name: 'John Doe',
  phone: '+1234567890',
  company: 'Test Company',
  role: 'manager' as const,
  bio: 'Test bio',
  avatar_url: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  user_id: 'user-1'
}

const mockToast = vi.fn()
const mockRefreshProfile = vi.fn()

const mockSupabaseFrom = vi.fn()
const mockSupabaseUpdate = vi.fn()
const mockSupabaseEq = vi.fn()
const mockSupabaseAuthUpdateUser = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  
  // Mock useAuth
  const mockUseAuth = vi.mocked(useAuth)
  mockUseAuth.mockReturnValue({
    user: mockUser,
    profile: mockProfile,
    refreshProfile: mockRefreshProfile,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false
  })
  
  // Mock useToast
  vi.mocked(useToast).mockReturnValue({
    toast: mockToast
  })
  
  // Mock Supabase client
  vi.mocked(supabase).from = mockSupabaseFrom
  vi.mocked(supabase).auth = {
    updateUser: mockSupabaseAuthUpdateUser
  } as typeof supabase.auth
  
  mockSupabaseFrom.mockReturnValue({
    update: mockSupabaseUpdate
  })
  
  mockSupabaseUpdate.mockReturnValue({
    eq: mockSupabaseEq
  })
  
  mockSupabaseEq.mockResolvedValue({ error: null })
  mockSupabaseAuthUpdateUser.mockResolvedValue({ error: null })
  
  // Mock URL.createObjectURL and related APIs
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  global.URL.revokeObjectURL = vi.fn()
})

describe('Settings', () => {
  it('renders settings page with header', () => {
    render(<Settings />)
    
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Manage your account settings and preferences')).toBeInTheDocument()
  })
  
  it('renders all navigation tabs', () => {
    render(<Settings />)
    
    expect(screen.getByText('Profile Settings')).toBeInTheDocument()
    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByText('Security')).toBeInTheDocument()
    expect(screen.getByText('Data Management')).toBeInTheDocument()
  })
  
  it('shows profile tab by default', () => {
    render(<Settings />)
    
    expect(screen.getByText('Profile Information')).toBeInTheDocument()
    expect(screen.getByText('Update your personal information and profile details')).toBeInTheDocument()
  })
  
  it('populates profile form with user data', () => {
    render(<Settings />)
    
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test bio')).toBeInTheDocument()
  })
  
  it('handles profile form submission successfully', async () => {
    render(<Settings />)
    
    const nameInput = screen.getByDisplayValue('John Doe')
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } })
    
    const saveButton = screen.getByText('Save Changes')
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      // No longer calling users table since we removed it
      expect(mockRefreshProfile).toHaveBeenCalled()
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.'
      })
    })
  })
  
  it('handles profile form validation errors', async () => {
    render(<Settings />)
    
    const nameInput = screen.getByDisplayValue('John Doe')
    fireEvent.change(nameInput, { target: { value: '' } })
    
    const saveButton = screen.getByText('Save Changes')
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(screen.getByText('Full name is required')).toBeInTheDocument()
    })
  })
  
  it('handles profile update errors', async () => {
    mockSupabaseEq.mockResolvedValue({ error: new Error('Update failed') })
    
    render(<Settings />)
    
    const saveButton = screen.getByText('Save Changes')
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive'
      })
    })
  })
  
  it('switches to notifications tab', () => {
    render(<Settings />)
    
    const notificationsTab = screen.getByText('Notifications')
    fireEvent.click(notificationsTab)
    
    expect(screen.getByText('Notification Preferences')).toBeInTheDocument()
    expect(screen.getByText('Choose what notifications you want to receive')).toBeInTheDocument()
  })
  
  it('displays notification switches', () => {
    render(<Settings />)
    
    const notificationsTab = screen.getByText('Notifications')
    fireEvent.click(notificationsTab)
    
    expect(screen.getByText('Email Notifications')).toBeInTheDocument()
    expect(screen.getByText('Push Notifications')).toBeInTheDocument()
    expect(screen.getByText('Deal Updates')).toBeInTheDocument()
    expect(screen.getByText('Proposal Updates')).toBeInTheDocument()
    expect(screen.getByText('Invoice Updates')).toBeInTheDocument()
    expect(screen.getByText('Calendar Reminders')).toBeInTheDocument()
  })
  
  it('handles notification toggle changes', async () => {
    render(<Settings />)
    
    const notificationsTab = screen.getByText('Notifications')
    fireEvent.click(notificationsTab)
    
    const emailSwitch = screen.getByRole('switch', { name: /email notifications/i })
    fireEvent.click(emailSwitch)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Notification settings updated',
        description: 'Your notification preferences have been saved.'
      })
    })
  })
  
  it('switches to security tab', () => {
    render(<Settings />)
    
    const securityTab = screen.getByText('Security')
    fireEvent.click(securityTab)
    
    expect(screen.getByText('Security Settings')).toBeInTheDocument()
    expect(screen.getByText('Manage your account security and password')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })
  
  it('opens password change modal', () => {
    render(<Settings />)
    
    const securityTab = screen.getByText('Security')
    fireEvent.click(securityTab)
    
    const changePasswordButton = screen.getByText('Change Password')
    fireEvent.click(changePasswordButton)
    
    expect(screen.getByText('Enter your current password and choose a new one.')).toBeInTheDocument()
  })
  
  it('handles password change form submission', async () => {
    render(<Settings />)
    
    const securityTab = screen.getByText('Security')
    fireEvent.click(securityTab)
    
    const changePasswordButton = screen.getByText('Change Password')
    fireEvent.click(changePasswordButton)
    
    const currentPasswordInput = screen.getByPlaceholderText('Enter current password')
    fireEvent.change(currentPasswordInput, { target: { value: 'oldpassword' } })
    
    const newPasswordInput = screen.getByPlaceholderText('Enter new password')
    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } })
    
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password')
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } })
    
    const updateButton = screen.getByText('Update Password')
    fireEvent.click(updateButton)
    
    await waitFor(() => {
      expect(mockSupabaseAuthUpdateUser).toHaveBeenCalledWith({
        password: 'newpassword123'
      })
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Password updated',
        description: 'Your password has been updated successfully.'
      })
    })
  })
  
  it('handles password validation errors', async () => {
    render(<Settings />)
    
    const securityTab = screen.getByText('Security')
    fireEvent.click(securityTab)
    
    const changePasswordButton = screen.getByText('Change Password')
    fireEvent.click(changePasswordButton)
    
    const newPasswordInput = screen.getByPlaceholderText('Enter new password')
    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } })
    
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password')
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } })
    
    const updateButton = screen.getByText('Update Password')
    fireEvent.click(updateButton)
    
    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument()
    })
  })
  
  it('handles password update errors', async () => {
    mockSupabaseAuthUpdateUser.mockResolvedValue({ error: new Error('Update failed') })
    
    render(<Settings />)
    
    const securityTab = screen.getByText('Security')
    fireEvent.click(securityTab)
    
    const changePasswordButton = screen.getByText('Change Password')
    fireEvent.click(changePasswordButton)
    
    const currentPasswordInput = screen.getByPlaceholderText('Enter current password')
    fireEvent.change(currentPasswordInput, { target: { value: 'oldpassword' } })
    
    const newPasswordInput = screen.getByPlaceholderText('Enter new password')
    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } })
    
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password')
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } })
    
    const updateButton = screen.getByText('Update Password')
    fireEvent.click(updateButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to update password. Please try again.',
        variant: 'destructive'
      })
    })
  })
  
  it('toggles password visibility', () => {
    render(<Settings />)
    
    const securityTab = screen.getByText('Security')
    fireEvent.click(securityTab)
    
    const changePasswordButton = screen.getByText('Change Password')
    fireEvent.click(changePasswordButton)
    
    const currentPasswordInput = screen.getByPlaceholderText('Enter current password')
    expect(currentPasswordInput).toHaveAttribute('type', 'password')
    
    const toggleButtons = screen.getAllByRole('button')
    const eyeButton = toggleButtons.find(button => button.querySelector('svg'))
    if (eyeButton) {
      fireEvent.click(eyeButton)
      expect(currentPasswordInput).toHaveAttribute('type', 'text')
    }
  })
  
  it('closes password modal when cancel is clicked', () => {
    render(<Settings />)
    
    const securityTab = screen.getByText('Security')
    fireEvent.click(securityTab)
    
    const changePasswordButton = screen.getByText('Change Password')
    fireEvent.click(changePasswordButton)
    
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)
    
    expect(screen.queryByText('Enter your current password and choose a new one.')).not.toBeInTheDocument()
  })
  
  it('switches to data management tab', () => {
    render(<Settings />)
    
    const dataTab = screen.getByText('Data Management')
    fireEvent.click(dataTab)
    
    expect(screen.getByText('Export your data and manage your account')).toBeInTheDocument()
    expect(screen.getByText('Export Data')).toBeInTheDocument()
    expect(screen.getByText('Delete Account')).toBeInTheDocument()
  })
  
  it('handles data export successfully', async () => {
    render(<Settings />)
    
    const dataTab = screen.getByText('Data Management')
    fireEvent.click(dataTab)
    
    const exportButton = screen.getByText('Export Data')
    fireEvent.click(exportButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Data exported',
        description: 'Your data has been exported successfully.'
      })
    })
  })
  
  it('handles data export errors', async () => {
    global.URL.createObjectURL = vi.fn(() => {
      throw new Error('Export failed')
    })
    
    render(<Settings />)
    
    const dataTab = screen.getByText('Data Management')
    fireEvent.click(dataTab)
    
    const exportButton = screen.getByText('Export Data')
    fireEvent.click(exportButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Export failed',
        description: 'Failed to export data. Please try again.',
        variant: 'destructive'
      })
    })
  })
  
  it('shows delete account button as disabled', () => {
    render(<Settings />)
    
    const dataTab = screen.getByText('Data Management')
    fireEvent.click(dataTab)
    
    const deleteButton = screen.getByText('Delete Account')
    expect(deleteButton).toBeDisabled()
    expect(screen.getByText('Contact support to delete your account')).toBeInTheDocument()
  })
  
  it('handles role selection in profile form', () => {
    render(<Settings />)
    
    const roleSelect = screen.getByText('Manager')
    fireEvent.click(roleSelect)
    
    const adminOption = screen.getByText('Administrator')
    fireEvent.click(adminOption)
    
    expect(screen.getByText('Administrator')).toBeInTheDocument()
  })
  
  it('shows loading state during profile save', async () => {
    // Mock a delayed response
    mockSupabaseEq.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve({ error: null }), 100)
    }))
    
    render(<Settings />)
    
    const saveButton = screen.getByText('Save Changes')
    fireEvent.click(saveButton)
    
    expect(screen.getByText('Saving...')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument()
    })
  })
  
  it('shows loading state during password update', async () => {
    // Mock a delayed response
    mockSupabaseAuthUpdateUser.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve({ error: null }), 100)
    }))
    
    render(<Settings />)
    
    const securityTab = screen.getByText('Security')
    fireEvent.click(securityTab)
    
    const changePasswordButton = screen.getByText('Change Password')
    fireEvent.click(changePasswordButton)
    
    const currentPasswordInput = screen.getByPlaceholderText('Enter current password')
    fireEvent.change(currentPasswordInput, { target: { value: 'oldpassword' } })
    
    const newPasswordInput = screen.getByPlaceholderText('Enter new password')
    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } })
    
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password')
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } })
    
    const updateButton = screen.getByText('Update Password')
    fireEvent.click(updateButton)
    
    expect(screen.getByText('Updating...')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.queryByText('Updating...')).not.toBeInTheDocument()
    })
  })
  
  it('handles missing user gracefully', () => {
    const mockUseAuthNull = vi.mocked(useAuth)
    mockUseAuthNull.mockReturnValue({
      user: null,
      profile: null,
      refreshProfile: mockRefreshProfile,
      login: vi.fn(),
      logout: vi.fn(),
      loading: false
    })
    
    render(<Settings />)
    
    expect(screen.getByText('Settings')).toBeInTheDocument()
    
    const saveButton = screen.getByText('Save Changes')
    fireEvent.click(saveButton)
    
    // Should not attempt to save without user
    expect(mockSupabaseFrom).not.toHaveBeenCalled()
  })
})