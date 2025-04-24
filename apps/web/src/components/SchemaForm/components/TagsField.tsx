'use client'

import { JsonSchema } from '../types'
import { TagInput } from '@repo/ui/components/shadcn/tag-input'

interface TagsFieldProps {
    schema: JsonSchema
    value: string[]
    onChange: (value: string[]) => void
    disabled?: boolean
}

export function TagsField({ schema, value, onChange, disabled }: TagsFieldProps) {
    return (
        <TagInput
            value={Array.isArray(value) ? value : []}
            onChange={onChange}
            disabled={disabled}
            placeholder={schema.placeholder}
        />
    )
}
