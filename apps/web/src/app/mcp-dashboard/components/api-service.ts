import { Collections } from '@repo/directus-sdk/client'
import directus from '@/lib/directus'

export const submitResponse = async ({
    requestId,
    responseData,
    error,
}: {
    requestId: number
    responseData?: any
    error?: string
}) => {
    const payload: Partial<Collections.Request> = {
        status: error ? 'error' : 'completed',
        responseData: responseData !== undefined ? JSON.stringify(responseData) : undefined,
        errorMessage: error || undefined,
    }

    Object.keys(payload).forEach(
        (key) =>
            payload[key as keyof typeof payload] === undefined &&
            delete payload[key as keyof typeof payload]
    )

    try {
        const updatedItem = await directus.Requests.update([requestId], payload)
        return updatedItem[0]
    } catch (sdkError: any) {
        console.error('Directus SDK Error updating request:', sdkError)
        const message =
            sdkError.errors?.[0]?.message ||
            sdkError.message ||
            'Failed to update request via Directus SDK'
        throw new Error(message)
    }
}

// Update the status of a container (not a request)
export const submitContainerStatus = async ({
    containerId,
    status,
    error,
}: {
    containerId: number
    status: 'completed' | 'error'
    error?: string
}) => {
    const payload: Partial<Collections.RequestContainer> = {
        status,
        errorMessage: error || undefined,
    }
    Object.keys(payload).forEach(
        (key) =>
            payload[key as keyof typeof payload] === undefined &&
            delete payload[key as keyof typeof payload]
    )
    try {
        const updatedItem = await directus.RequestContainers.update([containerId], payload)
        return updatedItem[0]
    } catch (sdkError: any) {
        console.error('Directus SDK Error updating container:', sdkError)
        const message =
            sdkError.errors?.[0]?.message ||
            sdkError.message ||
            'Failed to update container via Directus SDK'
        throw new Error(message)
    }
}
