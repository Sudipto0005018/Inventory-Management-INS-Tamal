"use client";

import * as React from "react";
import { Check, Plus, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface ComboboxOption {
    name: string;
    serviceNumber: string;
    phone_no: string;
    rank: string;
}

interface CustomComboBoxProps {
    options: ComboboxOption[];
    onSelect?: (value: ComboboxOption) => void;
    className?: string;
    placeholder?: string;
    onAdd?: (value: ComboboxOption) => void;
    enableAdd?: boolean;
}

export function CustomComboBoxService({
    options,
    onSelect,
    className,
    placeholder,
    onAdd = () => {},
    enableAdd = false,
}: CustomComboBoxProps) {
    const [open, setOpen] = React.useState(false);
    const [selectedServiceNumber, setSelectedServiceNumber] = React.useState("");
    const [inputValue, setInputValue] = React.useState("");

    const exists = options.some(
        (opt) => opt.serviceNumber.toLowerCase() === inputValue.toLowerCase()
    );

    const handleSelect = (serviceNumber: string) => {
        const selectedOption = options.find((opt) => opt.serviceNumber === serviceNumber);
        if (selectedOption) {
            setSelectedServiceNumber(serviceNumber);
            setOpen(false);
            onSelect?.(selectedOption);
        }
    };

    const handleAdd = () => {
        const newOption: ComboboxOption = {
            serviceNumber: inputValue,
            name: "",
            phone_no: "",
            rank: "",
        };
        onAdd(newOption);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-64 justify-between", className)}
                >
                    {selectedServiceNumber || placeholder || "Select option..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0">
                <Command>
                    <CommandInput
                        placeholder="Type to search..."
                        value={inputValue}
                        onValueChange={setInputValue}
                    />
                    <CommandEmpty>
                        {!exists && inputValue.trim() !== "" && enableAdd ? (
                            <div
                                className="flex cursor-pointer items-center gap-2 px-2 py-1 hover:bg-accent"
                                onClick={handleAdd}
                            >
                                <Plus size={16} /> Add "{inputValue}"
                            </div>
                        ) : (
                            "No results found."
                        )}
                    </CommandEmpty>

                    {/* ✅ Scrollable wrapper */}
                    <div className="max-h-60 overflow-auto">
                        <CommandGroup>
                            {options
                                .filter((opt) =>
                                    opt.serviceNumber
                                        .toLowerCase()
                                        .includes(inputValue.toLowerCase())
                                )
                                .map((opt) => (
                                    <CommandItem
                                        key={opt.serviceNumber}
                                        value={opt.serviceNumber}
                                        onSelect={() => handleSelect(opt.serviceNumber)}
                                    >
                                        {opt.serviceNumber}
                                        <Check
                                            className={cn(
                                                "ml-auto h-4 w-4",
                                                selectedServiceNumber === opt.serviceNumber
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                ))}

                            {!exists && inputValue.trim() !== "" && enableAdd && (
                                <CommandItem value={inputValue} onSelect={handleAdd}>
                                    <Plus size={16} className="mr-2" /> Add "{inputValue}"
                                </CommandItem>
                            )}
                        </CommandGroup>
                    </div>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
