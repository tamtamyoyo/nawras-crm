import type { FilterField } from './AdvancedFilters'

// Predefined filter configurations for different entities
export const customerFilters: FilterField[] = [
  {
    key: 'name',
    label: 'Name',
    type: 'text',
    placeholder: 'Search by name...'
  },
  {
    key: 'company',
    label: 'Company',
    type: 'text',
    placeholder: 'Search by company...'
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'prospect', label: 'Prospect' }
    ]
  },
  {
    key: 'created_at',
    label: 'Created Date',
    type: 'daterange'
  }
]

export const leadFilters: FilterField[] = [
  {
    key: 'name',
    label: 'Name',
    type: 'text',
    placeholder: 'Search by name...'
  },
  {
    key: 'status',
    label: 'Status',
    type: 'multiselect',
    options: [
      { value: 'new', label: 'New' },
      { value: 'contacted', label: 'Contacted' },
      { value: 'qualified', label: 'Qualified' },
      { value: 'converted', label: 'Converted' },
      { value: 'lost', label: 'Lost' }
    ]
  },
  {
    key: 'source',
    label: 'Source',
    type: 'select',
    options: [
      { value: 'website', label: 'Website' },
      { value: 'referral', label: 'Referral' },
      { value: 'social_media', label: 'Social Media' },
      { value: 'email_campaign', label: 'Email Campaign' },
      { value: 'cold_call', label: 'Cold Call' }
    ]
  },
  {
    key: 'score',
    label: 'Lead Score',
    type: 'numberrange',
    min: 0,
    max: 100
  }
]

export const dealFilters: FilterField[] = [
  {
    key: 'title',
    label: 'Title',
    type: 'text',
    placeholder: 'Search by title...'
  },
  {
    key: 'stage',
    label: 'Stage',
    type: 'multiselect',
    options: [
      { value: 'prospecting', label: 'Prospecting' },
      { value: 'qualification', label: 'Qualification' },
      { value: 'proposal', label: 'Proposal' },
      { value: 'negotiation', label: 'Negotiation' },
      { value: 'closed_won', label: 'Closed Won' },
      { value: 'closed_lost', label: 'Closed Lost' }
    ]
  },
  {
    key: 'value',
    label: 'Deal Value',
    type: 'numberrange',
    min: 0,
    max: 1000000,
    step: 1000
  },
  {
    key: 'expected_close_date',
    label: 'Expected Close Date',
    type: 'daterange'
  },
  {
    key: 'probability',
    label: 'Probability (%)',
    type: 'numberrange',
    min: 0,
    max: 100
  }
]