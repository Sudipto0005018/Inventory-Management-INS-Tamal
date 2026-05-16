// import { useState, useEffect } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogTitle,
// } from "../components/ui/dialog";
// import { Button } from "../components/ui/button";
// import { Input } from "../components/ui/input";
// import { Label } from "../components/ui/label";
// import { FormattedDatePicker } from "@/components/FormattedDatePicker";
// import SpinnerButton from "../components/ui/spinner-button";
// import toaster from "../utils/toaster";
// import apiService from "../utils/apiService";
// import { FaMagnifyingGlass } from "react-icons/fa6";
// import { ChevronDownIcon } from "lucide-react";

// const AddPTSDemand = ({ open, onOpenChange, onSuccess }) => {
//   const [step, setStep] = useState(1);
//   const [isLoading, setIsLoading] = useState(false);

//   // Item search states
//   const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
//   const [itemSearchTerm, setItemSearchTerm] = useState("");
//   const [searchedItems, setSearchedItems] = useState([]);
//   const [initialItems, setInitialItems] = useState([]);
//   const [isSearchingItems, setIsSearchingItems] = useState(false);
//   const [isLoadingInitial, setIsLoadingInitial] = useState(false);
//   const [selectedItem, setSelectedItem] = useState(null);

//   // Pagination for initial items
//   const [initialItemsPage, setInitialItemsPage] = useState(1);
//   const [hasMoreInitial, setHasMoreInitial] = useState(true);

//   const [formData, setFormData] = useState({
//     quantity: "",
//     internal_demand_no: "",
//     internal_demand_date: null,
//     requisition_no: "",
//     requisition_date: null,
//     mo_demand_no: "",
//     mo_demand_date: null,
//   });

//   // Fetch initial items when dropdown opens
//   const fetchInitialItems = async (page = 1) => {
//     setIsLoadingInitial(true);
//     try {
//       const response = await apiService.get("/pts/items", {
//         params: {
//           page: page,
//           limit: 50,
//         },
//       });

//       if (response.success) {
//         if (page === 1) {
//           setInitialItems(response.data.items);
//         } else {
//           setInitialItems((prev) => [...prev, ...response.data.items]);
//         }
//         setHasMoreInitial(
//           response.data.hasMore || response.data.items.length === 50,
//         );
//         setInitialItemsPage(page);
//       }
//     } catch (error) {
//       console.error("Error fetching initial items:", error);
//       toaster("error", "Failed to load items");
//     } finally {
//       setIsLoadingInitial(false);
//     }
//   };

//   // Search items when search term changes
//   useEffect(() => {
//     const searchItems = async () => {
//       if (!itemSearchTerm.trim()) {
//         setSearchedItems([]);
//         return;
//       }

//       setIsSearchingItems(true);
//       try {
//         const response = await apiService.get("/pts/items", {
//           params: {
//             search: itemSearchTerm,
//             limit: 500,
//           },
//         });

//         if (response.success) {
//           setSearchedItems(response.data.items || []);
//         }
//       } catch (error) {
//         console.error("Error searching items:", error);
//         toaster("error", "Failed to search items");
//       } finally {
//         setIsSearchingItems(false);
//       }
//     };

//     const debounceTimer = setTimeout(searchItems, 300);
//     return () => clearTimeout(debounceTimer);
//   }, [itemSearchTerm]);

//   // Reset when dialog opens
//   useEffect(() => {
//     if (open) {
//       setStep(1);
//       setSelectedItem(null);
//       setItemSearchTerm("");
//       setSearchedItems([]);
//       setFormData({
//         quantity: "",
//         internal_demand_no: "",
//         internal_demand_date: null,
//         requisition_no: "",
//         requisition_date: null,
//         mo_demand_no: "",
//         mo_demand_date: null,
//       });
//       // Don't fetch initial items until dropdown opens
//     }
//   }, [open]);

//   // Fetch initial items when dropdown opens
//   useEffect(() => {
//     if (isItemDropdownOpen && initialItems.length === 0 && !isLoadingInitial) {
//       fetchInitialItems(1);
//     }
//   }, [isItemDropdownOpen]);

//   const handleItemSelect = (item) => {
//     setSelectedItem(item);
//     setIsItemDropdownOpen(false);
//     setItemSearchTerm("");
//     setSearchedItems([]);
//   };

