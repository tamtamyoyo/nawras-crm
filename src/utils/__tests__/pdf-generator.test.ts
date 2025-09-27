import { describe, it, expect, vi } from 'vitest'
import { generateProposalPDF } from '../pdf-generator'

// Mock jsPDF
vi.mock('jspdf', () => {
  const mockPDF = {
    text: vi.fn(),
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    setFillColor: vi.fn(),
    setTextColor: vi.fn(),
    setDrawColor: vi.fn(),
    setLineWidth: vi.fn(),
    setGState: vi.fn(),
    getTextWidth: vi.fn().mockReturnValue(50),
    splitTextToSize: vi.fn().mockImplementation((text, maxWidth) => [text]),
    rect: vi.fn(),
    line: vi.fn(),
    circle: vi.fn(),
    addPage: vi.fn(),
    save: vi.fn(),
    internal: {
      pageSize: {
        width: 210,
        height: 297
      }
    }
  }
  return {
    default: vi.fn(() => mockPDF)
  }
})

// Mock jspdf-autotable
vi.mock('jspdf-autotable', () => ({}))

describe('PDF Generator', () => {
  it('should generate PDF without throwing errors', () => {
    const mockProposalData = {
      proposal: {
        id: '1',
        title: 'Test Proposal',
        content: JSON.stringify({
          sections: [
            { title: 'Introduction', content: 'Test content' }
          ]
        }),
        client_name: 'Test Client',
        total_amount: 5000,
        status: 'draft' as const,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        deal_id: '1',
        user_id: '1'
      },
      deal: {
        id: '1',
        title: 'Test Deal',
        value: 5000,
        status: 'active' as const,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        customer_id: '1',
        user_id: '1'
      },
      customer: {
        id: '1',
        name: 'Test Client',
        email: 'test@example.com',
        phone: '123-456-7890',
        company: 'Test Company',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        user_id: '1'
      }
    }

    expect(() => {
      generateProposalPDF(mockProposalData)
    }).not.toThrow()
  })

  it('should handle proposal with null content', () => {
    const mockProposalData = {
      proposal: {
        id: '1',
        title: 'Test Proposal',
        content: null,
        client_name: 'Test Client',
        total_amount: 5000,
        status: 'draft' as const,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        deal_id: '1',
        user_id: '1'
      },
      deal: {
        id: '1',
        title: 'Test Deal',
        value: 5000,
        status: 'active' as const,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        customer_id: '1',
        user_id: '1'
      },
      customer: {
        id: '1',
        name: 'Test Client',
        email: 'test@example.com',
        phone: '123-456-7890',
        company: 'Test Company',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        user_id: '1'
      }
    }

    expect(() => {
      generateProposalPDF(mockProposalData)
    }).not.toThrow()
  })
})