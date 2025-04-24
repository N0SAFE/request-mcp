'use client'

import { JsonSchema } from '../types'
import { Slider } from '@repo/ui/components/shadcn/slider'

interface RangeFieldProps {
    schema: JsonSchema
    value: number
    onChange: (value: number) => void
    disabled?: boolean
}

export function RangeField({ schema, value, onChange, disabled }: RangeFieldProps) {
    return (
        <Slider
            value={[value ?? schema.minimum ?? 0]}
            onValueChange={([val]) => onChange(val)}
            min={schema.minimum}
            max={schema.maximum}
            disabled={disabled}
            className="w-full"
        />
    )
}
