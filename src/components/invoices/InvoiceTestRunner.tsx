import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TestTube, Play, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react'
import { runInvoiceTests, type TestResult } from '@/utils/invoice-test-suite'
import { useToast } from '@/hooks/use-toast'

interface InvoiceTestRunnerProps {
  onTestComplete?: (results: TestResult[]) => void
}

export function InvoiceTestRunner({ onTestComplete }: InvoiceTestRunnerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  const handleRunTests = async () => {
    setIsRunning(true)
    setResults([])
    setProgress(0)
    
    try {
      toast({
        title: 'Starting Tests',
        description: 'Running comprehensive invoice functionality tests...'
      })
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 500)
      
      const testResults = await runInvoiceTests()
      
      clearInterval(progressInterval)
      setProgress(100)
      setResults(testResults)
      
      const passed = testResults.filter(r => r.status === 'pass').length
      const failed = testResults.filter(r => r.status === 'fail').length
      const warnings = testResults.filter(r => r.status === 'warning').length
      
      toast({
        title: 'Tests Completed',
        description: `${passed} passed, ${failed} failed, ${warnings} warnings`,
        variant: failed > 0 ? 'destructive' : 'default'
      })
      
      onTestComplete?.(testResults)
    } catch (error) {
      console.error('Test execution failed:', error)
      toast({
        title: 'Test Failed',
        description: 'An error occurred while running tests',
        variant: 'destructive'
      })
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      pass: 'bg-green-100 text-green-800',
      fail: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800'
    }
    
    return (
      <Badge className={variants[status]}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  const groupedResults = results.reduce((acc, result) => {
    const section = result.testName.split(' - ')[0] || 'General'
    if (!acc[section]) acc[section] = []
    acc[section].push(result)
    return acc
  }, {} as Record<string, TestResult[]>)

  const summary = {
    total: results.length,
    passed: results.filter(r => r.status === 'pass').length,
    failed: results.filter(r => r.status === 'fail').length,
    warnings: results.filter(r => r.status === 'warning').length
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Invoice Test Suite
        </CardTitle>
        <CardDescription>
          Comprehensive testing for invoice functionality including data persistence, edge cases, and UI validation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Controls */}
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleRunTests} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run All Tests
              </>
            )}
          </Button>
          
          {isRunning && (
            <div className="flex-1">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground mt-1">
                Progress: {progress}%
              </p>
            </div>
          )}
        </div>

        {/* Test Summary */}
        {results.length > 0 && (
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{summary.total}</div>
                <div className="text-sm text-muted-foreground">Total Tests</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{summary.warnings}</div>
                <div className="text-sm text-muted-foreground">Warnings</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Test Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Results</h3>
            <ScrollArea className="h-96 w-full border rounded-md p-4">
              {Object.entries(groupedResults).map(([section, sectionResults]) => (
                <div key={section} className="mb-6">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2 uppercase tracking-wide">
                    {section}
                  </h4>
                  <div className="space-y-2">
                    {sectionResults.map((result, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="flex-shrink-0 mt-0.5">
                          {getStatusIcon(result.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {result.testName.replace(`${section} - `, '')}
                            </span>
                            {getStatusBadge(result.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {result.message}
                          </p>
                          {result.details && (
                            <details className="mt-2">
                              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                View Details
                              </summary>
                              <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                                {JSON.stringify(result.details, null, 2)}
                              </pre>
                            </details>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(result.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
        )}

        {/* Test Recommendations */}
        {results.length > 0 && summary.failed > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 text-sm">Issues Found</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-red-700 space-y-1">
                {results
                  .filter(r => r.status === 'fail')
                  .map((result, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      <span>{result.testName}: {result.message}</span>
                    </li>
                  ))
                }
              </ul>
            </CardContent>
          </Card>
        )}

        {results.length > 0 && summary.warnings > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800 text-sm">Warnings</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-yellow-700 space-y-1">
                {results
                  .filter(r => r.status === 'warning')
                  .map((result, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-yellow-500">•</span>
                      <span>{result.testName}: {result.message}</span>
                    </li>
                  ))
                }
              </ul>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}