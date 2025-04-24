/**
 * Directus service module
 * Handles all interactions with the Directus API
 */
import { createTypedClient, Schema as DirectusSchema } from "@repo/directus-sdk/client";
import { 
  staticToken,
  rest,
  realtime
} from "@repo/directus-sdk";
import { config } from "../config";

/**
 * Create and configure the Directus client with admin token
 */
export const directusClient = createTypedClient(config.urls.directus).with(
  rest({
    credentials: 'include',
    onRequest: (options) => ({ ...options, cache: 'no-store' }),
  }),
).with(
    realtime()
).with(staticToken(config.auth.directusAdminToken || ''));

directusClient.subscribe('request', {
    event: 'update',
    query: {
        filter: {
            _or: [{
                status: { _eq: 'completed' }
            }, {
                status: { _eq: 'error' }
            }]
        }
    }
})

/**
 * Container creation interface
 */
export interface CreateContainerParams {
  title: string;
  description?: string | null;
  parentContainerId?: number;
}

/**
 * Request creation interface
 */
export interface CreateRequestParams {
  title: string;
  description?: string | null;
  type: 'text' | 'select' | 'schema';
  placeholder?: string;
  selectOptions?: Array<{ label: string; value: string }>;
  schema?: object;
  containerId?: number;
  metadata?: Record<string, any>;
}

/**
 * Interface for waiting for completion response
 */
export interface WaitForCompletionResponse {
  status: 'completed' | 'error';
  data?: any;
  error?: string;
}

/**
 * Types for container hierarchy matching McpDataContext
 */
export interface McpRequestHierarchyContainer {
  type: 'container';
  content: any; // Container data
  children?: McpRequestHierarchy[];
}

export interface McpRequestHierarchyRequest {
  type: 'request';
  content: any; // Request data
}

export type McpRequestHierarchy = McpRequestHierarchyContainer | McpRequestHierarchyRequest;

/**
 * Creates a container in Directus
 * 
 * @param params - Container creation parameters
 * @returns The created container
 */
export async function createContainer(params: CreateContainerParams): Promise<any> {
  const { title, description, parentContainerId } = params;
  
  // Create the container in Directus
  const container = await directusClient.RequestContainer.create({
    name: title,
    description: description || null,
  });

  // If parent container is specified, add this container as a child
  if (parentContainerId && typeof parentContainerId === 'number') {
    // Get the parent container
    const parentContainer = await directusClient.RequestContainer.get(parentContainerId, {
      fields: ['*', { children: ['*'] }]
    });

    if (!parentContainer) {
      throw new Error(`Parent container with ID ${parentContainerId} not found`);
    }

    // Update the parent container with the new child
    await directusClient.RequestContainer.update(parentContainerId, {
      children: [
        ...(parentContainer.children || []),
        {
          collection: 'request_container',
          item: String(container.id)
        }
      ]
    });
  }

  return container;
}

/**
 * Creates a request in Directus
 * 
 * @param params - Request creation parameters
 * @returns The created request
 */
export async function createRequest(params: CreateRequestParams): Promise<any> {
  const { 
    title, 
    description, 
    type, 
    placeholder, 
    selectOptions, 
    schema, 
    containerId,
    metadata
  } = params;
  
  // Prepare request data
  const requestData = {
    title,
    description: description || null,
    type,
    placeholder: type === 'text' ? (placeholder || null) : null,
    selectOptions: type === 'select' ? JSON.stringify(selectOptions) : null,
    schema: type === 'schema' ? (typeof schema === 'string' ? schema : JSON.stringify(schema)) : null,
    metadata: metadata ? JSON.stringify(metadata) : null,
  };

  // Create the request in Directus
  const request = await directusClient.Request.create(requestData);

  // If container is specified, add this request to the container
  if (containerId && typeof containerId === 'number') {
    // Get the container
    const container = await directusClient.RequestContainer.get(containerId, {
      fields: ['*', { children: ['*'] }]
    });

    if (!container) {
      throw new Error(`Container with ID ${containerId} not found`);
    }

    // Update the container with the new request
    await directusClient.RequestContainer.update(containerId, {
      children: [
        ...(container.children || []),
        {
          collection: 'request',
          item: request.id.toString()
        }
      ]
    });
  }

  return request;
}

