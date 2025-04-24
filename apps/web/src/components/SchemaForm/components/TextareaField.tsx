'use client'

import { JsonSchema } from '../types'
import { Textarea } from '@repo/ui/components/shadcn/textarea'

interface TextareaFieldProps {
    schema: JsonSchema
    value: string
    onChange: (value: string) => void
    disabled?: boolean
}

export function TextareaField({ schema, value, onChange, disabled }: TextareaFieldProps) {
    return (
        <Textarea
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={schema.placeholder}
            rows={schema.options?.multiline ? 10 : 5}
        />
    )
}
