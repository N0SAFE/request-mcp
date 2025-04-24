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

    const buildRequestHierarchy = (): McpRequestHierarchy[] => {
        const hierarchy: McpRequestHierarchy[] = []
        const requestMap = new Map<number, McpRequestHierarchy>()
        const containerMap = new Map<number, McpRequestHierarchy>()
        data?.containers.forEach((container) => {
            containerMap.set(container.id, {
                type: 'container',
                content: container,
                children: container.children
                    .map(({ item, collection }) => {
                        if (collection === 'request_container') {
                            if (containerMap.has(Number(item))) {
                                return containerMap.get(Number(item))!
                            }
                            const container = data?.containers.find(
                                (c) => c.id === Number(item)
                            )!
                            return {
                                type: 'container' as const,
                                content: container,
                                children: [],
                            }
                        }
                        const request = data?.requests.find(
                            (r) => r.id === Number(item)
                        )!
                        const requestHierarchy = {
                            type: 'request' as const,
                            content: request,
                        }
                        requestMap.set(request.id, requestHierarchy)
                        return requestHierarchy
                    })
                    .filter(Boolean),
            })
        })
        containerMap.forEach((container) => {
            hierarchy.push(container)
        })
        data?.requests.forEach((request) => {
            if (!requestMap.has(request.id)) {
                const requestHierarchy = {
                    type: 'request' as const,
                    content: request,
                }
                hierarchy.push(requestHierarchy)
            }
        })
        return hierarchy
    }

    const mcpRequestHierarchy = useMemo(() => {
        if (!data) return []
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
