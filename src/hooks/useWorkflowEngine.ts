import { useState } from 'react'

interface WorkflowEngineHook {
  executeWorkflow: (workflowId: string) => Promise<void>
  isExecuting: boolean
  executionHistory: WorkflowExecution[]
}

interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'running' | 'completed' | 'failed'
  startedAt: string
  completedAt?: string
  errorMessage?: string
}

export const useWorkflowEngine = (): WorkflowEngineHook => {
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionHistory, setExecutionHistory] = useState<WorkflowExecution[]>([])

  const executeWorkflow = async (workflowId: string): Promise<void> => {
    setIsExecuting(true)
    
    const executionId = `exec_${Date.now()}`
    const startedAt = new Date().toISOString()
    
    // Add to execution history
    const newExecution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: 'running',
      startedAt
    }
    
    setExecutionHistory(prev => [newExecution, ...prev])
    
    try {
      // Mock workflow execution - in real implementation this would
      // communicate with a workflow engine service
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update execution as completed
      setExecutionHistory(prev => 
        prev.map(exec => 
          exec.id === executionId 
            ? { ...exec, status: 'completed' as const, completedAt: new Date().toISOString() }
            : exec
        )
      )
      
      console.log(`Workflow ${workflowId} executed successfully`)
    } catch (error) {
      // Update execution as failed
      setExecutionHistory(prev => 
        prev.map(exec => 
          exec.id === executionId 
            ? { 
                ...exec, 
                status: 'failed' as const, 
                completedAt: new Date().toISOString(),
                errorMessage: error instanceof Error ? error.message : 'Unknown error'
              }
            : exec
        )
      )
      
      console.error(`Workflow ${workflowId} execution failed:`, error)
      throw error
    } finally {
      setIsExecuting(false)
    }
  }

  return {
    executeWorkflow,
    isExecuting,
    executionHistory
  }
}

export default useWorkflowEngine