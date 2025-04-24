'use client'

import * as React from 'react'
import { Input } from './input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    countryCode?: string
    value?: string
    onChange?: (value: string) => void
}

const countryCodes = [
    { code: '+1', label: '🇺🇸 United States' },
    { code: '+44', label: '🇬🇧 United Kingdom' },
    { code: '+33', label: '🇫🇷 France' },
    { code: '+49', label: '🇩🇪 Germany' },
    { code: '+81', label: '🇯🇵 Japan' },
    { code: '+86', label: '🇨🇳 China' },
    { code: '+91', label: '🇮🇳 India' },
    { code: '+7', label: '🇷🇺 Russia' },
    { code: '+55', label: '🇧🇷 Brazil' },
    { code: '+61', label: '🇦🇺 Australia' }
]

export function PhoneInput({
    countryCode = '+1',
    value = '',
    onChange,
    className,
    disabled,
    ...props
}: PhoneInputProps) {
    // Parse the initial value to separate country code and number
    const [selectedCode, setSelectedCode] = React.useState(() => {
        const code = countryCodes.find(c => value.startsWith(c.code))?.code || countryCode
        return code
    })

    const [number, setNumber] = React.useState(() => {
        const code = countryCodes.find(c => value.startsWith(c.code))?.code || countryCode
        return value.startsWith(code) ? value.slice(code.length) : value
    })

    // Update internal state when external value changes
    React.useEffect(() => {
        const code = countryCodes.find(c => value.startsWith(c.code))?.code || selectedCode
        const newNumber = value.startsWith(code) ? value.slice(code.length) : value
        setSelectedCode(code)
        setNumber(newNumber)
    }, [value, selectedCode])

    // Handle number input changes with validation
    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newNumber = e.target.value.replace(/[^\d\s-]/g, '') // Only allow digits, spaces, and hyphens
        setNumber(newNumber)
        onChange?.(selectedCode + newNumber)
    }

    return (
        <React.Fragment>
            <div className="flex gap-2">
                <Select value={selectedCode} onValueChange={(code) => {
                    setSelectedCode(code)
                    onChange?.(code + number)
                }} disabled={disabled}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {countryCodes.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                                {country.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Input
                    type="tel"
                    placeholder="Phone number"
                    value={number}
                    onChange={handleNumberChange}
                    className="flex-1"
                    disabled={disabled}
                    {...props}
                />
            </div>
        </React.Fragment>
    )
}
