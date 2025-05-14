'use client'

import { ApplyFields } from '@repo/directus-sdk/indirectus/utils'
import { Collections } from '@repo/directus-sdk/client'
import { SchemaForm } from '@/components/SchemaForm'

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
    // Always render as schema input
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
