import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Filter, X, ChevronDown, RotateCcw, Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
// Calendar component removed - using native date inputs

export interface FilterField {
  key: string
  label: string
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'numberrange' | 'boolean'
  options?: { value: string; label: string }[]
  placeholder?: string
  min?: number
  max?: number
  step?: number
}

export interface FilterValue {
  [key: string]: unknown
}

interface AdvancedFiltersProps {
  fields: FilterField[]
  values: FilterValue
  onChange: (values: FilterValue) => void
  onReset: () => void
  className?: string
}

export function AdvancedFilters({
  fields,
  values,
  onChange,
  onReset,
  className
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localValues, setLocalValues] = useState<FilterValue>(values)

  useEffect(() => {
    setLocalValues(values)
  }, [values])

  const handleValueChange = (key: string, value: unknown) => {
    const newValues = { ...localValues, [key]: value }
    setLocalValues(newValues)
    onChange(newValues)
  }

  const handleReset = () => {
    setLocalValues({})
    onReset()
  }

  const getActiveFiltersCount = () => {
    return Object.keys(values).filter(key => {
      const value = values[key]
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(v => v !== undefined && v !== null && v !== '')
      }
      return value !== undefined && value !== null && value !== ''
    }).length
  }

  const renderFilterField = (field: FilterField) => {
    const value = localValues[field.key]

    switch (field.type) {
      case 'text':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              placeholder={field.placeholder}
              value={value || ''}
              onChange={(e) => handleValueChange(field.key, e.target.value)}
            />
          </div>
        )

      case 'multiselect': {
        const selectedValues = Array.isArray(value) ? value : []
        return (
          <div key={field.key} className="space-y-2">
            <Label>{field.label}</Label>
            <div className="space-y-2">
              {field.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.key}-${option.value}`}
                    checked={selectedValues.includes(option.value)}
                    onCheckedChange={(checked) => {
                      const newValues = checked
                        ? [...selectedValues, option.value]
                        : selectedValues.filter(v => v !== option.value)
                      handleValueChange(field.key, newValues)
                    }}
                  />
                  <Label htmlFor={`${field.key}-${option.value}`} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )
      }

      case 'select': {
        return (
          <div key={field.key} className="space-y-2">
            <Label>{field.label}</Label>
            <Select
              value={value || ''}
              onValueChange={(newValue) => handleValueChange(field.key, newValue)}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || 'Select an option'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      }

      case 'date':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              type="date"
              value={value ? new Date(value).toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const newDate = e.target.value ? new Date(e.target.value).toISOString() : undefined
                handleValueChange(field.key, newDate)
              }}
            />
          </div>
        )

      case 'daterange': {
        const dateRange = value || {}
        return (
          <div key={field.key} className="space-y-2">
            <Label>{field.label}</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">From</Label>
                <Input
                  type="date"
                  value={dateRange.from ? new Date(dateRange.from).toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const newDate = e.target.value ? new Date(e.target.value).toISOString() : undefined
                    handleValueChange(field.key, {
                      ...dateRange,
                      from: newDate
                    })
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input
                  type="date"
                  value={dateRange.to ? new Date(dateRange.to).toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const newDate = e.target.value ? new Date(e.target.value).toISOString() : undefined
                    handleValueChange(field.key, {
                      ...dateRange,
                      to: newDate
                    })
                  }}
                />
              </div>
            </div>
          </div>
        )
      }

      case 'number':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              type="number"
              placeholder={field.placeholder}
              value={value || ''}
              min={field.min}
              max={field.max}
              step={field.step}
              onChange={(e) => handleValueChange(field.key, e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
        )

      case 'numberrange': {
        const numberRange = value || {}
        const min = field.min || 0
        const max = field.max || 1000000
        const currentRange = [numberRange.min || min, numberRange.max || max]
        
        return (
          <div key={field.key} className="space-y-2">
            <Label>{field.label}</Label>
            <div className="px-2">
              <Slider
                value={currentRange}
                onValueChange={([minVal, maxVal]) => {
                  handleValueChange(field.key, { min: minVal, max: maxVal })
                }}
                min={min}
                max={max}
                step={field.step || 1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>${currentRange[0].toLocaleString()}</span>
                <span>${currentRange[1].toLocaleString()}</span>
              </div>
            </div>
          </div>
        )
      }

      case 'boolean':
        return (
          <div key={field.key} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.key}
                checked={value || false}
                onCheckedChange={(checked) => handleValueChange(field.key, checked)}
              />
              <Label htmlFor={field.key}>{field.label}</Label>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <div className={cn('relative', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Advanced Filters</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-8 px-2 text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-4">
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {fields.map(renderFilterField)}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(values).map(([key, value]) => {
            if (!value || (Array.isArray(value) && value.length === 0)) return null
            
            const field = fields.find(f => f.key === key)
            if (!field) return null

            let displayValue = ''
            if (Array.isArray(value)) {
              displayValue = value.length > 1 ? `${value.length} selected` : value[0]
            } else if (typeof value === 'object' && value !== null) {
              if (field.type === 'daterange') {
                const from = value.from ? format(new Date(value.from), 'MMM dd') : ''
                const to = value.to ? format(new Date(value.to), 'MMM dd') : ''
                displayValue = `${from} - ${to}`
              } else if (field.type === 'numberrange') {
                displayValue = `$${value.min?.toLocaleString()} - $${value.max?.toLocaleString()}`
              }
            } else if (field.type === 'date') {
              displayValue = format(new Date(value), 'MMM dd, yyyy')
            } else if (field.type === 'boolean') {
              displayValue = value ? 'Yes' : 'No'
            } else {
              displayValue = String(value)
            }

            return (
              <Badge key={key} variant="secondary" className="gap-1">
                {field.label}: {displayValue}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleValueChange(key, undefined)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}