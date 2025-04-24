'use client'

import { JsonSchema } from '../types'
import { Input } from '@repo/ui/components/shadcn/input'

interface ColorFieldProps {
    schema: JsonSchema
    value: string
    onChange: (value: string) => void
    disabled?: boolean
}

export function ColorField({ schema, value, onChange, disabled }: ColorFieldProps) {
    return (
        <div className="flex items-center gap-2">
            <Input
                type="color"
                value={value ?? '#000000'}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="w-16 h-8 p-1"
            />
            <Input
                type="text"
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder="#000000"
                pattern="^#[0-9A-Fa-f]{6}$"
                className="flex-1"
            />
        </div>
    )
}
