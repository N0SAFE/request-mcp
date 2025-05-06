import * as React from 'react';

interface ListViewProps {
  schema: any;
  value: any;
}

export function ListView({ schema, value }: ListViewProps) {
  if (!schema || !schema.properties || !value) return null;
  const items = Array.isArray(value) ? value : [value];
  const fields = Object.keys(schema.properties);

  return (
    <ul className="divide-y divide-border">
      {items.map((item, idx) => (
        <li key={idx} className="py-2">
          {fields.map((field) => (
            <span key={field} className="mr-4">
              <span className="font-semibold">{schema.properties[field].title || field}:</span> {item[field]}
            </span>
          ))}
        </li>
      ))}
    </ul>
  );
}