//   const handleNext = () => {
//     if (!selectedItem) {
//       toaster("error", "Please select an item");
//       return;
//     }
//     if (!formData.quantity || formData.quantity <= 0) {
//       toaster("error", "Please enter valid quantity");
//       return;
//     }
//     setStep(2);
//   };

//   const handleSubmit = async () => {
//     if (!formData.internal_demand_no) {
//       toaster("error", "Internal Demand No is required");
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const payload = {
//         spare_id: selectedItem.type === "spare" ? selectedItem.id : null,
//         tool_id: selectedItem.type === "tool" ? selectedItem.id : null,
//         quantity: formData.quantity,
//         internal_demand_no: formData.internal_demand_no,
//         internal_demand_date: formData.internal_demand_date,
//         requisition_no: formData.requisition_no || null,
//         requisition_date: formData.requisition_date || null,
//         mo_demand_no: formData.mo_demand_no || null,
//         mo_demand_date: formData.mo_demand_date || null,
//       };

//       const response = await apiService.post("/pts/pts-demand", payload);
//       if (response.success) {
//         toaster("success", "PTS Demand added successfully");
//         resetForm();
//         onSuccess();
//       } else {
//         toaster("error", response.message);
//       }
//     } catch (error) {
//       toaster(
//         "error",
//         error.response?.data?.message || "Failed to add PTS Demand",
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const resetForm = () => {
//     setStep(1);
//     setSelectedItem(null);
//     setItemSearchTerm("");
//     setSearchedItems([]);
//     setInitialItems([]);
//     setFormData({
//       quantity: "",
//       internal_demand_no: "",
//       internal_demand_date: null,
//       requisition_no: "",
//       requisition_date: null,
//       mo_demand_no: "",
//       mo_demand_date: null,
//     });
//   };

//   const handleClose = () => {
//     resetForm();
//     onOpenChange(false);
//   };

//   return (
//     <Dialog open={open} onOpenChange={handleClose}>
//       <DialogContent
//         showCloseButton
//         onPointerDownOutside={(e) => {
//           e.preventDefault();
//         }}
//         className="max-w-2xl"
//       >
//         <DialogTitle className="text-lg font-semibold">
//           {step === 1
//             ? "Add PTS Demand - Select Item"
//             : "Add PTS Demand - Enter Demand Details"}
//         </DialogTitle>
//         <DialogDescription className="hidden" />

//         {step === 1 ? (
//           <div className="space-y-4">
//             {/* Select Item - Searchable Combobox */}
//             <div className="mt-2">
//               <Label>
//                 Select Item <span className="text-red-500">*</span>
//               </Label>

//               <div className="relative mt-1">
//                 {/* Custom Combobox */}
//                 <div className="relative">
//                   <button
//                     type="button"
//                     onClick={() => setIsItemDropdownOpen(!isItemDropdownOpen)}
//                     className="w-full p-2 border rounded-md bg-white text-left flex justify-between items-center hover:bg-gray-50"
//                   >
//                     <span
//                       className={
//                         selectedItem ? "text-gray-900" : "text-gray-400"
//                       }
//                     >
//                       {selectedItem
//                         ? `${selectedItem.description} (${selectedItem.category}) - ${selectedItem.type === "spare" ? "SPARE" : "TOOL"}`
//                         : "Search and Select Items..."}
//                     </span>
//                     <ChevronDownIcon
//                       className={`size-4 transition-transform ${isItemDropdownOpen ? "rotate-180" : ""}`}
//                     />
//                   </button>

//                   {/* Dropdown with search */}
//                   {isItemDropdownOpen && (
//                     <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
//                       {/* Search input inside dropdown */}
//                       <div className="p-2 border-b">
//                         <div className="relative">
//                           <input
//                             type="text"
//                             placeholder="Search by description, IN part no., or equipment..."
//                             className="w-full p-2 pl-8 border rounded-md"
//                             value={itemSearchTerm}
//                             onChange={(e) => setItemSearchTerm(e.target.value)}
//                             autoFocus
//                           />
//                           <FaMagnifyingGlass className="absolute left-2 top-3 text-gray-400 size-4" />
//                           {itemSearchTerm && (
//                             <button
//                               onClick={() => setItemSearchTerm("")}
//                               className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
//                             >
//                               ✕
//                             </button>
//                           )}
//                         </div>
//                       </div>

//                       {/* Search mode */}
//                       {itemSearchTerm && (
//                         <div className="max-h-60 overflow-y-auto">
//                           {isSearchingItems && (
//                             <div className="p-4 text-center text-gray-500">
//                               <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
//                               Searching...
//                             </div>
//                           )}

//                           {!isSearchingItems && (
//                             <>
//                               {searchedItems.length === 0 ? (
//                                 <div className="p-4 text-center text-gray-500 text-sm">
//                                   No items found matching "{itemSearchTerm}"
//                                 </div>
//                               ) : (
//                                 <>
//                                   <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 border-b sticky top-0">
//                                     Search Results ({searchedItems.length})
//                                   </div>
//                                   {searchedItems.map((item) => (
//                                     <div
//                                       key={`${item.type}-${item.id}`}
//                                       className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
//                                       onClick={() => handleItemSelect(item)}
//                                     >
//                                       <div className="flex-1">
//                                         <div className="font-medium">
//                                           {item.description}
//                                           <span className="ml-2 text-xs text-gray-500">
//                                             ({item.category})
//                                           </span>
//                                         </div>
//                                         <div className="text-xs text-gray-500 mt-1 space-x-2">
//                                           <span className="font-semibold">
//                                             Type:
//                                           </span>
//                                           <span className="text-blue-600 font-semibold">
//                                             {item.type === "spare"
//                                               ? "SPARE"
//                                               : "TOOL"}
//                                           </span>
//                                           {item.indian_pattern && (
//                                             <>
//                                               <span className="mx-1">•</span>
//                                               <span className="font-semibold">
//                                                 IN Part No.:
//                                               </span>
//                                               <span className="font-mono">
//                                                 {item.indian_pattern}
//                                               </span>
//                                             </>
//                                           )}
//                                           {item.item_code && (
//                                             <>
//                                               <span className="mx-1">•</span>
//                                               <span className="font-semibold">
//                                                 Item Code:
//                                               </span>
//                                               <span className="font-mono">
//                                                 {item.item_code}
//                                               </span>
//                                             </>
//                                           )}
//                                         </div>
//                                         {item.equipment_system && (
//                                           <div className="text-xs text-gray-500 mt-1">
//                                             <span className="font-semibold">
//                                               Equipment/System:
//                                             </span>
//                                             <span className="ml-1">
//                                               {item.equipment_system}
//                                             </span>
//                                           </div>
//                                         )}
//                                       </div>
//                                     </div>
//                                   ))}
//                                 </>
//                               )}
//                             </>
//                           )}
//                         </div>
//                       )}

//                       {/* Initial items mode (no search) */}
//                       {!itemSearchTerm && (
//                         <div className="max-h-60 overflow-y-auto">
//                           {initialItems.length === 0 && isLoadingInitial ? (
//                             <div className="p-4 text-center text-gray-500">
//                               <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
//                               Loading items...
//                             </div>
//                           ) : (
//                             <>
//                               <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 border-b sticky top-0">
//                                 Items (P/R Category Only)
//                               </div>
//                               {initialItems.map((item) => (
//                                 <div
//                                   key={`${item.type}-${item.id}`}
//                                   className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
//                                   onClick={() => handleItemSelect(item)}
//                                 >
//                                   <div className="flex-1">
//                                     <div className="font-medium">
//                                       {item.description}
//                                       <span className="ml-2 text-xs text-gray-500">
//                                         ({item.category})
//                                       </span>
//                                     </div>
//                                     <div className="text-xs text-gray-500 mt-1 space-x-2">
//                                       <span className="font-semibold">
//                                         Type:
//                                       </span>
//                                       <span className="text-blue-600 font-semibold">
//                                         {item.type === "spare"
//                                           ? "SPARE"
//                                           : "TOOL"}
//                                       </span>
//                                       {item.indian_pattern && (
//                                         <>
//                                           <span className="mx-1">•</span>
//                                           <span className="font-semibold">
//                                             IN Part No.:
//                                           </span>
//                                           <span className="font-mono">
//                                             {item.indian_pattern}
//                                           </span>
//                                         </>
//                                       )}
//                                       {item.item_code && (
//                                         <>
//                                           <span className="mx-1">•</span>
//                                           <span className="font-semibold">
//                                             Item Code:
//                                           </span>
//                                           <span className="font-mono">
//                                             {item.item_code}
//                                           </span>
//                                         </>
//                                       )}
//                                     </div>
//                                     {item.equipment_system && (
//                                       <div className="text-xs text-gray-500 mt-1">
//                                         <span className="font-semibold">
//                                           Equipment/System:
//                                         </span>
//                                         <span className="ml-1">
//                                           {item.equipment_system}
//                                         </span>
//                                       </div>
//                                     )}
//                                   </div>
//                                 </div>
//                               ))}

//                               {hasMoreInitial && (
//                                 <div className="p-2 text-center">
//                                   <Button
//                                     size="sm"
//                                     variant="outline"
//                                     onClick={() =>
//                                       fetchInitialItems(initialItemsPage + 1)
//                                     }
//                                     disabled={isLoadingInitial}
//                                     className="text-xs"
//                                   >
//                                     {isLoadingInitial
//                                       ? "Loading..."
//                                       : "Load More"}
//                                   </Button>
//                                 </div>
//                               )}
//                             </>
//                           )}
//                         </div>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Selected item details panel */}
//               {selectedItem && (
//                 <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
//                   <p className="text-xs text-green-800 mb-2 font-medium flex items-center gap-2">
//                     <span>✓ Selected Item Details:</span>
//                     <span className="px-2 py-0.5 bg-green-200 rounded text-xs font-semibold">
//                       {selectedItem.type === "spare" ? "SPARE" : "TOOL"}
//                     </span>
//                   </p>
//                   <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
//                     <div className="col-span-2">
//                       <span className="font-semibold text-gray-600">
//                         Description:
//                       </span>
//                       <span className="ml-2 text-gray-700">
//                         {selectedItem.description || "--"}
//                       </span>
//                     </div>
//                     <div>
//                       <span className="font-semibold text-gray-600">
//                         Category:
//                       </span>
//                       <span className="ml-2 text-gray-700">
//                         {selectedItem.category || "--"}
//                       </span>
//                     </div>
//                     <div>
//                       <span className="font-semibold text-gray-600">
//                         IN Part No.:
//                       </span>
//                       <span className="ml-2 text-gray-700 font-mono text-xs">
//                         {selectedItem.indian_pattern || "--"}
//                       </span>
//                     </div>
//                     <div>
//                       <span className="font-semibold text-gray-600">
//                         Denos:
//                       </span>
//                       <span className="ml-2 text-gray-700">
//                         {selectedItem.denos || "--"}
//                       </span>
//                     </div>
//                     <div className="col-span-2">
//                       <span className="font-semibold text-gray-600">
//                         Equipment/System:
//                       </span>
//                       <span className="ml-2 text-gray-700">
//                         {selectedItem.equipment_system || "--"}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Quantity Demanded */}
//             <div>
//               <Label className="mb-2 block">
//                 Quantity Demanded <span className="text-red-500">*</span>
//               </Label>
//               <Input
//                 type="number"
//                 value={formData.quantity}
//                 onChange={(e) =>
//                   setFormData((prev) => ({
//                     ...prev,
//                     quantity: e.target.value,
//                   }))
//                 }
//                 placeholder="Enter quantity"
//                 min="1"
//               />
//             </div>

//             <div className="flex justify-end gap-4 mt-6">
//               <Button variant="outline" onClick={handleClose}>
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handleNext}
//                 disabled={!selectedItem || !formData.quantity}
//               >
//                 Next
//               </Button>
//             </div>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             <div className="bg-gray-50 p-3 rounded mb-4">
//               <p>
//                 <strong>Item:</strong> {selectedItem?.description}
//               </p>
//               <p>
//                 <strong>Category:</strong> {selectedItem?.category}
//               </p>
//               <p>
//                 <strong>Quantity:</strong> {formData.quantity}
//               </p>
//             </div>

//             {/* Internal Demand No. - Always shown */}
//             <div className="flex gap-4 w-full">
//               <div className="w-full">
//                 <Label htmlFor="internal_demand_no" className="ms-2 mb-2 mt-4">
//                   Internal Demand No. <span className="text-red-500">*</span>
//                 </Label>
//                 <Input
//                   type="text"
//                   id="internal_demand_no"
//                   value={formData.internal_demand_no}
//                   placeholder="Internal Demand No."
//                   onChange={(e) =>
//                     setFormData((prev) => ({
//                       ...prev,
//                       internal_demand_no: e.target.value.toUpperCase(),
//                     }))
//                   }
//                 />
//               </div>
//               <div className="w-full mt-3">
//                 <FormattedDatePicker
//                   label="Internal Demand Date"
//                   value={formData.internal_demand_date}
//                   onChange={(date) =>
//                     setFormData((prev) => ({
//                       ...prev,
//                       internal_demand_date: date,
//                     }))
//                   }
//                 />
//               </div>
//             </div>

//             {/* Requisition No. - Shows only if Internal Demand No. and Date are filled */}
//             {formData.internal_demand_no && formData.internal_demand_date && (
//               <div className="flex gap-4 w-full">
//                 <div className="w-full">
//                   <Label htmlFor="requisition_no" className="ms-2 mb-2 mt-5">
//                     Requisition No.
//                   </Label>
//                   <Input
//                     type="text"
//                     id="requisition_no"
//                     value={formData.requisition_no}
//                     placeholder="Requisition No."
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         requisition_no: e.target.value.toUpperCase(),
//                       }))
//                     }
//                   />
//                 </div>
//                 <div className="w-full mt-4">
//                   <FormattedDatePicker
//                     label="Requisition Date"
//                     value={formData.requisition_date}
//                     onChange={(date) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         requisition_date: date,
//                       }))
//                     }
//                   />
//                 </div>
//               </div>
//             )}

//             {/* MO Demand No. - Shows only if Requisition No. and Date are filled */}
//             {formData.requisition_no && formData.requisition_date && (
//               <div className="flex gap-4 w-full">
//                 <div className="w-full">
//                   <Label htmlFor="mo_demand_no" className="ms-2 mb-2 mt-7">
//                     MO Demand No.
//                   </Label>
//                   <Input
//                     type="text"
//                     id="mo_demand_no"
//                     value={formData.mo_demand_no}
//                     placeholder="MO Demand No."
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         mo_demand_no: e.target.value.toUpperCase(),
//                       }))
//                     }
//                   />
//                 </div>
//                 <div className="w-full mt-6">
//                   <FormattedDatePicker
//                     label="MO Demand Date"
//                     value={formData.mo_demand_date}
//                     onChange={(date) =>
//                       setFormData((prev) => ({ ...prev, mo_demand_date: date }))
//                     }
//                   />
//                 </div>
//               </div>
//             )}

//             <div className="flex justify-between gap-4 mt-6">
//               <Button variant="outline" onClick={() => setStep(1)}>
//                 Back
//               </Button>
//               <div className="flex gap-4">
//                 <Button variant="outline" onClick={handleClose}>
//                   Cancel
//                 </Button>
//                 <SpinnerButton
//                   loading={isLoading}
//                   disabled={isLoading || !formData.internal_demand_no}
//                   onClick={handleSubmit}
//                 >
//                   Submit
//                 </SpinnerButton>
//               </div>
//             </div>
//           </div>
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default AddPTSDemand;

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { FormattedDatePicker } from "@/components/FormattedDatePicker";
import SpinnerButton from "../components/ui/spinner-button";
import toaster from "../utils/toaster";
import apiService from "../utils/apiService";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { ChevronDownIcon } from "lucide-react";

// Helper function to format date without timezone conversion
const formatDateLocal = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const AddPTSDemand = ({ open, onOpenChange, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Item search states
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [searchedItems, setSearchedItems] = useState([]);
  const [initialItems, setInitialItems] = useState([]);
  const [isSearchingItems, setIsSearchingItems] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Pagination for initial items
  const [initialItemsPage, setInitialItemsPage] = useState(1);
  const [hasMoreInitial, setHasMoreInitial] = useState(true);

  const [formData, setFormData] = useState({
    quantity: "",
    internal_demand_no: "",
    internal_demand_date: null,
    requisition_no: "",
    requisition_date: null,
    mo_demand_no: "",
    mo_demand_date: null,
  });

  // Fetch initial items when dropdown opens
  const fetchInitialItems = async (page = 1) => {
    setIsLoadingInitial(true);
    try {
      const response = await apiService.get("/pts/items", {
        params: {
          page: page,
          limit: 50,
        },
      });

      if (response.success) {
        if (page === 1) {
          setInitialItems(response.data.items);
        } else {
          setInitialItems((prev) => [...prev, ...response.data.items]);
        }
        setHasMoreInitial(
          response.data.hasMore || response.data.items.length === 50,
        );
        setInitialItemsPage(page);
      }
    } catch (error) {
      console.error("Error fetching initial items:", error);
      toaster("error", "Failed to load items");
    } finally {
      setIsLoadingInitial(false);
    }
  };

  // Search items when search term changes
  useEffect(() => {
    const searchItems = async () => {
      if (!itemSearchTerm.trim()) {
        setSearchedItems([]);
        return;
      }

      setIsSearchingItems(true);
      try {
        const response = await apiService.get("/pts/items", {
          params: {
            search: itemSearchTerm,
            limit: 500,
          },
        });

        if (response.success) {
          setSearchedItems(response.data.items || []);
        }
      } catch (error) {
        console.error("Error searching items:", error);
        toaster("error", "Failed to search items");
      } finally {
        setIsSearchingItems(false);
      }
    };

    const debounceTimer = setTimeout(searchItems, 300);
    return () => clearTimeout(debounceTimer);
  }, [itemSearchTerm]);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedItem(null);
      setItemSearchTerm("");
      setSearchedItems([]);
      setFormData({
        quantity: "",
        internal_demand_no: "",
        internal_demand_date: null,
        requisition_no: "",
        requisition_date: null,
        mo_demand_no: "",
        mo_demand_date: null,
      });
      // Don't fetch initial items until dropdown opens
    }
  }, [open]);

  // Fetch initial items when dropdown opens
  useEffect(() => {
    if (isItemDropdownOpen && initialItems.length === 0 && !isLoadingInitial) {
      fetchInitialItems(1);
    }
  }, [isItemDropdownOpen]);

  const handleItemSelect = (item) => {
    setSelectedItem(item);
    setIsItemDropdownOpen(false);
    setItemSearchTerm("");
    setSearchedItems([]);
  };

  const handleNext = () => {
    if (!selectedItem) {
      toaster("error", "Please select an item");
      return;
    }
    if (!formData.quantity || formData.quantity <= 0) {
      toaster("error", "Please enter valid quantity");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!formData.internal_demand_no) {
      toaster("error", "Internal Demand No is required");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        spare_id: selectedItem.type === "spare" ? selectedItem.id : null,
        tool_id: selectedItem.type === "tool" ? selectedItem.id : null,
        quantity: formData.quantity,
        internal_demand_no: formData.internal_demand_no,
        internal_demand_date: formatDateLocal(formData.internal_demand_date),
        requisition_no: formData.requisition_no || null,
        requisition_date: formatDateLocal(formData.requisition_date),
        mo_demand_no: formData.mo_demand_no || null,
        mo_demand_date: formatDateLocal(formData.mo_demand_date),
      };

      const response = await apiService.post("/pts/pts-demand", payload);
      if (response.success) {
        toaster("success", "PTS Demand added successfully");
        resetForm();
        onSuccess();
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      toaster(
        "error",
        error.response?.data?.message || "Failed to add PTS Demand",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedItem(null);
    setItemSearchTerm("");
    setSearchedItems([]);
    setInitialItems([]);
    setFormData({
      quantity: "",
      internal_demand_no: "",
      internal_demand_date: null,
      requisition_no: "",
      requisition_date: null,
      mo_demand_no: "",
      mo_demand_date: null,
    });
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton
        onPointerDownOutside={(e) => {
          e.preventDefault();
        }}
        className="max-w-2xl"
      >
        <DialogTitle className="text-lg font-semibold">
          {step === 1
            ? "Add PTS Demand - Select Item"
            : "Add PTS Demand - Enter Demand Details"}
        </DialogTitle>
        <DialogDescription className="hidden" />

        {step === 1 ? (
          <div className="space-y-4">
            {/* Select Item - Searchable Combobox */}
            <div className="mt-2">
              <Label>
                Select Item <span className="text-red-500">*</span>
              </Label>

              <div className="relative mt-1">
                {/* Custom Combobox */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsItemDropdownOpen(!isItemDropdownOpen)}
                    className="w-full p-2 border rounded-md bg-white text-left flex justify-between items-center hover:bg-gray-50"
                  >
                    <span
                      className={
                        selectedItem ? "text-gray-900" : "text-gray-400"
                      }
                    >
                      {selectedItem
                        ? `${selectedItem.description} (${selectedItem.category}) - ${selectedItem.type === "spare" ? "SPARE" : "TOOL"}`
                        : "Search and Select Items..."}
                    </span>
                    <ChevronDownIcon
                      className={`size-4 transition-transform ${isItemDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Dropdown with search */}
                  {isItemDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
                      {/* Search input inside dropdown */}
                      <div className="p-2 border-b">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search by description, IN part no., or equipment..."
                            className="w-full p-2 pl-8 border rounded-md"
                            value={itemSearchTerm}
                            onChange={(e) => setItemSearchTerm(e.target.value)}
                            autoFocus
                          />
                          <FaMagnifyingGlass className="absolute left-2 top-3 text-gray-400 size-4" />
                          {itemSearchTerm && (
                            <button
                              onClick={() => setItemSearchTerm("")}
                              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Search mode */}
                      {itemSearchTerm && (
                        <div className="max-h-60 overflow-y-auto">
                          {isSearchingItems && (
                            <div className="p-4 text-center text-gray-500">
                              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                              Searching...
                            </div>
                          )}

                          {!isSearchingItems && (
                            <>
                              {searchedItems.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                  No items found matching "{itemSearchTerm}"
                                </div>
                              ) : (
                                <>
                                  <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 border-b sticky top-0">
                                    Search Results ({searchedItems.length})
                                  </div>
                                  {searchedItems.map((item) => (
                                    <div
                                      key={`${item.type}-${item.id}`}
                                      className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                                      onClick={() => handleItemSelect(item)}
                                    >
                                      <div className="flex-1">
                                        <div className="font-medium">
                                          {item.description}
                                          <span className="ml-2 text-xs text-gray-500">
                                            ({item.category})
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1 space-x-2">
                                          <span className="font-semibold">
                                            Type:
                                          </span>
                                          <span className="text-blue-600 font-semibold">
                                            {item.type === "spare"
                                              ? "SPARE"
                                              : "TOOL"}
                                          </span>
                                          {item.indian_pattern && (
                                            <>
                                              <span className="mx-1">•</span>
                                              <span className="font-semibold">
                                                IN Part No.:
                                              </span>
                                              <span className="font-mono">
                                                {item.indian_pattern}
                                              </span>
                                            </>
                                          )}
                                          {item.item_code && (
                                            <>
                                              <span className="mx-1">•</span>
                                              <span className="font-semibold">
                                                Item Code:
                                              </span>
                                              <span className="font-mono">
                                                {item.item_code}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                        {item.equipment_system && (
                                          <div className="text-xs text-gray-500 mt-1">
                                            <span className="font-semibold">
                                              Equipment/System:
                                            </span>
                                            <span className="ml-1">
                                              {item.equipment_system}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* Initial items mode (no search) */}
                      {!itemSearchTerm && (
                        <div className="max-h-60 overflow-y-auto">
                          {initialItems.length === 0 && isLoadingInitial ? (
                            <div className="p-4 text-center text-gray-500">
                              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                              Loading items...
                            </div>
                          ) : (
                            <>
                              <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 border-b sticky top-0">
                                Items (P/R Category Only)
                              </div>
                              {initialItems.map((item) => (
                                <div
                                  key={`${item.type}-${item.id}`}
                                  className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                                  onClick={() => handleItemSelect(item)}
                                >
                                  <div className="flex-1">
                                    <div className="font-medium">
                                      {item.description}
                                      <span className="ml-2 text-xs text-gray-500">
                                        ({item.category})
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 space-x-2">
                                      <span className="font-semibold">
                                        Type:
                                      </span>
                                      <span className="text-blue-600 font-semibold">
                                        {item.type === "spare"
                                          ? "SPARE"
                                          : "TOOL"}
                                      </span>
                                      {item.indian_pattern && (
                                        <>
                                          <span className="mx-1">•</span>
                                          <span className="font-semibold">
                                            IN Part No.:
                                          </span>
                                          <span className="font-mono">
                                            {item.indian_pattern}
                                          </span>
                                        </>
                                      )}
                                      {item.item_code && (
                                        <>
                                          <span className="mx-1">•</span>
                                          <span className="font-semibold">
                                            Item Code:
                                          </span>
                                          <span className="font-mono">
                                            {item.item_code}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    {item.equipment_system && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        <span className="font-semibold">
                                          Equipment/System:
                                        </span>
                                        <span className="ml-1">
                                          {item.equipment_system}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}

                              {hasMoreInitial && (
                                <div className="p-2 text-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      fetchInitialItems(initialItemsPage + 1)
                                    }
                                    disabled={isLoadingInitial}
                                    className="text-xs"
                                  >
                                    {isLoadingInitial
                                      ? "Loading..."
                                      : "Load More"}
                                  </Button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected item details panel */}
              {selectedItem && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-xs text-green-800 mb-2 font-medium flex items-center gap-2">
                    <span>✓ Selected Item Details:</span>
                    <span className="px-2 py-0.5 bg-green-200 rounded text-xs font-semibold">
                      {selectedItem.type === "spare" ? "SPARE" : "TOOL"}
                    </span>
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="col-span-2">
                      <span className="font-semibold text-gray-600">
                        Description:
                      </span>
                      <span className="ml-2 text-gray-700">
                        {selectedItem.description || "--"}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">
                        Category:
                      </span>
                      <span className="ml-2 text-gray-700">
                        {selectedItem.category || "--"}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">
                        IN Part No.:
                      </span>
                      <span className="ml-2 text-gray-700 font-mono text-xs">
                        {selectedItem.indian_pattern || "--"}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">
                        Denos:
                      </span>
                      <span className="ml-2 text-gray-700">
                        {selectedItem.denos || "--"}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-semibold text-gray-600">
                        Equipment/System:
                      </span>
                      <span className="ml-2 text-gray-700">
                        {selectedItem.equipment_system || "--"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quantity Demanded */}
            <div>
              <Label className="mb-2 block">
                Quantity Demanded <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    quantity: e.target.value,
                  }))
                }
                placeholder="Enter quantity"
                min="1"
              />
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleNext}
                disabled={!selectedItem || !formData.quantity}
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded mb-4">
              <p>
                <strong>Item:</strong> {selectedItem?.description}
              </p>
              <p>
                <strong>Category:</strong> {selectedItem?.category}
              </p>
              <p>
                <strong>Quantity:</strong> {formData.quantity}
              </p>
            </div>

            {/* Internal Demand No. - Always shown */}
            <div className="flex gap-4 w-full">
              <div className="w-full">
                <Label htmlFor="internal_demand_no" className="ms-2 mb-2 mt-4">
                  Internal Demand No. <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  id="internal_demand_no"
                  value={formData.internal_demand_no}
                  placeholder="Internal Demand No."
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      internal_demand_no: e.target.value.toUpperCase(),
                    }))
                  }
                />
              </div>
              <div className="w-full mt-3">
                <FormattedDatePicker
                  label="Internal Demand Date"
                  value={formData.internal_demand_date}
                  onChange={(date) =>
                    setFormData((prev) => ({
                      ...prev,
                      internal_demand_date: date,
                    }))
                  }
                />
              </div>
            </div>

            {/* Requisition No. - Shows only if Internal Demand No. and Date are filled */}
            {formData.internal_demand_no && formData.internal_demand_date && (
              <div className="flex gap-4 w-full">
                <div className="w-full">
                  <Label htmlFor="requisition_no" className="ms-2 mb-2 mt-5">
                    Requisition No.
                  </Label>
                  <Input
                    type="text"
                    id="requisition_no"
                    value={formData.requisition_no}
                    placeholder="Requisition No."
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        requisition_no: e.target.value.toUpperCase(),
                      }))
                    }
                  />
                </div>
                <div className="w-full mt-4">
                  <FormattedDatePicker
                    label="Requisition Date"
                    value={formData.requisition_date}
                    onChange={(date) =>
                      setFormData((prev) => ({
                        ...prev,
                        requisition_date: date,
                      }))
                    }
                  />
                </div>
              </div>
            )}

            {/* MO Demand No. - Shows only if Requisition No. and Date are filled */}
            {formData.requisition_no && formData.requisition_date && (
              <div className="flex gap-4 w-full">
                <div className="w-full">
                  <Label htmlFor="mo_demand_no" className="ms-2 mb-2 mt-7">
                    MO Demand No.
                  </Label>
                  <Input
                    type="text"
                    id="mo_demand_no"
                    value={formData.mo_demand_no}
                    placeholder="MO Demand No."
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        mo_demand_no: e.target.value.toUpperCase(),
                      }))
                    }
                  />
                </div>
                <div className="w-full mt-6">
                  <FormattedDatePicker
                    label="MO Demand Date"
                    value={formData.mo_demand_date}
                    onChange={(date) =>
                      setFormData((prev) => ({ ...prev, mo_demand_date: date }))
                    }
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between gap-4 mt-6">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <div className="flex gap-4">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <SpinnerButton
                  loading={isLoading}
                  disabled={isLoading || !formData.internal_demand_no}
                  onClick={handleSubmit}
                >
                  Submit
                </SpinnerButton>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddPTSDemand;