import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DateRange } from 'react-day-picker'

export interface FilterConfig {
  id: string
  label: string
  type: 'select' | 'multiselect' | 'checkbox' | 'date-range' | 'number-range' | 'text'
  options?: { value: string; label: string }[]
  placeholder?: string
  icon?: React.ComponentType<{ className?: string }>
}

export interface FilterValue {
  [key: string]: unknown
}

interface FilterPanelProps {
  filters: FilterConfig[]
  values: FilterValue
  onChange: (values: FilterValue) => void
  onClear: () => void
  className?: string
  title?: string
  collapsible?: boolean
}

export function FilterPanel({
  filters,
  values,
  onChange,
  onClear,
  className,
  title = 'Filters',
  collapsible = true
}: FilterPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleFilterChange = (filterId: string, value: unknown) => {
    onChange({
      ...values,
      [filterId]: value
    })
  }

  const clearFilter = (filterId: string) => {
    const newValues = { ...values }
    delete newValues[filterId]
    onChange(newValues)
  }

  const getActiveFiltersCount = () => {
    return Object.keys(values).filter(key => {
      const value = values[key]
      if (Array.isArray(value)) {
        return value.length > 0
      }
      return value !== undefined && value !== null && value !== ''
    }).length
  }

  const renderFilter = (filter: FilterConfig) => {
    const value = values[filter.id]
    const Icon = filter.icon

    switch (filter.type) {
      case 'select':
        return (
          <div key={filter.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                {Icon && <Icon className="h-3 w-3" />}
                {filter.label}
              </Label>
              {value && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter(filter.id)}
                  className="h-4 w-4 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Select
              value={value || ''}
              onValueChange={(newValue) => handleFilterChange(filter.id, newValue || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder={filter.placeholder || `Select ${filter.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                {filter.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'multiselect': {
        const selectedValues = Array.isArray(value) ? value : []
        return (
          <div key={filter.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                {Icon && <Icon className="h-3 w-3" />}
                {filter.label}
              </Label>
              {selectedValues.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter(filter.id)}
                  className="h-4 w-4 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {filter.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${filter.id}-${option.value}`}
                    checked={selectedValues.includes(option.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleFilterChange(filter.id, [...selectedValues, option.value])
                      } else {
                        handleFilterChange(filter.id, selectedValues.filter(v => v !== option.value))
                      }
                    }}
                  />
                  <Label htmlFor={`${filter.id}-${option.value}`} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
            {selectedValues.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedValues.map((val) => {
                  const option = filter.options?.find(o => o.value === val)
                  return (
                    <Badge key={val} variant="secondary" className="text-xs">
                      {option?.label || val}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          handleFilterChange(filter.id, selectedValues.filter(v => v !== val))
                        }}
                        className="h-3 w-3 p-0 ml-1"
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  )
                })}
              </div>
            )}
          </div>
        )
      }

      case 'checkbox':
        return (
          <div key={filter.id} className="flex items-center space-x-2">
            <Checkbox
              id={filter.id}
              checked={!!value}
              onCheckedChange={(checked) => handleFilterChange(filter.id, checked)}
            />
            <Label htmlFor={filter.id} className="text-sm flex items-center gap-2">
              {Icon && <Icon className="h-3 w-3" />}
              {filter.label}
            </Label>
          </div>
        )

      case 'date-range':
        return (
          <div key={filter.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                {Icon && <Icon className="h-3 w-3" />}
                {filter.label}
              </Label>
              {value && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter(filter.id)}
                  className="h-4 w-4 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <DateRangePicker
              date={value as DateRange}
              onDateChange={(dateRange) => handleFilterChange(filter.id, dateRange)}
            />
          </div>
        )

      case 'number-range': {
        const rangeValue = value || { min: '', max: '' }
        return (
          <div key={filter.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                {Icon && <Icon className="h-3 w-3" />}
                {filter.label}
              </Label>
              {(rangeValue.min || rangeValue.max) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter(filter.id)}
                  className="h-4 w-4 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={rangeValue.min}
                onChange={(e) => handleFilterChange(filter.id, {
                  ...rangeValue,
                  min: e.target.value
                })}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Max"
                value={rangeValue.max}
                onChange={(e) => handleFilterChange(filter.id, {
                  ...rangeValue,
                  max: e.target.value
                })}
                className="flex-1"
              />
            </div>
          </div>
        )
      }

      case 'text':
        return (
          <div key={filter.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                {Icon && <Icon className="h-3 w-3" />}
                {filter.label}
              </Label>
              {value && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter(filter.id)}
                  className="h-4 w-4 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Input
              type="text"
              placeholder={filter.placeholder || `Enter ${filter.label.toLowerCase()}`}
              value={value || ''}
              onChange={(e) => handleFilterChange(filter.id, e.target.value || undefined)}
            />
          </div>
        )

      default:
        return null
    }
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {title}
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="text-xs"
              >
                Clear All
              </Button>
            )}
            {collapsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-6 w-6 p-0"
              >
                {isCollapsed ? '+' : '−'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="space-y-4">
          {filters.map(renderFilter)}
        </CardContent>
      )}
    </Card>
  )
}

export default FilterPanel