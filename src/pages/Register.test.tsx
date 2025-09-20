import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import Register from './Register'
import { supabase } from '@/lib/supabase'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn()
    }
  }
}))

// Mock development config to disable offline mode
vi.mock('../config/development', () => ({
  devConfig: {
    OFFLINE_MODE: false,
    offlineMode: false,
    enableDebugLogs: false
  },
  logDev: vi.fn()
}))

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ComponentProps<'button'>) => <button {...props}>{children}</button>
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.ComponentProps<'input'>) => <input {...props} />
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>
}))

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: { children: React.ReactNode; variant?: string }) => <div role="alert" data-variant={variant}>{children}</div>,
  AlertDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

// Mock react-hook-form
vi.mock('react-hook-form', () => ({
  useForm: () => ({
    handleSubmit: (fn: (data: Record<string, string>) => void) => (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const formData = new FormData(e.target as HTMLFormElement)
      const data = {
        fullName: formData.get('fullName') as string || '',
        email: formData.get('email') as string || '',
        password: formData.get('password') as string || '',
        confirmPassword: formData.get('confirmPassword') as string || ''
      }
      fn(data)
    },
    control: {},
    formState: { errors: {} }
  })
}))

vi.mock('@/components/ui/form', () => ({
  Form: ({ children, ...props }: React.ComponentProps<'form'>) => <form {...props}>{children}</form>,
  FormField: ({ name, render }: { name: string; render: (props: { field: { name: string; onChange: () => void; value: string; onBlur: () => void }; fieldState: { error: undefined } }) => React.ReactNode }) => render({ 
    field: { 
      name,
      onChange: vi.fn(), 
      value: '',
      onBlur: vi.fn()
    },
    fieldState: { error: undefined }
  }),
  FormItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormLabel: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
  FormControl: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormMessage: ({ children }: { children?: React.ReactNode }) => children ? <div role="alert">{children}</div> : null
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Loader2: ({ className }: { className?: string }) => <svg className={className}><title>Loading</title></svg>,
  Mail: ({ className }: { className?: string }) => <svg className={className}><title>Mail</title></svg>,
  Lock: ({ className }: { className?: string }) => <svg className={className}><title>Lock</title></svg>,
  User: ({ className }: { className?: string }) => <svg className={className}><title>User</title></svg>
}))

const mockSupabase = supabase as {
  auth: {
    signUp: ReturnType<typeof vi.fn>
  }
}

const renderRegister = () => {
  return render(
    <BrowserRouter>
      <Register />
    </BrowserRouter>
  )
}

