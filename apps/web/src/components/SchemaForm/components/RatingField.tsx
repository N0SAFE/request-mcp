'use client'

import { JsonSchema } from '../types'
import { Rating } from '@repo/ui/components/shadcn/rating'

interface RatingFieldProps {
    schema: JsonSchema
    value: number
    onChange: (value: number) => void
    disabled?: boolean
}

export function RatingField({ schema, value, onChange, disabled }: RatingFieldProps) {
    return (
        <Rating
            value={value ?? 0}
            onChange={onChange}
            disabled={disabled}
            max={schema.options?.maxRating ?? 5}
        />
    )
}
