'use client'

import { JsonSchema } from '../types'
import { Input } from '@repo/ui/components/shadcn/input'

interface CurrencyFieldProps {
    schema: JsonSchema
    value: number
    onChange: (value: number) => void
    disabled?: boolean
}

export function CurrencyField({ schema, value, onChange, disabled }: CurrencyFieldProps) {
    return (
        <div className="relative">
            <Input
                type="number"
                value={value ?? ''}
                onChange={(e) => onChange(Number(e.target.value))}
                disabled={disabled}
                min={schema.minimum}
                max={schema.maximum}
                step="0.01"
                className="pl-8"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {schema.options?.currency || '$'}
            </span>
        </div>
    )
}
