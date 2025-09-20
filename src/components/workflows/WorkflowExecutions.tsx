import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface WorkflowExecution {
  id: string
  workflow_id: string
  workflow_name?: string
  status: 'running' | 'completed' | 'failed'
  started_at: string
  completed_at?: string
  error_message?: string
  duration?: number
}

interface WorkflowExecutionsProps {
  executions: WorkflowExecution[]
  onRefresh: () => void
}

export const WorkflowExecutions: React.FC<WorkflowExecutionsProps> = ({
  executions,
  onRefresh
}) => {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'running':
        return 'secondary'
      case 'failed':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const formatDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return 'Running...'
    
    const start = new Date(startTime)
    const end = new Date(endTime)
    const duration = Math.round((end.getTime() - start.getTime()) / 1000)
    
    if (duration < 60) return `${duration}s`
    if (duration < 3600) return `${Math.round(duration / 60)}m`
    return `${Math.round(duration / 3600)}h`
  }

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString()
  }

  return (
    <div className="space-y-4" data-testid="workflow-executions">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Workflow Executions</h3>
          <p className="text-sm text-muted-foreground">
            View the history and status of workflow executions
          </p>
        </div>
        <Button onClick={onRefresh} variant="outline" data-testid="refresh-executions-button">
          Refresh Executions
        </Button>
      </div>

      {executions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-32">
            <p className="text-muted-foreground mb-4">No executions found</p>
            <p className="text-sm text-muted-foreground">
              Workflow executions will appear here once you start running workflows
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Executions</CardTitle>
            <CardDescription>
              Executions: {executions.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executions.map((execution) => (
                  <TableRow key={execution.id}>
                    <TableCell className="font-medium">
                      {execution.workflow_name || execution.workflow_id}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(execution.status)}>
                        {execution.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDateTime(execution.started_at)}
                    </TableCell>
                    <TableCell>
                      {formatDuration(execution.started_at, execution.completed_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        {execution.status === 'failed' && (
                          <Button size="sm" variant="outline">
                            Retry
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Execution Details Modal would go here */}
    </div>
  )
}

export default WorkflowExecutions