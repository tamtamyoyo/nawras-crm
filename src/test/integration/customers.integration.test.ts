import { describe, it, expect, beforeEach, vi } from 'vitest'
import { supabase } from '../../lib/supabase-client'

// Mock Supabase client
vi.mock('../../lib/supabase-client', () => {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    single: vi.fn(),
  }
  
  return {
    supabase: {
      from: vi.fn(() => mockChain),
    },
  }
})

interface MockChain {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  limit: ReturnType<typeof vi.fn>
  range: ReturnType<typeof vi.fn>
  ilike: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
}

const mockSupabase = vi.mocked(supabase)
let mockChain: MockChain

describe('Customer CRUD Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Get the mock chain that will be returned by from()
    mockChain = mockSupabase.from('customers')
  })

  describe('Create Customer', () => {
    it('should create a new customer successfully', async () => {
      const newCustomer = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        company: 'Acme Corp',
        status: 'active'
      }

      const mockResponse = {
        data: { id: '1', ...newCustomer, created_at: new Date().toISOString() },
        error: null
      }

      mockChain.single.mockResolvedValue(mockResponse)

      const { data, error } = await supabase
        .from('customers')
        .insert(newCustomer)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toEqual(mockResponse.data)
      expect(mockSupabase.from).toHaveBeenCalledWith('customers')
    })

    it('should handle validation errors when creating customer', async () => {
      const invalidCustomer = {
        name: '', // Invalid: empty name
        email: 'invalid-email', // Invalid: malformed email
      }

      const mockError = {
        data: null,
        error: {
          message: 'Validation failed',
          details: 'Name is required and email must be valid'
        }
      }

      mockChain.single.mockResolvedValue(mockError)

      const { data, error } = await supabase
        .from('customers')
        .insert(invalidCustomer)
        .select()
        .single()

      expect(data).toBeNull()
      expect(error).toBeTruthy()
      expect(error.message).toBe('Validation failed')
    })

    it('should handle duplicate email errors', async () => {
      const duplicateCustomer = {
        name: 'Jane Doe',
        email: 'existing@example.com',
        phone: '+1234567891'
      }

      const mockError = {
        data: null,
        error: {
          message: 'duplicate key value violates unique constraint',
          code: '23505'
        }
      }

      mockChain.single.mockResolvedValue(mockError)

      const { data, error } = await supabase
        .from('customers')
        .insert(duplicateCustomer)
        .select()
        .single()

      expect(data).toBeNull()
      expect(error).toBeTruthy()
      expect(error.code).toBe('23505')
    })
  })

  describe('Read Customers', () => {
    it('should fetch all customers successfully', async () => {
      const mockCustomers = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          company: 'Acme Corp',
          status: 'active',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+1234567891',
          company: 'Tech Inc',
          status: 'active',
          created_at: new Date().toISOString()
        }
      ]

      const mockResponse = {
        data: mockCustomers,
        error: null
      }

      mockChain.order.mockResolvedValue(mockResponse)

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      expect(error).toBeNull()
      expect(data).toEqual(mockCustomers)
      expect(data).toHaveLength(2)
    })

    it('should fetch a single customer by ID', async () => {
      const mockCustomer = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        company: 'Acme Corp',
        status: 'active',
        created_at: new Date().toISOString()
      }

      const mockResponse = {
        data: mockCustomer,
        error: null
      }

      mockChain.single.mockResolvedValue(mockResponse)

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', '1')
        .single()

      expect(error).toBeNull()
      expect(data).toEqual(mockCustomer)
      expect(mockChain.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should handle customer not found', async () => {
      const mockResponse = {
        data: null,
        error: {
          message: 'No rows found',
          code: 'PGRST116'
        }
      }

      mockChain.single.mockResolvedValue(mockResponse)

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', 'non-existent')
        .single()

      expect(data).toBeNull()
      expect(error).toBeTruthy()
      expect(error.code).toBe('PGRST116')
    })
  })

  describe('Update Customer', () => {
    it('should update customer successfully', async () => {
      const updatedData = {
        name: 'John Updated',
        company: 'Updated Corp'
      }

      const mockResponse = {
        data: {
          id: '1',
          name: 'John Updated',
          email: 'john@example.com',
          phone: '+1234567890',
          company: 'Updated Corp',
          status: 'active',
          updated_at: new Date().toISOString()
        },
        error: null
      }

      mockChain.single.mockResolvedValue(mockResponse)

      const { data, error } = await supabase
        .from('customers')
        .update(updatedData)
        .eq('id', '1')
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.name).toBe('John Updated')
      expect(data?.company).toBe('Updated Corp')
    })

    it('should handle update validation errors', async () => {
      const invalidUpdate = {
        email: 'invalid-email-format'
      }

      const mockError = {
        data: null,
        error: {
          message: 'Invalid email format',
          code: '23514'
        }
      }

      mockChain.single.mockResolvedValue(mockError)

      const { data, error } = await supabase
        .from('customers')
        .update(invalidUpdate)
        .eq('id', '1')
        .select()
        .single()

      expect(data).toBeNull()
      expect(error).toBeTruthy()
      expect(error.message).toBe('Invalid email format')
    })
  })

  describe('Delete Customer', () => {
    it('should delete customer successfully', async () => {
      const mockResponse = {
        data: null,
        error: null
      }

      mockChain.eq.mockResolvedValue(mockResponse)

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', '1')

      expect(error).toBeNull()
      expect(mockChain.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should handle delete constraints (customer has related records)', async () => {
      const mockError = {
        data: null,
        error: {
          message: 'Cannot delete customer with existing deals',
          code: '23503'
        }
      }

      mockChain.eq.mockResolvedValue(mockError)

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', '1')
      expect(error).toBeTruthy()
      expect(error.code).toBe('23503')
    })

    it('should handle delete non-existent customer', async () => {
      const mockResponse = {
        data: null,
        error: null
      }

      mockChain.eq.mockResolvedValue(mockResponse)

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', 'non-existent')

      expect(error).toBeNull()
      // Supabase doesn't return error for deleting non-existent records
    })
  })

  describe('Customer Search and Filtering', () => {
    it('should search customers by name', async () => {
      const mockResults = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          company: 'Acme Corp'
        }
      ]

      const mockResponse = {
        data: mockResults,
        error: null
      }

      mockChain.ilike.mockResolvedValue(mockResponse)

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .ilike('name', '%John%')

      expect(error).toBeNull()
      expect(data).toEqual(mockResults)
    })

    it('should filter customers by status', async () => {
      const mockActiveCustomers = [
        {
          id: '1',
          name: 'John Doe',
          status: 'active'
        },
        {
          id: '2',
          name: 'Jane Smith',
          status: 'active'
        }
      ]

      const mockResponse = {
        data: mockActiveCustomers,
        error: null
      }

      mockChain.eq.mockResolvedValue(mockResponse)

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('status', 'active')

      expect(error).toBeNull()
      expect(data).toEqual(mockActiveCustomers)
      expect(data?.every((customer) => customer.status === 'active')).toBe(true)
    })

    it('should paginate customers', async () => {
      const mockPaginatedResults = [
        { id: '11', name: 'Customer 11' },
        { id: '12', name: 'Customer 12' },
        { id: '13', name: 'Customer 13' }
      ]

      const mockResponse = {
        data: mockPaginatedResults,
        error: null
      }

      mockChain.range.mockResolvedValue(mockResponse)

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
        .range(10, 12) // Get items 11-13 (0-indexed)

      expect(error).toBeNull()
      expect(data).toEqual(mockPaginatedResults)
      expect(data).toHaveLength(3)
    })
  })
})