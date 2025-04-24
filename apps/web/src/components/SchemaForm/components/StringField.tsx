'use client'

import { Input } from '@repo/ui/components/shadcn/input'
import { JsonSchema } from '../types'
import { getInputType } from '../utils'
import { SelectField } from './SelectField'
import { DateField } from './DateField'
import { TextareaField } from './TextareaField'
import { ColorField } from './ColorField'
import { RangeField } from './RangeField'
import { RatingField } from './RatingField'
import { PhoneField } from './PhoneField'
import { CurrencyField } from './CurrencyField'
import { TagsField } from './TagsField'
import { PatternField } from './PatternField'

interface StringFieldProps {
    schema: JsonSchema
    value: string
    onChange: (value: string) => void
    disabled?: boolean
}

export function StringField({ schema, value, onChange, disabled }: StringFieldProps) {
    if (schema.enum) {
        return <SelectField schema={schema} value={value} onChange={onChange} disabled={disabled} />
    }

    switch (schema.format) {
        case 'date':
            return <DateField schema={schema} value={value} onChange={onChange} disabled={disabled} />
        case 'textarea':
            return <TextareaField schema={schema} value={value} onChange={onChange} disabled={disabled} />
        case 'color':
            return <ColorField schema={schema} value={value} onChange={onChange} disabled={disabled} />
        case 'range':
            return <RangeField schema={schema} value={Number(value)} onChange={(v) => onChange(String(v))} disabled={disabled} />
        case 'rating':
            return <RatingField schema={schema} value={Number(value)} onChange={(v) => onChange(String(v))} disabled={disabled} />
        case 'phone':
            return <PhoneField schema={schema} value={value} onChange={onChange} disabled={disabled} />
        case 'currency':
            return <CurrencyField schema={schema} value={Number(value)} onChange={(v) => onChange(String(v))} disabled={disabled} />
        case 'tags':
            return <TagsField schema={schema} value={value.split(',')} onChange={(v) => onChange(v.join(','))} disabled={disabled} />
        case 'pattern':
            return <PatternField schema={schema} value={value} onChange={onChange} disabled={disabled} />
        default:
            return (
                <Input
                    type={getInputType(schema.format)}
                    value={value ?? ''}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    placeholder={schema.placeholder}
                    pattern={schema.pattern}
                />
            )
    }
}
