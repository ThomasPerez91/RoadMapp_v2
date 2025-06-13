import { useState } from 'react'
import { Table, UnstyledButton, Group } from '@mantine/core'
import { IconArrowUp, IconArrowDown } from 'react-icons/tb'

export interface Column<T> {
  key: keyof T
  label: string
  sortFn?: (a: T, b: T) => number
  render?: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
}

export function DataTable<T>({ columns, data }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc')

  const setSort = (key: keyof T) => {
    if (sortKey === key) {
      setDirection(direction === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setDirection('asc')
    }
  }

  const sorted = [...data]
  if (sortKey) {
    const column = columns.find((c) => c.key === sortKey)
    if (column?.sortFn) {
      sorted.sort((a, b) => {
        const res = column.sortFn!(a, b)
        return direction === 'asc' ? res : -res
      })
    }
  }

  return (
    <Table striped highlightOnHover withTableBorder>
      <Table.Thead>
        <Table.Tr>
          {columns.map((col) => (
            <Table.Th key={String(col.key)}>
              {col.sortFn ? (
                <UnstyledButton onClick={() => setSort(col.key)}>
                  <Group gap={4} wrap="nowrap">
                    {col.label}
                    {sortKey === col.key ? (
                      direction === 'asc' ? (
                        <IconArrowUp size={12} />
                      ) : (
                        <IconArrowDown size={12} />
                      )
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
        {sorted.map((row, idx) => (
          <Table.Tr key={idx}>
            {columns.map((col) => (
              <Table.Td key={String(col.key)}>
                {col.render ? col.render(row) : (row as any)[col.key]}
              </Table.Td>
            ))}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}
