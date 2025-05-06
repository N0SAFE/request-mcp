import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui/components/shadcn/card';

interface CardViewProps {
  schema: any;
  value: any;
}

export function CardView({ schema, value }: CardViewProps) {
  if (!schema || !schema.properties || !value) return null;
  const items = Array.isArray(value) ? value : [value];
  const fields = Object.keys(schema.properties);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((item, idx) => (
        <Card key={idx}>
          <CardHeader>
            <CardTitle>{schema.title || `Item ${idx + 1}`}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {fields.map((field) => (
                <li key={field}>
                  <span className="font-semibold">{schema.properties[field].title || field}:</span> {item[field]}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
