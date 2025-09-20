import React, { createContext, useContext, ReactNode } from 'react'

interface WorkflowEngineContextType {
  executeWorkflow: (workflowId: string) => Promise<void>
  isExecuting: boolean
}

const WorkflowEngineContext = createContext<WorkflowEngineContextType | undefined>(undefined)

interface WorkflowEngineProviderProps {
  children: ReactNode
}

export const WorkflowEngineProvider: React.FC<WorkflowEngineProviderProps> = ({ children }) => {
  const executeWorkflow = async (workflowId: string) => {
    // Mock implementation for now
    console.log(`Executing workflow: ${workflowId}`)
    return Promise.resolve()
  }

  const value = {
    executeWorkflow,
    isExecuting: false
  }

  return (
    <WorkflowEngineContext.Provider value={value} data-testid="workflow-engine-provider">
      {children}
    </WorkflowEngineContext.Provider>
  )
}

export const useWorkflowEngineContext = () => {
  const context = useContext(WorkflowEngineContext)
  if (context === undefined) {
    throw new Error('useWorkflowEngineContext must be used within a WorkflowEngineProvider')
  }
  return context
}