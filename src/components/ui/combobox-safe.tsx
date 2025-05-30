import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ComboboxSafeProps<T> {
  items: T[] | null | undefined;
  value: T | null | undefined;
  onChange: (value: T | null) => void;
  placeholder?: string;
  getItemLabel: (item: T) => string;
  getItemValue: (item: T) => string;
  isLoading?: boolean;
}

export function ComboboxSafe<T>({
  items,
  value,
  onChange,
  placeholder = "Select an item...",
  getItemLabel,
  getItemValue,
  isLoading = false,
}: ComboboxSafeProps<T>) {
  const [open, setOpen] = React.useState(false);
  const safeItems = React.useMemo(() => Array.isArray(items) ? items : [], [items]);

  const valueLabel = React.useMemo(() => {
    if (!value) return placeholder;
    try {
      return getItemLabel(value);
    } catch (err) {
      console.error("Error getting item label", err);
      return placeholder;
    }
  }, [value, getItemLabel, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isLoading || safeItems.length === 0}
        >
          {isLoading ? "Loading..." : valueLabel}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      {safeItems.length > 0 && (
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder={placeholder} />
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup>
              {safeItems.map((item) => {
                // Safely get item value, with fallback
                const itemValue = (() => {
                  try {
                    return getItemValue(item);
                  } catch (err) {
                    console.error("Error getting item value", err);
                    return String(Math.random()); // Fallback to random id
                  }
                })();

                // Safely get item label, with fallback
                const itemLabel = (() => {
                  try {
                    return getItemLabel(item);
                  } catch (err) {
                    console.error("Error getting item label", err);
                    return "Unknown";
                  }
                })();

                // Determine if this item is selected
                const isSelected = (() => {
                  if (!value) return false;
                  try {
                    return getItemValue(value) === itemValue;
                  } catch (err) {
                    return false;
                  }
                })();

                return (
                  <CommandItem
                    key={itemValue}
                    value={itemValue}
                    onSelect={() => {
                      onChange(item);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {itemLabel}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      )}
    </Popover>
  );
} 