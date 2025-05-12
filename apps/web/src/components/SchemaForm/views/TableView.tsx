import * as React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@repo/ui/components/shadcn/table';

interface TableViewProps {
  schema: any;
  value: any;
}

export function TableView({ schema, value }: TableViewProps) {
  if (!schema || !schema.properties || !value) return null;
  const columns = Object.keys(schema.properties);
  const rows = Array.isArray(value) ? value : [value];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col}>{schema.properties[col].title || col}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={i}>
            {columns.map((col) => (
              <TableCell key={col}>{row[col]}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
