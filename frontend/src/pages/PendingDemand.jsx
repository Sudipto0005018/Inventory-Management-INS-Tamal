// import { useContext, useEffect, useMemo, useState } from "react";
// import { FaChevronRight, FaMagnifyingGlass } from "react-icons/fa6";
// import { IoMdRefresh } from "react-icons/io";
// import ComboBox from "../components/ComboBox";

// import { Input } from "../components/ui/input";
// import { Button } from "../components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogTitle,
// } from "../components/ui/dialog";
// import { Label } from "../components/ui/label";
// import { Calendar } from "../components/ui/calendar";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "../components/ui/popover";
// import { MultiSelect } from "../components/ui/multi-select";

// import { Context } from "../utils/Context";
// import apiService from "../utils/apiService";
// import PaginationTable from "../components/PaginationTableTwo";
// import SpinnerButton from "../components/ui/spinner-button";
// import toaster from "../utils/toaster";
// import { ChevronDownIcon } from "lucide-react";
// import {
//   formatDate,
//   getTimeDate,
//   getFormatedDate,
// } from "../utils/helperFunctions";
// import Spinner from "../components/Spinner";
// import { useNavigate } from "react-router";

// const PendingDemand = () => {
//   const { config, user, officer } = useContext(Context);
//   const navigate = useNavigate();

//   const columns = useMemo(() => [
//     {
//       key: "description",
//       header: "Item Description",
//       width: "max-w-[100px] px-0",
//     },
//     {
//       key: "indian_pattern",
//       header: (
//         <p>
//           <i>IN</i> Part No.
//         </p>
//       ),
//       width: "max-w-[100px] px-0",
//     },
//     { key: "category", header: "Category", width: "max-w-[20px] px-0" },
//     { key: "denos", header: "Denos.", width: "max-w-[20px] px-0" },
//     {
//       key: "survey_voucher_no",
//       header: "Survey Voucher No.",
//       width: "max-w-[60px] px-0",
//     },
//     {
//       key: "survey_qty",
//       header: "Surveyed Qty / Utilised Qty",
//       width: "max-w-[28px] px-0",
//     },
//     {
//       key: "survey_date",
//       header: "Surveyed Date / Utilised Date",
//       width: "max-w-[35px] px-0",
//     },
//     { key: "remarks", header: "Remarks", width: "max-w-[45px]" },
//     ...(user.role != "user"
//       ? [{ key: "processed", header: "Proceed", width: "max-w-[25px] px-0" }]
//       : []),
//     ...(user.role === "officer"
//       ? [{ key: "rollback", header: "Rollback", width: "max-w-[45px] px-0" }]
//       : []),
//   ]);

//   const options = [
//     {
//       value: "description",
//       label: "Item Description",
//       width: "min-w-[40px]",
//     },
//     {
//       value: "indian_pattern",
//       label: (
//         <span>
//           <i>IN</i> Part No.
//         </span>
//       ),
//       width: "min-w-[40px]",
//     },
//     { value: "category", label: "Category", width: "min-w-[40px]" },
//     { value: "denos", label: "Denos.", width: "min-w-[40px]" },
//     {
//       value: "survey_voucher_no",
//       label: "Survey Voucher No.",
//       width: "min-w-[40px]",
//     },
//     {
//       value: "survey_date",
//       label: "Surveyed Date / Utilised Date",
//       width: "min-w-[40px]",
//     },
//     { value: "remarks_survey", label: "Remarks" },
//   ];

//   //demand rollback states
//   const [rollbackDialog, setRollbackDialog] = useState(false);
//   const [rollbackChoice, setRollbackChoice] = useState("yes");
//   const [rollbackRow, setRollbackRow] = useState(null);
//   const [rollbackItemDesc, setRollbackItemDesc] = useState("");

//   //add demand states
//   const [addDemandItems, setAddDemandItems] = useState([]);
//   const [selectedDemandItem, setSelectedDemandItem] = useState(null);
//   const [demandQty, setDemandQty] = useState("");
//   // Add this with your other state declarations
//   const [manualDemandDate, setManualDemandDate] = useState(new Date());
//   // Add a separate state for add demand calendar
//   const [isAddDemandCalendarOpen, setIsAddDemandCalendarOpen] = useState(false);

//   const [selectedValues, setSelectedValues] = useState([]);
//   const [tableData, setTableData] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [fetchedData, setFetchedData] = useState({
//     items: [],
//     totalItems: 0,
//     totalPages: 1,
//     currentPage: 1,
//   });
//   const [isLoading, setIsLoading] = useState({
//     table: false,
//     search: false,
//     submit: false,
//     addDemand: false,
//   });
//   const [actualSearch, setActualSearch] = useState("");
//   const [inputs, setInputs] = useState({
//     search: "",
//     demand_no: "",
//     demand_date: new Date(),
//     remarks: "",
//   });
//   const [isOpen, setIsOpen] = useState({
//     demand: false,
//     demand_date: false,
//     addDemand: false,
//     addSpare: false,
//     addTool: false,
//   });
//   const [selectedRow, setSelectedRow] = useState({});

//   //add demand states
//   const [itemSearchTerm, setItemSearchTerm] = useState("");
//   const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
//   const [isSearchingItems, setIsSearchingItems] = useState(false);
//   const [filteredItems, setFilteredItems] = useState([]);

//   // Add these with your other state declarations
//   const [initialItems, setInitialItems] = useState([]);
//   const [initialItemsPage, setInitialItemsPage] = useState(1);
//   const [hasMoreInitial, setHasMoreInitial] = useState(true);
//   const [isLoadingInitial, setIsLoadingInitial] = useState(false);

//   const fetchInitialItems = async (page = 1) => {
//     if (isLoadingInitial) return;

//     setIsLoadingInitial(true);
//     try {
//       const response = await apiService.get("/demand/items", {
//         params: { page, limit: 200 },
//       });

//       if (page === 1) {
//         setInitialItems(response.data.items || []);
//       } else {
//         setInitialItems((prev) => [...prev, ...(response.data.items || [])]);
//       }

//       setHasMoreInitial(response.data.currentPage < response.data.totalPages);
//       setInitialItemsPage(page);
//     } catch (error) {
//       console.error("Error fetching initial items:", error);
//       toaster("error", "Failed to load items");
//     } finally {
//       setIsLoadingInitial(false);
//     }
//   };

//   const searchDemandItems = async (searchTerm) => {
//     if (!searchTerm.trim()) {
//       setFilteredItems([]);
//       return;
//     }

//     setIsSearchingItems(true);
//     try {
//       const response = await apiService.get("/demand/items", {
//         params: { search: searchTerm },
//       });
//       setFilteredItems(response.data.items || []);
//     } catch (error) {
//       console.error("Error searching items:", error);
//       toaster("error", "Failed to search items");
//       setFilteredItems([]);
//     } finally {
//       setIsSearchingItems(false);
//     }
//   };

//   useEffect(() => {
//     if (isOpen.addDemand && initialItems.length === 0) {
//       fetchInitialItems(1);
//     }
//   }, [isOpen.addDemand]);

//   useEffect(() => {
//     const debounceTimer = setTimeout(() => {
//       if (isItemDropdownOpen) {
//         searchDemandItems(itemSearchTerm);
//       }
//     }, 300);

//     return () => clearTimeout(debounceTimer);
//   }, [itemSearchTerm, isItemDropdownOpen]);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (isItemDropdownOpen && !event.target.closest(".demand-combobox")) {
//         setIsItemDropdownOpen(false);
//         setItemSearchTerm("");
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [isItemDropdownOpen]);

//   const handleRollback = (row) => {
//     setRollbackRow(row);
//     setRollbackItemDesc(row.description);
//     setRollbackChoice("yes");
//     setRollbackDialog(true);
//   };

//   const confirmRollback = async () => {
//     if (rollbackChoice !== "yes") {
//       setRollbackDialog(false);
//       return;
//     }

