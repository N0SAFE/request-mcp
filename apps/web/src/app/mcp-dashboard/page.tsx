'use client';

import { useState, FormEvent, ChangeEvent, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Folder, CheckCircle, XCircle, AlertCircle, Clock, Send, Loader2 } from 'lucide-react';
import { Collections } from '@repo/directus-sdk/client';
import directus from '@/lib/directus';
import { SelectOption, RequestInputType } from '@/lib/requestStore';

import { Button } from '@repo/ui/components/shadcn/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/shadcn/card';
import { RadioGroup, RadioGroupItem } from '@repo/ui/components/shadcn/radio-group';
import { Label } from '@repo/ui/components/shadcn/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/shadcn/select';
import { Checkbox } from '@repo/ui/components/shadcn/checkbox';
import { Textarea } from '@repo/ui/components/shadcn/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@repo/ui/components/shadcn/accordion';
import { Progress } from '@repo/ui/components/shadcn/progress';
import { Badge } from '@repo/ui/components/shadcn/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/components/shadcn/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@repo/ui/components/shadcn/sheet';
import { ScrollArea } from '@repo/ui/components/shadcn/scroll-area';
import { Input } from '@repo/ui/components/shadcn/input';

function mapInputOptions(options: any): SelectOption[] | undefined {
    if (!options) return undefined;
    try {
        let parsedOptions: any[] = [];
        if (typeof options === 'string') {
            parsedOptions = JSON.parse(options);
        } else if (Array.isArray(options)) {
            parsedOptions = options;
        }

        if (Array.isArray(parsedOptions)) {
            return parsedOptions.map(opt => ({
                value: String(opt?.value ?? opt),
                label: String(opt?.label ?? opt?.value ?? opt)
            })).filter(opt => opt.value);
        }
    } catch (e) {
        console.error("Failed to parse input options", e, options);
    }
    return undefined;
}

// Fetch only top-level containers and requests (no deep nesting)
const fetchTopLevelNodes = async () => {
    const topLevelContainers = await directus.items('request_container').readByQuery({
        filter: { parent: { _null: true } },
        limit: -1
    });
    const topLevelRequests = await directus.items('request').readByQuery({
        filter: { container: { _null: true } },
        limit: -1
    });
    // Return as flat array, sorted by creation date
    const allNodes = [
        ...(topLevelContainers.data || []),
        ...(topLevelRequests.data || [])
    ];
    allNodes.sort((a, b) => new Date(a.date_created || 0).getTime() - new Date(b.date_created || 0).getTime());
    return allNodes;
};

// Fetch children for a container on demand
const fetchContainerChildren = async (containerId: string) => {
    const childrenContainers = await directus.items('request_container').readByQuery({
        filter: { parent: { _eq: containerId } },
        limit: -1
    });
    const childrenRequests = await directus.items('request').readByQuery({
        filter: { container: { _eq: containerId } },
        limit: -1
    });
    return [
        ...(childrenContainers.data || []),
        ...(childrenRequests.data || [])
    ].sort((a, b) => new Date(a.date_created || 0).getTime() - new Date(b.date_created || 0).getTime());
};

const submitResponse = async ({ requestId, responseData, error }: { requestId: string; responseData?: any; error?: string }) => {
    const payload: Partial<Collections.Request> = {
        status: error ? 'error' : 'completed',
        response: responseData !== undefined ? JSON.stringify(responseData) : undefined,
        error_message: error || undefined,
        date_updated: new Date().toISOString(),
    };

    Object.keys(payload).forEach(key => payload[key as keyof typeof payload] === undefined && delete payload[key as keyof typeof payload]);

    try {
        const updatedItem = await directus.items('request').updateOne(requestId, payload);
        return updatedItem;
    } catch (sdkError: any) {
        console.error("Directus SDK Error updating request:", sdkError);
        throw new Error(sdkError.message || 'Failed to update request via Directus SDK');
    }
};

