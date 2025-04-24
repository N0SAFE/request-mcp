'use client'

import { JsonSchema } from '../types'
import { PatternInput } from '@repo/ui/components/shadcn/pattern-input'

interface PatternFieldProps {
    schema: JsonSchema
    value: string
    onChange: (value: string) => void
    disabled?: boolean
}

export function PatternField({ schema, value, onChange, disabled }: PatternFieldProps) {
    return (
        <PatternInput
            value={value ?? ''}
            onChange={onChange}
            disabled={disabled}
            pattern={schema.pattern}
            placeholder={schema.placeholder}
        />
    )
}
