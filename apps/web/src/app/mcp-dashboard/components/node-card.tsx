'use client'

import React, { FormEvent, useEffect, useMemo, useState } from 'react'
import { Folder, Send, Loader2 } from 'lucide-react'
import {
    McpRequestHierarchy,
    McpRequestHierarchyContainer,
    McpRequestHierarchyRequest,
} from '@/contexts/McpDataContext'
import { Button } from '@repo/ui/components/shadcn/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@repo/ui/components/shadcn/card'
import { Label } from '@repo/ui/components/shadcn/label'
import { Textarea } from '@repo/ui/components/shadcn/textarea'
import { Badge } from '@repo/ui/components/shadcn/badge'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@repo/ui/components/shadcn/tooltip'
import {
    calculateContainerStatus,
    calculateExpectedContainerStatus,
} from './status-utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { JSONSchemaToZod } from '@dmitryrechkin/json-schema-to-zod'
import { SchemaForm } from '@/components/SchemaForm'
import { z, ZodType, ZodTypeDef } from 'zod'
import { UseMutationResult } from '@tanstack/react-query'
import { MutationInput } from './dashboard'

type ResponseState = { responseData?: unknown; error?: string }
interface NodeCardProps {
    node: McpRequestHierarchy
    responses: Record<number, ResponseState>
    jsonError: Record<number, string | null>
    handleResponseChange: (nodeId: number, value: unknown) => void
    handleErrorChange: (nodeId: number, value: string) => void
    handleSubmit: (e: FormEvent<HTMLFormElement>, nodeId: number) => void
    isSubmitting: (nodeId: number) => boolean
    getBadgeVariant: (
        status: string | null | undefined
    ) => 'default' | 'secondary' | 'destructive' | 'outline' | 'success'
    level?: number
    allowRequestInput?: boolean
    mutation: UseMutationResult<unknown, Error, MutationInput, unknown>
}

