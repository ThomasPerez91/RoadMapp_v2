// resources/js/components/generics/data_table.tsx
import { useState } from 'react'
import { Table, UnstyledButton, Group, ScrollArea, Text, Box, useMantineTheme } from '@mantine/core'
import { TbArrowUp, TbArrowDown } from 'react-icons/tb'

export interface Column<T> {
  key: keyof T | string
  label: string
  sortFn?: (a: T, b: T) => number
  render?: (row: T) => React.ReactNode
  align?: 'left' | 'center' | 'right'
  width?: string | number
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  minWidth?: number
  emptyMessage?: string
  maxHeight?: number
}

export function DataTable<T>({
  columns,
  data,
  minWidth = 720,
  emptyMessage = 'Aucun élément enregistré',
  maxHeight = 420,
}: DataTableProps<T>) {
  const theme = useMantineTheme()
  const [sortKey, setSortKey] = useState<keyof T | string | null>(null)
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc')

  const setSort = (key: keyof T | string) => {
    if (sortKey === key) {
      setDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
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
    <Box
      style={{
        borderRadius: 24,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'linear-gradient(145deg, rgba(7,14,24,0.96), rgba(3,9,18,0.96))',
        overflow: 'hidden',
      }}
    >
      <ScrollArea type="auto" mah={maxHeight}>
        <Table
          withTableBorder={false}
          withColumnBorders={false}
          horizontalSpacing="md"
          verticalSpacing="sm"
          style={{ minWidth }}
        >
          <Table.Thead>
            <Table.Tr
              style={{
                background: 'linear-gradient(90deg, rgba(15,25,40,0.98), rgba(10,18,32,0.98))',
              }}
            >
              {columns.map((col) => {
                const isSorted = sortKey === col.key
                return (
                  <Table.Th
                    key={String(col.key)}
                    style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                      textAlign: col.align ?? 'left',
                      fontWeight: 600,
                      fontSize: theme.fontSizes.xs,
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                      paddingTop: theme.spacing.sm,
                      paddingBottom: theme.spacing.sm,
                      width: col.width,
                      color: 'rgba(255,255,255,0.7)',
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {col.sortFn ? (
                      <UnstyledButton
                        onClick={() => setSort(col.key)}
                        style={{ width: '100%', paddingInline: 0 }}
                      >
                        <Group
                          gap={4}
                          wrap="nowrap"
                          justify={
                            col.align === 'right'
                              ? 'flex-end'
                              : col.align === 'center'
                                ? 'center'
                                : 'flex-start'
                          }
                        >
                          <Text
                            component="span"
                            fz="xs"
                            fw={600}
                            style={{ opacity: isSorted ? 1 : 0.8 }}
                          >
                            {col.label}
                          </Text>
                          {isSorted &&
                            (direction === 'asc' ? (
                              <TbArrowUp size={12} />
                            ) : (
                              <TbArrowDown size={12} />
                            ))}
                        </Group>
                      </UnstyledButton>
                    ) : (
                      <Text component="span" fz="xs" fw={600} style={{ opacity: 0.8 }}>
                        {col.label}
                      </Text>
                    )}
                  </Table.Th>
                )
              })}
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {sorted.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length}>
                  <Box py="lg">
                    <Text ta="center" opacity={0.6} fz="sm">
                      {emptyMessage}
                    </Text>
                  </Box>
                </Table.Td>
              </Table.Tr>
            ) : (
              sorted.map((row, idx) => {
                const baseBg = idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)'

                return (
                  <Table.Tr
                    key={idx}
                    style={{
                      background: baseBg,
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      transition:
                        'background 120ms ease, transform 80ms ease, box-shadow 120ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(60, 64, 72, 0.9)' // row highlight gris chaud
                      e.currentTarget.style.boxShadow = '0 0 0 1px rgba(56,189,248,0.35)' // léger halo bleu comme tes boutons
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = baseBg
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    {columns.map((col) => (
                      <Table.Td
                        key={String(col.key)}
                        style={{
                          textAlign: col.align ?? 'left',
                          fontSize: theme.fontSizes.sm,
                          color: 'rgba(255,255,255,0.9)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {col.render ? col.render(row) : (row as any)[col.key]}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                )
              })
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Box>
  )
}
