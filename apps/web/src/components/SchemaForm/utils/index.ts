import { JsonSchema, LayoutOptions } from '../types'
import { cn } from '@repo/ui/lib/utils'

export function getInputType(format?: string): HTMLInputElement['type'] {
    switch (format) {
        case 'email': return 'email'
        case 'uri': return 'url'
        case 'date': return 'date'
        case 'time': return 'time'
        case 'datetime': return 'datetime-local'
        case 'password': return 'password'
        case 'color': return 'color'
        case 'range': return 'range'
        case 'tel': return 'tel'
        default: return 'text'
    }
}

export function getDefaultValue(schema: JsonSchema): any {
    if (!schema.type && schema.properties) {
        return getDefaultValue({ ...schema, type: 'object' })
    }

    switch (schema.type) {
        case 'object': {
            if (!schema.properties) return {}
            const obj: Record<string, any> = {}
            Object.entries(schema.properties).forEach(([key, propSchema]) => {
                if (schema.required?.includes(key)) {
                    obj[key] = getDefaultValue(propSchema)
                }
            })
            return obj
        }
        case 'array': return []
        case 'string': return ''
        case 'number':
        case 'integer': return null
        case 'boolean': return false
        default: return null
    }
}

export function getLayoutClasses(layout?: LayoutOptions): string {
    if (!layout) return ''
    
    const classes = []
    
    switch (layout.type) {
        case 'flex':
            classes.push('flex flex-wrap')
            break
        case 'grid':
            classes.push('grid')
            if (layout.columns) {
                classes.push(`grid-cols-${layout.columns}`)
            }
            break
        case 'columns':
            classes.push('columns-' + (layout.columns || 1))
            break
        default:
            classes.push('block')
    }

    switch (layout.gap) {
        case 'small': classes.push('gap-2'); break
        case 'medium': classes.push('gap-4'); break
        case 'large': classes.push('gap-6'); break
    }

    switch (layout.alignment) {
        case 'center': classes.push('items-center justify-center'); break
        case 'end': classes.push('items-end justify-end'); break
        default: classes.push('items-start justify-start')
    }

    if (layout.style?.className) {
        classes.push(layout.style.className)
    }

    return classes.join(' ')
}
