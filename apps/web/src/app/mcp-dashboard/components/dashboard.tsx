'use client'

import { useState, FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TooltipProvider } from '@repo/ui/components/shadcn/tooltip'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@repo/ui/components/shadcn/tabs'
import { Input } from '@repo/ui/components/shadcn/input'
import { useMcpData } from '@/contexts/McpDataContext'
import { submitResponse, submitContainerStatus } from './api-service'
import { NodeCard } from './node-card'
import { getBadgeVariant, calculateContainerStatus } from './status-utils'
import { DashboardViewMode } from './dashboard-view-mode'
import { DashboardTableView } from './dashboard-table-view'
import { DashboardListView } from './dashboard-list-view'
import { DashboardGridView } from './dashboard-grid-view'
import { useQueryState } from 'nuqs'
import { Toaster } from '@repo/ui/components/shadcn/sonner'
import { toast } from 'sonner'

export function Dashboard() {
    const queryClient = useQueryClient()
    const [responses, setResponses] = useState<Record<number, { responseData?: any; error?: string }>>({})
    const [jsonError, setJsonError] = useState<Record<number, string | null>>({})
    // --- Filtering, Search, and Tab State ---
    const [tab, setTab] = useQueryState<'pending' | 'completed' | 'error'>('tab', {
        defaultValue: 'pending',
        history: 'replace',
        parse: (v) => (v === 'completed' || v === 'error' ? v : 'pending'),
        serialize: (v) => v,
    })
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('') // For future advanced filtering

    // View mode state
    const [viewMode, setViewMode] = useState('card')

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
        { requestId: number; responseData?: any; error?: string; isContainer?: boolean; status?: 'completed' | 'error' }
    >({
        mutationFn: async (variables) => {
            if (variables.isContainer && variables.status) {
                return submitContainerStatus({
                    containerId: variables.requestId,
                    status: variables.status,
                    error: variables.error,
                })
            } else {
                return submitResponse(variables)
            }
        },
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
            toast.success(
                variables.isContainer
                    ? `Container #${variables.requestId} updated successfully.`
                    : `Request #${variables.requestId} updated successfully.`
            )
        },
        onError: (error, variables) => {
            console.error(
                `Directus submission error for ${variables.requestId}:`,
                error.message
            )
            toast.error(
                variables.isContainer
                    ? `Failed to update container #${variables.requestId}: ${error.message}`
                    : `Failed to update request #${variables.requestId}: ${error.message}`
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
                    isContainer: true,
                    status: 'error',
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

    // Helper: recursively filter/search nodes
    // Use status-utils to get the real status for containers
    function filterNodes(nodes: any[]): any[] {
        // Helper: recursively flatten all nodes (including nested)
        function flatten(nodes: any[]): any[] {
            let result: any[] = []
            for (const node of nodes) {
                result.push(node)
                if (node.type === 'container' && node.children) {
                    result = result.concat(flatten(node.children))
                }
            }
            return result
        }
        // If searching, flatten all nodes and filter by search, then group by top-level container/request
        if (search) {
            const allNodes = flatten(nodes)
            const filtered = allNodes.filter((node: any) => {
                const name = node.content.name?.toLowerCase() || ''
                const desc = node.content.description?.toLowerCase() || ''
                return (
                    name.includes(search.toLowerCase()) ||
                    desc.includes(search.toLowerCase())
                )
            })
            // Show only top-level nodes that match, or that have descendants matching
            function hasMatchingDescendant(node: any): boolean {
                if (filtered.includes(node)) return true
                if (node.type === 'container' && node.children) {
                    return node.children.some(hasMatchingDescendant)
                }
                return false
            }
            return nodes
                .filter(hasMatchingDescendant)
                .map((node: any) => {
                    if (node.type === 'container' && node.children) {
                        return {
                            ...node,
                            children: filterNodes(node.children),
                        }
                    }
                    return node
                })
        }
        // Otherwise, filter by tab (status)
        return nodes
            .filter((node: any) => {
                let status
                if (node.type === 'container') {
                    status = calculateContainerStatus(node)
                } else {
                    status = node.content.status
                }
                if (tab === 'pending' && status !== 'pending') return false
                if (tab === 'completed' && status !== 'completed') return false
                if (tab === 'error' && status !== 'error') return false
                return true
            })
            .map((node: any) => {
                if (node.type === 'container' && node.children) {
                    return {
                        ...node,
                        children: filterNodes(node.children),
                    }
                }
                return node
            })
    }
    // Helper: get container status
    function getContainerStatus(node) {
        if (node.type === 'container') {
            return getBadgeVariant === undefined ? node.content.status : getBadgeVariant(node.content.status)
        }
        return node.content.status
    }
    // Use the status calculation from status-utils for containers
    function getTopLevelStatus(node) {
        if (node.type === 'container') {
            return getBadgeVariant === undefined ? node.content.status : getBadgeVariant(node.content.status)
        }
        return node.content.status
    }
    // Use the status calculation from status-utils for containers
    function getStatus(node) {
        if (node.type === 'container') {
            return getBadgeVariant === undefined ? node.content.status : getBadgeVariant(node.content.status)
        }
        return node.content.status
    }
    // ---

    return (
        <TooltipProvider>
            <div className="container mx-auto min-h-screen p-4 pt-12 pb-10 md:pt-20">
                <div className="mx-auto mb-8 flex max-w-7xl items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Dashboard
                    </h1>
                </div>

                <div className="mx-auto max-w-7xl">
                    {/* Search and filter controls */}
                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                        <Input
                            type="text"
                            placeholder="Search by name or description..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="max-w-xs"
                        />
                        <DashboardViewMode mode={viewMode} setMode={setViewMode} />
                    </div>
                    <Tabs value={tab} onValueChange={value => setTab(value as typeof tab)} className="w-full">
                        <TabsList>
                            <TabsTrigger value="pending">In Progress</TabsTrigger>
                            <TabsTrigger value="completed">Completed</TabsTrigger>
                            <TabsTrigger value="error">Error</TabsTrigger>
                        </TabsList>
                        <TabsContent value="pending">
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
                            {!isLoading && !isError && filterNodes(mcpRequestHierarchy).length === 0 && (
                                <p className="text-muted-foreground text-center">
                                    No pending requests found.
                                </p>
                            )}
                            {!isLoading && !isError && filterNodes(mcpRequestHierarchy).length > 0 && (
                                <div>
                                    {viewMode === 'card' && (
                                        <div className="space-y-6">
                                            {filterNodes(mcpRequestHierarchy).map((node) => (
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
                                    {viewMode === 'table' && (
                                        <DashboardTableView nodes={filterNodes(mcpRequestHierarchy)} />
                                    )}
                                    {viewMode === 'list' && (
                                        <DashboardListView nodes={filterNodes(mcpRequestHierarchy)} />
                                    )}
                                    {viewMode === 'grid' && (
                                        <DashboardGridView nodes={filterNodes(mcpRequestHierarchy)} />
                                    )}
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="completed">
                            {!isLoading && !isError && filterNodes(mcpRequestHierarchy).length === 0 && (
                                <p className="text-muted-foreground text-center">
                                    No completed requests found.
                                </p>
                            )}
                            {!isLoading && !isError && filterNodes(mcpRequestHierarchy).length > 0 && (
                                <div>
                                    {viewMode === 'card' && (
                                        <div className="space-y-6">
                                            {filterNodes(mcpRequestHierarchy).map((node) => (
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
                                    {viewMode === 'table' && (
                                        <DashboardTableView nodes={filterNodes(mcpRequestHierarchy)} />
                                    )}
                                    {viewMode === 'list' && (
                                        <DashboardListView nodes={filterNodes(mcpRequestHierarchy)} />
                                    )}
                                    {viewMode === 'grid' && (
                                        <DashboardGridView nodes={filterNodes(mcpRequestHierarchy)} />
                                    )}
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="error">
                            {!isLoading && !isError && filterNodes(mcpRequestHierarchy).length === 0 && (
                                <p className="text-muted-foreground text-center">
                                    No error requests found.
                                </p>
                            )}
                            {!isLoading && !isError && filterNodes(mcpRequestHierarchy).length > 0 && (
                                <div>
                                    {viewMode === 'card' && (
                                        <div className="space-y-6">
                                            {filterNodes(mcpRequestHierarchy).map((node) => (
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
                                    {viewMode === 'table' && (
                                        <DashboardTableView nodes={filterNodes(mcpRequestHierarchy)} />
                                    )}
                                    {viewMode === 'list' && (
                                        <DashboardListView nodes={filterNodes(mcpRequestHierarchy)} />
                                    )}
                                    {viewMode === 'grid' && (
                                        <DashboardGridView nodes={filterNodes(mcpRequestHierarchy)} />
                                    )}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
            <Toaster />
        </TooltipProvider>
    )
}