//     try {
//       // Case 1️⃣ : Manual Withdrawl (C / LP → Demand)
//       if (rollbackRow?.transaction_id?.startsWith("PI-")) {
//         await apiService.post("/survey/reverse", {
//           survey_id: rollbackRow.id,
//         });
//       }
//       // Case 2️⃣ : Survey → Demand (Pending Survey Flow)
//       else {
//         await apiService.post("/demand/reverse", {
//           demand_id: rollbackRow.id,
//         });
//       }

//       toaster("success", "Rollback successful");

//       setFetchedData((prev) => ({
//         ...prev,
//         items: prev.items.filter((item) => item.id !== rollbackRow.id),
//       }));
//     } catch (error) {
//       toaster("error", error.response?.data?.message || "Rollback failed");
//     } finally {
//       setRollbackDialog(false);
//     }
//   };

//   const fetchDemandItems = async () => {
//     try {
//       const response = await apiService.get("/demand/items");
//       setAddDemandItems(response.data.items || []);
//     } catch (error) {
//       console.error("Error fetching demand items:", error);
//       toaster("error", "Failed to fetch items");
//     }
//   };

//   const fetchdata = async (page = currentPage, search = inputs.search) => {
//     console.log(selectedValues);

//     try {
//       setIsLoading((prev) => ({ ...prev, table: true }));
//       const response = await apiService.get("/demand", {
//         params: {
//           page,
//           search,
//           cols: selectedValues.join(","),
//           // limit: config.row_per_page,
//           limit: 2000,
//         },
//       });

//       setFetchedData(response.data);
//     } catch (error) {
//       console.log(error);
//       setFetchedData({
//         items: [],
//         totalItems: 0,
//         totalPages: 1,
//         currentPage: 1,
//       });
//     } finally {
//       setIsLoading((prev) => ({ ...prev, table: false }));
//     }
//   };

//   const handleSearch = async (e) => {
//     const searchTerm = inputs.search.trim();
//     if (searchTerm === actualSearch) {
//       return;
//     } else {
//       setActualSearch(searchTerm);
//     }
//     setIsLoading((prev) => ({ ...prev, search: true }));
//     await fetchdata();
//     setIsLoading((prev) => ({ ...prev, search: false }));
//   };

//   const handleRefresh = () => {
//     setInputs((prev) => ({ ...prev, search: "" }));
//     setSelectedValues([]);
//     setCurrentPage(1);
//     setActualSearch("");
//     fetchdata(1, "");
//   };

//   const handleProceed = async (row) => {
//     setSelectedRow(row);
//     setIsOpen((prev) => ({ ...prev, demand: true }));
//   };

//   const handleDemandSubmit = async () => {
//     try {
//       setIsLoading((prev) => ({ ...prev, submit: true }));
//       const response = await apiService.post("/demand/create-pending-issue", {
//         id: selectedRow.id,
//         demand_no: inputs.demand_no,
//         demand_date: formatDate(inputs.demand_date),
//         remarks: inputs.remarks,
//       });
//       toaster("success", response.message);
//       setIsOpen((prev) => ({ ...prev, demand: false }));
//       fetchdata();
//     } catch (error) {
//       console.log(error);
//       toaster(
//         "error",
//         error.response?.data?.message || "Error submitting demand",
//       );
//     } finally {
//       setIsLoading((prev) => ({ ...prev, submit: false }));
//     }
//   };

//   const resetAddDemandDialog = () => {
//     setAddDemandItems([]);
//     setSelectedDemandItem(null);
//     setDemandQty("");
//   };

//   useEffect(() => {
//     if (isOpen.addDemand) {
//       fetchDemandItems();
//     }
//   }, [isOpen.addDemand]);

//   useEffect(() => {
//     fetchdata();
//   }, [currentPage]);

//   useEffect(() => {
//     const t = fetchedData.items.map((row) => ({
//       ...row,
//       survey_date: row.survey_date ? getFormatedDate(row.survey_date) : "---",
//       created_at: getTimeDate(row.created_at),
//       processed: (
//         <Button
//           size="icon"
//           className="bg-white text-black shadow-md border hover:bg-gray-100"
//           onClick={() => handleProceed(row)}
//         >
//           <FaChevronRight />
//         </Button>
//       ),
//       rollback:
//         user.role === "officer" ? (
//           <Button
//             variant="destructive"
//             className="bg-red-600 text-white hover:bg-red-700"
//             size="sm"
//             onClick={() => handleRollback(row)}
//           >
//             Rollback
//           </Button>
//         ) : null,
//     }));
//     setTableData(t);
//   }, [fetchedData]);

//   if (isLoading.table) {
//     return <Spinner />;
//   }

//   return (
//     <div className="px-2 w-full">
//       <div className="mb-2">
//         <Input
//           type="text"
//           placeholder="Search Demand..."
//           className="bg-white "
//           value={inputs.search}
//           onChange={(e) =>
//             setInputs((prev) => ({ ...prev, search: e.target.value }))
//           }
//           onKeyDown={(e) => {
//             if (e.key === "Enter") {
//               handleSearch();
//             }
//           }}
//         />
//       </div>
//       <div className="flex items-center mb-4 gap-4 w-full">
//         <div className="w-full">
//           <MultiSelect
//             className="bg-white hover:bg-blue-50"
//             options={options}
//             placeholder="Select Fields"
//             onValueChange={setSelectedValues}
//             defaultValue={selectedValues}
//             singleLine
//             maxCount={6}
//           />
//         </div>

//         <Button
//           className="cursor-pointer hover:bg-primary/85 flex items-center gap-1"
//           onClick={() => setIsOpen((prev) => ({ ...prev, addDemand: true }))}
//         >
//           + Add Demand
//         </Button>
//         <SpinnerButton
//           className="cursor-pointer hover:bg-primary/85"
//           onClick={handleSearch}
//           loading={isLoading.search}
//           disabled={isLoading.search}
//           loadingText="Searching..."
//         >
//           <FaMagnifyingGlass className="size-3.5" />
//           Search
//         </SpinnerButton>
//         <Button
//           variant="outline"
//           className="cursor-pointer flex items-center gap-1 bg-white
//             hover:bg-gray-200
//             hover:scale-105
//             transition-all duration-200"
//           onClick={handleRefresh}
//           title="Reset Search"
//         >
//           <IoMdRefresh
//             className="size-7 font-bold
//               hover:rotate-180
//               transition-transform duration-300"
//             style={{
//               color: "#109240",
//               borderRadius: "6px",
//               cursor: "pointer",
//             }}
//           />
//           <span className="text-md font-extrabold text-green-700"></span>
//         </Button>
//       </div>
//       <div className="min-w-0 overflow-x-auto">
//         <PaginationTable
//           data={tableData}
//           columns={columns}
//           currentPage={fetchedData.currentPage || 1}
//           pageSize={fetchedData.items?.length || 10}
//           totalPages={fetchedData.totalPages || 1}
//           onPageChange={setCurrentPage}
//           className="h-[calc(95vh-210px)] w-[calc(100vw-35px)]"
//         />
//       </div>

//       <Dialog
//         open={isOpen.demand}
//         onOpenChange={(set) =>
//           setIsOpen((prev) => {
//             if (!set) {
//               setInputs((prev) => ({
//                 ...prev,
//                 demand_no: "",
//               }));
//             }
//             return { ...prev, demand: set };
//           })
//         }
//       >
//         <DialogContent
//           onInteractOutside={(e) => {
//             e.preventDefault();
//           }}
//           onPointerDownOutside={(e) => {
//             e.preventDefault();
//           }}
//           onCloseAutoFocus={() => {
//             setInputs((prev) => ({
//               ...prev,
//               demand_no: "",
//               demand_date: new Date(),
//               remarks: "",
//             }));
//           }}
//         >
//           <div
//             className="sticky top-0 z-10 bg-background
//                 grid grid-cols-2 items-center
//                 pb-2 border-b"
//           >
//             <DialogTitle className="capitalize">Demand Details</DialogTitle>
//             <button
//               type="button"
//               onClick={() => setIsOpen((prev) => ({ ...prev, demand: false }))}
//               className="justify-self-end rounded-md p-1 transition"
//             >
//               ✕
//             </button>
//           </div>
//           <div className="flex items-start gap-2 mb-3">
//             <span className="font-semibold text-gray-700">
//               Item Description :
//             </span>

