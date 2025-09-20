import { describe, it, expect, vi } from 'vitest'
import { generateProposalPDF } from '../pdf-generator'

// Mock jsPDF
vi.mock('jspdf', () => {
  const mockPDF = {
    text: vi.fn(),
    setFontSize: vi.fn(),
    setFont: vi.fn(),
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
    const mockProposal = {
      id: '1',
      title: 'Test Proposal',
      content: {
        sections: [
          { title: 'Introduction', content: 'Test content' }
        ]
      },
      client_name: 'Test Client',
      total_amount: 5000,
      status: 'draft' as const,
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    }

    expect(() => {
      generateProposalPDF(mockProposal)
    }).not.toThrow()
  })

  it('should handle proposal with null content', () => {
    const mockProposal = {
      id: '1',
      title: 'Test Proposal',
      content: null,
      client_name: 'Test Client',
      total_amount: 5000,
      status: 'draft' as const,
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    }

    expect(() => {
      generateProposalPDF(mockProposal)
    }).not.toThrow()
  })
})