const renderInput = (
    req: Collections.Request,
    responseValue: any,
    handleChange: (nodeId: string, value: any) => void,
    disabled: boolean,
    jsonParseError: string | null
) => {
    const inputId = `response-${req.id}`;

    switch (req.input_type) {
        case 'boolean':
            return (
                <RadioGroup
                    value={responseValue === true ? 'true' : responseValue === false ? 'false' : undefined}
                    onValueChange={(value) => handleChange(req.id, value === 'true')}
                    disabled={disabled}
                    className="flex items-center space-x-4"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id={`${inputId}-true`} />
                        <Label htmlFor={`${inputId}-true`} className="cursor-pointer">True</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id={`${inputId}-false`} />
                        <Label htmlFor={`${inputId}-false`} className="cursor-pointer">False</Label>
                    </div>
                </RadioGroup>
            );
        case 'select':
            return (
                <Select
                    value={responseValue ?? ''}
                    onValueChange={(value) => handleChange(req.id, value)}
                    disabled={disabled}
                >
                    <SelectTrigger id={inputId} className="w-full">
                        <SelectValue placeholder="-- Select an option --" />
                    </SelectTrigger>
                    <SelectContent>
                        {mapInputOptions(req.input_options)?.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        case 'multi-select':
            const currentSelection = Array.isArray(responseValue) ? responseValue : [];
            return (
                <div className="space-y-3">
                    {mapInputOptions(req.input_options)?.map(opt => (
                        <div key={opt.value} className="flex items-center space-x-2">
                            <Checkbox
                                id={`${inputId}-${opt.value}`}
                                checked={currentSelection.includes(opt.value)}
                                onCheckedChange={(checked) => {
                                    const value = opt.value;
                                    const newSelection = checked
                                        ? [...currentSelection, value]
                                        : currentSelection.filter(v => v !== value);
                                    handleChange(req.id, newSelection);
                                }}
                                disabled={disabled}
                            />
                            <Label htmlFor={`${inputId}-${opt.value}`} className="cursor-pointer">
                                {opt.label}
                            </Label>
                        </div>
                    ))}
                </div>
            );
        case 'schema':
        case 'json':
            return (
                <>
                    <Textarea
                        id={inputId}
                        rows={5}
                        className={`w-full font-mono ${jsonParseError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                        placeholder={req.input_type === 'json' ? 'Enter valid JSON data...' : 'Enter data conforming to schema (see below)...'}
                        value={typeof responseValue === 'string' ? responseValue : JSON.stringify(responseValue ?? '', null, 2)}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleChange(req.id, e.target.value)}
                        disabled={disabled}
                    />
                    {jsonParseError && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{jsonParseError}</p>
                    )}
                    {req.input_type === 'schema' && req.input_schema && (
                        <Accordion type="single" collapsible className="w-full mt-2">
                            <AccordionItem value="item-1" className="border-b-0">
                                <AccordionTrigger className="text-xs py-1 text-muted-foreground hover:no-underline">
                                    View Schema
                                </AccordionTrigger>
                                <AccordionContent className="mt-1">
                                    <pre className="bg-muted p-2 rounded text-xs overflow-x-auto max-h-40">
                                        {JSON.stringify(req.input_schema, null, 2)}
                                    </pre>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    )}
                </>
            );
        case 'text':
        default:
            return (
                <Textarea
                    id={inputId}
                    rows={4}
                    className="w-full"
                    placeholder={req.prompt || 'Enter response...'}
                    value={responseValue ?? ''}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleChange(req.id, e.target.value)}
                    disabled={disabled}
                />
            );
    }
};

interface NodeCardProps {
    node: Collections.Request | Collections.RequestContainer;
    responses: Record<string, { responseData?: any; error?: string }>;
    jsonError: Record<string, string | null>;
    handleResponseChange: (nodeId: string, value: any) => void;
    handleErrorChange: (nodeId: string, value: string) => void;
    handleSubmit: (e: FormEvent<HTMLFormElement>, nodeId: string) => void;
    isSubmitting: (nodeId: string) => boolean;
    getBadgeVariant: (status: Collections.Request['status']) => "default" | "secondary" | "destructive" | "outline";
    level?: number;
    onCardClick?: (node: Collections.Request | Collections.RequestContainer) => void;
    allowRequestInput?: boolean;
}

const NodeCard: React.FC<NodeCardProps & { isSheetMainContainer?: boolean }> = ({
    node,
    responses,
    jsonError,
    handleResponseChange,
    handleErrorChange,
    handleSubmit,
    isSubmitting,
    getBadgeVariant,
    level = 0,
    onCardClick,
    allowRequestInput = false,
    isSheetMainContainer = false
}) => {
    if ('parent' in node) {
        return (
            <Card className="mb-4 border-l-4 border-blue-500 cursor-pointer" onClick={() => { if (!isSheetMainContainer) onCardClick?.(node); }}>
                <CardHeader>
                    <div className="flex justify-between items-center flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            <Folder className="h-5 w-5 text-blue-600" />
                            <CardTitle className="text-lg">{node.name || 'Unnamed Container'}</CardTitle>
                        </div>
                    </div>
                    {node.description && <CardDescription className="mt-1 text-sm">{node.description}</CardDescription>}
                    <CardDescription className="text-xs mt-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                ID: <span className="font-mono bg-muted px-1 rounded">{node.id.substring(0, 8)}...</span>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent><p>{node.id}</p></TooltipContent>
                        </Tooltip>
                        <span className="mx-2">|</span>
                        Created: {new Date(node.date_created || Date.now()).toLocaleString()}
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const req = node;

    return (
        <Card key={req.id} className={`mb-4 ${level > 0 ? 'border-l-4 border-gray-300 dark:border-gray-700' : ''} cursor-pointer ${req.status !== 'pending' ? 'opacity-70' : ''}`} onClick={() => onCardClick?.(req)}>
            <CardHeader>
                <div className="flex justify-between items-start flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <Send className="h-5 w-5 text-purple-600" />
                        <CardTitle className="text-lg break-all">{req.name || 'Unnamed Request'}</CardTitle>
                    </div>
                    <Badge variant={getBadgeVariant(req.status)}>{req.status}</Badge>
                </div>
                <CardDescription className="text-xs mt-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">
                            ID: <span className="font-mono bg-muted px-1 rounded">{req.id.substring(0, 8)}...</span>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent><p>{req.id}</p></TooltipContent>
                    </Tooltip>
                    <span className="mx-2">|</span>
                    Received: {new Date(req.date_created || Date.now()).toLocaleString()}
                </CardDescription>
                {req.prompt && <p className="text-sm mt-2 text-foreground">{req.prompt}</p>}
            </CardHeader>
        </Card>
    );
};

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [responses, setResponses] = useState<Record<string, { responseData?: any; error?: string }>>({});
  const [jsonError, setJsonError] = useState<Record<string, string | null>>({});
  const [sheetStack, setSheetStack] = useState<(Collections.Request | Collections.RequestContainer)[]>([]);

  const { data: topLevelNodes = [], isLoading, error: queryError, isError } = useQuery<(Collections.Request | Collections.RequestContainer)[], Error>({
    queryKey: ['nodes'],
    queryFn: fetchTopLevelNodes,
    refetchInterval: 5000,
  });

  const mutation = useMutation<Collections.Request, Error, { requestId: string; responseData?: any; error?: string }>({
    mutationFn: submitResponse,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
      setResponses(prev => {
        const newState = { ...prev };
        delete newState[variables.requestId];
        return newState;
      });
      setJsonError(prev => ({
        ...prev,
        [variables.requestId]: null,
      }));
      const sheetIndex = sheetStack.findIndex(node => node.id === variables.requestId);
      if (sheetIndex !== -1) {
          handleSheetClose(sheetIndex);
      }
    },
    onError: (error, variables) => {
      console.error(`Directus submission error for ${variables.requestId}:`, error.message);
    },
  });

  const handleResponseChange = (nodeId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [nodeId]: { responseData: value, error: undefined }
    }));
    setJsonError(prev => ({ ...prev, [nodeId]: null }));
  };

  const handleErrorChange = (nodeId: string, value: string) => {
    setResponses(prev => ({
        ...prev,
        [nodeId]: { responseData: undefined, error: value }
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>, nodeId: string) => {
    e.preventDefault();
    setJsonError(prev => ({ ...prev, [nodeId]: null }));

    const nodeDetails = sheetStack.find(node => node.id === nodeId);

    if (!nodeDetails || !('status' in nodeDetails)) {
        console.error("Could not find request item details for submission or node is not a request item:", nodeId);
        return;
    }
    const requestItemDetails = nodeDetails as Collections.Request;

    const responsePayload = responses[nodeId];
    if (!responsePayload || (responsePayload.responseData === undefined && (responsePayload.error === undefined || responsePayload.error === ''))) {
      console.warn("Submit called but no response data or error message provided for:", nodeId);
      return;
    }

    let finalResponseData = responsePayload.responseData;

    if ((requestItemDetails.input_type === 'json' || requestItemDetails.input_type === 'schema') && typeof finalResponseData === 'string' && finalResponseData.trim() !== '') {
      try {
        finalResponseData = JSON.parse(finalResponseData);
      } catch (parseError: any) {
        console.error("JSON Parse Error:", parseError);
        setJsonError(prev => ({ ...prev, [nodeId]: `Invalid JSON: ${parseError.message}` }));
        return;
      }
    }

    mutation.mutate({
        requestId: nodeId,
        responseData: finalResponseData,
        error: responsePayload.error
    });
  };

  const isSubmitting = (nodeId: string) =>
    mutation.isPending && mutation.variables?.requestId === nodeId;

  const getBadgeVariant = (status: Collections.Request['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case 'pending': return 'secondary';
        case 'completed': return 'default';
        case 'error': return 'destructive';
        case 'timed_out': return 'destructive';
        default: return 'outline';
    }
  };

  const handleCardClick = async (node: Collections.Request | Collections.RequestContainer) => {
    if (sheetStack.length > 0 && sheetStack[sheetStack.length - 1].id === node.id) {
        return;
    }
    if ('parent' in node) {
        const children = await fetchContainerChildren(node.id);
        setSheetStack((prev) => [...prev, { ...node, children }]);
    } else {
        setSheetStack((prev) => [...prev, node]);
    }
  };

  const handleSheetClose = (idx: number) => {
    setSheetStack((prev) => prev.slice(0, idx));
  };

  const renderSheetStack = () => (
    <>
      {sheetStack.map((node, idx) => (
        <Sheet key={`${node.id}-${idx}`} open={true} onOpenChange={(open) => { if (!open) handleSheetClose(idx); }}>
          <SheetContent side="right" className={`w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl h-screen p-0 flex flex-col overflow-hidden`} style={{
             right: `${idx * 20}px`,
             zIndex: 10 + idx,
             boxShadow: idx > 0 ? '-5px 0 15px rgba(0,0,0,0.1)' : 'none'
          }}>
            <SheetHeader className="p-6 border-b">
              <SheetTitle className="flex items-center gap-2">
                 {'parent' in node ? <Folder className="h-5 w-5 text-blue-600" /> : <Send className="h-5 w-5 text-purple-600" />}
                 {node.name || ('parent' in node ? 'Unnamed Container' : 'Unnamed Request')}
              </SheetTitle>
              {'parent' in node && node.description && (
                <SheetDescription>{node.description}</SheetDescription>
              )}
               {'status' in node && node.prompt && (
                <SheetDescription>{node.prompt}</SheetDescription>
              )}
               <SheetDescription className="text-xs pt-1">
                    ID: {node.id} | Created: {new Date(node.date_created || Date.now()).toLocaleString()}
               </SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-grow p-6">
              <NodeCard
                  node={node}
                  responses={responses}
                  jsonError={jsonError}
                  handleResponseChange={handleResponseChange}
                  handleErrorChange={handleErrorChange}
                  handleSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                  getBadgeVariant={getBadgeVariant}
                  level={0}
                  allowRequestInput={idx === sheetStack.length - 1}
                  isSheetMainContainer={true}
              />
              {'parent' in node && node.children && node.children.length > 0 && (
                  <div className="mt-6 space-y-4 border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4">Items in this Container</h3>
                      {node.children.map(child => (
                          <NodeCard
                              key={child.id}
                              node={child}
                              responses={responses}
                              jsonError={jsonError}
                              handleResponseChange={handleResponseChange}
                              handleErrorChange={handleErrorChange}
                              handleSubmit={handleSubmit}
                              isSubmitting={isSubmitting}
                              getBadgeVariant={getBadgeVariant}
                              level={1}
                              onCardClick={handleCardClick}
                              allowRequestInput={idx === sheetStack.length - 1}
                          />
                      ))}
                  </div>
              )}
               {'parent' in node && (!node.children || node.children.length === 0) && (
                   <p className="text-sm text-muted-foreground mt-6 border-t pt-6">This container is empty.</p>
               )}
            </ScrollArea>
            <SheetFooter className="p-6 border-t">
              <SheetClose asChild>
                <Button variant="outline">Close</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ))}
    </>
  );

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 pt-12 md:pt-20 pb-10 min-h-screen">
        <div className="flex justify-between items-center mb-8 max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>

        {renderSheetStack()}

        <div className="max-w-7xl mx-auto">
          {isLoading && <p className="text-center text-muted-foreground">Loading requests...</p>}
          {isError && <p className="text-center text-red-600 dark:text-red-400">Error loading requests: {queryError?.message}</p>}
          {!isLoading && !isError && topLevelNodes.length === 0 && (
            <p className="text-center text-muted-foreground">No pending requests found.</p>
          )}
          {!isLoading && !isError && topLevelNodes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {topLevelNodes.map(node => (
                <NodeCard
                  key={node.id}
                  node={node}
                  responses={responses}
                  jsonError={jsonError}
                  handleResponseChange={handleResponseChange}
                  handleErrorChange={handleErrorChange}
                  handleSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                  getBadgeVariant={getBadgeVariant}
                  level={0}
                  onCardClick={handleCardClick}
                  allowRequestInput={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
