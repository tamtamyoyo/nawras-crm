import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTableColumnHeader } from "@/components/ui/data-table"
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"
import { Building, Calendar, Download, Edit, Eye, Send, Trash2, User } from "lucide-react"
import { toast } from "sonner"
import { generateProposalPDF } from "@/utils/pdf-generator"
import type { Database } from "@/lib/database.types"
import type { Customer, Deal } from "@/services/offlineDataService"

type Proposal = Database['public']['Tables']['proposals']['Row']

interface ProposalsTableProps {
  data: Proposal[]
  deals: Deal[]
  customers: Customer[]
  onView: (proposal: Proposal) => void
  onEdit: (proposal: Proposal) => void
  onDelete: (proposal: Proposal) => void
  onStatusUpdate: (proposal: Proposal, status: string) => void
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'accepted': return 'default'
    case 'rejected': return 'destructive'
    case 'sent': return 'secondary'
    default: return 'outline'
  }
}

const PROPOSAL_STATUS = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' }
]

export function ProposalsTable({
  data,
  deals,
  customers,
  onView,
  onEdit,
  onDelete,
  onStatusUpdate
}: ProposalsTableProps) {
  const handleDownload = async (proposal: Proposal) => {
    try {
      const deal = deals.find(d => d.id === proposal.deal_id)
      const customer = deal ? customers.find(c => c.id === deal.customer_id) : null
      
      if (!deal || !customer) {
        toast.error('Missing deal or customer information for PDF generation')
        return
      }
      
      await generateProposalPDF({
        proposal,
        deal,
        customer
      })
      
      toast.success('Proposal PDF downloaded successfully')
    } catch (error) {
      console.error('Error generating proposal PDF:', error)
      toast.error('Failed to generate proposal PDF')
    }
  }
  const columns: ColumnDef<Proposal>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Title" />
      ),
      cell: ({ row }) => {
        const proposal = row.original
        const deal = deals.find(d => d.id === proposal.deal_id)
        const customer = deal ? customers.find(c => c.id === deal.customer_id) : null
        
        return (
          <div className="space-y-1">
            <div className="font-medium">{proposal.title}</div>
            {deal && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Building className="h-3 w-3 mr-1" />
                <span>{deal.title}</span>
              </div>
            )}
            {customer && (
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="h-3 w-3 mr-1" />
                <span>{customer.name}</span>
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const statusConfig = PROPOSAL_STATUS.find(s => s.value === status)
        
        return (
          <Badge variant={getStatusVariant(status)}>
            {statusConfig?.label || status}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "valid_until",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Valid Until" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("valid_until") as string
        if (!date) return <span className="text-muted-foreground">-</span>
        
        return (
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            <span>{new Date(date).toLocaleDateString()}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string
        return (
          <div className="text-sm text-muted-foreground">
            {new Date(date).toLocaleDateString()}
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const proposal = row.original
        
        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(proposal)}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(proposal)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(proposal)}
              className="h-8 w-8 p-0"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(proposal)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            {proposal.status === 'draft' && (
              <Button
                size="sm"
                onClick={() => onStatusUpdate(proposal, 'sent')}
                className="h-8"
              >
                <Send className="h-4 w-4 mr-1" />
                Send
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <EnhancedDataTable
      columns={columns}
      data={data}
      searchKey="title"
      searchPlaceholder="Search proposals..."
    />
  )
}