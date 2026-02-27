import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { FaEye, FaTrash } from "react-icons/fa";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import toaster from "../utils/toaster";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import SpinnerButton from "./ui/spinner-button";

const ComboBox = ({
  options = [],
  onCustomAdd = async () => {},
  onSelect,
  onView,
  onDelete,
  placeholder = "Select option...",
  placeholderOne = "Enter Custom Option",
  dialogContent,
  dialogOpen,
  setDialogOpen,
  className = "",
  value: propValue,
}) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(propValue || "");

  useEffect(() => {
    if (propValue !== undefined) {
      setValue(propValue);
    }
  }, [propValue]);
  const [dialogs, setDialogs] = useState({
    other: false,
    confirm: false,
  });
  const [loading, setLoading] = useState({
    delete: false,
    add: false,
  });
  const [customInputValue, setCustomInputValue] = useState("");
  const [selectedOption, setSelectedOption] = useState({});

  const handleSelect = (currentValue) => {
    if (currentValue === "other_custom_option") {
      if (dialogContent) {
        if (setDialogOpen) {
          setDialogOpen(true);
        }
      } else {
        setDialogs((prev) => ({ ...prev, other: true }));
      }
      setOpen(false);
    } else {
      const isDeselecting = currentValue === value;
      const newValue = isDeselecting ? "" : currentValue;
      setValue(newValue);

      if (onSelect) {
        if (isDeselecting) {
          onSelect(null);
        } else {
          const selectedOption = options.find(
            (opt) => opt.name === currentValue,
          );
          onSelect(selectedOption);
        }
      }
      setOpen(false);
    }
  };

  const handleOtherDialogOk = () => {
    if (customInputValue.trim()) {
      setDialogs({
        other: false,
        confirm: true,
      });
    }
  };

  const handleConfirmYes = async () => {
    try {
      const customOption = { name: customInputValue };
      if (onCustomAdd) {
        setLoading((prev) => ({ ...prev, add: true }));
        await onCustomAdd(customOption);
        // setLoading((prev) => ({ ...prev, add: true }));
      }
      setValue(customInputValue);
      if (onSelect) onSelect(customOption);
      setDialogs((prev) => ({ ...prev, confirm: false }));
      setCustomInputValue("");
    } catch (error) {
      console.error(error);
    } finally {
      // ✅ ALWAYS STOP LOADING
      setLoading((prev) => ({ ...prev, add: false }));
    }
  };

  const handleConfirmNo = () => {
    const customOption = { name: customInputValue };
    setValue(customInputValue);
    if (onSelect) onSelect(customOption);
    setDialogs((prev) => ({ ...prev, confirm: false }));
    setCustomInputValue("");
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-[200px] justify-between text-left font-normal",
              className,
            )}
          >
            <span className="truncate">
              {value
                ? options.find((option) => option.name === value)?.name || value
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandEmpty>No option found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.name}
                    value={option.name}
                    onSelect={handleSelect}
                    className="justify-between"
                  >
                    <div className="flex items-center">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.name ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {option.name}
                    </div>
                    <div className="flex items-center gap-1">
                      {onView && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 hover:bg-primary/30"
                          onClick={(e) => {
                            e.stopPropagation();
                            onView(option);
                          }}
                        >
                          <FaEye className="size-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOption(option);
                            setDialogs((prev) => ({
                              ...prev,
                              delete: true,
                            }));
                          }}
                        >
                          <FaTrash className="size-3" />
                        </Button>
                      )}
                    </div>
                  </CommandItem>
                ))}
                <CommandItem
                  value="other_custom_option"
                  onSelect={handleSelect}
                  className="cursor-pointer"
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  Other...
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Dialog for entering custom value */}
      <Dialog
        open={dialogContent ? dialogOpen : dialogs.other}
        onOpenChange={(isOpen) =>
          dialogContent
            ? setDialogOpen && setDialogOpen(isOpen)
            : setDialogs((prev) => ({ ...prev, other: isOpen }))
        }
      >
        <DialogContent>
          {dialogContent ? (
            dialogContent
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-left">
                  {placeholderOne}
                </DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Input
                  value={customInputValue}
                  onChange={(e) => setCustomInputValue(e.target.value)}
                  placeholder="Type here..."
                />
              </div>
              <DialogFooter>
                <Button
                  variant="secondary"
                  onClick={() =>
                    setDialogs((prev) => ({ ...prev, other: false }))
                  }
                >
                  Cancel
                </Button>
                <Button onClick={handleOtherDialogOk}>OK</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog for confirmation */}
      <Dialog
        open={dialogs.confirm}
        onOpenChange={(isOpen) =>
          setDialogs((prev) => ({ ...prev, confirm: isOpen }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-left">Add for Future Use?</DialogTitle>
            <DialogDescription className="text-left">
              Do you want to add "{customInputValue}" to the list for future
              use?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={handleConfirmNo}>
              No
            </Button>
            <SpinnerButton
              disabled={loading.add}
              loading={loading.add}
              loadingText="Adding..."
              onClick={handleConfirmYes}
            >
              Yes
            </SpinnerButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={dialogs.delete}
        onOpenChange={(isOpen) =>
          setDialogs((prev) => ({ ...prev, delete: isOpen }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-left">Delete</DialogTitle>
            <DialogDescription className="text-left">
              <p>
                Do you want to delete "{selectedOption.name}" from the list?
              </p>
              <span className="text-xs text-gray-500">
                Note: Once it is done. It can't be undone.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setDialogs((prev) => ({ ...prev, delete: false }));
              }}
            >
              No
            </Button>
            <SpinnerButton
              variant="destructive"
              disabled={loading.delete}
              loading={loading.delete}
              loadingText="Deleting..."
              onClick={async () => {
                setLoading((prev) => ({ ...prev, delete: true }));
                await onDelete(selectedOption);
                setDialogs((prev) => ({ ...prev, delete: false }));
                setLoading((prev) => ({ ...prev, delete: false }));
              }}
            >
              Yes
            </SpinnerButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ComboBox;
