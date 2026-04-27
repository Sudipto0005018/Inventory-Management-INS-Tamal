// import { useEffect, useState } from "react";
// import { Check, ChevronsUpDown, Edit, Plus } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { Button } from "./ui/button";
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
//   CommandList,
// } from "./ui/command";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "./ui/dialog";
// import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
// import { Card, CardContent } from "./ui/card";
// import { FaTrash } from "react-icons/fa6";
// import { MdEdit } from "react-icons/md";

// const parseJsonSafe = (data) => {
//   try {
//     if (typeof data === "string") {
//       return JSON.parse(data);
//     }
//     return data;
//   } catch (error) {
//     return [];
//   }
// };

// export const DefaultRenderDetail = ({
//   details,
//   onEdit,
//   onDelete,
//   isFromOldSuppliers = false,
//   fetchSupplier = async () => {},
// }) => {
//   // if (!details) return null;
//   const [supplier, setSupplier] = useState({});
//   useEffect(() => {
//     if (isFromOldSuppliers) {
//       fetchSupplier().then((data) => {
//         setSupplier(data);
//       });
//     }
//   }, []);

//   const contacts = supplier?.contacts || parseJsonSafe(details.contacts);
//   const persons = supplier?.details || parseJsonSafe(details.details);

//   return (
//     <div className="relative text-sm space-y-1">
//       <div className="absolute top-0 right-4 z-10 flex gap-2">
//         <Button
//           variant="ghost"
//           className={isFromOldSuppliers ? "hidden" : ""}
//           onClick={() => onEdit(details)}
//         >
//           <MdEdit className="h-5 w-5 text-primary" />
//         </Button>
//         <Button
//           variant="ghost"
//           className="hidden"
//           onClick={() => onDelete(details)}
//         >
//           <FaTrash className="h-4 w-4 p-[1px] text-red-700" />
//         </Button>
//       </div>
//       <p>
//         <strong>Name:</strong> {supplier.name || details.name || "N/A"}
//       </p>
//       <p>
//         <strong>Address:</strong> {supplier.address || details.address || "N/A"}
//       </p>
//       <p>
//         <strong>Contacts:</strong>{" "}
//         {Array.isArray(contacts) && contacts.length > 0
//           ? contacts.join(", ")
//           : "N/A"}
//       </p>
//       {Array.isArray(persons) && persons.length > 0 && (
//         <div className="mt-2">
//           <strong>Persons:</strong>
//           <ul className="list-disc pl-4 mt-1">
//             {persons.map((p, i) => (
//               <li key={i}>
//                 {p.prefix} {p.name} {p.designation ? `(${p.designation})` : ""}{" "}
//                 - {p.phone}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// };

// const AsyncSelectBox = ({
//   value,
//   onChange,
//   fetchOptions,
//   fetchDetails,
//   renderDetail,
//   AddNewModal,
//   placeholder = "Select item...",
//   label = "Item",
//   isEditable = true,
//   onDelete,
// }) => {
//   const [open, setOpen] = useState(false);
//   const [options, setOptions] = useState([]);
//   const [details, setDetails] = useState(null);
//   const [loadingDetails, setLoadingDetails] = useState(false);
//   const [loadingOptions, setLoadingOptions] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
//   const [editData, setEditData] = useState(null);
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
//   const [itemToDelete, setItemToDelete] = useState(null);

//   useEffect(() => {
//     let isMounted = true;
//     const loadDetails = async () => {
//       if (value?.id) {
//         setLoadingDetails(true);
//         setDetails(null);
//         try {
//           const data = await fetchDetails(value.id);
//           if (isMounted) setDetails(data);
//         } catch (error) {
//           console.error("Failed to fetch details", error);
//         } finally {
//           if (isMounted) setLoadingDetails(false);
//         }
//       } else {
//         setDetails(null);
//       }
//     };
//     loadDetails();
//     return () => {
//       isMounted = false;
//     };
//   }, [value?.id]);

