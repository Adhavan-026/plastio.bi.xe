"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

export type ComboboxOption = {
  id: string;
  label: string;
  sublabel?: string;
};

export function EntityCombobox({
  items,
  value,
  onValueChange,
  placeholder,
  emptyText = "No results.",
  name,
  className,
}: {
  items: ComboboxOption[];
  value: ComboboxOption | null;
  onValueChange: (item: ComboboxOption | null) => void;
  placeholder: string;
  emptyText?: string;
  name?: string;
  className?: string;
}) {
  return (
    <Combobox
      items={items}
      value={value}
      onValueChange={onValueChange}
      itemToStringLabel={(item: ComboboxOption | null) => item?.label ?? ""}
      itemToStringValue={(item: ComboboxOption | null) => item?.id ?? ""}
      isItemEqualToValue={(a: ComboboxOption, b: ComboboxOption) => a?.id === b?.id}
      name={name}
    >
      <ComboboxInput placeholder={placeholder} showClear className={className} />
      <ComboboxContent>
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(item: ComboboxOption) => (
            <ComboboxItem key={item.id} value={item}>
              <div className="flex flex-col">
                <span>{item.label}</span>
                {item.sublabel && (
                  <span className="text-muted-foreground text-xs">{item.sublabel}</span>
                )}
              </div>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
