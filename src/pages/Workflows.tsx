import React, { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { WorkflowBuilder } from '@/components/workflows/WorkflowBuilder'
import { WorkflowExecutions } from '@/components/workflows/WorkflowExecutions'
import { WorkflowEngineProvider } from '@/components/workflows/WorkflowEngine'
import { useAuthHook } from '@/hooks/useAuthHook'
import { useWorkflowEngine } from '@/hooks/useWorkflowEngine'
import { toast } from '@/hooks/use-toast'
import { supabase } from "@/lib/supabase-client";

interface Workflow {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive' | 'draft'
  trigger_type: 'manual' | 'scheduled' | 'event'
  created_at: string
  updated_at: string
}

interface WorkflowExecution {
  id: string
  workflow_id: string
  status: 'running' | 'completed' | 'failed'
  started_at: string
  completed_at?: string
  error_message?: string
}

const Workflows: React.FC = () => {
  const { user, isAuthenticated } = useAuthHook()
  const { executeWorkflow } = useWorkflowEngine()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | undefined>()
  const [activeTab, setActiveTab] = useState('workflows')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      loadWorkflows()
      loadExecutions()
    }
  }, [isAuthenticated])

  const loadWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setWorkflows(data || [])
    } catch (error) {
      console.error('Error loading workflows:', error)
      toast({ title: 'Error', description: 'Failed to load workflows' })
    } finally {
      setLoading(false)
    }
  }

  const loadExecutions = async () => {
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setExecutions(data || [])
    } catch (error) {
      console.error('Error loading executions:', error)
    }
  }

  const handleCreateWorkflow = () => {
    setSelectedWorkflow(undefined)
    setIsBuilderOpen(true)
  }

  const handleEditWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow)
    setIsBuilderOpen(true)
  }

  const handleSaveWorkflow = async () => {
    setIsBuilderOpen(false)
    await loadWorkflows()
    toast({ title: 'Success', description: 'Workflow saved successfully' })
  }

  const handleExecuteWorkflow = async (workflowId: string) => {
    try {
      await executeWorkflow(workflowId)
      await loadExecutions()
      toast({ title: 'Success', description: 'Workflow execution started' })
    } catch (error) {
      console.error('Error executing workflow:', error)
      toast({ title: 'Error', description: 'Failed to execute workflow' })
    }
  }

  const handleDeleteWorkflow = async (workflowId: string) => {
    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', workflowId)

      if (error) throw error
      await loadWorkflows()
      toast({ title: 'Success', description: 'Workflow deleted successfully' })
    } catch (error) {
      console.error('Error deleting workflow:', error)
      toast({ title: 'Error', description: 'Failed to delete workflow' })
    }
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p>Please log in to access workflows.</p>
        </div>
      </Layout>
    )
  }

  return (
    <WorkflowEngineProvider>
      <Layout>
        <div className="container mx-auto px-4 py-8" data-testid="workflows-page">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Workflows</h1>
            <Button onClick={handleCreateWorkflow} data-testid="create-workflow-btn">
              Create Workflow
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="workflows">Workflows</TabsTrigger>
              <TabsTrigger value="executions">Executions</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="workflows" className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <p>Loading workflows...</p>
                </div>
              ) : workflows.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-32">
                    <p className="text-muted-foreground mb-4">No workflows found</p>
                    <Button onClick={handleCreateWorkflow}>Create your first workflow</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {workflows.map((workflow) => (
                    <Card key={workflow.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{workflow.name}</CardTitle>
                          <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                            {workflow.status}
                          </Badge>
                        </div>
                        <CardDescription>{workflow.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            {workflow.trigger_type}
                          </span>
                          <div className="space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditWorkflow(workflow)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleExecuteWorkflow(workflow.id)}
                              disabled={workflow.status !== 'active'}
                            >
                              Run
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="executions">
              <WorkflowExecutions 
                executions={executions} 
                onRefresh={loadExecutions}
              />
            </TabsContent>

            <TabsContent value="templates">
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Templates</CardTitle>
                  <CardDescription>
                    Choose from pre-built workflow templates to get started quickly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Templates coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <WorkflowBuilder
            isOpen={isBuilderOpen}
            onClose={() => setIsBuilderOpen(false)}
            onSave={handleSaveWorkflow}
            workflow={selectedWorkflow}
          />
        </div>
      </Layout>
    </WorkflowEngineProvider>
  )
}

export default Workflows