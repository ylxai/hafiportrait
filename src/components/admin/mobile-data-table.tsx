'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, ChevronUp, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => ReactNode;
  className?: string;
  priority?: 'high' | 'medium' | 'low'; // untuk responsive display
}

interface MobileDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  actions?: (item: T) => ReactNode;
  emptyMessage?: string;
  className?: string;
}

export function MobileDataTable<T extends { id: string | number }>({ 
  data, 
  columns, 
  onRowClick,
  actions,
  emptyMessage = "Tidak ada data",
  className 
}: MobileDataTableProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());

  const toggleRow = (id: string | number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Filter kolom berdasarkan prioritas untuk mobile
  const mobileColumns = columns.filter(col => col.priority === 'high');
  const expandedColumns = columns.filter(col => col.priority !== 'high');

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Mobile View - Card Layout */}
      <div className="md:hidden space-y-3">
        {data.map((item) => {
          const isExpanded = expandedRows.has(item.id);
          
          return (
            <div 
              key={item.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              {/* Main Content */}
              <div 
                className={cn(
                  "p-4",
                  onRowClick && "cursor-pointer hover:bg-gray-50"
                )}
                onClick={() => onRowClick?.(item)}
              >
                {/* High Priority Fields */}
                <div className="space-y-2">
                  {mobileColumns.map((column) => (
                    <div key={String(column.key)} className="flex justify-between items-start">
                      <span className="text-sm text-gray-600">{column.label}:</span>
                      <span className="text-sm font-medium text-gray-900 text-right">
                        {column.render ? column.render(item) : String(item[column.key as keyof T])}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Actions & Expand Button */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  {actions && (
                    <div onClick={(e) => e.stopPropagation()}>
                      {actions(item)}
                    </div>
                  )}
                  
                  {expandedColumns.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRow(item.id);
                      }}
                      className="ml-auto"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Tutup
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Detail
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && expandedColumns.length > 0 && (
                <div className="px-4 pb-4 bg-gray-50 border-t">
                  <div className="space-y-2 pt-3">
                    {expandedColumns.map((column) => (
                      <div key={String(column.key)} className="flex justify-between items-start">
                        <span className="text-sm text-gray-600">{column.label}:</span>
                        <span className="text-sm text-gray-900 text-right">
                          {column.render ? column.render(item) : String(item[column.key as keyof T])}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop View - Traditional Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              {columns.map((column) => (
                <th 
                  key={String(column.key)}
                  className={cn(
                    "text-left py-3 px-4 font-medium text-gray-700",
                    column.className
                  )}
                >
                  {column.label}
                </th>
              ))}
              {actions && (
                <th className="text-right py-3 px-4 font-medium text-gray-700">
                  Aksi
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr 
                key={item.id}
                className={cn(
                  "border-b hover:bg-gray-50",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <td 
                    key={String(column.key)}
                    className={cn(
                      "py-3 px-4 text-sm",
                      column.className
                    )}
                  >
                    {column.render ? column.render(item) : String(item[column.key as keyof T])}
                  </td>
                ))}
                {actions && (
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    {actions(item)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}