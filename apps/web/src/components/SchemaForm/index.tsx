'use client'

import { useEffect, useMemo, useState } from 'react'
import { JsonSchema, SchemaFormProps } from './types'
import { getDefaultValue, getLayoutClasses } from './utils'
import { Label } from '@repo/ui/components/shadcn/label'
import { Input } from '@repo/ui/components/shadcn/input'
import { StringField } from './components/StringField'
import { JSONSchemaToZod } from '@dmitryrechkin/json-schema-to-zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@repo/ui/lib/utils'
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from '@repo/ui/components/shadcn/tabs'
import { TableView } from './views/TableView'
import { CardView } from './views/CardView'
import { ListView } from './views/ListView'
import { AccordionView } from './views/AccordionView'
import { useForm } from 'react-hook-form'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@repo/ui/components/shadcn/form'
import { Button } from '@repo/ui/components/shadcn/button'

export function SchemaForm({
    schema,
    onSubmit,
    disabled = false,
}: SchemaFormProps) {
    const submit = (data: any) => {
        const parsedData = JSON.parse(JSON.stringify(data))
        onSubmit(parsedData)
    }

    if (!schema.type && schema.properties) {
        schema = { ...schema, type: 'object' }
    }

    const zodSchema = useMemo(() => {
        return JSONSchemaToZod.convert(schema)
    }, [schema])

    console.log(zodSchema)

    const form = useForm({
        resolver: zodResolver(zodSchema),
    })

    const generateInputs = (schema: JsonSchema, parentKey = '') => {
        switch (schema.type) {
            case 'object': {
                if (!schema.properties) return null

                const isRoot = !parentKey
                const hasTitle = Boolean(schema.title)
                const layoutClasses = getLayoutClasses(schema.options?.layout)

                return (
                    <div
                        className={cn(
                            'relative',
                            !isRoot && 'border-muted ml-2 border-l-2 pl-4',
                            hasTitle && 'pt-2',
                            schema.options?.layout?.style?.padding,
                            schema.options?.layout?.style?.margin,
                            schema.options?.layout?.style?.background &&
                                `bg-${schema.options.layout.style.background}`
                        )}
                    >
                        {schema.title && (
                            <div
                                className={cn(
                                    'font-semibold',
                                    isRoot ? 'mb-6 text-2xl' : 'mb-4 text-lg'
                                )}
                            >
                                {schema.title}
                                {schema.description && (
                                    <p className="text-muted-foreground mt-1 text-sm font-normal">
                                        {schema.description}
                                    </p>
                                )}
                            </div>
                        )}
                        <div className={cn('space-y-6', layoutClasses)}>
                            {Object.entries(schema.properties).map(
                                ([key, propSchema]) => {
                                    const fullKey = parentKey
                                        ? `${parentKey}.${key}`
                                        : key
                                    const isRequired =
                                        schema.required?.includes(key)
                                    const isNestedObject =
                                        propSchema.type === 'object'

                                    return (
                                        <div
                                            key={key}
                                            className={cn(
                                                schema.options?.layout?.type ===
                                                    'flex' &&
                                                    'min-w-[200px] flex-1',
                                                schema.options?.layout?.type ===
                                                    'grid' && 'w-full',
                                                isNestedObject && 'pt-2'
                                            )}
                                        >
                                            {(!isNestedObject ||
                                                !propSchema.title) && (
                                                <>
                                                    <Label
                                                        className={cn(
                                                            isRequired &&
                                                                "after:ml-1 after:text-red-500 after:content-['*']"
                                                        )}
                                                    >
                                                        {propSchema.title ||
                                                            key}
                                                    </Label>
                                                    {propSchema.description && (
                                                        <p className="text-muted-foreground text-sm">
                                                            {
                                                                propSchema.description
                                                            }
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                            {generateInputs(
                                                propSchema,
                                                fullKey
                                            )}
                                        </div>
                                    )
                                }
                            )}
                        </div>
                    </div>
                )
            }
            case 'string': {
                return (
                    <FormField
                        control={form.control}
                        name={parentKey}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {schema.title || parentKey}
                                </FormLabel>
                                <FormControl>
                                    <StringField
                                        {...field}
                                        schema={schema}
                                        disabled={disabled}
                                    />
                                </FormControl>
                                <FormDescription>
                                    {schema.description}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )
            }
            case 'number':
            case 'integer': {
                return (
                    <FormField
                        control={form.control}
                        name={parentKey}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {schema.title || parentKey}
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        disabled={disabled}
                                        min={schema.minimum}
                                        max={schema.maximum}
                                        step={
                                            schema.type === 'integer'
                                                ? 1
                                                : 'any'
                                        }
                                    />
                                </FormControl>
                                <FormDescription>
                                    {schema.description}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )
            }
            case 'boolean': {
                return (
                    <div className="flex items-center space-x-2">
                        <FormField
                            control={form.control}
                            name={parentKey}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {schema.title || parentKey}
                                    </FormLabel>
                                    <FormControl>
                                        <input
                                            {...field}
                                            type="checkbox"
                                            disabled={disabled}
                                            className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {schema.description}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
                {generateInputs(schema)}
                <div className="flex justify-end">
                    <Button
                        type="submit"
                        disabled={disabled}
                        className="w-full sm:w-auto"
                    >
                        Submit
                    </Button>
                </div>
            </form>
        </Form>
    )
}

export type {
    JsonSchema,
    JsonSchemaType,
    JsonSchemaFormat,
    SchemaFormProps,
} from './types'
