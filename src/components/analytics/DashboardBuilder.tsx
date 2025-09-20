import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Layout, Plus, Settings, Trash2, Save, RotateCcw, Grid, Layers } from 'lucide-react'
import { CustomWidget } from './CustomWidget'
import { toast } from 'sonner'
import { WidgetConfig, DashboardConfig } from '@/types/analytics'
import { cn } from '@/lib/utils'

interface DashboardBuilderProps {
  data: Record<string, unknown[]>
  onSave?: (config: DashboardConfig) => void
  initialConfig?: DashboardConfig
}

const DEFAULT_WIDGETS: Partial<WidgetConfig>[] = [
  {
    title: 'Total Revenue',
    type: 'metric',
    dataSource: 'revenue',
    size: 'small'
  },
  {
    title: 'Deals Pipeline',
    type: 'bar',
    dataSource: 'deals',
    size: 'medium'
  },
  {
    title: 'Customer Growth',
    type: 'line',
    dataSource: 'customers',
    size: 'medium'
  },
  {
    title: 'Lead Sources',
    type: 'pie',
    dataSource: 'leads',
    size: 'small'
  },
  {
    title: 'Revenue Trend',
    type: 'area',
    dataSource: 'revenue',
    size: 'large'
  }
]

const CHART_TYPES = [
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'pie', label: 'Pie Chart' },
  { value: 'area', label: 'Area Chart' },
  { value: 'metric', label: 'Metric Card' }
]

const DATA_SOURCES = [
  { value: 'deals', label: 'Deals' },
  { value: 'customers', label: 'Customers' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'leads', label: 'Leads' },
  { value: 'performance', label: 'Performance' }
]

export function DashboardBuilder({ data, onSave, initialConfig }: DashboardBuilderProps) {
  const [config, setConfig] = useState<DashboardConfig>(
    initialConfig || {
      id: 'default',
      name: 'My Dashboard',
      widgets: [],
      layout: 'grid',
      columns: 3
    }
  )
  const [isEditing, setIsEditing] = useState(false)
  const [showAddWidget, setShowAddWidget] = useState(false)
  const [newWidget, setNewWidget] = useState<Partial<WidgetConfig>>({
    title: '',
    type: 'bar',
    dataSource: 'deals',
    size: 'medium'
  })

  const generateId = () => {
    return Math.random().toString(36).substr(2, 9)
  }

  const addWidget = useCallback((widgetData: Partial<WidgetConfig>) => {
    const widget: WidgetConfig = {
      id: generateId(),
      title: widgetData.title || 'New Widget',
      type: widgetData.type || 'bar',
      dataSource: widgetData.dataSource || 'deals',
      size: widgetData.size || 'medium',
      position: { x: 0, y: 0 },
      ...widgetData
    }

    setConfig(prev => ({
      ...prev,
      widgets: [...prev.widgets, widget]
    }))

    toast.success('Widget added successfully')
  }, [])

  const updateWidget = useCallback((updatedWidget: WidgetConfig) => {
    setConfig(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => w.id === updatedWidget.id ? updatedWidget : w)
    }))
    toast.success('Widget updated successfully')
  }, [])

  const removeWidget = useCallback((widgetId: string) => {
    setConfig(prev => ({
      ...prev,
      widgets: prev.widgets.filter(w => w.id !== widgetId)
    }))
    toast.success('Widget removed successfully')
  }, [])

  const handleAddWidget = () => {
    if (!newWidget.title) {
      toast.error('Please enter a widget title')
      return
    }

    addWidget(newWidget)
    setNewWidget({
      title: '',
      type: 'bar',
      dataSource: 'deals',
      size: 'medium'
    })
    setShowAddWidget(false)
  }

  const addDefaultWidgets = () => {
    DEFAULT_WIDGETS.forEach(widget => {
      addWidget(widget)
    })
  }

  const saveDashboard = () => {
    if (onSave) {
      onSave(config)
    }
    setIsEditing(false)
    toast.success('Dashboard saved successfully')
  }

  const resetDashboard = () => {
    setConfig(prev => ({ ...prev, widgets: [] }))
    toast.success('Dashboard reset successfully')
  }

  const getWidgetData = (dataSource: string) => {
    return data[dataSource] || []
  }

  const getGridClass = () => {
    switch (config.columns) {
      case 2: return 'grid-cols-1 md:grid-cols-2'
      case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    }
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Dashboard Builder
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Create and customize your analytics dashboard
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={isEditing ? 'default' : 'secondary'}>
                {isEditing ? 'Editing' : 'View Mode'}
              </Badge>
              <Switch
                checked={isEditing}
                onCheckedChange={setIsEditing}
                aria-label="Toggle edit mode"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Dashboard name"
              value={config.name}
              onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
              className="w-48"
              disabled={!isEditing}
            />
            
            <Select
              value={config.columns.toString()}
              onValueChange={(value) => setConfig(prev => ({ ...prev, columns: parseInt(value) }))}
              disabled={!isEditing}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 Columns</SelectItem>
                <SelectItem value="3">3 Columns</SelectItem>
                <SelectItem value="4">4 Columns</SelectItem>
              </SelectContent>
            </Select>
            
            {isEditing && (
              <>
                <Dialog open={showAddWidget} onOpenChange={setShowAddWidget}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Widget
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Widget</DialogTitle>
                      <DialogDescription>
                        Configure your new dashboard widget
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Title</label>
                        <Input
                          placeholder="Widget title"
                          value={newWidget.title}
                          onChange={(e) => setNewWidget(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Chart Type</label>
                        <Select
                          value={newWidget.type}
                          onValueChange={(value) => setNewWidget(prev => ({ ...prev, type: value as WidgetConfig['type'] }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CHART_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Data Source</label>
                        <Select
                          value={newWidget.dataSource}
                          onValueChange={(value) => setNewWidget(prev => ({ ...prev, dataSource: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DATA_SOURCES.map(source => (
                              <SelectItem key={source.value} value={source.value}>
                                {source.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Size</label>
                        <Select
                          value={newWidget.size}
                          onValueChange={(value) => setNewWidget(prev => ({ ...prev, size: value as WidgetConfig['size'] }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button onClick={handleAddWidget}>
                          Add Widget
                        </Button>
                        <Button variant="outline" onClick={() => setShowAddWidget(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button variant="outline" size="sm" onClick={addDefaultWidgets}>
                  <Grid className="h-4 w-4 mr-2" />
                  Add Defaults
                </Button>
                
                <Button variant="outline" size="sm" onClick={resetDashboard}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                
                <Button size="sm" onClick={saveDashboard}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Grid */}
      {config.widgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layout className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No widgets added</h3>
            <p className="text-gray-600 text-center mb-4">
              Start building your dashboard by adding widgets
            </p>
            {isEditing && (
              <Button onClick={() => setShowAddWidget(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Widget
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={cn("grid gap-6", getGridClass())}>
          {config.widgets.map((widget) => (
            <CustomWidget
              key={widget.id}
              config={widget}
              data={getWidgetData(widget.dataSource)}
              onUpdate={updateWidget}
              onRemove={removeWidget}
              isEditing={isEditing}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default DashboardBuilder