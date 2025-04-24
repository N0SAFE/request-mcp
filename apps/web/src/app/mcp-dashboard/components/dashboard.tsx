'use client'

import { useState, FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TooltipProvider } from '@repo/ui/components/shadcn/tooltip'
import { useMcpData } from '@/contexts/McpDataContext'
import { submitResponse } from './api-service'
import { NodeCard } from './node-card'
import { getBadgeVariant } from './status-utils'

export function Dashboard() {
    const queryClient = useQueryClient()
    const [responses, setResponses] = useState<Record<number, { responseData?: any; error?: string }>>({})
    const [jsonError, setJsonError] = useState<Record<number, string | null>>({})

    const {
        mcpRequestHierarchy,
        isLoading,
        isError,
        error: queryError,
        getRequestById,
    } = useMcpData()

    const mutation = useMutation<
        any,
        Error, 
        { requestId: number; responseData?: any; error?: string }
    >({
        mutationFn: submitResponse,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['allMcpNodes'] })
            setResponses((prev) => {
                const newState = { ...prev }
                delete newState[variables.requestId]
                return newState
            })
            setJsonError((prev) => ({
                ...prev,
                [variables.requestId]: null,
            }))
        },
        onError: (error, variables) => {
            console.error(
                `Directus submission error for ${variables.requestId}:`,
                error.message
            )
        },
    })

    const handleResponseChange = (nodeId: number, value: any) => {
        setResponses((prev) => ({
            ...prev,
            [nodeId]: { ...prev[nodeId], responseData: value },
        }))
        setJsonError((prev) => ({ ...prev, [nodeId]: null }))
    }

    const handleErrorChange = (nodeId: number, value: string) => {
        setResponses((prev) => ({
            ...prev,
            [nodeId]: { ...prev[nodeId], error: value },
        }))
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>, nodeId: number) => {
        e.preventDefault()
        setJsonError((prev) => ({ ...prev, [nodeId]: null }))

        const requestDetails = getRequestById(nodeId)
        const responsePayload = responses[nodeId]
        if (!responsePayload || (responsePayload.responseData === undefined && !responsePayload.error)) {
            console.warn('Submit called but no response data or error message provided for:', nodeId)
            return
        }

        let finalResponseData = responsePayload.responseData

        // Check if this is a container (no requestDetails from getRequestById)
        if (!requestDetails) {
            // This is likely a container - just submit the error
            if (responsePayload.error) {
                mutation.mutate({
                    requestId: nodeId,
                    responseData: undefined, 
                    error: responsePayload.error,
                })
            }
            return
        }

        // Handle request submission with JSON validation
        const inputType = requestDetails.inputType as string
        if ((inputType === 'json' || inputType === 'schema') && 
            typeof finalResponseData === 'string' && 
            finalResponseData.trim() !== '') {
            try {
                finalResponseData = JSON.parse(finalResponseData)
            } catch (parseError: any) {
                console.error('JSON Parse Error:', parseError)
                setJsonError((prev) => ({
                    ...prev,
                    [nodeId]: `Invalid JSON: ${parseError.message}`,
                }))
                return
            }
        }

        mutation.mutate({
            requestId: nodeId,
            responseData: finalResponseData,
            error: responsePayload.error,
        })
    }

    const isSubmitting = (nodeId: number) =>
        mutation.isPending && mutation.variables?.requestId === nodeId

    return (
        <TooltipProvider>
            <div className="container mx-auto min-h-screen p-4 pt-12 pb-10 md:pt-20">
                <div className="mx-auto mb-8 flex max-w-7xl items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Dashboard
                    </h1>
                </div>

                <div className="mx-auto max-w-7xl">
                    {isLoading && (
                        <p className="text-muted-foreground text-center">
                            Loading requests...
                        </p>
                    )}
                    {isError && (
                        <p className="text-center text-red-600 dark:text-red-400">
                            Error loading requests: {queryError?.message}
                        </p>
                    )}
                    {!isLoading && !isError && mcpRequestHierarchy.length === 0 && (
                        <p className="text-muted-foreground text-center">
                            No pending requests found.
                        </p>
                    )}
                    {!isLoading && !isError && mcpRequestHierarchy.length > 0 && (
                        <div className="space-y-6">
                            {mcpRequestHierarchy.map((node) => (
                                <NodeCard
                                    key={node.content.id}
                                    node={node}
                                    responses={responses}
                                    jsonError={jsonError}
                                    handleResponseChange={handleResponseChange}
                                    handleErrorChange={handleErrorChange}
                                    handleSubmit={handleSubmit}
                                    isSubmitting={isSubmitting}
                                    getBadgeVariant={getBadgeVariant}
                                    level={0}
                                    allowRequestInput={true}
                                    mutation={mutation}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </TooltipProvider>
    )
}
