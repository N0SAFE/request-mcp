'use client'

import { JsonSchema } from '../types'
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@repo/ui/components/shadcn/select'

interface SelectFieldProps {
    schema: JsonSchema
    value: string
    onChange: (value: string) => void
    disabled?: boolean
}

export function SelectField({ schema, value, onChange, disabled }: SelectFieldProps) {
    return (
        <Select
            value={value?.toString() ?? ''}
            onValueChange={onChange}
            disabled={disabled}
        >
            <SelectTrigger className="w-full">
                <SelectValue placeholder={schema.title || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
                {(schema.enum || []).map((option: string, index: number) => (
                    <SelectItem key={option} value={option}>
                        {schema.enumNames?.[index] || option}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
