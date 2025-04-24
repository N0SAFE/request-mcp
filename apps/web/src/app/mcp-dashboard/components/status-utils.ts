import { McpRequestHierarchyContainer } from '@/contexts/McpDataContext'

// Calculate container status based on child nodes
export const calculateContainerStatus = (node: McpRequestHierarchyContainer): 'pending' | 'completed' | 'error' => {
    // Always respect the container's actual status if explicitly set (regardless of the value)
    if (node.content.status) {
        return node.content.status as 'pending' | 'completed' | 'error';
    }
    
    // If the container has no children, it's still pending
    if (!node.children || node.children.length === 0) {
        return 'pending';
    }
    
    // Count statuses of all children
    const statuses = node.children.map((child) => {
        if (child.type === 'container') {
            return calculateContainerStatus(child);
        } else {
            return child.content.status as 'pending' | 'completed' | 'error';
        }
    });
    
    // If any child has error status, container has error status
    if (statuses.includes('error')) {
        return 'error';
    }
    
    // If all children are completed, container is completed
    if (statuses.every((status) => status === 'completed')) {
        return 'completed';
    }
    
    // Otherwise container is still pending
    return 'pending';
};

// Calculate container status based ONLY on child nodes (ignoring container's own status)
export const calculateExpectedContainerStatus = (node: McpRequestHierarchyContainer): 'pending' | 'completed' | 'error' => {
    // If the container has no children, it's still pending
    if (!node.children || node.children.length === 0) {
        return 'pending';
    }
    
    // Count statuses of all children
    const statuses = node.children.map((child) => {
        if (child.type === 'container') {
            // For child containers, we need to consider their actual status first
            if (child.content.status) {
                return child.content.status as 'pending' | 'completed' | 'error';
            }
            return calculateExpectedContainerStatus(child);
        } else {
            return child.content.status as 'pending' | 'completed' | 'error';
        }
    });
    
    // If any child has error status, container has error status
    if (statuses.includes('error')) {
        return 'error';
    }
    
    // If all children are completed, container is completed
    if (statuses.every((status) => status === 'completed')) {
        return 'completed';
    }
    
    // Otherwise container is still pending
    return 'pending';
};

// Utility function to get badge variant based on status
export const getBadgeVariant = (
    status: string | null | undefined
): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' => {
    switch (status) {
        case 'completed':
            return 'success'
        case 'error':
            return 'destructive'
        case 'pending':
            return 'secondary'
        default:
            return 'outline'
    }
}
