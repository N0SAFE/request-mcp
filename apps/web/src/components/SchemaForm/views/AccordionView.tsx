import * as React from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@repo/ui/components/shadcn/accordion';

interface AccordionViewProps {
  schema: any;
  value: any;
}

export function AccordionView({ schema, value }: AccordionViewProps) {
  if (!schema || !schema.properties || !value) return null;
  const items = Array.isArray(value) ? value : [value];
  const fields = Object.keys(schema.properties);

  return (
    <Accordion type="multiple" className="w-full">
      {items.map((item, idx) => (
        <AccordionItem key={idx} value={`item-${idx}`}>
          <AccordionTrigger>{schema.title || `Item ${idx + 1}`}</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-1">
              {fields.map((field) => (
                <li key={field}>
                  <span className="font-semibold">{schema.properties[field].title || field}:</span> {item[field]}
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