//   useEffect(() => {
//     let isMounted = true;
//     const loadOptions = async () => {
//       setLoadingOptions(true);
//       try {
//         const results = await fetchOptions(searchQuery);
//         if (isMounted) setOptions(results || []);
//       } catch (error) {
//         console.error("Failed to fetch options", error);
//         if (isMounted) setOptions([]);
//       } finally {
//         if (isMounted) setLoadingOptions(false);
//       }
//     };

//     const debounce = setTimeout(() => {
//       if (open) loadOptions();
//     }, 300);

//     return () => {
//       clearTimeout(debounce);
//       isMounted = false;
//     };
//   }, [searchQuery, open]);

//   const handleDeleteClick = (details) => {
//     setItemToDelete(details);
//     setDeleteDialogOpen(true);
//   };

//   const confirmDelete = async () => {
//     if (itemToDelete && onDelete) {
//       await onDelete(itemToDelete.id);
//       setDeleteDialogOpen(false);
//       setItemToDelete(null);
//     }
//   };

//   return (
//     <div className="w-full space-y-4">
//       <div className="flex flex-col gap-2">
//         <Popover open={open} onOpenChange={setOpen}>
//           <PopoverTrigger asChild>
//             <Button
//               variant="outline"
//               role="combobox"
//               aria-expanded={open}
//               className="w-full justify-between"
//             >
//               {value?.name || details?.name || placeholder}
//               <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//             </Button>
//           </PopoverTrigger>
//           <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
//             <Command shouldFilter={false}>
//               <CommandInput
//                 placeholder={`Search ${label}...`}
//                 value={searchQuery}
//                 onValueChange={setSearchQuery}
//               />
//               <CommandList>
//                 {loadingOptions && (
//                   <div className="py-6 text-center text-sm text-muted-foreground">
//                     Loading...
//                   </div>
//                 )}
//                 {!loadingOptions && options.length === 0 && (
//                   <CommandEmpty>No {label} found.</CommandEmpty>
//                 )}
//                 <CommandGroup>
//                   {!loadingOptions &&
//                     options.map((item) => (
//                       <CommandItem
//                         key={item.id}
//                         value={item.id} // ShadCN Command uses value for selection, but we handle manually
//                         onSelect={() => {
//                           onChange(item);
//                           setOpen(false);
//                         }}
//                       >
//                         <Check
//                           className={cn(
//                             "mr-2 h-4 w-4",
//                             value?.id === item.id ? "opacity-100" : "opacity-0",
//                           )}
//                         />
//                         {item.name}
//                       </CommandItem>
//                     ))}
//                 </CommandGroup>
//                 <CommandGroup>
//                   {isEditable && (
//                     <CommandItem
//                       className="cursor-pointer text-blue-600 font-medium border-t mt-1"
//                       onSelect={() => {
//                         setOpen(false);
//                         setEditData(null);
//                         setIsAddModalOpen(true);
//                       }}
//                     >
//                       <Plus className="mr-2 h-4 w-4" />
//                       Add New {label}
//                     </CommandItem>
//                   )}
//                 </CommandGroup>
//               </CommandList>
//             </Command>
//           </PopoverContent>
//         </Popover>
//       </div>

//       {/* Details Box */}
//       {value?.id && (
//         <Card className="bg-muted/10">
//           <CardContent className="p-4">
//             {loadingDetails ? (
//               <div className="flex items-center justify-center py-4">
//                 <div className="text-sm text-muted-foreground">
//                   Loading details...
//                 </div>
//               </div>
//             ) : details ? (
//               renderDetail ? (
//                 renderDetail(details)
//               ) : (
//                 <DefaultRenderDetail
//                   details={details}
//                   onEdit={(d) => {
//                     setEditData(d);
//                     setIsAddModalOpen(true);
//                   }}
//                   onDelete={handleDeleteClick}
//                 />
//               )
//             ) : (
//               <div className="text-sm text-muted-foreground italic">
//                 No details available
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       )}