//             <span className="text-gray-900 font-medium ml-1">
//               {selectedRow?.description || "-"}
//             </span>
//           </div>
//           <DialogDescription className="hidden" />
//           <div>
//             <Label htmlFor="demand_no" className="mb-2 gap-1">
//               Surveyed / Utilised Qty
//             </Label>
//             <Input
//               id="survey_qty"
//               type="text"
//               placeholder="Enter Demand No."
//               name="survey_qty"
//               value={selectedRow?.survey_qty}
//               onChange={(e) =>
//                 setInputs((prev) => ({ ...prev, survey_qty: e.target.value }))
//               }
//             />
//             <Label htmlFor="demand_no" className="mb-2 mt-4 gap-1">
//               Demand No.<span className="text-red-500">*</span>
//             </Label>
//             <Input
//               id="demand_no"
//               type="text"
//               placeholder="Enter Demand No."
//               name="demand_no"
//               value={inputs.demand_no}
//               onChange={(e) =>
//                 setInputs((prev) => ({
//                   ...prev,
//                   demand_no: e.target.value.toUpperCase(),
//                 }))
//               }
//             />

//             <Label htmlFor="demand_date" className="mb-2 mt-4 gap-1">
//               Demand Date<span className="text-red-500">*</span>
//             </Label>
//             <Popover
//               open={isOpen.demand_date}
//               onOpenChange={(set) => {
//                 setIsOpen((prev) => ({ ...prev, demand_date: set }));
//               }}
//             >
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="outline"
//                   id="demand_date"
//                   className="w-full justify-between font-normal"
//                 >
//                   {inputs.demand_date
//                     ? getFormatedDate(inputs.demand_date)
//                     : "Select date"}
//                   <ChevronDownIcon />
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent
//                 className="w-auto overflow-hidden p-0"
//                 align="start"
//               >
//                 <Calendar
//                   mode="single"
//                   selected={inputs.demand_date}
//                   captionLayout="dropdown"
//                   onSelect={(date) => {
//                     setInputs((prev) => ({
//                       ...prev,
//                       demand_date: date,
//                     }));
//                     setIsOpen((prev) => ({
//                       ...prev,
//                       demand_date: false,
//                     }));
//                   }}
//                 />
//               </PopoverContent>
//             </Popover>
//             <div>
//               <Label className="mb-1 mt-4">Remarks</Label>
//               <Input
//                 className="mt-2"
//                 placeholder="Enter remarks"
//                 value={inputs.remarks}
//                 onChange={(e) =>
//                   setInputs((prev) => ({
//                     ...prev,
//                     remarks: e.target.value.toUpperCase(),
//                   }))
//                 }
//               />
//             </div>
//             <div>
//               <div className="flex items-center mt-4 gap-4 justify-end">
//                 <Button
//                   variant="destructive"
//                   onClick={() =>
//                     setIsOpen((prev) => ({ ...prev, demand: false }))
//                   }
//                 >
//                   Cancel
//                 </Button>
//                 <SpinnerButton
//                   loading={isLoading.submit}
//                   disabled={isLoading.submit || !inputs.demand_no}
//                   loadingText="Submitting..."
//                   className="text-white hover:bg-primary/85 cursor-pointer"
//                   onClick={handleDemandSubmit}
//                 >
//                   Submit
//                 </SpinnerButton>
//               </div>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>

//       <Dialog open={rollbackDialog} onOpenChange={setRollbackDialog}>
//         <DialogContent className="w-[420px] p-6">
//           <DialogTitle>
//             Rollback:{" "}
//             <span className="text-sm">{rollbackItemDesc || "Item"}</span>
//           </DialogTitle>

//           <div className="mt-4">
//             <p className="mb-3 text-sm text-gray-700">
//               Are you sure you want to rollback this transaction?
//             </p>

//             <div className="flex gap-6 mt-2">
//               <label className="flex items-center gap-2">
//                 <input
//                   type="radio"
//                   name="rollbackChoice"
//                   value="yes"
//                   checked={rollbackChoice === "yes"}
//                   onChange={() => setRollbackChoice("yes")}
//                 />
//                 Yes
//               </label>

//               <label className="flex items-center gap-2">
//                 <input
//                   type="radio"
//                   name="rollbackChoice"
//                   value="no"
//                   checked={rollbackChoice === "no"}
//                   onChange={() => setRollbackChoice("no")}
//                 />
//                 No
//               </label>
//             </div>
//           </div>

//           <div className="flex justify-end gap-3 mt-6">
//             <Button
//               className="bg-red-600 text-white hover:bg-red-700"
//               onClick={() => setRollbackDialog(false)}
//             >
//               Cancel
//             </Button>

//             <Button
//               className="text-white hover:bg-primary/85 cursor-pointer"
//               onClick={confirmRollback}
//             >
//               Confirm
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>

//       {/* Add Demand Dialog - Modified */}
//       {/* Add Demand Dialog - With Search and 200 Initial Items */}
//       <Dialog
//         open={isOpen.addDemand}
//         onOpenChange={(open) => {
//           if (!open) {
//             resetAddDemandDialog();
//             setItemSearchTerm("");
//             setFilteredItems([]);
//             setIsItemDropdownOpen(false);
//             setManualDemandDate(new Date());
//           }
//           setIsOpen((prev) => ({ ...prev, addDemand: open }));
//         }}
//       >
//         <DialogContent
//           showCloseButton
//           onPointerDownOutside={(e) => {
//             e.preventDefault();
//           }}
//           className="max-w-lg"
//         >
//           <DialogTitle>Add Demand Item</DialogTitle>

//           {/* Select Item - Searchable Combobox */}
//           <div className="mt-4">
//             <Label>
//               Select Item <span className="text-red-500">*</span>
//             </Label>

//             <div className="demand-combobox relative mt-1">
//               {/* Dropdown button */}
//               <button
//                 type="button"
//                 onClick={() => setIsItemDropdownOpen(!isItemDropdownOpen)}
//                 className="w-full p-2 border rounded-md bg-white text-left flex justify-between items-center hover:bg-gray-50"
//               >
//                 <span
//                   className={
//                     selectedDemandItem ? "text-gray-900" : "text-gray-400"
//                   }
//                 >
//                   {selectedDemandItem
//                     ? `${selectedDemandItem.description} (${selectedDemandItem.category}) - ${selectedDemandItem.type === "spare" ? "SPARE" : "TOOL"}`
//                     : "Search and Select Items..."}
//                 </span>
//                 <ChevronDownIcon
//                   className={`size-4 transition-transform ${isItemDropdownOpen ? "rotate-180" : ""}`}
//                 />
//               </button>

//               {/* Dropdown with search */}
//               {isItemDropdownOpen && (
//                 <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
//                   {/* Search input inside dropdown */}
//                   <div className="p-2 border-b">
//                     <div className="relative">
//                       <input
//                         type="text"
//                         placeholder="Search by description, part no., item code, or equipment..."
//                         className="w-full p-2 pl-8 border rounded-md"
//                         value={itemSearchTerm}
//                         onChange={(e) => setItemSearchTerm(e.target.value)}
//                         autoFocus
//                       />
//                       <FaMagnifyingGlass className="absolute left-2 top-3 text-gray-400 size-4" />
//                       {itemSearchTerm && (
//                         <button
//                           onClick={() => setItemSearchTerm("")}
//                           className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
//                         >
//                           ✕
//                         </button>
//                       )}
//                     </div>
//                   </div>

//                   {/* Show search results or initial items */}
//                   <div className="max-h-60 overflow-y-auto">
//                     {/* Search mode */}
//                     {itemSearchTerm && (
//                       <>
//                         {isSearchingItems && (
//                           <div className="p-4 text-center text-gray-500">
//                             <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
//                             Searching...
//                           </div>
//                         )}

//                         {!isSearchingItems && (
//                           <>
//                             {filteredItems.length === 0 ? (
//                               <div className="p-4 text-center text-gray-500 text-sm">
//                                 No items found matching "{itemSearchTerm}"
//                               </div>
//                             ) : (
//                               <>
//                                 <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 border-b">
//                                   Search Results ({filteredItems.length})
//                                 </div>
//                                 {filteredItems.map((item) => (
//                                   <div
//                                     key={`${item.type}-${item.id}`}
//                                     className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
//                                     onClick={() => {
//                                       setSelectedDemandItem(item);
//                                       setIsItemDropdownOpen(false);
//                                       setItemSearchTerm("");
//                                       setFilteredItems([]);
//                                     }}
//                                   >
//                                     <div className="flex-1">
//                                       <div className="font-medium">
//                                         {item.description}
//                                         <span className="ml-2 text-xs text-gray-500">
//                                           ({item.category})
//                                         </span>
//                                       </div>
//                                       <div className="text-xs text-gray-500 mt-1 space-x-2">
//                                         <span className="font-semibold">
//                                           Type:
//                                         </span>
//                                         <span className="text-blue-600 font-semibold">
//                                           {item.type === "spare"
//                                             ? "SPARE"
//                                             : "TOOL"}
//                                         </span>
//                                         {item.indian_pattern && (
//                                           <>
//                                             <span className="mx-1">•</span>
//                                             <span className="font-semibold">
//                                               IN Part No.:
//                                             </span>
//                                             <span className="font-mono">
//                                               {item.indian_pattern}
//                                             </span>
//                                           </>
//                                         )}
//                                         {item.item_code && (
//                                           <>
//                                             <span className="mx-1">•</span>
//                                             <span className="font-semibold">
//                                               Item Code:
//                                             </span>
//                                             <span className="font-mono">
//                                               {item.item_code}
//                                             </span>
//                                           </>
//                                         )}
//                                       </div>
//                                       {item.equipment_system && (
//                                         <div className="text-xs text-gray-500 mt-1">
//                                           <span className="font-semibold">
//                                             Equipment/System:
//                                           </span>
//                                           <span className="ml-1">
//                                             {item.equipment_system}
//                                           </span>
//                                         </div>
//                                       )}
//                                     </div>
//                                   </div>
//                                 ))}
//                               </>
//                             )}
//                           </>
//                         )}
//                       </>
//                     )}

//                     {/* Initial items mode (no search) */}
//                     {!itemSearchTerm && (
//                       <>
//                         {initialItems.length === 0 && isLoadingInitial ? (
//                           <div className="p-4 text-center text-gray-500">
//                             <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
//                             Loading items...
//                           </div>
//                         ) : (
//                           <>
//                             <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 border-b sticky top-0">
//                               Popular Items (First {initialItems.length} of{" "}
//                               {initialItems.length}+)
//                             </div>
//                             {initialItems.map((item) => (
//                               <div
//                                 key={`${item.type}-${item.id}`}
//                                 className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
//                                 onClick={() => {
//                                   setSelectedDemandItem(item);
//                                   setIsItemDropdownOpen(false);
//                                   setItemSearchTerm("");
//                                 }}
//                               >
//                                 <div className="flex-1">
//                                   <div className="font-medium">
//                                     {item.description}
//                                     <span className="ml-2 text-xs text-gray-500">
//                                       ({item.category})
//                                     </span>
//                                   </div>
//                                   <div className="text-xs text-gray-500 mt-1 space-x-2">
//                                     <span className="font-semibold">Type:</span>
//                                     <span className="text-blue-600 font-semibold">
//                                       {item.type === "spare" ? "SPARE" : "TOOL"}
//                                     </span>
//                                     {item.indian_pattern && (
//                                       <>
//                                         <span className="mx-1">•</span>
//                                         <span className="font-semibold">
//                                           IN Part No.:
//                                         </span>
//                                         <span className="font-mono">
//                                           {item.indian_pattern}
//                                         </span>
//                                       </>
//                                     )}
//                                     {item.item_code && (
//                                       <>
//                                         <span className="mx-1">•</span>
//                                         <span className="font-semibold">
//                                           Item Code:
//                                         </span>
//                                         <span className="font-mono">
//                                           {item.item_code}
//                                         </span>
//                                       </>
//                                     )}
//                                   </div>
//                                   {item.equipment_system && (
//                                     <div className="text-xs text-gray-500 mt-1">
//                                       <span className="font-semibold">
//                                         Equipment/System:
//                                       </span>
//                                       <span className="ml-1">
//                                         {item.equipment_system}
//                                       </span>
//                                     </div>
//                                   )}
//                                 </div>
//                               </div>
//                             ))}

//                             {hasMoreInitial && (
//                               <div className="p-2 text-center">
//                                 <Button
//                                   size="sm"
//                                   variant="outline"
//                                   onClick={() =>
//                                     fetchInitialItems(initialItemsPage + 1)
//                                   }
//                                   disabled={isLoadingInitial}
//                                   className="text-xs"
//                                 >
//                                   {isLoadingInitial
//                                     ? "Loading..."
//                                     : "Load More (200 more)"}
//                                 </Button>
//                               </div>
//                             )}
//                           </>
//                         )}
//                       </>
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Selected item details panel */}
//             {selectedDemandItem && (
//               <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
//                 <p className="text-xs text-green-800 mb-2 font-medium flex items-center gap-2">
//                   <span>✓ Selected Item Details:</span>
//                   <span className="px-2 py-0.5 bg-green-200 rounded text-xs font-semibold">
//                     {selectedDemandItem.type === "spare" ? "SPARE" : "TOOL"}
//                   </span>
//                 </p>
//                 <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
//                   <div className="col-span-2">
//                     <span className="font-semibold text-gray-600">
//                       Description:
//                     </span>
//                     <span className="ml-2 text-gray-700">
//                       {selectedDemandItem.description || "--"}
//                     </span>
//                   </div>
//                   <div>
//                     <span className="font-semibold text-gray-600">
//                       Category:
//                     </span>
//                     <span className="ml-2 text-gray-700">
//                       {selectedDemandItem.category || "--"}
//                     </span>
//                   </div>
//                   <div>
//                     <span className="font-semibold text-gray-600">
//                       IN Part No.:
//                     </span>
//                     <span className="ml-2 text-gray-700 font-mono text-xs">
//                       {selectedDemandItem.indian_pattern || "--"}
//                     </span>
//                   </div>
//                   <div>
//                     <span className="font-semibold text-gray-600">
//                       Item Code:
//                     </span>
//                     <span className="ml-2 text-gray-700 font-mono text-xs">
//                       {selectedDemandItem.item_code || "--"}
//                     </span>
//                   </div>
//                   <div className="col-span-2">
//                     <span className="font-semibold text-gray-600">
//                       Equipment/System:
//                     </span>
//                     <span className="ml-2 text-gray-700">
//                       {selectedDemandItem.equipment_system || "--"}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Qty to be demanded */}
//           <div className="mt-4">
//             <Label>
//               Qty to be demanded <span className="text-red-500">*</span>
//             </Label>
//             <Input
//               type="number"
//               min="1"
//               placeholder="Enter Demand Qty"
//               value={demandQty}
//               onChange={(e) => setDemandQty(e.target.value)}
//               className="mt-1"
//             />
//           </div>

//           <div>
//             <Label htmlFor="demand_date" className="mb-2 mt-6 gap-1">
//               To be Demanded Date<span className="text-red-500">*</span>
//             </Label>
//             <Popover
//               open={isAddDemandCalendarOpen}
//               onOpenChange={setIsAddDemandCalendarOpen}
//             >
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="outline"
//                   id="demand_date"
//                   className="w-full justify-between font-normal"
//                 >
//                   {manualDemandDate
//                     ? getFormatedDate(manualDemandDate)
//                     : "Select date"}
//                   <ChevronDownIcon />
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent
//                 className="w-auto overflow-hidden p-0"
//                 align="start"
//               >
//                 <Calendar
//                   mode="single"
//                   selected={manualDemandDate}
//                   captionLayout="dropdown"
//                   onSelect={(date) => {
//                     setManualDemandDate(date);
//                     setIsAddDemandCalendarOpen(false);
//                   }}
//                 />
//               </PopoverContent>
//             </Popover>
//           </div>

