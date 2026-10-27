"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"
import { Popover } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"

export interface ComboboxOption {
  value: string
  label: string
  /** Extra text that search should match (SKU, email, …) */
  keywords?: string[]
  description?: React.ReactNode
  trailing?: React.ReactNode
  leading?: React.ReactNode
  group?: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string | null
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  /** Rendered under the list, e.g. a "Create new" button. Receives the current search text. */
  footer?: (search: string, close: () => void) => React.ReactNode
  /** Custom trigger content */
  renderValue?: (option: ComboboxOption | undefined) => React.ReactNode
  invalid?: boolean
  id?: string
  minWidth?: number
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No results",
  className,
  footer,
  renderValue,
  invalid,
  id,
  minWidth = 300,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const selected = options.find((o) => o.value === value)
  const close = React.useCallback(() => setOpen(false), [])

  const groups = React.useMemo(() => {
    const map = new Map<string, ComboboxOption[]>()
    for (const option of options) {
      const key = option.group ?? ""
      map.set(key, [...(map.get(key) ?? []), option])
    }
    return [...map.entries()]
  }, [options])

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        onClick={() => {
          setSearch("")
          setOpen((o) => !o)
        }}
        className={cn(
          "flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-start text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30",
          className,
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate", !selected && "text-muted-foreground")}>
          {renderValue ? renderValue(selected) : (selected?.label ?? placeholder)}
        </span>
        <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
      </button>
      <Popover open={open} onOpenChange={setOpen} anchorRef={triggerRef} minWidth={minWidth}>
        <Command
          filter={(itemValue, query, keywords) => {
            const haystack = [itemValue, ...(keywords ?? [])].join(" ").toLowerCase()
            return query
              .toLowerCase()
              .split(/\s+/)
              .every((term) => haystack.includes(term))
              ? 1
              : 0
          }}
        >
          <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} autoFocus />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {groups.map(([group, items]) => (
              <CommandGroup key={group || "_"} heading={group || undefined}>
                {items.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.value}`}
                    keywords={option.keywords}
                    onSelect={() => {
                      onChange(option.value)
                      setOpen(false)
                      triggerRef.current?.focus()
                    }}
                  >
                    <CheckIcon className={cn("!text-primary", option.value === value ? "opacity-100" : "opacity-0")} />
                    {option.leading}
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{option.label}</div>
                      {option.description && <div className="truncate text-xs text-muted-foreground">{option.description}</div>}
                    </div>
                    {option.trailing && <div className="shrink-0 text-xs text-muted-foreground tabular">{option.trailing}</div>}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
          {footer && <div className="border-t p-1">{footer(search, close)}</div>}
        </Command>
      </Popover>
    </>
  )
}
