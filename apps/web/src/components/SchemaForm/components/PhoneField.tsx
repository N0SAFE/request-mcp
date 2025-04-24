'use client'

import { JsonSchema } from '../types'
import { PhoneInput } from '@repo/ui/components/shadcn/phone-input'

interface PhoneFieldProps {
    schema: JsonSchema
    value: string
    onChange: (value: string) => void
    disabled?: boolean
}

export function PhoneField({ schema, value, onChange, disabled }: PhoneFieldProps) {
    return (
        <PhoneInput
            value={value ?? ''}
            onChange={onChange}
            disabled={disabled}
            countryCode={schema.options?.countryCode}
        />
    )
}