//           {/* Action Buttons */}
//           <div className="flex justify-end gap-3 mt-6">
//             <Button
//               variant="destructive"
//               onClick={() => {
//                 resetAddDemandDialog();
//                 setIsOpen((prev) => ({ ...prev, addDemand: false }));
//                 setItemSearchTerm("");
//                 setSelectedDemandItem(null);
//                 setIsItemDropdownOpen(false);
//                 setFilteredItems([]);
//               }}
//             >
//               Cancel
//             </Button>

//             <Button
//               className="text-white"
//               onClick={async () => {
//                 if (!selectedDemandItem) {
//                   return toaster("error", "Please select an item");
//                 }

//                 if (!demandQty || Number(demandQty) <= 0) {
//                   return toaster("error", "Quantity must be greater than 0");
//                 }

//                 if (!manualDemandDate) {
//                   return toaster("error", "Please select a demand date");
//                 }

//                 setIsLoading((prev) => ({ ...prev, addDemand: true }));

//                 try {
//                   await apiService.post("/demand/manual-add", {
//                     spare_id:
//                       selectedDemandItem.type === "spare"
//                         ? selectedDemandItem.id
//                         : null,
//                     tool_id:
//                       selectedDemandItem.type === "tool"
//                         ? selectedDemandItem.id
//                         : null,
//                     survey_qty: Number(demandQty),
//                     survey_date: formatDate(manualDemandDate),
//                   });

//                   toaster("success", "Demand item added successfully");

//                   resetAddDemandDialog();
//                   setIsOpen((prev) => ({ ...prev, addDemand: false }));
//                   setItemSearchTerm("");
//                   setSelectedDemandItem(null);
//                   setIsItemDropdownOpen(false);
//                   setFilteredItems([]);
//                   setManualDemandDate(new Date());
//                   fetchdata();
//                 } catch (error) {
//                   console.error("Error adding demand item:", error);
//                   toaster(
//                     "error",
//                     error.response?.data?.message ||
//                       "Failed to add demand item",
//                   );
//                 } finally {
//                   setIsLoading((prev) => ({ ...prev, addDemand: false }));
//                 }
//               }}
//               disabled={isLoading.addDemand}
//             >
//               {isLoading.addDemand ? "Submitting..." : "Submit"}
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default PendingDemand;


import { useContext, useEffect, useMemo, useState } from "react";
import { FaChevronRight, FaMagnifyingGlass } from "react-icons/fa6";
import { IoMdRefresh } from "react-icons/io";
import ComboBox from "../components/ComboBox";

import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { MultiSelect } from "../components/ui/multi-select";

import { Context } from "../utils/Context";
import apiService from "../utils/apiService";
import PaginationTable from "../components/PaginationTableTwo";
import SpinnerButton from "../components/ui/spinner-button";
import toaster from "../utils/toaster";
import { ChevronDownIcon } from "lucide-react";
import {
  formatDate,
  getTimeDate,
  getFormatedDate,
} from "../utils/helperFunctions";
import Spinner from "../components/Spinner";
import { useNavigate } from "react-router";