export const NodeCard: React.FC<NodeCardProps> = ({
    node,
    responses,
    jsonError,
    handleResponseChange,
    handleErrorChange,
    handleSubmit,
    isSubmitting,
    getBadgeVariant,
    level = 0,
    allowRequestInput = false,
    mutation,
}) => {
    const currentResponse = responses[node.content.id] || {}
    const currentJsonError = jsonError[node.content.id] || null
    const isRequest = node.type === 'request'
    const isDisabled = isSubmitting(node.content.id)

    // Calculate status for container
    const containerStatus = useMemo(() => isRequest ? undefined : calculateContainerStatus(node as McpRequestHierarchyContainer), [isRequest, node]);

    // For pending containers, check if the expected status is different
    const expectedStatus = useMemo(() =>
        !isRequest && node.content.status === 'pending'
            ? calculateExpectedContainerStatus(
                  node as McpRequestHierarchyContainer
              )
            : undefined
    , [isRequest, node]);

    // Use a ref to track if we've already attempted to update this container's status
    // This prevents infinite loops by ensuring we only trigger the update once per status change
    const updateAttemptedRef = React.useRef<{
        id: number
        status: string
    } | null>(null)

    // Auto-update container status if there's a mismatch and it's not currently being updated
    useEffect(() => {
        if (
            !isRequest &&
            node.content.status === 'pending' &&
            expectedStatus &&
            expectedStatus !== 'pending' &&
            !isSubmitting(node.content.id) &&
            !(
                updateAttemptedRef.current?.id === node.content.id &&
                updateAttemptedRef.current?.status === expectedStatus
            )
        ) {
            updateAttemptedRef.current = {
                id: node.content.id,
                status: expectedStatus,
            }
            mutation.mutate({
                type: 'container',
                requestId: node.content.id,
                status: expectedStatus,
                error:
                    expectedStatus === 'error'
                        ? 'Automatically set to error due to child status'
                        : undefined,
            })
        }
    }, [isRequest, node.content.id, node.content.status, expectedStatus, isSubmitting, mutation])

    // Always render as schema input
    if (!(node.content as any).schema) return null
    const baseSchema = useMemo(() => {
        try {
            let schema =
                typeof (node.content as any).schema === 'string'
                    ? JSON.parse((node.content as any).schema)
                    : (node.content as any).schema
            if (!schema.type && schema.properties) {
                return { ...schema, type: 'object' }
            }
            return schema
        } catch (e) {
            console.error('Failed to parse schema:', e)
            return null
        }
    }, [(node.content as any).schema])

    return (
        <Card
            className={`mb-4 ${level > 0 ? 'ml-6' : ''} ${!isRequest ? 'border-l-4 border-blue-500' : 'border-l-4 border-gray-300 dark:border-gray-700'} ${isRequest && node.content.status !== 'pending' ? 'opacity-70' : ''}`}
        >
            <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                        {!isRequest ? (
                            <Folder className="h-5 w-5 text-blue-600" />
                        ) : (
                            <Send className="h-5 w-5 text-purple-600" />
                        )}
                        <CardTitle className="text-lg break-all">
                            {node.content.name ||
                                (!isRequest
                                    ? 'Unnamed Container'
                                    : 'Unnamed Request')}
                        </CardTitle>
                    </div>
                    {/* Display status badge */}
                    {isRequest ? (
                        <Badge
                            variant={
                                getBadgeVariant(node.content.status) as any
                            }
                        >
                            {node.content.status}
                        </Badge>
                    ) : (
                        <Badge
                            variant={getBadgeVariant(containerStatus) as any}
                        >
                            {containerStatus}
                        </Badge>
                    )}
                </div>
                {node.content.description && (
                    <CardDescription className="mt-1 text-sm">
                        {node.content.description}
                    </CardDescription>
                )}
                <CardDescription className="mt-1 text-xs">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="cursor-help">
                                    ID:{' '}
                                    <span className="bg-muted rounded px-1 font-mono">
                                        {node.content.id}
                                    </span>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{node.content.id}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <span className="mx-2">|</span>
                    Created:{' '}
                    {new Date(node.content.date_created!).toLocaleString()}
                </CardDescription>
            </CardHeader>
            {isRequest && (
                <CardContent>
                    {node.content.status === 'pending' ? (
                        <SchemaForm
                            schema={baseSchema}
                            disabled={isDisabled}
                            onSubmit={async (formData) => {
                                // Typesafe submit for request
                                await mutation.mutateAsync({
                                    type: 'request',
                                    requestId: node.content.id,
                                    responseData: formData,
                                });
                            }}
                        />
                    ) : (
                        <div className="space-y-4">
                            {node.content.status === 'completed' &&
                                node.content.responseData && (
                                    <div>
                                        <h3 className="text-md mb-2 font-medium">
                                            Response Data:
                                        </h3>
                                        <div className="bg-muted overflow-auto rounded-md p-3">
                                            <pre className="text-sm break-all whitespace-pre-wrap">
                                                {typeof node.content
                                                    .responseData === 'string'
                                                    ? node.content.responseData
                                                    : JSON.stringify(
                                                          node.content
                                                              .responseData,
                                                          null,
                                                          2
                                                      )}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            {node.content.status === 'error' &&
                                node.content.errorMessage && (
                                    <div>
                                        <h3 className="text-md text-destructive mb-2 font-medium">
                                            Error:
                                        </h3>
                                        <div className="bg-destructive/10 rounded-md p-3">
                                            <p className="text-destructive text-sm">
                                                {node.content.errorMessage}
                                            </p>
                                        </div>
                                    </div>
                                )}
                        </div>
                    )}
                </CardContent>
            )}
            {!isRequest && node.children && node.children.length > 0 && (
                <CardContent className="pt-0">
                    <div className="mt-4 space-y-4 border-t pt-4">
                        <h4 className="text-md font-semibold">
                            Items in this Container:
                        </h4>
                        {node.children.map((child) => (
                            <NodeCard
                                key={child.content.id}
                                node={child}
                                responses={responses}
                                jsonError={jsonError}
                                handleResponseChange={handleResponseChange}
                                handleErrorChange={handleErrorChange}
                                handleSubmit={handleSubmit}
                                isSubmitting={isSubmitting}
                                getBadgeVariant={getBadgeVariant}
                                level={level + 1}
                                allowRequestInput={allowRequestInput}
                                mutation={mutation}
                            />
                        ))}
                    </div>
                </CardContent>
            )}
            {!isRequest && (!node.children || node.children.length === 0) && (
                <CardContent className="pt-0">
                    <p className="text-muted-foreground mt-4 border-t pt-4 text-sm">
                        This container is empty.
                    </p>
                </CardContent>
            )}
            {/* Add error reporting for containers */}
            {!isRequest && node.content.status !== 'error' && (
                <CardContent className="pt-0">
                    <div className="mt-4 space-y-4 border-t pt-4">
                        <h4 className="text-md font-semibold">
                            Container Actions:
                        </h4>
                        <form
                            onSubmit={(e) => handleSubmit(e, node.content.id)}
                            className="space-y-4"
                        >
                            <div>
                                <Label
                                    htmlFor={`error-${node.content.id}`}
                                    className="mb-2 block font-medium"
                                >
                                    Report Error for Container
                                </Label>
                                <Textarea
                                    id={`error-${node.content.id}`}
                                    rows={2}
                                    className="w-full"
                                    placeholder="Describe any error encountered for this container..."
                                    value={currentResponse.error ?? ''}
                                    onChange={(e) =>
                                        handleErrorChange(
                                            node.content.id,
                                            e.target.value
                                        )
                                    }
                                    disabled={isDisabled}
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={
                                        isDisabled || !currentResponse.error
                                    }
                                    variant="destructive"
                                >
                                    {isSubmitting(node.content.id) ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                                            Submitting Error...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />{' '}
                                            Report Container Error
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </CardContent>
            )}
            {/* Display error message for containers */}
            {!isRequest &&
                node.content.status === 'error' &&
                node.content.errorMessage && (
                    <CardContent className="pt-0">
                        <div className="mt-4 space-y-4 border-t pt-4">
                            <h3 className="text-md text-destructive mb-2 font-medium">
                                Container Error:
                            </h3>
                            <div className="bg-destructive/10 rounded-md p-3">
                                <p className="text-destructive text-sm">
                                    {node.content.errorMessage}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                )}
        </Card>
    )
}
