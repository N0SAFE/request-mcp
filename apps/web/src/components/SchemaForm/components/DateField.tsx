'use client'

import { JsonSchema } from '../types'
import { DatePicker } from '@repo/ui/components/shadcn/date-picker'

interface DateFieldProps {
    schema: JsonSchema
    value: string
    onChange: (value: string) => void
    disabled?: boolean
}

export function DateField({ schema, value, onChange, disabled }: DateFieldProps) {
    const dateValue = value ? new Date(value) : undefined
    const minDate = schema.options?.minDate ? new Date(schema.options.minDate) : undefined
    const maxDate = schema.options?.maxDate ? new Date(schema.options.maxDate) : undefined
    
    const isValidDate = (date?: Date) => {
        if (!date) return true
        if (minDate && date < minDate) return false
        if (maxDate && date > maxDate) return false
        return true
    }

    return (
        <div className="space-y-1">
            <DatePicker
                value={dateValue}
                onChange={(date) => {
                    if (isValidDate(date)) {
                        onChange(date ? date.toISOString().split('T')[0] : undefined)
                    }
                }}
                disabled={disabled}
                placeholder={schema.placeholder || 'Select date...'}
            />
            {schema.options?.minDate && (
                <p className="text-xs text-muted-foreground">
                    Minimum date: {new Date(schema.options.minDate).toLocaleDateString()}
                </p>
            )}
            {schema.options?.maxDate && (
                <p className="text-xs text-muted-foreground">
                    Maximum date: {new Date(schema.options.maxDate).toLocaleDateString()}
                </p>
            )}
        </div>
    )
}
