'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { Input } from './input'
import { Badge } from './badge'
import { cn } from '../../lib/utils'

interface TagInputProps {
    value: string[]
    onChange: (value: string[]) => void
    disabled?: boolean
    placeholder?: string
    className?: string
}

export function TagInput({ value, onChange, disabled, placeholder, className }: TagInputProps) {
    const [input, setInput] = React.useState('')
    const inputRef = React.useRef<HTMLInputElement>(null)

    const addTag = (tag: string) => {
        if (tag.trim() && !value.includes(tag.trim())) {
            onChange([...value, tag.trim()])
        }
        setInput('')
    }

    const removeTag = (tagToRemove: string) => {
        onChange(value.filter(tag => tag !== tagToRemove))
    }

    return (
        <div className={cn('flex flex-wrap gap-2', className)}>
            {value.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    {!disabled && (
                        <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeTag(tag)}
                        />
                    )}
                </Badge>
            ))}
            <Input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag(input)
                    }
                    if (e.key === 'Backspace' && !input && value.length > 0) {
                        removeTag(value[value.length - 1])
                    }
                }}
                onBlur={() => input && addTag(input)}
                placeholder={placeholder}
                disabled={disabled}
                className="flex-1 min-w-[200px]"
            />
        </div>
    )
}
