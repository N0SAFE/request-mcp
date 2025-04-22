import { NextResponse } from 'next/server';
import { updateRequestStatus, McpRequestItem, getRequest } from '@/lib/requestStore'; // Updated imports

interface RespondParams {
  params: { requestId: string };
}

export async function POST(request: Request, { params }: RespondParams) {
  const { requestId: requestIdString } = params;

  if (!requestIdString) {
    return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
  }
  
  const requestId = Number(requestIdString);

  if (typeof requestId !== 'number' || isNaN(requestId)) {
    return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 });
  }

  let responseData: any;
  let error: string | undefined;

  try {
    const body = await request.json();
    responseData = body.responseData;
    error = body.error;

    if (responseData === undefined && error === undefined) {
      return NextResponse.json({ error: 'Either responseData or error must be provided' }, { status: 400 });
    }
    if (responseData !== undefined && error !== undefined) {
        return NextResponse.json({ error: 'Cannot provide both responseData and error' }, { status: 400 });
    }

  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const node = await getRequest(requestId); // Use getNode

  if (!node) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  if (node.status !== 'pending') {
    // Allow resubmission for requests in error or timed_out status
    if (node.status === 'error') {
      node.status = 'pending';
    } else {
      return NextResponse.json({ error: `Request is not pending (status: ${node.status})` }, { status: 409 }); // Conflict
    }
  }

  // Accept the response and update status locally
  const newStatus = error ? 'error' : 'completed';
  const updated = updateRequestStatus(requestId, newStatus);

  if (updated) {
    return NextResponse.json({ message: `Request ${newStatus} successfully (no webhook)` });
  } else {
    return NextResponse.json({ error: 'Failed to update request status locally' }, { status: 500 });
  }
}
