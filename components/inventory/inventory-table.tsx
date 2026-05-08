"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnFiltersState,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { asPercent } from "@/lib/tax/shared";
import {
  archiveInventoryItemAction,
  deleteInventoryItemAction,
} from "./inventory-item-actions";

import type { InventoryItem } from "@/lib/types/inventory";
import { InventoryStatusBadge, InventorySourceBadge } from "./inventory-badges";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    onInventoryChanged?: () => Promise<void>;
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SortableHeader({
  column,
  label,
}: {
  column: Column<InventoryItem, unknown>;
  label: string;
}) {
  return (
    <button
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {label}
      {column.getIsSorted() === "asc" ? (
        <ArrowUp className="size-3" />
      ) : column.getIsSorted() === "desc" ? (
        <ArrowDown className="size-3" />
      ) : (
        <ArrowUpDown className="size-3 opacity-40" />
      )}
    </button>
  );
}

function InventoryRowActions({
  item,
  onInventoryChanged,
}: {
  item: InventoryItem;
  onInventoryChanged: () => Promise<void>;
}) {
  const router = useRouter();

  function handleArchive() {
    const confirmed = window.confirm(`Archive "${item.name}"?`)
    if (!confirmed) {
      return
    }

    startTransition(async () => {
      try {
        await archiveInventoryItemAction(item.id)
        await onInventoryChanged()
      } catch (error) {
        window.alert(
          error instanceof Error ? error.message : "Unable to archive inventory item.",
        )
      }
    })
  }

  function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${item.name}" permanently? This cannot be undone.`,
    )
    if (!confirmed) {
      return
    }

    startTransition(async () => {
      try {
        await deleteInventoryItemAction(item.id)
        await onInventoryChanged()
      } catch (error) {
        window.alert(
          error instanceof Error ? error.message : "Unable to delete inventory item.",
        )
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-7">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          className="text-xs uppercase cursor-pointer"
          style={{ letterSpacing: "0.08em" }}
          onClick={() => router.push(`/admin/inventory/${item.id}`)}
        >
          <Pencil className="size-3.5" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-xs uppercase cursor-pointer text-muted-foreground"
          style={{ letterSpacing: "0.08em" }}
          onClick={handleArchive}
        >
          Archive
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          className="text-xs uppercase cursor-pointer"
          style={{ letterSpacing: "0.08em" }}
          onClick={handleDelete}
        >
          <Trash2 className="size-3.5" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const columnHelper = createColumnHelper<InventoryItem>();

const columns = [
  columnHelper.accessor("name", {
    header: ({ column }) => <SortableHeader column={column} label="NAME" />,
    cell: (info) => (
      <div className="min-w-0">
        <p className="font-medium text-foreground text-sm truncate max-w-[200px]">
          {info.getValue()}
        </p>
        {info.row.original.sku && (
          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
            {info.row.original.sku}
          </p>
        )}
      </div>
    ),
  }),
  columnHelper.accessor("itemType", {
    header: "TYPE",
    cell: (info) => (
      <span
        className="text-[10px] font-semibold uppercase text-muted-foreground"
        style={{ letterSpacing: "0.1em" }}
      >
        {info.getValue()}
      </span>
    ),
    filterFn: "equals",
  }),
  columnHelper.accessor("manufacturer", {
    header: "MANUFACTURER",
    cell: (info) => (
      <span className="text-sm text-foreground">{info.getValue() ?? "—"}</span>
    ),
  }),
  columnHelper.accessor("model", {
    header: "MODEL",
    cell: (info) => (
      <span className="text-sm text-muted-foreground">
        {info.getValue() ?? "—"}
      </span>
    ),
  }),
  columnHelper.accessor("price", {
    header: ({ column }) => <SortableHeader column={column} label="PRICE" />,
    cell: (info) => (
      <span className="font-mono text-sm text-foreground">
        ${info.getValue().toFixed(2)}
      </span>
    ),
  }),
  columnHelper.accessor("taxMode", {
    header: "TAX",
    cell: (info) => {
      const item = info.row.original
      if (item.taxMode === "EXEMPT") {
        return <span className="text-[10px] font-semibold uppercase text-muted-foreground">EXEMPT</span>
      }

      if (item.taxMode === "CUSTOM" && typeof item.customTaxRate === "number") {
        return <span className="font-mono text-sm text-foreground">{asPercent(item.customTaxRate)}</span>
      }

      return (
        <span className="text-[10px] font-semibold uppercase text-muted-foreground">
          {item.taxMode}
        </span>
      )
    },
  }),
  columnHelper.accessor("quantity", {
    header: ({ column }) => <SortableHeader column={column} label="QTY" />,
    cell: (info) => (
      <span
        className={`font-mono text-sm font-semibold ${
          info.getValue() === 0 ? "text-destructive" : "text-foreground"
        }`}
      >
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("status", {
    header: "STATUS",
    cell: (info) => <InventoryStatusBadge status={info.getValue()} />,
    filterFn: "equals",
  }),
  columnHelper.accessor("sourceSystem", {
    header: "SOURCE",
    cell: (info) => <InventorySourceBadge source={info.getValue()} />,
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: ({ row, table }) => (
      <InventoryRowActions
        item={row.original}
        onInventoryChanged={table.options.meta?.onInventoryChanged ?? (async () => {})}
      />
    ),
  }),
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const ALL_TYPES = ["FIREARM", "PART", "ACCESSORY", "APPAREL", "OTHER", "SERVICES", "AMMUNITION"] as const;
const ALL_STATUSES = [
  "DRAFT",
  "AVAILABLE",
  "RESERVED",
  "SOLD",
  "ARCHIVED",
] as const;

export function InventoryTable({
  data,
  onInventoryChanged,
}: {
  data: InventoryItem[];
  onInventoryChanged: () => Promise<void>;
}) {
  "use no memo";

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    meta: {
      onInventoryChanged,
    },
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const visibleCount = table.getRowModel().rows.length;

  return (
    <div className="flex flex-col gap-4">
      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="SEARCH..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8 h-8 text-xs"
            style={{ letterSpacing: "0.06em" }}
          />
        </div>

        <Select
          onValueChange={(v) =>
            table
              .getColumn("itemType")
              ?.setFilterValue(v === "ALL" ? undefined : v)
          }
        >
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="ALL TYPES" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="text-xs">
              ALL TYPES
            </SelectItem>
            {ALL_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="text-xs">
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          onValueChange={(v) =>
            table
              .getColumn("status")
              ?.setFilterValue(v === "ALL" ? undefined : v)
          }
        >
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="ALL STATUSES" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="text-xs">
              ALL STATUSES
            </SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <p
          className="ml-auto text-[10px] font-semibold uppercase text-muted-foreground"
          style={{ letterSpacing: "0.1em" }}
        >
          {visibleCount} of {data.length} items
        </p>
      </div>

      {/* Table */}
      <div className="border border-border/40 overflow-hidden">
        <Table className="bg-surface-container-low">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-surface-container border-border/40 hover:bg-surface-container"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-[10px] font-semibold uppercase text-muted-foreground h-9 px-4"
                    style={{ letterSpacing: "0.12em" }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-border/20 hover:bg-surface-container-high/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-16 text-muted-foreground text-sm"
                >
                  No inventory items match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
