'use client'

import * as React from 'react'
import { Star } from 'lucide-react'
import { cn } from '../../lib/utils'

interface RatingProps {
    value: number
    onChange: (value: number) => void
    max?: number
    disabled?: boolean
    className?: string
}

export function Rating({ value, onChange, max = 5, disabled, className }: RatingProps) {
    return (
        <div className={cn('flex gap-1', className)}>
            {Array.from({ length: max }).map((_, index) => (
                <button
                    key={index}
                    type="button"
                    onClick={() => !disabled && onChange(index + 1)}
                    className={cn(
                        'transition-colors',
                        disabled && 'cursor-not-allowed opacity-50'
                    )}
                >
                    <Star
                        className={cn(
                            'h-6 w-6',
                            index < value ? 'fill-yellow-400 text-yellow-400' : 'fill-none text-gray-300'
                        )}
                    />
                </button>
            ))}
        </div>
    )
}
