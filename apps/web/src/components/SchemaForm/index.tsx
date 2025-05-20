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
import { z, ZodType } from 'zod'
import { ZodTypeDef } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Loader2, Send } from 'lucide-react'
import { Textarea } from '@repo/ui/components/shadcn/textarea'

function createZodSchema(schema: JsonSchema) {
    const dataZod = JSONSchemaToZod.convert(schema)
    return z.discriminatedUnion('success', [
        z.object({
            success: z.literal(true),
            data: dataZod,
            error: z.string(),
        }),
        z.object({
            success: z.literal(false),
            data: z.object({}).optional(),
            error: z.string().min(1),
        }),
    ])
}

export function SchemaForm({
    schema,
    disabled = false,
    onSubmit,
}: SchemaFormProps & {
    onSubmit?: (
        data: z.infer<ReturnType<typeof createZodSchema>>
    ) => Promise<any>
}) {
    // État pour suivre si nous sommes en mode erreur
    const [isErrorMode, setIsErrorMode] = useState(false)

    // Construire un schéma Zod qui accepte soit des données valides, soit un état d'erreur
    const zodSchema = useMemo(() => createZodSchema(schema), [schema])

    const form = useForm({
        resolver: zodSchema ? zodResolver(zodSchema) : undefined,
        defaultValues: {
            success: true,
            data: {},
            error: '',
        },
    })

    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (name === 'error') {
                const errorValue = value.error
                if (errorValue && errorValue.length > 0) {
                    if (!isErrorMode) {
                        setIsErrorMode(true)
                        form.setValue('success', false)
                    }
                } else {
                    if (isErrorMode) {
                        setIsErrorMode(false)
                        form.setValue('success', true)
                    }
                }
            }
        })
        return () => subscription.unsubscribe()
    }, [form, isErrorMode])

    // Fonction pour générer les champs de formulaire en fonction du schéma
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
                        name={`data.${parentKey}`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {schema.title || parentKey}
                                </FormLabel>
                                <FormControl>
                                    <StringField
                                        {...field}
                                        schema={schema}
                                        disabled={disabled || isErrorMode}
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
                        name={`data.${parentKey}`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {schema.title || parentKey}
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        disabled={disabled || isErrorMode}
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
                            name={`data.${parentKey}`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {schema.title || parentKey}
                                    </FormLabel>
                                    <FormControl>
                                        <input
                                            {...field}
                                            type="checkbox"
                                            disabled={disabled || isErrorMode}
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

    // Mutation pour soumettre le formulaire
    const { mutate, isPending, isError, error, reset } = useMutation({
        mutationFn: async (formData: z.infer<typeof zodSchema>) => {
            if (onSubmit) {
                return onSubmit(formData)
            }
            // fallback: simulate
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (
                        !formData.success &&
                        (!formData.error || formData.error.length === 0)
                    ) {
                        reject(
                            new Error(
                                "Le message d'erreur ne peut pas être vide"
                            )
                        )
                        return
                    }
                    resolve(formData)
                }, 2000)
            })
        },
    })

    const handleSubmit = form.handleSubmit(
        (data) => {
            if (isErrorMode) {
                data.data = null
                data.success = false
            } else {
                data.error = ''
                data.success = true
            }
            mutate(data)
        },
        (error) => {
            console.error('Form submission error:', error)
        }
    )

    return (
        <Form {...form}>
            <form
                className="space-y-4"
                onSubmit={(e) => {
                    if (isError) reset()
                    handleSubmit(e)
                }}
            >
                {/* Champs de formulaire pour les données */}
                <div className={cn(isErrorMode && 'opacity-50')}>
                    {generateInputs(schema)}
                </div>

                {/* Champ caché pour le flag success */}
                <FormField
                    control={form.control}
                    name="success"
                    render={({ field }) => (
                        <FormItem className="hidden">
                            <FormControl>
                                <input
                                    type="hidden"
                                    {...field}
                                    value={field.value ? 'true' : 'false'}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background text-muted-foreground px-2">
                            OU
                        </span>
                    </div>
                </div>

                {/* Champ pour le message d'erreur */}
                <div>
                    <FormField
                        control={form.control}
                        name="error"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Signaler une erreur</FormLabel>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        rows={3}
                                        className={cn(
                                            'w-full',
                                            isErrorMode && 'border-destructive'
                                        )}
                                        placeholder="Décrivez l'erreur rencontrée..."
                                        disabled={disabled}
                                        value={field.value || ''}
                                        onChange={(e) => {
                                            field.onChange(e.target.value)
                                            // La mise à jour du mode est gérée par l'effet useEffect
                                        }}
                                    />
                                </FormControl>
                                <FormDescription>
                                    {isErrorMode
                                        ? 'Mode erreur activé. Les champs de données sont désactivés.'
                                        : "Remplissez ce champ pour signaler une erreur au lieu d'envoyer des données."}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Affichage d'une erreur de soumission */}
                {isError && error && (
                    <div className="border-destructive bg-destructive/10 text-destructive mb-2 rounded border p-2">
                        {error instanceof Error ? error.message : String(error)}
                    </div>
                )}
                {/* Bouton de soumission */}
                <div className="flex justify-end">
                    <Button
                        type="submit"
                        variant={isErrorMode ? 'destructive' : undefined}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isErrorMode
                                    ? "Envoi de l'erreur..."
                                    : 'Envoi des données...'}
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                {isErrorMode
                                    ? "Envoyer l'erreur"
                                    : 'Envoyer les données'}
                            </>
                        )}
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
