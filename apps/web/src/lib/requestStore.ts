import { Collections } from "@repo/directus-sdk/client";
import directus from "./directus";
import { ApplyFields } from "@repo/directus-sdk/indirectus/utils";

// Define the possible input types for actual requests
export type RequestInputType = 'schema';

// Define the structure for select/multi-select options
export interface SelectOption {
  value: string;
  label: string;
}

// Define the possible node types
export type McpNodeType = 'container' | 'request';

// Base interface for common properties
interface McpNodeBase {
  id: string; // Changed from requestId for generality
  name: string; // Changed from toolName for generality
  timestamp: number;
  nodeType: McpNodeType;
}

// Interface for Container nodes
export interface McpContainer extends McpNodeBase {
  nodeType: 'container';
  description?: string; // Optional description for the container
  children: McpNode[]; // Containers hold other nodes
  // Containers might not have status, webhook, etc. directly
}

// Interface for Request Item nodes
export interface McpRequestItem extends McpNodeBase {
  nodeType: 'request';
  args: any; // Arguments passed to the tool
  prompt?: string; // Optional prompt/question for the user
  inputType: RequestInputType;
  inputOptions?: SelectOption[]; // Options for select/multi-select
  inputSchema?: any; // JSON schema definition for 'schema' or 'json' type
  status: 'pending' | 'completed' | 'error' | 'timed_out';
  webhookUrl?: string; // Store the webhook URL for responding
  // Request items typically don't have children in this model
}

// Discriminated Union for any node in the hierarchy
export type McpNode = McpContainer | McpRequestItem;

// In-memory store using a Map - Stores ALL nodes flatly by ID
const pendingNodes = new Map<string, McpNode>();

// --- Mock Data for Testing (Hierarchical Structure using new types) ---

// Define request items (children)
const mockRequest1: McpRequestItem = {
  id: 'mock-req-001',
  name: 'getUserDetails',
  nodeType: 'request',
  args: { userId: 'user-abc' },
  prompt: 'Please confirm the user ID.',
  inputType: 'text',
  timestamp: Date.now() - 120000,
  status: 'pending',
  webhookUrl: 'http://localhost:3001/webhook/test1'
};

const mockRequest3: McpRequestItem = {
  id: 'mock-req-003',
  name: 'assignUserRole',
  nodeType: 'request',
  args: { userId: 'user-xyz' },
  prompt: 'Select the role for user-xyz:',
  inputType: 'select',
  inputOptions: [
    { value: 'admin', label: 'Administrator' },
    { value: 'editor', label: 'Editor' },
    { value: 'viewer', label: 'Viewer' }
  ],
  timestamp: Date.now() - 600000,
  status: 'pending',
  webhookUrl: 'http://localhost:3001/webhook/test3'
};

// Define container (parent) holding request items
const mockFolder1: McpContainer = {
  id: 'mock-folder-user-tasks',
  name: 'User Management Tasks',
  nodeType: 'container',
  description: 'Group of tasks related to user management',
  timestamp: Date.now() - 1000000,
  children: [mockRequest1, mockRequest3]
};

// Define other top-level request items
const mockTopLevelRequest2: McpRequestItem = {
  id: 'mock-req-002',
  name: 'updateSettings',
  nodeType: 'request',
  args: { setting: 'notifications', value: true },
  prompt: 'Enable notifications?',
  inputType: 'boolean',
  timestamp: Date.now() - 300000,
  status: 'pending',
  webhookUrl: 'http://localhost:3001/webhook/test2'
};

// Define a nested container
const mockSubFolder: McpContainer = {
    id: 'mock-subfolder-features',
    name: 'Product Features Config',
    nodeType: 'container',
    description: 'Configuration for specific product features',
    timestamp: Date.now() - 950000,
    children: [] // Will add child below
};

const mockRequest4: McpRequestItem = {
  id: 'mock-req-004',
  name: 'configureProductFeatures',
  nodeType: 'request',
  args: { productId: 'prod-123' },
  prompt: 'Select features to enable:',
  inputType: 'multi-select',
  inputOptions: [
    { value: 'feature_a', label: 'Feature A' },
    { value: 'feature_b', label: 'Feature B - Extended' },
    { value: 'feature_c', label: 'Feature C - Beta' }
  ],
  timestamp: Date.now() - 900000,
  status: 'pending',
  webhookUrl: 'http://localhost:3001/webhook/test4'
};

// Add request 4 to the subfolder
mockSubFolder.children.push(mockRequest4);

// --- Populate the Flat Store ---
const addNodeRecursively = (node: McpNode) => {
  if (pendingNodes.has(node.id)) return; // Avoid duplicates

  // Add the current node (without children initially to avoid circular refs in the map value)
  const { children, ...nodeWithoutChildren } = node as McpContainer; // Assume container to access children
  pendingNodes.set(node.id, nodeWithoutChildren as McpNode); // Add as base type first

  // If children exist (only for containers), recursively add them and update the parent in the map
  if (node.nodeType === 'container' && children && children.length > 0) {
    const childNodes = children.map(child => {
      addNodeRecursively(child);
      return child; // Return the child object reference
    });
    // Update the parent container entry in the map to include the children array reference
    const parentInMap = pendingNodes.get(node.id) as McpContainer | undefined;
    if (parentInMap && parentInMap.nodeType === 'container') {
        parentInMap.children = childNodes;
    }
  }
};