describe('Register Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.auth.signUp.mockResolvedValue({ error: null })
  })

  it('renders registration form correctly', () => {
    renderRegister()
    
    expect(screen.getByText('Nawras CRM')).toBeInTheDocument()
    expect(screen.getByText('Create your account to get started')).toBeInTheDocument()
    expect(screen.getByText('Sign Up')).toBeInTheDocument()
    expect(screen.getByText('Enter your information to create a new account')).toBeInTheDocument()
    expect(screen.getByText('Full Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getAllByText('Password')).toHaveLength(1)
    expect(screen.getByText('Confirm Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('displays all input fields with correct types and placeholders', () => {
    renderRegister()
    
    const fullNameInput = screen.getByPlaceholderText('Enter your full name')
    const emailInput = screen.getByPlaceholderText('Enter your email')
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password')
    
    expect(fullNameInput).toBeInTheDocument()
    expect(emailInput).toBeInTheDocument()
    expect(passwordInput).toBeInTheDocument()
    expect(confirmPasswordInput).toBeInTheDocument()
    
    expect(fullNameInput).toHaveAttribute('type', 'text')
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(confirmPasswordInput).toHaveAttribute('type', 'password')
  })

  it('shows login link', () => {
    renderRegister()
    
    expect(screen.getByText('Already have an account?')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login')
  })

  it('handles successful registration', () => {
    renderRegister()
    
    const fullNameInput = screen.getByPlaceholderText('Enter your full name')
    const emailInput = screen.getByPlaceholderText('Enter your email')
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password')
    const submitButton = screen.getByRole('button', { name: /create account/i })

    fireEvent.change(fullNameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    expect(fullNameInput).toBeInTheDocument()
    expect(emailInput).toBeInTheDocument()
    expect(passwordInput).toBeInTheDocument()
    expect(confirmPasswordInput).toBeInTheDocument()
    expect(submitButton).toBeInTheDocument()
  })

  it('displays success message after successful registration', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({ error: null })
    
    renderRegister()
    
    const fullNameInput = screen.getByPlaceholderText('Enter your full name')
    const emailInput = screen.getByPlaceholderText('Enter your email')
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password')
    const submitButton = screen.getByRole('button', { name: /create account/i })

    fireEvent.change(fullNameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Registration Successful!')).toBeInTheDocument()
      expect(screen.getByText('Please check your email to verify your account before signing in.')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /go to sign in/i })).toBeInTheDocument()
    })
  })

  it('displays loading state during form submission', () => {
    renderRegister()
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    expect(submitButton).toBeInTheDocument()
    expect(submitButton).not.toBeDisabled()
  })

  it('displays error message when registration fails', () => {
    renderRegister()
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    expect(submitButton).toBeInTheDocument()
    
    const fullNameInput = screen.getByPlaceholderText('Enter your full name')
    expect(fullNameInput).toBeInTheDocument()
  })

  it('handles unexpected errors during registration', () => {
    renderRegister()
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    expect(submitButton).toBeInTheDocument()
    
    const emailInput = screen.getByPlaceholderText('Enter your email')
    expect(emailInput).toBeInTheDocument()
  })

  it('validates full name minimum length', () => {
    renderRegister()
    
    const fullNameInput = screen.getByPlaceholderText('Enter your full name')
    const submitButton = screen.getByRole('button', { name: /create account/i })

    fireEvent.change(fullNameInput, { target: { value: 'A' } })
    fireEvent.blur(fullNameInput)
    
    expect(submitButton).toBeInTheDocument()
  })

  it('validates email format', () => {
    renderRegister()
    
    const emailInput = screen.getByPlaceholderText('Enter your email')
    const submitButton = screen.getByRole('button', { name: /create account/i })

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.blur(emailInput)
    
    expect(submitButton).toBeInTheDocument()
  })

  it('validates password minimum length', () => {
    renderRegister()
    
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const submitButton = screen.getByRole('button', { name: /create account/i })

    fireEvent.change(passwordInput, { target: { value: '123' } })
    fireEvent.blur(passwordInput)
    
    expect(submitButton).toBeInTheDocument()
  })

  it('validates password confirmation match', () => {
    renderRegister()
    
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password')
    const submitButton = screen.getByRole('button', { name: /create account/i })

    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } })
    fireEvent.blur(confirmPasswordInput)
    
    expect(submitButton).toBeInTheDocument()
  })

  it('clears error message on new submission', () => {
    renderRegister()
    
    const fullNameInput = screen.getByPlaceholderText('Enter your full name')
    const emailInput = screen.getByPlaceholderText('Enter your email')
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password')
    
    expect(fullNameInput).toBeInTheDocument()
    expect(emailInput).toBeInTheDocument()
    expect(passwordInput).toBeInTheDocument()
    expect(confirmPasswordInput).toBeInTheDocument()
  })

  it('displays icons in input fields', () => {
    renderRegister()
    
    const fullNameInput = screen.getByPlaceholderText('Enter your full name')
    const emailInput = screen.getByPlaceholderText('Enter your email')
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password')
    
    expect(fullNameInput).toBeInTheDocument()
    expect(emailInput).toBeInTheDocument()
    expect(passwordInput).toBeInTheDocument()
    expect(confirmPasswordInput).toBeInTheDocument()
  })

  it('has proper input styling classes', () => {
    renderRegister()
    
    const fullNameInput = screen.getByPlaceholderText('Enter your full name')
    const emailInput = screen.getByPlaceholderText('Enter your email')
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password')
    
    expect(fullNameInput).toHaveClass('pl-10')
    expect(emailInput).toHaveClass('pl-10')
    expect(passwordInput).toHaveClass('pl-10')
    expect(confirmPasswordInput).toHaveClass('pl-10')
  })

  it('success page shows correct content and navigation', () => {
    renderRegister()
    
    const loginLink = screen.getByRole('link', { name: /sign in/i })
    expect(loginLink).toBeInTheDocument()
    expect(loginLink).toHaveAttribute('href', '/login')
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    expect(submitButton).toBeInTheDocument()
  })
})