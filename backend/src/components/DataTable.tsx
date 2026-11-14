import React, { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from 'lucide-react'

export interface Column<T> {
  key: keyof T | string
  label: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  emptyMessage?: string
  searchable?: boolean
  searchPlaceholder?: string
}

type SortDirection = 'asc' | 'desc' | null

function getNestedValue<T>(obj: T, key: string): unknown {
  return key.split('.').reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, obj)
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No records found.',
  searchable = false,
  searchPlaceholder = 'Search…',
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortKey(null)
        setSortDirection(null)
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return data
    const q = searchQuery.toLowerCase()
    return data.filter((row) =>
      columns.some((col) => {
        const val = getNestedValue(row, col.key as string)
        if (typeof val === 'string') return val.toLowerCase().includes(q)
        if (typeof val === 'number') return String(val).includes(q)
        return false
      })
    )
  }, [data, columns, searchQuery])

  const sorted = useMemo(() => {
    if (!sortKey || !sortDirection) return filtered
    return [...filtered].sort((a, b) => {
      const aVal = getNestedValue(a, sortKey)
      const bVal = getNestedValue(b, sortKey)
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const cmp = aVal.localeCompare(bVal)
        return sortDirection === 'asc' ? cmp : -cmp
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
      return 0
    })
  }, [filtered, sortKey, sortDirection])

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey) return <ChevronsUpDown className="inline-block ml-1 w-3.5 h-3.5 opacity-40" />
    if (sortDirection === 'asc') return <ChevronUp className="inline-block ml-1 w-3.5 h-3.5 text-cyan-400" />
    return <ChevronDown className="inline-block ml-1 w-3.5 h-3.5 text-cyan-400" />
  }

  return (
    <div className="flex flex-col gap-3">
      {searchable && (
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="
              w-full pl-9 pr-4 py-2 rounded-lg text-sm
              bg-zinc-800 border border-zinc-700
              text-zinc-100 placeholder-zinc-500
              focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500
              transition
            "
          />
        </div>
      )}

      <div className="w-full overflow-x-auto rounded-xl border border-zinc-800">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 border-b border-zinc-800">
              {columns.map((col) => (
                <th
                  key={col.key as string}
                  className={`
                    px-4 py-3 text-left font-semibold text-zinc-400 uppercase tracking-wider text-xs whitespace-nowrap select-none
                    ${col.sortable ? 'cursor-pointer hover:text-zinc-200 transition-colors' : ''}
                  `}
                  onClick={col.sortable ? () => handleSort(col.key as string) : undefined}
                >
                  {col.label}
                  {col.sortable && <SortIcon colKey={col.key as string} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="bg-zinc-900/40">
                  {columns.map((col) => (
                    <td key={col.key as string} className="px-4 py-3">
                      <div className="h-4 rounded bg-zinc-800 animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-zinc-500 italic"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sorted.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="bg-zinc-900/20 hover:bg-zinc-800/50 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key as string}
                      className="px-4 py-3 text-zinc-200 whitespace-nowrap"
                    >
                      {col.render
                        ? col.render(row)
                        : (() => {
                            const val = getNestedValue(row, col.key as string)
                            if (val === null || val === undefined) return <span className="text-zinc-600 italic">—</span>
                            return String(val)
                          })()}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && sorted.length > 0 && (
        <p className="text-xs text-zinc-600 text-right">
          {sorted.length} of {data.length} row{data.length !== 1 ? 's' : ''}
          {searchQuery.trim() ? ' (filtered)' : ''}
        </p>
      )}
    </div>
  )
}

export default DataTable
