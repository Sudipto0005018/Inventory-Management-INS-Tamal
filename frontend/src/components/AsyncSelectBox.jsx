import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Edit, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Card, CardContent } from "./ui/card";
import { FaTrash } from "react-icons/fa6";
import { MdEdit } from "react-icons/md";

const parseJsonSafe = (data) => {
  try {
    if (typeof data === "string") {
      return JSON.parse(data);
    }
    return data;
  } catch (error) {
    return [];
  }
};

const DefaultRenderDetail = ({ details, onEdit, onDelete }) => {
  if (!details) return null;

  const contacts = parseJsonSafe(details.contacts);
  const persons = parseJsonSafe(details.details);

  return (
    <div className="relative text-sm space-y-1">
      <div className="absolute top-0 right-4 z-10 flex gap-2">
        <Button variant="ghost" onClick={() => onEdit(details)}>
          <MdEdit className="h-5 w-5 text-primary" />
        </Button>
        <Button
          variant="ghost"
          className="hidden"
          onClick={() => onDelete(details)}
        >
          <FaTrash className="h-4 w-4 p-[1px] text-red-700" />
        </Button>
      </div>
      <p>
        <strong>Name:</strong> {details.name || "N/A"}
      </p>
      <p>
        <strong>Address:</strong> {details.address || "N/A"}
      </p>
      <p>
        <strong>Contacts:</strong>{" "}
        {Array.isArray(contacts) && contacts.length > 0
          ? contacts.join(", ")
          : "N/A"}
      </p>
      {Array.isArray(persons) && persons.length > 0 && (
        <div className="mt-2">
          <strong>Persons:</strong>
          <ul className="list-disc pl-4 mt-1">
            {persons.map((p, i) => (
              <li key={i}>
                {p.prefix} {p.name} {p.designation ? `(${p.designation})` : ""}{" "}
                - {p.phone}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const AsyncSelectBox = ({
  value,
  onChange,
  fetchOptions,
  fetchDetails,
  renderDetail,
  AddNewModal,
  placeholder = "Select item...",
  label = "Item",
  isEditable = true,
  onDelete,
}) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadDetails = async () => {
      if (value?.id) {
        setLoadingDetails(true);
        setDetails(null);
        try {
          const data = await fetchDetails(value.id);
          if (isMounted) setDetails(data);
        } catch (error) {
          console.error("Failed to fetch details", error);
        } finally {
          if (isMounted) setLoadingDetails(false);
        }
      } else {
        setDetails(null);
      }
    };
    loadDetails();
    return () => {
      isMounted = false;
    };
  }, [value?.id]);

  useEffect(() => {
    let isMounted = true;
    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        const results = await fetchOptions(searchQuery);
        if (isMounted) setOptions(results || []);
      } catch (error) {
        console.error("Failed to fetch options", error);
        if (isMounted) setOptions([]);
      } finally {
        if (isMounted) setLoadingOptions(false);
      }
    };

    const debounce = setTimeout(() => {
      if (open) loadOptions();
    }, 300);

    return () => {
      clearTimeout(debounce);
      isMounted = false;
    };
  }, [searchQuery, open]);

  const handleDeleteClick = (details) => {
    setItemToDelete(details);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete && onDelete) {
      await onDelete(itemToDelete.id);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {value?.name || details?.name || placeholder}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder={`Search ${label}...`}
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                {loadingOptions && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Loading...
                  </div>
                )}
                {!loadingOptions && options.length === 0 && (
                  <CommandEmpty>No {label} found.</CommandEmpty>
                )}
                <CommandGroup>
                  {!loadingOptions &&
                    options.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={item.id} // ShadCN Command uses value for selection, but we handle manually
                        onSelect={() => {
                          onChange(item);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value?.id === item.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        {item.name}
                      </CommandItem>
                    ))}
                </CommandGroup>
                <CommandGroup>
                  {isEditable && (
                    <CommandItem
                      className="cursor-pointer text-blue-600 font-medium border-t mt-1"
                      onSelect={() => {
                        setOpen(false);
                        setEditData(null);
                        setIsAddModalOpen(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add New {label}
                    </CommandItem>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Details Box */}
      {value?.id && (
        <Card className="bg-muted/10">
          <CardContent className="p-4">
            {loadingDetails ? (
              <div className="flex items-center justify-center py-4">
                <div className="text-sm text-muted-foreground">
                  Loading details...
                </div>
              </div>
            ) : details ? (
              renderDetail ? (
                renderDetail(details)
              ) : (
                <DefaultRenderDetail
                  details={details}
                  onEdit={(d) => {
                    setEditData(d);
                    setIsAddModalOpen(true);
                  }}
                  onDelete={handleDeleteClick}
                />
              )
            ) : (
              <div className="text-sm text-muted-foreground italic">
                No details available
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {AddNewModal && (
        <AddNewModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          val={editData}
          onEdited={async (id) => {
            const data = await fetchDetails(id);
            setDetails(data);
          }}
          editable={isEditable}
        />
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {label.toLowerCase()}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AsyncSelectBox;