//       {AddNewModal && (
//         <AddNewModal
//           open={isAddModalOpen}
//           onOpenChange={(open) => {
//             setIsAddModalOpen(open);
//             if (!open) fetchOptions();
//           }}
//           val={editData}
//           onEdited={async (id) => {
//             const data = await fetchDetails(id);
//             setDetails(data);
//           }}
//           onAdded={(newItem) => {
//             onChange(newItem);
//             setOpen(false);
//           }}
//           editable={isEditable}
//           fetchData={fetchOptions}
//         />
//       )}

//       <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Confirm Deletion</DialogTitle>
//             <DialogDescription>
//               Are you sure you want to delete this {label.toLowerCase()}? This
//               action cannot be undone.
//             </DialogDescription>
//           </DialogHeader>
//           <DialogFooter>
//             <Button
//               variant="outline"
//               onClick={() => setDeleteDialogOpen(false)}
//             >
//               Cancel
//             </Button>
//             <Button variant="destructive" onClick={confirmDelete}>
//               Delete
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default AsyncSelectBox;

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Edit, Plus, User, Users } from "lucide-react";
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
import { Input } from "./ui/input";
import { Label } from "./ui/label";

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

export const DefaultRenderDetail = ({
  details,
  onEdit,
  onDelete,
  isFromOldSuppliers = false,
  fetchSupplier = async () => {},
  showIndividualInfo = false,
  selectedIndividual = null,
}) => {
  const [supplier, setSupplier] = useState({});

  useEffect(() => {
    if (isFromOldSuppliers) {
      fetchSupplier().then((data) => {
        setSupplier(data);
      });
    }
  }, []);

  const contacts = supplier?.contacts || parseJsonSafe(details.contacts);
  const persons = supplier?.details || parseJsonSafe(details.details);

  return (
    <div className="relative text-sm space-y-1">
      <div className="absolute top-0 right-4 z-10 flex gap-2">
        <Button
          variant="ghost"
          className={isFromOldSuppliers ? "hidden" : ""}
          onClick={() => onEdit(details)}
        >
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
        <strong>Name:</strong> {supplier.name || details.name || "N/A"}
      </p>
      <p>
        <strong>Address:</strong> {supplier.address || details.address || "N/A"}
      </p>
      <p>
        <strong>Contacts:</strong>{" "}
        {Array.isArray(contacts) && contacts.length > 0
          ? contacts.join(", ")
          : "N/A"}
      </p>
      {Array.isArray(persons) && persons.length > 0 && (
        <div className="mt-2">
          <strong>Contact Persons:</strong>
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

      {/* Show selected individual info */}
      {showIndividualInfo && selectedIndividual && (
        <div className="mt-3 pt-2 border-t border-gray-200">
          <strong className="text-green-700">Selected Contact Person:</strong>
          <div className="mt-1 text-sm bg-green-50 p-2 rounded">
            <p>
              <strong>Name:</strong> {selectedIndividual.prefix || ""}{" "}
              {selectedIndividual.name}
            </p>
            <p>
              <strong>Designation:</strong>{" "}
              {selectedIndividual.designation || "N/A"}
            </p>
            <p>
              <strong>Phone:</strong> {selectedIndividual.phone || "N/A"}
            </p>
          </div>
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
  showIndividualSelect = false, // New prop to enable individual selection
  fetchIndividuals = null, // Function to fetch individuals for a firm
  onIndividualChange = null, // Callback when individual is selected
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

  // Individual selection states
  const [individualOpen, setIndividualOpen] = useState(false);
  const [individuals, setIndividuals] = useState([]);
  const [selectedIndividual, setSelectedIndividual] = useState(null);
  const [loadingIndividuals, setLoadingIndividuals] = useState(false);
  const [individualSearchQuery, setIndividualSearchQuery] = useState("");
  const [showAddIndividualModal, setShowAddIndividualModal] = useState(false);

  // Load individuals when a firm is selected
  useEffect(() => {
    if (showIndividualSelect && value?.id && fetchIndividuals) {
      loadIndividuals(value.id);
    } else {
      setIndividuals([]);
      if (!value?.selectedIndividual) {
        setSelectedIndividual(null);
      }
    }
  }, [value?.id, showIndividualSelect]);

  // Set selected individual from value if present
  useEffect(() => {
    if (value?.selectedIndividual) {
      setSelectedIndividual(value.selectedIndividual);
    } else if (!showIndividualSelect) {
      setSelectedIndividual(null);
    }
  }, [value?.selectedIndividual, showIndividualSelect]);

  const loadIndividuals = async (firmId) => {
    setLoadingIndividuals(true);
    try {
      const result = await fetchIndividuals(firmId);
      const individualsList = Array.isArray(result)
        ? result
        : result?.details
          ? parseJsonSafe(result.details)
          : [];
      setIndividuals(individualsList);
    } catch (error) {
      console.error("Failed to load individuals:", error);
      setIndividuals([]);
    } finally {
      setLoadingIndividuals(false);
    }
  };

const handleIndividualSelect = (individual) => {
  console.log("Individual selected in AsyncSelectBox:", individual);
  setSelectedIndividual(individual);
  setIndividualOpen(false);

  // Create a clean individual object with proper id
  const cleanIndividual = {
    id: individual.id,
    prefix: individual.prefix || "",
    name: individual.name || "",
    designation: individual.designation || "",
    phone: individual.phone || "",
  };

  // Update the value with selected individual info
  const updatedValue = {
    ...value,
    selectedIndividual: cleanIndividual,
  };

  onChange(updatedValue);

  if (onIndividualChange) {
    onIndividualChange(cleanIndividual);
  }
};

  const handleAddNewIndividual = (newIndividual) => {
    // Add the new individual to the list
    setIndividuals((prev) => [...prev, newIndividual]);
    // Auto-select the newly added individual
    handleIndividualSelect(newIndividual);
    setShowAddIndividualModal(false);
  };

  // Filter individuals based on search query
  const filteredIndividuals = individuals.filter((individual) => {
    if (!individualSearchQuery) return true;
    const searchLower = individualSearchQuery.toLowerCase();
    return (
      individual.name?.toLowerCase().includes(searchLower) ||
      individual.designation?.toLowerCase().includes(searchLower) ||
      individual.phone?.includes(individualSearchQuery) ||
      individual.prefix?.toLowerCase().includes(searchLower)
    );
  });

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
      // Reset individual selection when firm is deleted
      setSelectedIndividual(null);
      if (onIndividualChange) {
        onIndividualChange(null);
      }
    }
  };

  // Individual Add Modal Component
  const AddIndividualModal = ({ open, onOpenChange, onAdd, firmId }) => {
    const [newIndividual, setNewIndividual] = useState({
      prefix: "Mr",
      name: "",
      designation: "",
      phone: "",
    });

    const handleSubmit = () => {
      if (!newIndividual.name.trim()) {
        // toaster("error", "Name is required");
        return;
      }
      onAdd(newIndividual);
      setNewIndividual({ prefix: "Mr", name: "", designation: "", phone: "" });
      onOpenChange(false);
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Contact Person</DialogTitle>
            <DialogDescription>
              Add a new contact person for {value?.name || "this firm"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Prefix</Label>
              <select
                className="w-full border rounded-md px-3 py-2 mt-1"
                value={newIndividual.prefix}
                onChange={(e) =>
                  setNewIndividual({ ...newIndividual, prefix: e.target.value })
                }
              >
                <option value="Mr">Mr</option>
                <option value="Mrs">Mrs</option>
                <option value="Ms">Ms</option>
                <option value="Dr">Dr</option>
              </select>
            </div>
            <div>
              <Label>Name *</Label>
              <Input
                placeholder="Enter name"
                value={newIndividual.name}
                onChange={(e) =>
                  setNewIndividual({
                    ...newIndividual,
                    name: e.target.value.toUpperCase(),
                  })
                }
              />
            </div>
            <div>
              <Label>Designation</Label>
              <Input
                placeholder="Enter designation"
                value={newIndividual.designation}
                onChange={(e) =>
                  setNewIndividual({
                    ...newIndividual,
                    designation: e.target.value.toUpperCase(),
                  })
                }
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                type="tel"
                placeholder="Enter phone number"
                value={newIndividual.phone}
                onChange={(e) =>
                  setNewIndividual({ ...newIndividual, phone: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Add Person</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* Firm/Company Selection */}
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
                        value={item.id}
                        onSelect={() => {
                          onChange(item);
                          setOpen(false);
                          // Reset individual selection when firm changes
                          setSelectedIndividual(null);
                          if (onIndividualChange) {
                            onIndividualChange(null);
                          }
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

      {/* Individual Selection Dropdown */}
      {showIndividualSelect && value?.id && individuals.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Contact Person (Dealt with)
          </Label>
          <Popover open={individualOpen} onOpenChange={setIndividualOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={individualOpen}
                className="w-full justify-between"
              >
                {selectedIndividual
                  ? `${selectedIndividual.prefix || ""} ${selectedIndividual.name}${selectedIndividual.designation ? ` - ${selectedIndividual.designation}` : ""}`
                  : "Select individual dealt with..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput
                  placeholder="Search person by name, designation, or phone..."
                  value={individualSearchQuery}
                  onValueChange={setIndividualSearchQuery}
                />
                <CommandList>
                  {loadingIndividuals && (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Loading contacts...
                    </div>
                  )}
                  {!loadingIndividuals && filteredIndividuals.length === 0 && (
                    <CommandEmpty>No contact persons found.</CommandEmpty>
                  )}
                  <CommandGroup>
                    {!loadingIndividuals &&
                      filteredIndividuals.map((individual, idx) => (
                        <CommandItem
                          key={idx}
                          value={`${individual.prefix || ""} ${individual.name}`}
                          onSelect={() => handleIndividualSelect(individual)}
                          className="flex flex-col items-start py-2"
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {individual.prefix || ""} {individual.name}
                              </span>
                              {individual.designation && (
                                <span className="text-xs text-muted-foreground">
                                  {individual.designation}
                                </span>
                              )}
                              {individual.phone && (
                                <span className="text-xs text-muted-foreground">
                                  📞 {individual.phone}
                                </span>
                              )}
                            </div>
                            <Check
                              className={cn(
                                "h-4 w-4",
                                selectedIndividual === individual
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                  <CommandGroup>
                    <CommandItem
                      className="cursor-pointer text-blue-600 font-medium border-t mt-1"
                      onSelect={() => {
                        setIndividualOpen(false);
                        setShowAddIndividualModal(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Person
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {selectedIndividual && (
            <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <User className="h-3 w-3" />
              Selected: {selectedIndividual.prefix || ""}{" "}
              {selectedIndividual.name}
              {selectedIndividual.designation &&
                ` (${selectedIndividual.designation})`}
            </div>
          )}
        </div>
      )}

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
                  showIndividualInfo={showIndividualSelect}
                  selectedIndividual={selectedIndividual}
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

      {/* Add/Edit Firm Modal */}
      {AddNewModal && (
        <AddNewModal
          open={isAddModalOpen}
          onOpenChange={(open) => {
            setIsAddModalOpen(open);
            if (!open) fetchOptions();
          }}
          val={editData}
          onEdited={async (id) => {
            const data = await fetchDetails(id);
            setDetails(data);
          }}
          onAdded={(newItem) => {
            onChange(newItem);
            setOpen(false);
          }}
          editable={isEditable}
          fetchData={fetchOptions}
        />
      )}

      {/* Add Individual Modal */}
      <AddIndividualModal
        open={showAddIndividualModal}
        onOpenChange={setShowAddIndividualModal}
        onAdd={handleAddNewIndividual}
        firmId={value?.id}
      />

      {/* Delete Confirmation Dialog */}
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