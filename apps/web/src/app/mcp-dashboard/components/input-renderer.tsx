'use client'

import { ChangeEvent } from 'react'
import { ApplyFields } from '@repo/directus-sdk/indirectus/utils'
import { Collections } from '@repo/directus-sdk/client'
import { SchemaForm } from '@/components/SchemaForm'
import { Textarea } from '@repo/ui/components/shadcn/textarea'
import {
    RadioGroup,
    RadioGroupItem,
} from '@repo/ui/components/shadcn/radio-group'
import { Label } from '@repo/ui/components/shadcn/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@repo/ui/components/shadcn/select'
import { Checkbox } from '@repo/ui/components/shadcn/checkbox'

export type RequestInputType = 'boolean' | 'select' | 'multi-select' | 'schema' | 'json' | 'text';

export interface SelectOption {
    value: string
    label: string
}

export function mapInputOptions(options: any): SelectOption[] | undefined {
    if (!options) return undefined
    try {
        let parsedOptions: any[] = []
        if (typeof options === 'string') {
            parsedOptions = JSON.parse(options)
        } else if (Array.isArray(options)) {
            parsedOptions = options
        }

        if (Array.isArray(parsedOptions)) {
            return parsedOptions
                .map((opt) => ({
                    value: String(opt?.value ?? opt),
                    label: String(opt?.label ?? opt?.value ?? opt),
                }))
                .filter((opt) => opt.value)
        }
    } catch (e) {
        console.error('Failed to parse input options', e, options)
    }
    return undefined
}

export const renderInput = (
    req: ApplyFields<Collections.Request>,
    responseValue: any,
    handleChange: (nodeId: number, value: any) => void,
    disabled: boolean,
    jsonParseError: string | null
) => {
    // Safely access inputType with type checking
    const inputType = req.inputType as RequestInputType | undefined;
    if (!inputType) return null;

    const inputId = `response-${req.id}`

    switch (inputType) {
        case 'boolean': {
            return (
                <RadioGroup
                    value={
                        responseValue === true
                            ? 'true'
                            : responseValue === false
                              ? 'false'
                              : undefined
                    }
                    onValueChange={(value) =>
                        handleChange(req.id, value === 'true')
                    }
                    disabled={disabled}
                    className="flex items-center space-x-4"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id={`${inputId}-true`} />
                        <Label
                            htmlFor={`${inputId}-true`}
                            className="cursor-pointer"
                        >
                            True
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id={`${inputId}-false`} />
                        <Label
                            htmlFor={`${inputId}-false`}
                            className="cursor-pointer"
                        >
                            False
                        </Label>
                    </div>
                </RadioGroup>
            )
        }
        case 'select': {
            return (
                <Select
                    value={responseValue ?? ''}
                    onValueChange={(value) => handleChange(req.id, value)}
                    disabled={disabled}
                >
                    <SelectTrigger id={inputId} className="w-full">
                        <SelectValue placeholder="-- Select an option --" />
                    </SelectTrigger>
                    <SelectContent>
                        {mapInputOptions(req.selectOptions)?.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )
        }
        case 'multi-select': {
            const currentSelection = Array.isArray(responseValue)
                ? responseValue
                : []
            return (
                <div className="space-y-3">
                    {mapInputOptions(req.selectOptions)?.map((opt) => (
                        <div
                            key={opt.value}
                            className="flex items-center space-x-2"
                        >
                            <Checkbox
                                id={`${inputId}-${opt.value}`}
                                checked={currentSelection.includes(opt.value)}
                                onCheckedChange={(checked) => {
                                    const value = opt.value
                                    const newSelection = checked
                                        ? [...currentSelection, value]
                                        : currentSelection.filter(
                                              (v) => v !== value
                                          )
                                    handleChange(req.id, newSelection)
                                }}
                                disabled={disabled}
                            />
                            <Label
                                htmlFor={`${inputId}-${opt.value}`}
                                className="cursor-pointer"
                            >
                                {opt.label}
                            </Label>
                        </div>
                    ))}
                </div>
            )
        }
        case 'schema': {
            if (!req.schema) return null;
            let schema;
            try {
                schema = typeof req.schema === 'string' ? JSON.parse(req.schema) : req.schema;
            } catch (e) {
                console.error('Failed to parse schema:', e);
                return null;
            }
            
            return (
                <>
                    <SchemaForm
                        schema={schema}
                        value={responseValue}
                        onChange={(value) => handleChange(req.id, value)}
                        disabled={disabled}
                    />
                    {jsonParseError && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {jsonParseError}
                        </p>
                    )}
                </>
            );
        }
        case 'json': {
            return (
                <>
                    <Textarea
                        id={inputId}
                        rows={5}
                        className={`w-full font-mono ${jsonParseError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                        placeholder="Enter valid JSON data..."
                        value={typeof responseValue === 'string' ? responseValue : JSON.stringify(responseValue ?? '', null, 2)}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleChange(req.id, e.target.value)}
                        disabled={disabled}
                    />
                    {jsonParseError && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {jsonParseError}
                        </p>
                    )}
                </>
            );
        }
        case 'text':
        default: {
            return (
                <Textarea
                    id={inputId}
                    rows={4}
                    className="w-full"
                    placeholder={req.prompt || 'Enter response...'}
                    value={responseValue ?? ''}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                        handleChange(req.id, e.target.value)
                    }
                    disabled={disabled}
                />
            )
        }
    }
}
