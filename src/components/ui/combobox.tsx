"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    notFoundText?: string;
    className?: string;
    onCreate?: (value: string) => void;
}

export function Combobox({ 
    options, 
    value, 
    onChange,
    placeholder = "Select an option...",
    searchPlaceholder = "Search...",
    notFoundText = "No option found.",
    className,
    onCreate
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSelect = (currentValue: string) => {
    onChange(currentValue === value ? "" : currentValue)
    setOpen(false)
  }

  const handleCreate = () => {
    if (onCreate) {
      onCreate(searchQuery);
      setOpen(false);
    }
  }

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) setSearchQuery('');
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-11 text-base sm:text-sm", !value && "text-muted-foreground", className)}
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="text-base sm:text-sm"
          />
          <CommandList>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label} // Compare with label for filtering
                  onSelect={() => handleSelect(option.value)}
                  className="text-base sm:text-sm"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {onCreate && searchQuery && !filteredOptions.some(opt => opt.label.toLowerCase() === searchQuery.toLowerCase()) && (
              <>
                <CommandEmpty>
                    <button onClick={handleCreate} className="w-full text-left p-2 hover:bg-accent rounded-sm text-base sm:text-sm">
                      <PlusCircle className="mr-2 h-4 w-4 inline-block" />Create "{searchQuery}"
                    </button>
                </CommandEmpty>
              </>
            )}
            {filteredOptions.length === 0 && !searchQuery && (
                 <CommandEmpty className="text-base sm:text-sm">{notFoundText}</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
