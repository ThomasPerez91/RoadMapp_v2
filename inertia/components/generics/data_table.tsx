// resources/js/components/generics/data_table.tsx
import { useState } from 'react';
import { Table, UnstyledButton, Group, ScrollArea, Text } from '@mantine/core';
import { TbArrowUp, TbArrowDown } from 'react-icons/tb';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortFn?: (a: T, b: T) => number;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  minWidth?: number;            // optionnel: largeur mini du tableau
  emptyMessage?: string;        // message quand data est vide
}

export function DataTable<T>({
  columns,
  data,
  minWidth = 720,
  emptyMessage = 'Aucun élement enregistré',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | string | null>(null);
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc');

  const setSort = (key: keyof T | string) => {
    if (sortKey === key) {
      setDirection(direction === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setDirection('asc');
    }
  };

  const sorted = [...data];
  if (sortKey) {
    const column = columns.find((c) => c.key === sortKey);
    if (column?.sortFn) {
      sorted.sort((a, b) => {
        const res = column.sortFn!(a, b);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  return (
    <ScrollArea type="auto">
      <Table striped highlightOnHover withTableBorder style={{ minWidth }}>
        <Table.Thead>
          <Table.Tr>
            {columns.map((col) => (
              <Table.Th key={String(col.key)}>
                {col.sortFn ? (
                  <UnstyledButton onClick={() => setSort(col.key)}>
                    <Group gap={4} wrap="nowrap">
                      {col.label}
                      {sortKey === col.key ? (
                        direction === 'asc' ? <TbArrowUp size={12} /> : <TbArrowDown size={12} />
                      ) : null}
                    </Group>
                  </UnstyledButton>
                ) : (
                  col.label
                )}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {sorted.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={columns.length}>
                <Text ta="center" opacity={0.8} py="md">
                  {emptyMessage}
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            sorted.map((row, idx) => (
              <Table.Tr key={idx}>
                {columns.map((col) => (
                  <Table.Td key={String(col.key)}>
                    {col.render ? col.render(row) : (row as any)[col.key]}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