// Add mock data to the flat store
addNodeRecursively(mockFolder1);
addNodeRecursively(mockTopLevelRequest2);
addNodeRecursively(mockSubFolder); // Adding the subfolder automatically adds its children

console.log("Initial pending nodes map:", pendingNodes);

// --- Store Management Functions ---

// Add node needs to handle potential children
export const addNode = (node: McpNode): void => {
  if (!node.id) {
    console.error("Attempted to add node without ID");
    return;
  }
  addNodeRecursively(node);
  console.log(`Node added (potentially with children): ${node.id}, Type: ${node.nodeType}`);
};

export const getContainer = async (containerId: Collections.RequestContainer['id']): Promise<ApplyFields<Collections.RequestContainer> | undefined> => {
  return await directus.RequestContainer.get(containerId);
}

export const getRequest = async (requestId: Collections.Request['id']): Promise<ApplyFields<Collections.Request> | undefined> => {
  return await directus.Request.get(requestId);
}

// Helper function to check if a node or any of its children are pending
const isNodeOrDescendantPending = (node: McpNode): boolean => {
    if (node.nodeType === 'request' && node.status === 'pending') {
        return true;
    }
    if (node.nodeType === 'container' && node.children) {
        return node.children.some(child => isNodeOrDescendantPending(child));
    }
    return false;
};

// This function returns TOP-LEVEL nodes that have at least one pending request within them
export const getAllTopLevelPendingNodes = (): McpNode[] => {
  const allNodes = Array.from(pendingNodes.values());
  const childNodeIds = new Set<string>();

  // Identify all IDs that are children of other nodes
  allNodes.forEach(node => {
    if (node.nodeType === 'container' && node.children) {
      node.children.forEach(child => {
        childNodeIds.add(child.id);
      });
    }
  });

  // Filter for top-level nodes that contain at least one pending request
  return allNodes.filter(node => 
    !childNodeIds.has(node.id) && isNodeOrDescendantPending(node)
  );
};

// Update status - only applies to McpRequestItem
export const updateRequestStatus = (requestId: string, status: McpRequestItem['status']): boolean => {
  const node = pendingNodes.get(requestId);
  if (node && node.nodeType === 'request') {
    node.status = status;
    // Do not remove the request from the store, just update its status
    return true;
  }
  return false;
};

// Remove node - recursive
export const removeNode = (nodeId: string): boolean => {
  const nodeToRemove = pendingNodes.get(nodeId);
  if (!nodeToRemove) {
    return false;
  }

  // Recursively remove children first (if it's a container)
  if (nodeToRemove.nodeType === 'container' && nodeToRemove.children) {
    // Iterate over a copy of the children array for safe removal
    [...nodeToRemove.children].forEach(child => {
      removeNode(child.id); // Recursive call
    });
  }

  // Delete the actual node from the map
  const deleted = pendingNodes.delete(nodeId);

  // Also remove from parent's children array if applicable (important for consistency)
  // This requires iterating through all nodes to find potential parents
  pendingNodes.forEach(potentialParent => {
      if (potentialParent.nodeType === 'container' && potentialParent.children) {
          const index = potentialParent.children.findIndex(child => child.id === nodeId);
          if (index > -1) {
              potentialParent.children.splice(index, 1);
          }
      }
  });

  return deleted;
};

// checkTimeouts - needs recursion, only acts on McpRequestItem
export const checkTimeouts = (timeoutDuration: number = 5 * 60 * 1000): void => {
  const now = Date.now();
  const checkedIds = new Set<string>();

  const checkRecursively = (node: McpNode) => {
    if (!node || checkedIds.has(node.id)) {
        return;
    }
    checkedIds.add(node.id);

    if (node.nodeType === 'request') {
        if (node.status === 'pending' && (now - node.timestamp > timeoutDuration)) {
            console.warn(`Request timed out: ${node.id}`);
            updateRequestStatus(node.id, 'timed_out');
            // Node is removed by updateRequestStatus, no need to check children (it has none)
            return; 
        }
    } else if (node.nodeType === 'container' && node.children) {
        // Check children of containers
        // Iterate over a copy in case children get removed during iteration
        [...node.children].forEach(child => {
            const fullChild = pendingNodes.get(child.id);
            if (fullChild) {
                checkRecursively(fullChild);
            }
        });
    }
  };

  // Start checking from all top-level nodes currently in the map
  const allNodes = Array.from(pendingNodes.values());
  const childNodeIds = new Set<string>();
  allNodes.forEach(node => {
    if (node.nodeType === 'container' && node.children) {
        node.children.forEach(child => {
            childNodeIds.add(child.id);
        });
    }
  });
  const topLevelNodes = allNodes.filter(node => !childNodeIds.has(node.id));

  topLevelNodes.forEach(checkRecursively);
};

