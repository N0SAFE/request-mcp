'use client'

import * as React from 'react'
import { Input } from './input'
import { cn } from '../../lib/utils'

interface PatternInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: string
    onChange: (value: string) => void
    pattern?: string
    className?: string
}

export function PatternInput({ value, onChange, pattern, className, ...props }: PatternInputProps) {
    const [isValid, setIsValid] = React.useState(true)

    const validateInput = (input: string) => {
        if (!pattern) return true
        const regex = new RegExp(pattern)
        return regex.test(input)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        setIsValid(validateInput(newValue))
        onChange(newValue)
    }

    return (
        <div className="space-y-1">
            <Input
                value={value}
                onChange={handleChange}
                className={cn(
                    className,
                    !isValid && 'border-red-500 focus-visible:ring-red-500'
                )}
                {...props}
            />
            {!isValid && pattern && (
                <p className="text-xs text-red-500">
                    Input must match pattern: {pattern}
                </p>
            )}
        </div>
    )
}
