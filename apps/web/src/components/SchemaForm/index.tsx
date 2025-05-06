'use client'

import { useEffect, useState } from 'react'
import { JsonSchema, SchemaFormProps } from './types'
import { getDefaultValue, getLayoutClasses } from './utils'
import { Label } from '@repo/ui/components/shadcn/label'
import { Input } from '@repo/ui/components/shadcn/input'
import { StringField } from './components/StringField'

import { cn } from '@repo/ui/lib/utils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@repo/ui/components/shadcn/tabs'
import { TableView } from './views/TableView'
import { CardView } from './views/CardView'
import { ListView } from './views/ListView'
import { AccordionView } from './views/AccordionView'

export function SchemaForm({ schema, value, onChange, disabled = false, parentKey = '' }: SchemaFormProps) {
    const [internalValue, setInternalValue] = useState<any>(value ?? getDefaultValue(schema))
    const [view, setView] = useState<'form' | 'table' | 'card' | 'list' | 'accordion'>('form')

    useEffect(() => {
        const newValue = value ?? getDefaultValue(schema)
        if (JSON.stringify(internalValue) !== JSON.stringify(newValue)) {
            setInternalValue(newValue)
        }
    }, [value, schema, internalValue])

    const handleChange = (key: string, newValue: any) => {
        if (JSON.stringify(internalValue?.[key]) === JSON.stringify(newValue)) {
            return; // Skip update if value hasn't changed
        }
        
        const updatedData = { ...internalValue, [key]: newValue }
        setInternalValue(updatedData)
        onChange(updatedData)
    }

    if (!schema.type && schema.properties) {
        schema = { ...schema, type: 'object' }
    }

    switch (schema.type) {
        case 'object': {
            if (!schema.properties) return null

            const isRoot = !parentKey
            const hasTitle = Boolean(schema.title)
            const layoutClasses = getLayoutClasses(schema.options?.layout)

            if (isRoot) {
                return (
                    <div>
                        <Tabs value={view} onValueChange={setView as any} className="mb-4">
                            <TabsList>
                                <TabsTrigger value="form">Form</TabsTrigger>
                                <TabsTrigger value="table">Table</TabsTrigger>
                                <TabsTrigger value="card">Card</TabsTrigger>
                                <TabsTrigger value="list">List</TabsTrigger>
                                <TabsTrigger value="accordion">Accordion</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <TabsContent value="form">
                            <div className={cn(
                                "relative",
                                hasTitle && "pt-2",
                                schema.options?.layout?.style?.padding,
                                schema.options?.layout?.style?.margin,
                                schema.options?.layout?.style?.background && `bg-${schema.options.layout.style.background}`,
                            )}>
                                {schema.title && (
                                    <div className={cn(
                                        "font-semibold",
                                        "text-2xl mb-6"
                                    )}>
                                        {schema.title}
                                        {schema.description && (
                                            <p className="font-normal text-sm text-muted-foreground mt-1">
                                                {schema.description}
                                            </p>
                                        )}
                                    </div>
                                )}
                                <div className={cn(
                                    "space-y-6",
                                    layoutClasses
                                )}>
                                    {Object.entries(schema.properties).map(([key, propSchema]) => {
                                        const fullKey = parentKey ? `${parentKey}.${key}` : key
                                        const isRequired = schema.required?.includes(key)
                                        const isNestedObject = propSchema.type === 'object'

                                        return (
                                            <div key={key} className={cn(
                                                schema.options?.layout?.type === 'flex' && 'flex-1 min-w-[200px]',
                                                schema.options?.layout?.type === 'grid' && 'w-full',
                                                isNestedObject && "pt-2"
                                            )}>
                                                {(!isNestedObject || !propSchema.title) && (
                                                    <>
                                                        <Label className={cn(
                                                            isRequired && "after:content-['*'] after:ml-1 after:text-red-500"
                                                        )}>
                                                            {propSchema.title || key}
                                                        </Label>
                                                        {propSchema.description && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {propSchema.description}
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                                <SchemaForm
                                                    schema={propSchema}
                                                    value={internalValue?.[key]}
                                                    onChange={(newValue) => handleChange(key, newValue)}
                                                    disabled={disabled}
                                                    parentKey={fullKey}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="table">
                            <TableView schema={schema} value={internalValue} />
                        </TabsContent>
                        <TabsContent value="card">
                            <CardView schema={schema} value={internalValue} />
                        </TabsContent>
                        <TabsContent value="list">
                            <ListView schema={schema} value={internalValue} />
                        </TabsContent>
                        <TabsContent value="accordion">
                            <AccordionView schema={schema} value={internalValue} />
                        </TabsContent>
                    </div>
                )
            }

            // Not root: render as normal form
            return (
                <div className={cn(
                    "relative",
                    !isRoot && "border-l-2 border-muted pl-4 ml-2",
                    hasTitle && "pt-2",
                    schema.options?.layout?.style?.padding,
                    schema.options?.layout?.style?.margin,
                    schema.options?.layout?.style?.background && `bg-${schema.options.layout.style.background}`,
                )}>
                    {schema.title && (
                        <div className={cn(
                            "font-semibold",
                            isRoot ? "text-2xl mb-6" : "text-lg mb-4"
                        )}>
                            {schema.title}
                            {schema.description && (
                                <p className="font-normal text-sm text-muted-foreground mt-1">
                                    {schema.description}
                                </p>
                            )}
                        </div>
                    )}
                    <div className={cn(
                        "space-y-6",
                        layoutClasses
                    )}>
                        {Object.entries(schema.properties).map(([key, propSchema]) => {
                            const fullKey = parentKey ? `${parentKey}.${key}` : key
                            const isRequired = schema.required?.includes(key)
                            const isNestedObject = propSchema.type === 'object'

                            return (
                                <div key={key} className={cn(
                                    schema.options?.layout?.type === 'flex' && 'flex-1 min-w-[200px]',
                                    schema.options?.layout?.type === 'grid' && 'w-full',
                                    isNestedObject && "pt-2"
                                )}>
                                    {(!isNestedObject || !propSchema.title) && (
                                        <>
                                            <Label className={cn(
                                                isRequired && "after:content-['*'] after:ml-1 after:text-red-500"
                                            )}>
                                                {propSchema.title || key}
                                            </Label>
                                            {propSchema.description && (
                                                <p className="text-sm text-muted-foreground">
                                                    {propSchema.description}
                                                </p>
                                            )}
                                        </>
                                    )}
                                    <SchemaForm
                                        schema={propSchema}
                                        value={internalValue?.[key]}
                                        onChange={(newValue) => handleChange(key, newValue)}
                                        disabled={disabled}
                                        parentKey={fullKey}
                                    />
                                </div>
                            )
                        })}
                    </div>
                </div>
            )
        }
        case 'string': {
            return (
                <StringField
                    schema={schema}
                    value={internalValue ?? ''}
                    onChange={onChange}
                    disabled={disabled}
                />
            )
        }
        case 'number':
        case 'integer': {
            return (
                <Input
                    type="number"
                    value={internalValue ?? ''}
                    onChange={(e) => onChange(Number(e.target.value))}
                    disabled={disabled}
                    min={schema.minimum}
                    max={schema.maximum}
                    step={schema.type === 'integer' ? 1 : 'any'}
                />
            )
        }
        case 'boolean': {
            return (
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={Boolean(internalValue)}
                        onChange={(e) => onChange(e.target.checked)}
                        disabled={disabled}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    {schema.title && (
                        <Label>{schema.title}</Label>
                    )}
                </div>
            )
        }
        case 'array': {
            // ToDo: Implement array handling with add/remove functionality
            return null
        }
        default:
            return null
    }
}

export type { JsonSchema, JsonSchemaType, JsonSchemaFormat, SchemaFormProps } from './types'