/**
 * Waits for a request to be completed or errored
 * First checks if the request is already completed,
 * If not, sets up a subscription to wait for completion
 * 
 * @param id - The ID of the request to wait for
 * @returns Promise that resolves with the response data or rejects with an error
 */
export async function waitForRequestCompletion(id: number): Promise<WaitForCompletionResponse> {
  try {
    // First check if the request is already completed or errored
    const request = await directusClient.Request.get(id, {
      fields: ['*']
    });

    // If request is already completed or errored, return immediately
    if (request && (request.status === 'completed' || request.status === 'error')) {
      return {
        status: request.status as 'completed' | 'error',
        data: request.status === 'completed' ? request.responseData : undefined,
        error: request.status === 'error' ? request.errorMessage : undefined
      };
    }

    // If not completed, subscribe to updates and wait
    return new Promise((resolve, reject) => {
      let subscription: { unsubscribe: () => void } | undefined;
      
      // Setup subscription timeout
      const timeoutId = setTimeout(() => {
        // Clean up subscription
        if (subscription) {
          subscription.unsubscribe();
        }
        reject(new Error(`Request wait operation timed out after ${config.requests.timeoutMs / 1000} seconds.`));
      }, config.requests.timeoutMs);

      // Subscribe to updates for this specific request
      directusClient.subscribe('request', {
        event: 'update',
        query: {
          filter: {
            _and: [
              { id: { _eq: id } },
              { 
                _or: [
                  { status: { _eq: 'completed' } },
                  { status: { _eq: 'error' } }
                ] 
              }
            ]
          }
        }
      }).then(result => {
        subscription = result;
        
        // Set up the subscription handler
        result.subscription.next().then(async () => {
          try {
            // Get updated request data
            const updatedRequest = await directusClient.Request.get(id, {
              fields: ['*']
            });
            
            // Clear timeout
            clearTimeout(timeoutId);
            
            // Unsubscribe as we got our update
            subscription?.unsubscribe();
            
            // Return the response based on status
            if (updatedRequest.status === 'completed') {
              resolve({
                status: 'completed',
                data: updatedRequest.responseData
              });
            } else if (updatedRequest.status === 'error') {
              resolve({
                status: 'error',
                error: updatedRequest.errorMessage
              });
            } else {
              // This shouldn't happen given our filter, but handling just in case
              reject(new Error(`Unexpected request status: ${updatedRequest.status}`));
            }
          } catch (error: any) {
            clearTimeout(timeoutId);
            subscription?.unsubscribe();
            reject(new Error(`Error processing request update: ${error.message}`));
          }
        }).catch((error: any) => {
          clearTimeout(timeoutId);
          subscription?.unsubscribe();
          reject(new Error(`Subscription error: ${error.message}`));
        });
      }).catch((error: any) => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to create subscription: ${error.message}`));
      });
    });
  } catch (error: any) {
    throw new Error(`Error waiting for request completion: ${error.message}`);
  }
}

/**
 * Waits for a container to be completed or errored
 * First checks if the container is already completed,
 * If not, sets up a subscription to wait for completion
 * 
 * @param id - The ID of the container to wait for
 * @returns Promise that resolves with the response data or rejects with an error
 */
export async function waitForContainerCompletion(id: number): Promise<WaitForCompletionResponse> {
  try {
    // First check if the container is already completed or errored
    const container = await directusClient.RequestContainer.get(id, {
      fields: ['*']
    });

    // If container is already completed or errored, return immediately
    if (container && (container.status === 'completed' || container.status === 'error')) {
      return {
        status: container.status as 'completed' | 'error',
        data: container.status === 'completed' ? container.responseData : undefined,
        error: container.status === 'error' ? container.errorMessage : undefined
      };
    }

    // If not completed, subscribe to updates and wait
    return new Promise((resolve, reject) => {
      let subscription: { unsubscribe: () => void } | undefined;
      
      // Setup subscription timeout
      const timeoutId = setTimeout(() => {
        // Clean up subscription
        if (subscription) {
          subscription.unsubscribe();
        }
        reject(new Error(`Container wait operation timed out after ${config.requests.timeoutMs / 1000} seconds.`));
      }, config.requests.timeoutMs);

      // Subscribe to updates for this specific container
      directusClient.subscribe('request_container', {
        event: 'update',
        query: {
          filter: {
            _and: [
              { id: { _eq: id } },
              { 
                _or: [
                  { status: { _eq: 'completed' } },
                  { status: { _eq: 'error' } }
                ] 
              }
            ]
          }
        }
      }).then(result => {
        subscription = result;
        
        // Set up the subscription handler
        result.subscription.next().then(async () => {
          try {
            // Get updated container data
            const updatedContainer = await directusClient.RequestContainer.get(id, {
              fields: ['*']
            });
            
            // Clear timeout
            clearTimeout(timeoutId);
            
            // Unsubscribe as we got our update
            subscription?.unsubscribe();
            
            // Return the response based on status
            if (updatedContainer.status === 'completed') {
              resolve({
                status: 'completed',
                data: updatedContainer.responseData
              });
            } else if (updatedContainer.status === 'error') {
              resolve({
                status: 'error',
                error: updatedContainer.error
              });
            } else {
              // This shouldn't happen given our filter, but handling just in case
              reject(new Error(`Unexpected container status: ${updatedContainer.status}`));
            }
          } catch (error: any) {
            clearTimeout(timeoutId);
            subscription?.unsubscribe();
            reject(new Error(`Error processing container update: ${error.message}`));
          }
        }).catch((error: any) => {
          clearTimeout(timeoutId);
          subscription?.unsubscribe();
          reject(new Error(`Subscription error: ${error.message}`));
        });
      }).catch((error: any) => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to create subscription: ${error.message}`));
      });
    });
  } catch (error: any) {
    throw new Error(`Error waiting for container completion: ${error.message}`);
  }
}

