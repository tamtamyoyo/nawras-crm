import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Workflow {
  id?: string
  name?: string
  description?: string
  status?: 'active' | 'inactive' | 'draft'
  trigger_type?: 'manual' | 'scheduled' | 'event'
  created_at?: string
  updated_at?: string
}

interface WorkflowBuilderProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  workflow?: Workflow
}

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  isOpen,
  onClose,
  onSave,
  workflow
}) => {
  const handleSave = () => {
    onSave()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {workflow ? `Edit Workflow: ${workflow.name}` : 'Create New Workflow'}
          </DialogTitle>
          <DialogDescription>
            {workflow ? 'Modify your existing workflow' : 'Create an automated workflow to streamline your business processes'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Configure the basic settings for your workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Workflow Name</label>
                <Input 
                  placeholder="Enter workflow name" 
                  defaultValue={workflow?.name || ''}
                  data-testid="workflow-name-input"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  placeholder="Describe what this workflow does" 
                  defaultValue={workflow?.description || ''}
                  data-testid="workflow-description-input"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Trigger Type</label>
                <Select defaultValue={workflow?.trigger_type || 'manual'}>
                  <SelectTrigger data-testid="trigger-type-select">
                    <SelectValue placeholder="Select trigger type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="event">Event-based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Workflow Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow Steps</CardTitle>
              <CardDescription>Define the actions that will be executed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <p className="text-gray-500 mb-4">Drag and drop workflow steps here</p>
                  <Button variant="outline" data-testid="add-step-button">
                    Add Step
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>Conditions</CardTitle>
              <CardDescription>Set conditions for when this workflow should run</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <p className="text-gray-500 mb-4">Add conditions to control workflow execution</p>
                  <Button variant="outline" data-testid="add-condition-button">
                    Add Condition
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-2 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Close Builder
          </Button>
          <Button onClick={handleSave} data-testid="save-workflow-button">
            Save Workflow
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default WorkflowBuilder