export type LayoutType = 'default' | 'flex' | 'grid' | 'columns' | 'tabs'

export type LayoutOptions = {
    type?: LayoutType
    columns?: 1 | 2 | 3 | 4
    gap?: 'small' | 'medium' | 'large'
    alignment?: 'start' | 'center' | 'end'
    style?: {
        className?: string
        padding?: string
        margin?: string
        background?: string
    }
}

export type JsonSchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array'

export type JsonSchemaFormat = 
    | 'email' 
    | 'uri' 
    | 'date' 
    | 'time' 
    | 'datetime' 
    | 'password'
    | 'textarea'
    | 'color'
    | 'range'
    | 'rating'
    | 'phone'
    | 'currency'
    | 'code'
    | 'tags'
    | 'pattern'

export type JsonSchema = {
    type?: JsonSchemaType
    format?: JsonSchemaFormat
    properties?: Record<string, JsonSchema>
    required?: string[]
    title?: string
    description?: string
    enum?: string[]
    enumNames?: string[]
    minimum?: number
    maximum?: number
    placeholder?: string
    pattern?: string
    options?: {
        layout?: LayoutOptions
        currency?: string
        language?: string
        maxRating?: number
        accept?: string
        maxSize?: number
        countryCode?: string
        multiline?: boolean
        minDate?: string
        maxDate?: string
    }
}

export interface SchemaFormProps {
    schema: JsonSchema
    value: any
    onChange: (value: any) => void
    disabled?: boolean
    parentKey?: string
}
