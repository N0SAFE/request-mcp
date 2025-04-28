'use client'

import React, { createContext, useContext, useMemo, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Collections } from '@repo/directus-sdk/client'
import directus from '@/lib/directus'
import { ApplyFields } from '@repo/directus-sdk/indirectus/utils'

export type McpRequestHierarchyContainer = {
    type: 'container'
    content: ApplyFields<
        Collections.RequestContainer,
        ['*', { children: ['*'] }]
    >
    children?: McpRequestHierarchy[]
}

export type McpRequestHierarchyRequest = {
    type: 'request'
    content: ApplyFields<Collections.Request>
}

export type McpRequestHierarchy =
    | McpRequestHierarchyContainer
    | McpRequestHierarchyRequest

interface McpDataContextType {
    mcpRequestHierarchy: McpRequestHierarchy[]
    isLoading: boolean
    isError: boolean
    error: Error | null
    getRequestById: (id: number) => ApplyFields<Collections.Request> | undefined
    getContainerById: (
        id: number
    ) =>
        | ApplyFields<Collections.RequestContainer, ['*', { children: ['*'] }]>
        | undefined
}

const McpDataContext = createContext<McpDataContextType | undefined>(undefined)

// Function to fetch all nodes (requests and containers)
const fetchAllNodes = async (): Promise<{
    requests: ApplyFields<Collections.Request>[]
    containers: ApplyFields<
        Collections.RequestContainer,
        ['*', { children: ['*'] }]
    >[]
}> => {
    const [requestsRes, containersRes] = await Promise.all([
        directus.Requests.query({ limit: -1 }),
        directus.RequestContainers.query({
            limit: -1,
            fields: ['*', { children: ['*'] }],
        }),
    ])

    if (!requestsRes || !containersRes) {
        throw new Error('Failed to fetch data from Directus')
    }

    return {
        requests: requestsRes,
        containers: containersRes,
    }
}

export const McpDataProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['allMcpNodes'],
        queryFn: fetchAllNodes,
        refetchInterval: 5000,
    })

    const getRequestById = (
        id: number
    ): ApplyFields<Collections.Request> | undefined => {
        if (!data) return undefined
        return data.requests.find((request) => request.id === id)
    }

    const getContainerById = (
        id: number
    ):
        | ApplyFields<Collections.RequestContainer, ['*', { children: ['*'] }]>
        | undefined => {
        if (!data) return undefined
        return data.containers.find((container) => container.id === id)
    }

    const mcpRequestHierarchy = useMemo(() => {
        if (!data) return []
        // Move buildRequestHierarchy inside useMemo to avoid dependency issues
        const buildContainerHierarchy = (
            container: ApplyFields<Collections.RequestContainer, ['*', { children: ['*'] }]>,
            containers: ApplyFields<Collections.RequestContainer, ['*', { children: ['*'] }]>[],
            requests: ApplyFields<Collections.Request>[]
        ): McpRequestHierarchyContainer => {
            return {
                type: 'container',
                content: container,
                children: container.children
                    .map(({ item, collection }) => {
                        if (collection === 'request_container') {
                            const childContainer = containers.find((c) => c.id === Number(item))
                            if (childContainer) {
                                return buildContainerHierarchy(childContainer, containers, requests)
                            }
                            return undefined
                        }
                        if (collection === 'request') {
                            const request = requests.find((r) => r.id === Number(item))
                            if (request) {
                                return {
                                    type: 'request' as const,
                                    content: request,
                                }
                            }
                            return undefined
                        }
                        return undefined
                    })
                    .filter(Boolean) as McpRequestHierarchy[],
            }
        }
        const buildRequestHierarchy = (): McpRequestHierarchy[] => {
            const { containers, requests } = data
            // Find root containers (not referenced as children by any other container)
            const referencedContainerIds = new Set<number>()
            containers.forEach((container) => {
                container.children.forEach(({ item, collection }) => {
                    if (collection === 'request_container') {
                        referencedContainerIds.add(Number(item))
                    }
                })
            })
            const rootContainers = containers.filter((container) => !referencedContainerIds.has(container.id))
            const hierarchy: McpRequestHierarchy[] = []
            // Build hierarchy for root containers
            rootContainers.forEach((container) => {
                hierarchy.push(buildContainerHierarchy(container, containers, requests))
            })
            // Add requests that are not referenced by any container
            const referencedRequestIds = new Set<number>()
            containers.forEach((container) => {
                container.children.forEach(({ item, collection }) => {
                    if (collection === 'request') {
                        referencedRequestIds.add(Number(item))
                    }
                })
            })
            requests.forEach((request) => {
                if (!referencedRequestIds.has(request.id)) {
                    hierarchy.push({
                        type: 'request',
                        content: request,
                    })
                }
            })
            return hierarchy
        }
        return buildRequestHierarchy()
    }, [data])

    console.log(mcpRequestHierarchy)

    const value = {
        mcpRequestHierarchy,
        isLoading,
        isError,
        error,
        getRequestById,
        getContainerById,
    }

    return (
        <McpDataContext.Provider value={value}>
            {children}
        </McpDataContext.Provider>
    )
}

export const useMcpData = (): McpDataContextType => {
    const context = useContext(McpDataContext)
    if (context === undefined) {
        throw new Error('useMcpData must be used within a McpDataProvider')
    }
    return context
}