/**
 * Performs a health check on the Directus server
 * 
 * @returns True if Directus is healthy, false otherwise
 */
export async function checkDirectusHealth(): Promise<boolean> {
  try {
    const response = await directusClient.serverHealth();
    return response.status === "ok";
  } catch (error) {
    return false;
  }
}

/**
 * Builds a hierarchy for a specific container
 * 
 * @param containerId - The ID of the container to build hierarchy for
 * @returns The container hierarchy including all nested children
 */
export async function buildContainerHierarchy(containerId: number): Promise<McpRequestHierarchyContainer | null> {
  try {
    // Fetch all containers and requests
    const [allContainers, allRequests] = await Promise.all([
      directusClient.RequestContainers.query({
        limit: -1,
        fields: ['*', { children: ['*'] }],
      }),
      directusClient.Requests.query({ limit: -1 }),
    ]);

    if (!allContainers || !allRequests) {
      throw new Error('Failed to fetch data from Directus');
    }

    // Create maps for quick lookups
    const containerMap = new Map<number, McpRequestHierarchyContainer>();
    const requestMap = new Map<number, McpRequestHierarchyRequest>();
    
    // First pass: create all container objects with empty children arrays
    allContainers.forEach((container) => {
      containerMap.set(container.id, {
        type: 'container',
        content: container,
        children: [],
      });
    });
    
    // Second pass: populate children for each container
    allContainers.forEach((container) => {
      const containerNode = containerMap.get(container.id);
      if (!containerNode) return;
      
      containerNode.children = container.children
        .map(({ item, collection }) => {
          if (collection === 'request_container') {
            // For container children, use the reference from containerMap
            const childContainer = containerMap.get(Number(item));
            if (childContainer) {
              return childContainer;
            }
            return null; // Skip if not found
          }
          
          // For request children
          const request = allRequests.find(
            (r) => r.id === Number(item)
          );
          if (!request) return null;
          
          const requestHierarchy = {
            type: 'request' as const,
            content: request,
          };
          requestMap.set(request.id, requestHierarchy);
          return requestHierarchy;
        })
        .filter(Boolean) as McpRequestHierarchy[];
    });
    
    // Return the hierarchy for the specified container
    return containerMap.get(containerId) || null;
  } catch (error: any) {
    console.error(`Error building container hierarchy: ${error.message}`);
    return null;
  }
}