const PendingDemand = () => {
  const { config, user, officer } = useContext(Context);
  const navigate = useNavigate();

  const columns = useMemo(() => [
    {
      key: "description",
      header: "Item Description",
      width: "max-w-[100px] px-0",
    },
    {
      key: "indian_pattern",
      header: (
        <p>
          <i>IN</i> Part No.
        </p>
      ),
      width: "max-w-[100px] px-0",
    },
    { key: "category", header: "Category", width: "max-w-[20px] px-0" },
    { key: "denos", header: "Denos.", width: "max-w-[20px] px-0" },
    {
      key: "survey_voucher_no",
      header: "Survey Voucher No.",
      width: "max-w-[60px] px-0",
    },
    {
      key: "survey_qty",
      header: "Surveyed Qty / Utilised Qty",
      width: "max-w-[28px] px-0",
    },
    {
      key: "survey_date",
      header: "Surveyed Date / Utilised Date",
      width: "max-w-[35px] px-0",
    },
    { key: "remarks", header: "Remarks", width: "max-w-[45px]" },
    ...(user.role != "user"
      ? [{ key: "processed", header: "Proceed", width: "max-w-[25px] px-0" }]
      : []),
    ...(user.role === "officer"
      ? [{ key: "rollback", header: "Rollback", width: "max-w-[45px] px-0" }]
      : []),
  ]);

  const options = [
    {
      value: "description",
      label: "Item Description",
      width: "min-w-[40px]",
    },
    {
      value: "indian_pattern",
      label: (
        <span>
          <i>IN</i> Part No.
        </span>
      ),
      width: "min-w-[40px]",
    },
    { value: "category", label: "Category", width: "min-w-[40px]" },
    { value: "denos", label: "Denos.", width: "min-w-[40px]" },
    {
      value: "survey_voucher_no",
      label: "Survey Voucher No.",
      width: "min-w-[40px]",
    },
    {
      value: "survey_date",
      label: "Surveyed Date / Utilised Date",
      width: "min-w-[40px]",
    },
    { value: "remarks_survey", label: "Remarks" },
  ];

  //demand rollback states
  const [rollbackDialog, setRollbackDialog] = useState(false);
  const [rollbackChoice, setRollbackChoice] = useState("yes");
  const [rollbackRow, setRollbackRow] = useState(null);
  const [rollbackItemDesc, setRollbackItemDesc] = useState("");

  //add demand states
  const [addDemandItems, setAddDemandItems] = useState([]);
  const [selectedDemandItem, setSelectedDemandItem] = useState(null);
  const [demandQty, setDemandQty] = useState("");
  const [manualDemandDate, setManualDemandDate] = useState(new Date());
  const [isAddDemandCalendarOpen, setIsAddDemandCalendarOpen] = useState(false);

  // Category validation state
  const [categoryError, setCategoryError] = useState("");

  const [selectedValues, setSelectedValues] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [fetchedData, setFetchedData] = useState({
    items: [],
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
  });
  const [isLoading, setIsLoading] = useState({
    table: false,
    search: false,
    submit: false,
    addDemand: false,
  });
  const [actualSearch, setActualSearch] = useState("");
  const [inputs, setInputs] = useState({
    search: "",
    demand_no: "",
    demand_date: new Date(),
    remarks: "",
  });
  const [isOpen, setIsOpen] = useState({
    demand: false,
    demand_date: false,
    addDemand: false,
    addSpare: false,
    addTool: false,
  });
  const [selectedRow, setSelectedRow] = useState({});

  //add demand states
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const [isSearchingItems, setIsSearchingItems] = useState(false);
  const [filteredItems, setFilteredItems] = useState([]);

  // Add these with your other state declarations
  const [initialItems, setInitialItems] = useState([]);
  const [initialItemsPage, setInitialItemsPage] = useState(1);
  const [hasMoreInitial, setHasMoreInitial] = useState(true);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);

  // Updated function to handle item selection with new validation rules
  const handleItemSelection = (item) => {
    const category = item.category?.toUpperCase();

    // New validation logic: Only C category allowed
    if (category === "P" || category === "R") {
      setCategoryError("Initiate Survey Procedure");
      toaster("error", "Initiate Survey Procedure");
      return false;
    } else if (category === "LP") {
      setCategoryError("Demand applicable for P/R/C category items");
      toaster("error", "Demand applicable for P/R/C category items");
      return false;
    } else if (category === "C") {
      setCategoryError("");
      setSelectedDemandItem(item);
      setIsItemDropdownOpen(false);
      setItemSearchTerm("");
      setFilteredItems([]);
      return true;
    } else {
      setCategoryError("Invalid category for demand");
      toaster("error", "Invalid category for demand");
      return false;
    }
  };

  const fetchInitialItems = async (page = 1) => {
    if (isLoadingInitial) return;

    setIsLoadingInitial(true);
    try {
      const response = await apiService.get("/demand/items", {
        params: { page, limit: 200 },
      });

      if (page === 1) {
        setInitialItems(response.data.items || []);
      } else {
        setInitialItems((prev) => [...prev, ...(response.data.items || [])]);
      }

      setHasMoreInitial(response.data.currentPage < response.data.totalPages);
      setInitialItemsPage(page);
    } catch (error) {
      console.error("Error fetching initial items:", error);
      toaster("error", "Failed to load items");
    } finally {
      setIsLoadingInitial(false);
    }
  };

  const searchDemandItems = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setFilteredItems([]);
      return;
    }

    setIsSearchingItems(true);
    try {
      const response = await apiService.get("/demand/items", {
        params: { search: searchTerm },
      });
      setFilteredItems(response.data.items || []);
    } catch (error) {
      console.error("Error searching items:", error);
      toaster("error", "Failed to search items");
      setFilteredItems([]);
    } finally {
      setIsSearchingItems(false);
    }
  };

  useEffect(() => {
    if (isOpen.addDemand && initialItems.length === 0) {
      fetchInitialItems(1);
    }
  }, [isOpen.addDemand]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (isItemDropdownOpen) {
        searchDemandItems(itemSearchTerm);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [itemSearchTerm, isItemDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isItemDropdownOpen && !event.target.closest(".demand-combobox")) {
        setIsItemDropdownOpen(false);
        setItemSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isItemDropdownOpen]);

  const handleRollback = (row) => {
    setRollbackRow(row);
    setRollbackItemDesc(row.description);
    setRollbackChoice("yes");
    setRollbackDialog(true);
  };

  const confirmRollback = async () => {
    if (rollbackChoice !== "yes") {
      setRollbackDialog(false);
      return;
    }

    try {
      // Case 1️⃣ : Manual Withdrawl (C / LP → Demand)
      if (rollbackRow?.transaction_id?.startsWith("PI-")) {
        await apiService.post("/survey/reverse", {
          survey_id: rollbackRow.id,
        });
      }
      // Case 2️⃣ : Survey → Demand (Pending Survey Flow)
      else {
        await apiService.post("/demand/reverse", {
          demand_id: rollbackRow.id,
        });
      }

      toaster("success", "Rollback successful");

      setFetchedData((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== rollbackRow.id),
      }));
    } catch (error) {
      toaster("error", error.response?.data?.message || "Rollback failed");
    } finally {
      setRollbackDialog(false);
    }
  };

  const fetchDemandItems = async () => {
    try {
      const response = await apiService.get("/demand/items");
      setAddDemandItems(response.data.items || []);
    } catch (error) {
      console.error("Error fetching demand items:", error);
      toaster("error", "Failed to fetch items");
    }
  };

  const fetchdata = async (page = currentPage, search = inputs.search) => {
    console.log(selectedValues);

    try {
      setIsLoading((prev) => ({ ...prev, table: true }));
      const response = await apiService.get("/demand", {
        params: {
          page,
          search,
          cols: selectedValues.join(","),
          // limit: config.row_per_page,
          limit: 2000,
        },
      });

      setFetchedData(response.data);
    } catch (error) {
      console.log(error);
      setFetchedData({
        items: [],
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, table: false }));
    }
  };

  const handleSearch = async (e) => {
    const searchTerm = inputs.search.trim();
    if (searchTerm === actualSearch) {
      return;
    } else {
      setActualSearch(searchTerm);
    }
    setIsLoading((prev) => ({ ...prev, search: true }));
    await fetchdata();
    setIsLoading((prev) => ({ ...prev, search: false }));
  };

  const handleRefresh = () => {
    setInputs((prev) => ({ ...prev, search: "" }));
    setSelectedValues([]);
    setCurrentPage(1);
    setActualSearch("");
    fetchdata(1, "");
  };

  const handleProceed = async (row) => {
    setSelectedRow(row);
    setIsOpen((prev) => ({ ...prev, demand: true }));
  };

  const handleDemandSubmit = async () => {
    try {
      setIsLoading((prev) => ({ ...prev, submit: true }));
      const response = await apiService.post("/demand/create-pending-issue", {
        id: selectedRow.id,
        demand_no: inputs.demand_no,
        demand_date: formatDate(inputs.demand_date),
        remarks: inputs.remarks,
      });
      toaster("success", response.message);
      setIsOpen((prev) => ({ ...prev, demand: false }));
      fetchdata();
    } catch (error) {
      console.log(error);
      toaster(
        "error",
        error.response?.data?.message || "Error submitting demand",
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, submit: false }));
    }
  };

  const resetAddDemandDialog = () => {
    setAddDemandItems([]);
    setSelectedDemandItem(null);
    setDemandQty("");
    setCategoryError("");
  };

  useEffect(() => {
    if (isOpen.addDemand) {
      fetchDemandItems();
    }
  }, [isOpen.addDemand]);

  useEffect(() => {
    fetchdata();
  }, [currentPage]);

  useEffect(() => {
    const t = fetchedData.items.map((row) => ({
      ...row,
      survey_date: row.survey_date ? getFormatedDate(row.survey_date) : "---",
      created_at: getTimeDate(row.created_at),
      processed: (
        <Button
          size="icon"
          className="bg-white text-black shadow-md border hover:bg-gray-100"
          onClick={() => handleProceed(row)}
        >
          <FaChevronRight />
        </Button>
      ),
      rollback:
        user.role === "officer" ? (
          <Button
            variant="destructive"
            className="bg-red-600 text-white hover:bg-red-700"
            size="sm"
            onClick={() => handleRollback(row)}
          >
            Rollback
          </Button>
        ) : null,
    }));
    setTableData(t);
  }, [fetchedData]);

  if (isLoading.table) {
    return <Spinner />;
  }

  return (
    <div className="px-2 w-full">
      <div className="mb-2">
        <Input
          type="text"
          placeholder="Search Demand..."
          className="bg-white "
          value={inputs.search}
          onChange={(e) =>
            setInputs((prev) => ({ ...prev, search: e.target.value }))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />
      </div>
      <div className="flex items-center mb-4 gap-4 w-full">
        <div className="w-full">
          <MultiSelect
            className="bg-white hover:bg-blue-50"
            options={options}
            placeholder="Select Fields"
            onValueChange={setSelectedValues}
            defaultValue={selectedValues}
            singleLine
            maxCount={6}
          />
        </div>

        <Button
          className="cursor-pointer hover:bg-primary/85 flex items-center gap-1"
          onClick={() => setIsOpen((prev) => ({ ...prev, addDemand: true }))}
        >
          + Add Demand
        </Button>
        <SpinnerButton
          className="cursor-pointer hover:bg-primary/85"
          onClick={handleSearch}
          loading={isLoading.search}
          disabled={isLoading.search}
          loadingText="Searching..."
        >
          <FaMagnifyingGlass className="size-3.5" />
          Search
        </SpinnerButton>
        <Button
          variant="outline"
          className="cursor-pointer flex items-center gap-1 bg-white
            hover:bg-gray-200 
            hover:scale-105 
            transition-all duration-200"
          onClick={handleRefresh}
          title="Reset Search"
        >
          <IoMdRefresh
            className="size-7 font-bold
              hover:rotate-180 
              transition-transform duration-300"
            style={{
              color: "#109240",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          />
          <span className="text-md font-extrabold text-green-700"></span>
        </Button>
      </div>
      <div className="min-w-0 overflow-x-auto">
        <PaginationTable
          data={tableData}
          columns={columns}
          currentPage={fetchedData.currentPage || 1}
          pageSize={fetchedData.items?.length || 10}
          totalPages={fetchedData.totalPages || 1}
          onPageChange={setCurrentPage}
          className="h-[calc(95vh-210px)] w-[calc(100vw-35px)]"
        />
      </div>

      <Dialog
        open={isOpen.demand}
        onOpenChange={(set) =>
          setIsOpen((prev) => {
            if (!set) {
              setInputs((prev) => ({
                ...prev,
                demand_no: "",
              }));
            }
            return { ...prev, demand: set };
          })
        }
      >
        <DialogContent
          onInteractOutside={(e) => {
            e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            e.preventDefault();
          }}
          onCloseAutoFocus={() => {
            setInputs((prev) => ({
              ...prev,
              demand_no: "",
              demand_date: new Date(),
              remarks: "",
            }));
          }}
        >
          <div
            className="sticky top-0 z-10 bg-background 
                grid grid-cols-2 items-center 
                pb-2 border-b"
          >
            <DialogTitle className="capitalize">Demand Details</DialogTitle>
            <button
              type="button"
              onClick={() => setIsOpen((prev) => ({ ...prev, demand: false }))}
              className="justify-self-end rounded-md p-1 transition"
            >
              ✕
            </button>
          </div>
          <div className="flex items-start gap-2 mb-3">
            <span className="font-semibold text-gray-700">
              Item Description :
            </span>

            <span className="text-gray-900 font-medium ml-1">
              {selectedRow?.description || "-"}
            </span>
          </div>
          <DialogDescription className="hidden" />
          <div>
            <Label htmlFor="demand_no" className="mb-2 gap-1">
              Surveyed / Utilised Qty
            </Label>
            <Input
              id="survey_qty"
              type="text"
              placeholder="Enter Demand No."
              name="survey_qty"
              value={selectedRow?.survey_qty}
              onChange={(e) =>
                setInputs((prev) => ({ ...prev, survey_qty: e.target.value }))
              }
            />
            <Label htmlFor="demand_no" className="mb-2 mt-4 gap-1">
              Demand No.<span className="text-red-500">*</span>
            </Label>
            <Input
              id="demand_no"
              type="text"
              placeholder="Enter Demand No."
              name="demand_no"
              value={inputs.demand_no}
              onChange={(e) =>
                setInputs((prev) => ({
                  ...prev,
                  demand_no: e.target.value.toUpperCase(),
                }))
              }
            />

            <Label htmlFor="demand_date" className="mb-2 mt-4 gap-1">
              Demand Date<span className="text-red-500">*</span>
            </Label>
            <Popover
              open={isOpen.demand_date}
              onOpenChange={(set) => {
                setIsOpen((prev) => ({ ...prev, demand_date: set }));
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  id="demand_date"
                  className="w-full justify-between font-normal"
                >
                  {inputs.demand_date
                    ? getFormatedDate(inputs.demand_date)
                    : "Select date"}
                  <ChevronDownIcon />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto overflow-hidden p-0"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={inputs.demand_date}
                  captionLayout="dropdown"
                  onSelect={(date) => {
                    setInputs((prev) => ({
                      ...prev,
                      demand_date: date,
                    }));
                    setIsOpen((prev) => ({
                      ...prev,
                      demand_date: false,
                    }));
                  }}
                />
              </PopoverContent>
            </Popover>
            <div>
              <Label className="mb-1 mt-4">Remarks</Label>
              <Input
                className="mt-2"
                placeholder="Enter remarks"
                value={inputs.remarks}
                onChange={(e) =>
                  setInputs((prev) => ({
                    ...prev,
                    remarks: e.target.value.toUpperCase(),
                  }))
                }
              />
            </div>
            <div>
              <div className="flex items-center mt-4 gap-4 justify-end">
                <Button
                  variant="destructive"
                  onClick={() =>
                    setIsOpen((prev) => ({ ...prev, demand: false }))
                  }
                >
                  Cancel
                </Button>
                <SpinnerButton
                  loading={isLoading.submit}
                  disabled={isLoading.submit || !inputs.demand_no}
                  loadingText="Submitting..."
                  className="text-white hover:bg-primary/85 cursor-pointer"
                  onClick={handleDemandSubmit}
                >
                  Submit
                </SpinnerButton>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rollbackDialog} onOpenChange={setRollbackDialog}>
        <DialogContent className="w-[420px] p-6">
          <DialogTitle>
            Rollback:{" "}
            <span className="text-sm">{rollbackItemDesc || "Item"}</span>
          </DialogTitle>

          <div className="mt-4">
            <p className="mb-3 text-sm text-gray-700">
              Are you sure you want to rollback this transaction?
            </p>

            <div className="flex gap-6 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="rollbackChoice"
                  value="yes"
                  checked={rollbackChoice === "yes"}
                  onChange={() => setRollbackChoice("yes")}
                />
                Yes
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="rollbackChoice"
                  value="no"
                  checked={rollbackChoice === "no"}
                  onChange={() => setRollbackChoice("no")}
                />
                No
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => setRollbackDialog(false)}
            >
              Cancel
            </Button>

            <Button
              className="text-white hover:bg-primary/85 cursor-pointer"
              onClick={confirmRollback}
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Demand Dialog - Modified with Updated Category Validation */}
      <Dialog
        open={isOpen.addDemand}
        onOpenChange={(open) => {
          if (!open) {
            resetAddDemandDialog();
            setItemSearchTerm("");
            setFilteredItems([]);
            setIsItemDropdownOpen(false);
            setManualDemandDate(new Date());
            setCategoryError("");
          }
          setIsOpen((prev) => ({ ...prev, addDemand: open }));
        }}
      >
        <DialogContent
          showCloseButton
          onPointerDownOutside={(e) => {
            e.preventDefault();
          }}
          className="max-w-lg"
        >
          <DialogTitle>Add Demand Item</DialogTitle>

          {/* Select Item - Searchable Combobox */}
          <div className="mt-4">
            <Label>
              Select Item <span className="text-red-500">*</span>
            </Label>

            <div className="demand-combobox relative mt-1">
              {/* Dropdown button */}
              <button
                type="button"
                onClick={() => setIsItemDropdownOpen(!isItemDropdownOpen)}
                className="w-full p-2 border rounded-md bg-white text-left flex justify-between items-center hover:bg-gray-50"
              >
                <span
                  className={
                    selectedDemandItem ? "text-gray-900" : "text-gray-400"
                  }
                >
                  {selectedDemandItem
                    ? `${selectedDemandItem.description} (${selectedDemandItem.category}) - ${selectedDemandItem.type === "spare" ? "SPARE" : "TOOL"}`
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
                        placeholder="Search by description, part no., item code, or equipment..."
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

                  {/* Updated Category info note */}
                  <div className="px-3 py-2 bg-blue-50 text-xs text-blue-700 border-b">
                    ℹ️ Only C category items can be demanded directly. For P/R
                    category items, please initiate survey procedure first.
                  </div>

                  {/* Show search results or initial items */}
                  <div className="max-h-60 overflow-y-auto">
                    {/* Search mode */}
                    {itemSearchTerm && (
                      <>
                        {isSearchingItems && (
                          <div className="p-4 text-center text-gray-500">
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                            Searching...
                          </div>
                        )}

                        {!isSearchingItems && (
                          <>
                            {filteredItems.length === 0 ? (
                              <div className="p-4 text-center text-gray-500 text-sm">
                                No items found matching "{itemSearchTerm}"
                              </div>
                            ) : (
                              <>
                                <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 border-b">
                                  Search Results ({filteredItems.length})
                                </div>
                                {filteredItems.map((item) => {
                                  const category = item.category?.toUpperCase();
                                  // Updated validation: Only C category is selectable
                                  const isSelectable = category === "C";
                                  const showError =
                                    category === "P" || category === "R";
                                  const showLPError = category === "LP";

                                  return (
                                    <div
                                      key={`${item.type}-${item.id}`}
                                      className={`p-3 border-b last:border-b-0 ${
                                        isSelectable
                                          ? "hover:bg-blue-50 cursor-pointer"
                                          : "opacity-60 cursor-not-allowed bg-gray-50"
                                      }`}
                                      onClick={() =>
                                        isSelectable &&
                                        handleItemSelection(item)
                                      }
                                    >
                                      <div className="flex-1">
                                        <div className="font-medium">
                                          {item.description}
                                          <span
                                            className={`ml-2 text-xs px-2 py-0.5 rounded ${
                                              isSelectable
                                                ? "bg-green-100 text-green-700"
                                                : category === "LP"
                                                  ? "bg-orange-100 text-orange-700"
                                                  : "bg-yellow-100 text-yellow-700"
                                            }`}
                                          >
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
                                        {showError && (
                                          <div className="text-xs text-red-600 mt-1 font-medium">
                                            ⚠️ Initiate Survey Procedure
                                          </div>
                                        )}
                                        {showLPError && (
                                          <div className="text-xs text-orange-600 mt-1 font-medium">
                                            ⚠️ Demand applicable for P/R/C
                                            category items
                                          </div>
                                        )}
                                        {!isSelectable &&
                                          !showError &&
                                          !showLPError && (
                                            <div className="text-xs text-red-600 mt-1">
                                              Invalid category for demand
                                            </div>
                                          )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </>
                            )}
                          </>
                        )}
                      </>
                    )}

                    {/* Initial items mode (no search) */}
                    {!itemSearchTerm && (
                      <>
                        {initialItems.length === 0 && isLoadingInitial ? (
                          <div className="p-4 text-center text-gray-500">
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                            Loading items...
                          </div>
                        ) : (
                          <>
                            <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 border-b sticky top-0">
                              Items (First {initialItems.length} of{" "}
                              {initialItems.length}+)
                            </div>
                            {initialItems.map((item) => {
                              const category = item.category?.toUpperCase();
                              // Updated validation: Only C category is selectable
                              const isSelectable = category === "C";
                              const showError =
                                category === "P" || category === "R";
                              const showLPError = category === "LP";

                              return (
                                <div
                                  key={`${item.type}-${item.id}`}
                                  className={`p-3 border-b last:border-b-0 ${
                                    isSelectable
                                      ? "hover:bg-blue-50 cursor-pointer"
                                      : "opacity-60 cursor-not-allowed bg-gray-50"
                                  }`}
                                  onClick={() =>
                                    isSelectable && handleItemSelection(item)
                                  }
                                >
                                  <div className="flex-1">
                                    <div className="font-medium">
                                      {item.description}
                                      <span
                                        className={`ml-2 text-xs px-2 py-0.5 rounded ${
                                          isSelectable
                                            ? "bg-green-100 text-green-700"
                                            : category === "LP"
                                              ? "bg-orange-100 text-orange-700"
                                              : "bg-yellow-100 text-yellow-700"
                                        }`}
                                      >
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
                                    {showError && (
                                      <div className="text-xs text-red-600 mt-1 font-medium">
                                        ⚠️ Initiate Survey Procedure
                                      </div>
                                    )}
                                    {showLPError && (
                                      <div className="text-xs text-orange-600 mt-1 font-medium">
                                        ⚠️ Demand applicable for P/R/C category
                                        items
                                      </div>
                                    )}
                                    {!isSelectable &&
                                      !showError &&
                                      !showLPError && (
                                        <div className="text-xs text-red-600 mt-1">
                                          Invalid category for demand
                                        </div>
                                      )}
                                  </div>
                                </div>
                              );
                            })}

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
                                    : "Load More (200 more)"}
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Category validation error message */}
            {categoryError && (
              <div className="mt-2 text-sm text-red-600">
                {categoryError === "Initiate Survey Procedure"
                  ? "⚠️ Initiate Survey Procedure - P/R category items require survey before demand"
                  : categoryError ===
                      "Demand applicable for P/R/C category items"
                    ? "⚠️ Demand applicable for P/R/C category items - LP items cannot be demanded"
                    : categoryError}
              </div>
            )}

            {/* Selected item details panel - Only shown for C category items */}
            {selectedDemandItem && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-xs text-green-800 mb-2 font-medium flex items-center gap-2">
                  <span>✓ Selected Item Details:</span>
                  <span className="px-2 py-0.5 bg-green-200 rounded text-xs font-semibold">
                    {selectedDemandItem.type === "spare" ? "SPARE" : "TOOL"}
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="col-span-2">
                    <span className="font-semibold text-gray-600">
                      Description:
                    </span>
                    <span className="ml-2 text-gray-700">
                      {selectedDemandItem.description || "--"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600">
                      Category:
                    </span>
                    <span className="ml-2 text-gray-700">
                      {selectedDemandItem.category || "--"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600">
                      IN Part No.:
                    </span>
                    <span className="ml-2 text-gray-700 font-mono text-xs">
                      {selectedDemandItem.indian_pattern || "--"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600">
                      Item Code:
                    </span>
                    <span className="ml-2 text-gray-700 font-mono text-xs">
                      {selectedDemandItem.item_code || "--"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-semibold text-gray-600">
                      Equipment/System:
                    </span>
                    <span className="ml-2 text-gray-700">
                      {selectedDemandItem.equipment_system || "--"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Qty to be demanded */}
          <div className="mt-4">
            <Label>
              Qty to be demanded <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              min="1"
              placeholder="Enter Demand Qty"
              value={demandQty}
              onChange={(e) => setDemandQty(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="demand_date" className="mb-2 mt-6 gap-1">
              To be Demanded Date<span className="text-red-500">*</span>
            </Label>
            <Popover
              open={isAddDemandCalendarOpen}
              onOpenChange={setIsAddDemandCalendarOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  id="demand_date"
                  className="w-full justify-between font-normal"
                >
                  {manualDemandDate
                    ? getFormatedDate(manualDemandDate)
                    : "Select date"}
                  <ChevronDownIcon />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto overflow-hidden p-0"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={manualDemandDate}
                  captionLayout="dropdown"
                  onSelect={(date) => {
                    setManualDemandDate(date);
                    setIsAddDemandCalendarOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="destructive"
              onClick={() => {
                resetAddDemandDialog();
                setIsOpen((prev) => ({ ...prev, addDemand: false }));
                setItemSearchTerm("");
                setSelectedDemandItem(null);
                setIsItemDropdownOpen(false);
                setFilteredItems([]);
                setCategoryError("");
              }}
            >
              Cancel
            </Button>

            <Button
              className="text-white"
              onClick={async () => {
                if (!selectedDemandItem) {
                  return toaster("error", "Please select an item");
                }

                if (!demandQty || Number(demandQty) <= 0) {
                  return toaster("error", "Quantity must be greater than 0");
                }

                if (!manualDemandDate) {
                  return toaster("error", "Please select a demand date");
                }

                setIsLoading((prev) => ({ ...prev, addDemand: true }));

                try {
                  await apiService.post("/demand/manual-add", {
                    spare_id:
                      selectedDemandItem.type === "spare"
                        ? selectedDemandItem.id
                        : null,
                    tool_id:
                      selectedDemandItem.type === "tool"
                        ? selectedDemandItem.id
                        : null,
                    survey_qty: Number(demandQty),
                    survey_date: formatDate(manualDemandDate),
                  });

                  toaster("success", "Demand item added successfully");

                  resetAddDemandDialog();
                  setIsOpen((prev) => ({ ...prev, addDemand: false }));
                  setItemSearchTerm("");
                  setSelectedDemandItem(null);
                  setIsItemDropdownOpen(false);
                  setFilteredItems([]);
                  setManualDemandDate(new Date());
                  setCategoryError("");
                  fetchdata();
                } catch (error) {
                  console.error("Error adding demand item:", error);
                  toaster(
                    "error",
                    error.response?.data?.message ||
                      "Failed to add demand item",
                  );
                } finally {
                  setIsLoading((prev) => ({ ...prev, addDemand: false }));
                }
              }}
              disabled={
                isLoading.addDemand ||
                !selectedDemandItem ||
                !demandQty ||
                !manualDemandDate
              }
            >
              {isLoading.addDemand ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PendingDemand;
