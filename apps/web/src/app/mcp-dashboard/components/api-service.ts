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
