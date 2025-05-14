import { NextResponse } from 'next/server';
import { addNode, getAllTopLevelPendingNodes, McpRequestItem, McpNode } from '@/lib/requestStore'; // Updated imports
import { v4 as uuidv4 } from 'uuid';

// Get all top-level pending nodes (requests or containers with pending children)
export async function GET() {
  try {
    const nodes = getAllTopLevelPendingNodes(); // Use new function
    return NextResponse.json(nodes);
  } catch (error) {
    console.error("Error fetching pending nodes:", error);
    return NextResponse.json({ error: 'Failed to fetch pending nodes' }, { status: 500 });
  }
}

// Add a new request item (assuming only request items are added via this endpoint for now)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Basic validation (adapt as needed for McpRequestItem properties)
    if (!body.toolName || !body.args || !body.webhookUrl) {
      return NextResponse.json({ error: 'Missing required fields for request item' }, { status: 400 });
    }

    // Construct the new McpRequestItem
    const newNode: McpRequestItem = {
      id: uuidv4(), // Generate a unique ID
      nodeType: 'request',
      name: body.toolName,
      args: body.args,
      prompt: body.prompt,
      inputType: 'schema',
      inputOptions: body.inputOptions,
      inputSchema: body.inputSchema,
      timestamp: Date.now(),
      status: 'pending',
      webhookUrl: body.webhookUrl,
    };

    addNode(newNode); // Use addNode

    // Return the created node's ID and potentially the node itself
    return NextResponse.json({ message: 'Request item added successfully', nodeId: newNode.id }, { status: 201 });

  } catch (error) {
    console.error("Error adding request item:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to add request item' }, { status: 500 });
  }
}

