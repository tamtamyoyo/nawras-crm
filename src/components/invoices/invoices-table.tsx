import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"
import { DataTableColumnHeader } from "@/components/ui/data-table"
import { Building, User, Calendar, Eye, Edit, Trash2, DollarSign, Download } from "lucide-react"
import { Database } from "@/lib/database.types"
import { generateInvoicePDF } from "@/utils/pdf-generator"

type Invoice = Database['public']['Tables']['invoices']['Row']

interface InvoicesTableProps {
  data: Invoice[]
  deals: Database['public']['Tables']['deals']['Row'][]
  customers: Database['public']['Tables']['customers']['Row'][]
  onView: (invoice: Invoice) => void
  onEdit: (invoice: Invoice) => void
  onDelete: (invoice: Invoice) => void
  onStatusUpdate: (invoice: Invoice, status: string) => void
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'paid': return 'default'
    case 'overdue': return 'destructive'
    case 'sent': return 'secondary'
    default: return 'outline'
  }
}

const INVOICE_STATUS = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' }
]

export function InvoicesTable({
  data,
  deals,
  customers,
  onView,
  onEdit,
  onDelete,
  onStatusUpdate
}: InvoicesTableProps) {
  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: "invoice_number",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Invoice" />
      ),
      cell: ({ row }) => {
        const invoice = row.original
        const deal = deals.find(d => d.id === invoice.deal_id)
        const customer = deal ? customers.find(c => c.id === deal.customer_id) : null
        
        return (
          <div className="space-y-1">
            <div className="font-medium">#{invoice.invoice_number}</div>
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
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number
        
        return (
          <div className="flex items-center font-medium">
            <DollarSign className="h-4 w-4 mr-1" />
            <span>${amount?.toLocaleString() || '0'}</span>
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
        const statusConfig = INVOICE_STATUS.find(s => s.value === status)
        
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
      accessorKey: "due_date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Due Date" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("due_date") as string
        if (!date) return <span className="text-muted-foreground">-</span>
        
        const dueDate = new Date(date)
        const isOverdue = dueDate < new Date() && row.original.status !== 'paid'
        
        return (
          <div className={`flex items-center ${isOverdue ? 'text-red-600' : ''}`}>
            <Calendar className="h-3 w-3 mr-1" />
            <span>{dueDate.toLocaleDateString()}</span>
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
        const invoice = row.original
        
        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(invoice)}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(invoice)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(invoice)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const deal = deals.find(d => d.id === invoice.deal_id)
                const customer = deal ? customers.find(c => c.id === deal.customer_id) : null
                if (customer && deal) {
                  generateInvoicePDF({ invoice, deal, customer })
                }
              }}
              className="h-8 w-8 p-0"
            >
              <Download className="h-4 w-4" />
            </Button>
            {invoice.status === 'draft' && (
              <Button
                size="sm"
                onClick={() => onStatusUpdate(invoice, 'sent')}
                className="h-8"
              >
                Send
              </Button>
            )}
            {invoice.status === 'sent' && (
              <Button
                size="sm"
                onClick={() => onStatusUpdate(invoice, 'paid')}
                variant="outline"
                className="h-8"
              >
                Mark Paid
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
      searchKey="invoice_number"
      searchPlaceholder="Search invoices..."
    />
  )
}