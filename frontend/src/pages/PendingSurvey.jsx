// import { useContext, useEffect, useMemo, useState } from "react";
// import { FaChevronRight, FaMagnifyingGlass } from "react-icons/fa6";
// import { IoMdRefresh } from "react-icons/io";

// import { Input } from "../components/ui/input";
// import { Button } from "../components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogTitle,
//   DialogFooter,
// } from "../components/ui/dialog";
// import { Label } from "../components/ui/label";
// import { Calendar } from "../components/ui/calendar";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "../components/ui/popover";
// import { MultiSelect } from "../components/ui/multi-select";
// import ComboBox from "../components/ComboBox";

// import { Context } from "../utils/Context";
// import apiService from "../utils/apiService";
// import PaginationTable from "../components/PaginationTableTwo";
// import SpinnerButton from "../components/ui/spinner-button";
// import toaster from "../utils/toaster";
// import { ChevronDownIcon, Plus } from "lucide-react";
// import {
//   formatDate,
//   getFormatedDate,
//   getTimeDate,
// } from "../utils/helperFunctions";
// import Spinner from "../components/Spinner";
// import Chip from "../components/Chip";
// import { useNavigate } from "react-router";

// const PendingSurvey = () => {
//   const { config, user, surveyReason, fetchSurveyReason } = useContext(Context);
//   const navigate = useNavigate();

//    const proceedWithSurvey = (row) => {
//      setSelectedRow(row);
//      setIsOpen((prev) => ({ ...prev, survey: true }));
//    };

//    const handleProceedWithCategoryCheck = (row) => {
//      // Check if category is null, undefined, or empty
//      if (!row.category || row.category === "" || row.category === null) {
//        // Open category selection dialog
//        setCategoryDialog({
//          open: true,
//          selectedRow: row,
//          selectedCategory: "",
//        });
//      } else {
//        // Category exists, proceed directly
//        proceedWithSurvey(row);
//      }
//   };

//   const columns = useMemo(
//     () => [
//       {
//         key: "description",
//         header: "Item Description",
//         width: "max-w-[90px] px-0",
//       },
//       {
//         key: "indian_pattern",
//         header: (
//           <span>
//             <i>IN</i> Part No.
//           </span>
//         ),
//         width: "max-w-[80px] px-0",
//       },
//       { key: "category", header: "Category", width: "max-w-[20px] px-0" },
//       { key: "denos", header: "Denos.", width: "max-w-[20px] px-0" },
//       {
//         key: "withdrawl_date_str",
//         header: "Withdrawal Date / Survey Date",
//         width: "max-w-[40px] px-0",
//       },
//       { key: "service_no", header: "Service No.", width: "max-w-[40px] px-0" },
//       { key: "issue_to", header: "Issued To", width: "max-w-[30px] px-0" },
//       {
//         key: "withdrawl_qty",
//         header: <span>Withdrawal Qty / Survey Qty</span>,
//         width: "max-w-[30px] px-0",
//       },
//       {
//         key: "survey_quantity",
//         header: "Surveyed Qty",
//         width: "max-w-[30px]",
//       },
//       { key: "remarks_survey", header: "Remarks", width: "max-w-[45px]" },

//       ...(user.role != "user"
//         ? [{ key: "processed", header: "Proceed", width: "max-w-[25px] px-0" }]
//         : []),

//       ...(user.role === "officer"
//         ? [{ key: "rollback", header: "Rollback", width: "max-w-[45px] px-0" }]
//         : []),
//     ],
//     [user.role],
//   );
//   const options = [
//     { value: "description", label: "Item Description" },
//     {
//       value: "indian_pattern",
//       label: (
//         <span>
//           <i>IN</i> Part No.
//         </span>
//       ),
//       width: "min-w-[40px]",
//     },
//     { value: "category", label: "Category" },
//     { value: "denos", label: "Denos." },
//     { value: "withdrawl_date", label: "Withdrawal Date" },
//     { value: "service_no", label: "Service No." },
//     { value: "issue_to", label: "Issued To" },
//     { value: "remarks_survey", label: "Remarks" },
//   ];

//   //rollback states
//   const [rollbackDialog, setRollbackDialog] = useState(false);
//   const [rollbackChoice, setRollbackChoice] = useState("yes");
//   const [rollbackIssueId, setRollbackIssueId] = useState(null);
//   const [rollbackItemDesc, setRollbackItemDesc] = useState("");

//   //add survey states
//   const [itemsList, setItemsList] = useState([]);
//   const [selectedItem, setSelectedItem] = useState(null);
//   const [withdrawlQty, setWithdrawlQty] = useState("");
//   // Add this with your other state declarations
//   const [manualSurveyDate, setManualSurveyDate] = useState(new Date());

//   const [itemSearchTerm, setItemSearchTerm] = useState("");
//   const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
//   // Add these with your other state declarations
//   const [initialItems, setInitialItems] = useState([]);
//   const [initialItemsPage, setInitialItemsPage] = useState(1);
//   const [hasMoreInitial, setHasMoreInitial] = useState(true);
//   const [isLoadingInitial, setIsLoadingInitial] = useState(false);
//   const [isSearchingItems, setIsSearchingItems] = useState(false);
//   const [searchedItems, setSearchedItems] = useState([]);

//   //for survey-stockin
//   const [repairStatus, setRepairStatus] = useState(null);

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
//     survey: false,
//   });
//   const [actualSearch, setActualSearch] = useState("");
//   const [inputs, setInputs] = useState({
//     search: "",
//     voucher_no: "",
//     survey_calender: new Date(),
//     quantity: "",
//     remarks: "",
//   });
//   const [isOpen, setIsOpen] = useState({
//     survey: false,
//     survey_calender: false,
//     addSurvey: false,
//     addSpare: false,
//     addTool: false,
//   });
//   const [selectedRow, setSelectedRow] = useState({});

//   //new state variable for category
//   // Add these state variables with your other state declarations
//   const [categoryDialog, setCategoryDialog] = useState({
//     open: false,
//     selectedRow: null,
//     selectedCategory: "",
//   });
//   const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);

// const handleCategoryUpdateAndRoute = async () => {
//   const { selectedRow, selectedCategory } = categoryDialog;

//   if (!selectedCategory) {
//     toaster("error", "Please select a category");
//     return;
//   }

//   setIsUpdatingCategory(true);

//   try {
//     // Determine item type and ID
//     const itemId = selectedRow.spare_id || selectedRow.tool_id;
//     const itemType = selectedRow.spare_id ? "spare" : "tool";

//     // Update the item's category using dedicated endpoint
//     const updateResponse = await apiService.post("/survey/update-category", {
//       item_id: itemId,
//       item_type: itemType,
//       category: selectedCategory.toUpperCase(),
//     });

//     if (!updateResponse.success) {
//       throw new Error(updateResponse.message || "Failed to update category");
//     }

//     toaster("success", `Category updated to ${selectedCategory.toUpperCase()}`);

//     // Check if category is C or LP - these go to demand/procurement
//     if (
//       selectedCategory.toUpperCase() === "C" ||
//       selectedCategory.toUpperCase() === "LP"
//     ) {
//       // Move to pending for demand/procurement
//       const moveResponse = await apiService.post("/survey/move-from-survey", {
//         survey_id: selectedRow.id,
//         category: selectedCategory.toUpperCase(),
//       });

//       if (!moveResponse.success) {
//         throw new Error(moveResponse.message || "Failed to move to demand");
//       }

//       toaster("success", "Item moved to Pending for Demand/Procurement");

//       // Refresh the table to remove this item from survey list
//       await fetchdata(currentPage, actualSearch, selectedValues);

//       // Close dialog
//       setCategoryDialog({
//         open: false,
//         selectedRow: null,
//         selectedCategory: "",
//       });
//     } else if (
//       selectedCategory.toUpperCase() === "P" ||
//       selectedCategory.toUpperCase() === "R"
//     ) {
//       // Close dialog first
//       setCategoryDialog({
//         open: false,
//         selectedRow: null,
//         selectedCategory: "",
//       });

//       // Refresh to show updated category
//       await fetchdata(currentPage, actualSearch, selectedValues);

//       // Now proceed with normal survey flow
//       setSelectedRow(selectedRow);
//       setIsOpen((prev) => ({ ...prev, survey: true }));
//     }
//   } catch (error) {
//     console.error("Error updating category:", error);
//     toaster(
//       "error",
//       error.response?.data?.message ||
//         error.message ||
//         "Failed to update category",
//     );
//   } finally {
//     setIsUpdatingCategory(false);
//   }
// };

//   const handleRollback = (issueId, description) => {
//     setRollbackIssueId(issueId);
//     setRollbackItemDesc(description);
//     setRollbackChoice("yes");
//     setRollbackDialog(true);
//   };

//   const confirmRollback = async () => {
//     if (rollbackChoice !== "yes") {
//       setRollbackDialog(false);
//       return;
//     }

//     try {
//       const response = await apiService.post("/survey/reverse", {
//         survey_id: rollbackIssueId,
//       });

//       if (response.success) {
//         toaster("success", "Survey rolled back successfully");
//         fetchdata();
//       } else {
//         toaster("error", response.message);
//       }
//     } catch (error) {
//       toaster("error", error.response?.data?.message || error.message);
//     } finally {
//       setRollbackDialog(false);
//     }
//   };

//   // search
//   const fetchInitialItems = async (page = 1) => {
//     if (isLoadingInitial) return;

//     setIsLoadingInitial(true);
//     try {
//       const response = await apiService.get("/survey/items", {
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

//   const searchSurveyItems = async (searchTerm) => {
//     if (!searchTerm.trim() || searchTerm.length < 2) {
//       setSearchedItems([]);
//       return;
//     }

//     setIsSearchingItems(true);
//     try {
//       const response = await apiService.get("/survey/items", {
//         params: { search: searchTerm },
//       });
//       setSearchedItems(response.data.items || []);
//     } catch (error) {
//       console.error("Error searching items:", error);
//       setSearchedItems([]);
//     } finally {
//       setIsSearchingItems(false);
//     }
//   };

//   useEffect(() => {
//     if (isOpen.addSurvey && initialItems.length === 0) {
//       fetchInitialItems(1);
//     }
//   }, [isOpen.addSurvey]);

//   useEffect(() => {
//     const debounceTimer = setTimeout(() => {
//       if (isItemDropdownOpen && itemSearchTerm) {
//         searchSurveyItems(itemSearchTerm);
//       } else if (!itemSearchTerm) {
//         setSearchedItems([]);
//       }
//     }, 300);

//     return () => clearTimeout(debounceTimer);
//   }, [itemSearchTerm, isItemDropdownOpen]);

//   const resetSurveyDialog = () => {
//     setRepairStatus(null);

//     setInputs({
//       search: "",
//       voucher_no: "",
//       survey_calender: new Date(),
//       quantity: "",
//       remarks: "",
//     });

//     setSelectedRow({});
//   };

//   // const filteredItems = useMemo(() => {
//   //   if (!itemSearchTerm.trim()) return itemsList;

//   //   const searchLower = itemSearchTerm.toLowerCase().trim();
//   //   return itemsList.filter(
//   //     (item) =>
//   //       item.description?.toLowerCase().includes(searchLower) ||
//   //       item.indian_pattern?.toLowerCase().includes(searchLower) ||
//   //       item.item_code?.toLowerCase().includes(searchLower) ||
//   //       item.equipment_system?.toLowerCase().includes(searchLower),
//   //   );
//   // }, [itemsList, itemSearchTerm]);

//   // Remove or comment out the old filteredItems and replace with:
//   const displayItems = itemSearchTerm ? searchedItems : initialItems;

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (isItemDropdownOpen && !event.target.closest(".relative")) {
//         setIsItemDropdownOpen(false);
//         setItemSearchTerm("");
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [isItemDropdownOpen]);

//   const addToDropdown = async (type, value) => {
//     try {
//       const data = {
//         type,
//         attr: [value],
//       };

//       const response = await apiService.post("/config/add", data);
//       console.log("ADD RESPONSE:", response);
//       if (response.success) {
//         toaster("success", "Data Added");

//         if (type === "survey") {
//           await fetchSurveyReason();
//         }
//       }
//     } catch (error) {
//       console.error(error);
//       toaster("error", "Failed to add");
//     }
//   };

//   const fetchSurveyItems = async () => {
//     try {
//       const response = await apiService.get("/survey/items");
//       setItemsList(response.data.items || []);
//     } catch (error) {
//       console.error("Error fetching survey items:", error);
//       toaster("error", "Failed to fetch items");
//     }
//   };

//   const fetchdata = async (
//     page = currentPage,
//     search = inputs.search,
//     cols = selectedValues,
//   ) => {
//     try {
//       setIsLoading((prev) => ({ ...prev, table: true }));

//       const response = await apiService.get("/survey", {
//         params: {
//           page,
//           search,
//           limit: config.row_per_page,
//           status: "pending",
//           cols: cols.length ? cols.join(",") : "",
//         },
//       });

//       setFetchedData(response.data);
//     } catch (error) {
//       console.log(error);
//       toaster.error(error.response?.data?.message);
//     } finally {
//       setIsLoading((prev) => ({ ...prev, table: false }));
//     }
//   };

//   useEffect(() => {
//     if (isOpen.addSurvey) {
//       fetchSurveyItems();
//     }
//   }, [isOpen.addSurvey]);

//   const handleSearch = async () => {
//     const searchTerm = inputs.search.trim();

//     if (searchTerm === actualSearch) return;

//     setActualSearch(searchTerm);

//     setIsLoading((prev) => ({ ...prev, search: true }));
//     await fetchdata(1, searchTerm, selectedValues);
//     setCurrentPage(1);
//     setIsLoading((prev) => ({ ...prev, search: false }));
//   };

//   const handleRefresh = () => {
//     setInputs((prev) => ({ ...prev, search: "" }));
//     setSelectedValues([]);
//     setCurrentPage(1);
//     setActualSearch("");

//     fetchdata(1, "");
//   };

//   const handleServay = async () => {
//     try {
//       const qty = Number(inputs.quantity);

//       if (!qty || qty < 0) {
//         return toaster("error", "Qty must be greater than 0");
//       }
//       setIsLoading((prev) => ({ ...prev, survey: true }));

//       if (repairStatus === "yes") {
//         await apiService.post("/demand/repair-stock", {
//           spare_id: selectedRow.spare_id,
//           tool_id: selectedRow.tool_id,
//           repairable_qty: inputs.quantity,
//           transaction_id: selectedRow.transaction_id,
//         });

//         toaster("success", "Item sent to repair stock");
//       } else {
//         if (!selectedRow.surveyReason) {
//           return toaster("error", "Please select reason for survey");
//         }
//         await apiService.post("/demand/create", {
//           spare_id: selectedRow.spare_id,
//           tool_id: selectedRow.tool_id,
//           survey_qty: inputs.quantity,
//           survey_voucher_no: inputs.voucher_no,
//           survey_date: formatDate(inputs.survey_calender),
//           transaction_id: selectedRow.transaction_id,
//           reason_for_survey: selectedRow.surveyReason,
//           remarks: inputs.remarks,
//         });

//         toaster("success", "Survey completed successfully");
//       }

//       setIsOpen((prev) => ({ ...prev, survey: false }));
//       fetchdata();
//     } catch (error) {
//       toaster("error", error.response?.data?.message);
//     } finally {
//       setIsLoading((prev) => ({ ...prev, survey: false }));
//     }
//   };

//   const resetAddSurveyDialog = () => {
//     setSelectedItem(null);
//     setWithdrawlQty("");
//     setItemsList([]);
//   };

//   useEffect(() => {
//     fetchdata(currentPage, actualSearch, selectedValues);
//   }, [currentPage]);

// useEffect(() => {
//   const t = fetchedData.items.map((row) => {
//     console.log("SOURCE TYPE:", row.source_type, row);

//     return {
//       ...row,
//       survey_quantity: row.survey_quantity || "0",
//       issue_date: getFormatedDate(row.issue_date),
//       withdrawl_date_str: row.withdrawl_date
//         ? getFormatedDate(row.withdrawl_date)
//         : "---",
//       created_at: getTimeDate(row.created_at),
//       status:
//         row.status?.toLowerCase() == "pending" ? (
//           <Chip text="Pending" varient="info" />
//         ) : (
//           <Chip text="Completed" varient="success" />
//         ),
//       // Add the processed button directly here instead of using column render
//       processed: (
//         <Button
//           size="icon"
//           disabled={row.issue_to?.toLowerCase() === "special_demand"}
//           className={`bg-white text-black shadow-md border hover:bg-gray-100
//             ${row.issue_to?.toLowerCase() === "special_demand" ? "opacity-40 cursor-not-allowed" : ""}`}
//           onClick={() => handleProceedWithCategoryCheck(row)}
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
//             onClick={() => handleRollback(row.id, row.description)}
//           >
//             Rollback
//           </Button>
//         ) : null,
//     };
//   });
//   setTableData(t);
// }, [fetchedData]);

//   if (isLoading.table) {
//     return <Spinner />;
//   }

//   return (
//     <div className="px-2 w-full">
//       <div className="mb-2">
//         <Input
//           type="text"
//           placeholder="Search Survey Items"
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
//           onClick={() => setIsOpen((prev) => ({ ...prev, addSurvey: true }))}
//         >
//           <Plus className="size-4" />
//           Add Survey
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
//           className="h-[calc(100vh-230px)] w-[calc(100vw-35px)]"
//         />
//       </div>

//       <Dialog
//         open={isOpen.survey}
//         onOpenChange={(open) => {
//           if (!open) resetSurveyDialog();
//           setIsOpen((prev) => ({ ...prev, survey: open }));
//         }}
//       >
//         <DialogContent
//           className="unbounded w-full !max-w-2xl"
//           onInteractOutside={(e) => {
//             e.preventDefault(); // 🚫 Prevent outside click close
//           }}
//           onPointerDownOutside={(e) => {
//             e.preventDefault();
//           }}
//           onCloseAutoFocus={() => {
//             setInputs((prev) => ({
//               ...prev,
//               servay_number: "",
//               voucher_no: "",
//               survey_calender: new Date(),
//             }));
//           }}
//         >
//           <div
//             className="sticky top-0 z-10 bg-background
//                 grid grid-cols-2 items-center
//                 pb-2 border-b"
//           >
//             <DialogTitle className="capitalize">
//               Issue {selectedRow.spare_id ? "spare" : "tool"}
//             </DialogTitle>
//             <button
//               type="button"
//               onClick={() => {
//                 resetSurveyDialog();
//                 setIsOpen((prev) => ({ ...prev, survey: false }));
//               }}
//               className="justify-self-end rounded-md p-1 transition"
//             >
//               ✕
//             </button>
//           </div>

//           <div className="grid grid-cols-2 gap-4 mb-4">
//             <div className="flex flex-col gap-1 mb-3">
//               <span className="font-semibold text-gray-700">
//                 Item Description :
//               </span>

//               <span className="text-gray-900">
//                 {selectedRow?.description || "-"}
//               </span>
//             </div>

//             <div className="flex flex-col gap-2 mb-3">
//               <Label className="font-semibold">
//                 Item Repaired / Serviceable?
//               </Label>

//               <div className="flex items-center gap-6">
//                 <label className="flex items-center gap-2">
//                   <input
//                     type="radio"
//                     name="repairStatus"
//                     value="yes"
//                     checked={repairStatus === "yes"}
//                     onChange={() => setRepairStatus("yes")}
//                   />
//                   Yes
//                 </label>

//                 <label className="flex items-center gap-2">
//                   <input
//                     type="radio"
//                     name="repairStatus"
//                     value="no"
//                     checked={repairStatus === "no"}
//                     onChange={() => setRepairStatus("no")}
//                   />
//                   No
//                 </label>
//               </div>
//             </div>
//           </div>

//           <DialogDescription className="hidden" />
//           {repairStatus === "yes" && (
//             <div className="grid grid-cols-3 gap-4 mb-4">
//               <div>
//                 <Label>Withdrawal Qty</Label>
//                 <Input value={selectedRow?.withdrawl_qty ?? 0} readOnly />
//               </div>

//               <div>
//                 <Label>Previously Stocked In Qty</Label>
//                 <Input value={selectedRow?.survey_quantity ?? 0} readOnly />
//               </div>

//               <div>
//                 <Label>
//                   Repairable Qty <span className="text-red-500">*</span>
//                 </Label>
//                 <Input
//                   type="number"
//                   min="0"
//                   placeholder="Enter Repairable Qty"
//                   value={inputs.quantity}
//                   onChange={(e) =>
//                     setInputs((prev) => ({
//                       ...prev,
//                       quantity: e.target.value,
//                     }))
//                   }
//                 />
//               </div>
//             </div>
//           )}

//           {repairStatus === "no" && (
//             <>
//               <div className="grid grid-cols-3 gap-4 mb-4">
//                 <div>
//                   <Label>Withdrawal Qty</Label>
//                   <Input value={selectedRow?.withdrawl_qty ?? 0} readOnly />
//                 </div>

//                 <div>
//                   <Label>Previously Surveyed Qty</Label>
//                   <Input value={selectedRow?.survey_quantity ?? 0} readOnly />
//                 </div>

//                 <div>
//                   <Label>
//                     Survey Qty <span className="text-red-500">*</span>
//                   </Label>
//                   <Input
//                     type="number"
//                     min="0"
//                     placeholder="Enter Survey Qty"
//                     value={inputs.quantity}
//                     onChange={(e) =>
//                       setInputs((prev) => ({
//                         ...prev,
//                         quantity: e.target.value,
//                       }))
//                     }
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Label>
//                     Survey Voucher No. <span className="text-red-500">*</span>
//                   </Label>
//                   <Input
//                     placeholder="Enter Survey Voucher No."
//                     value={inputs.voucher_no}
//                     onChange={(e) =>
//                       setInputs((prev) => ({
//                         ...prev,
//                         voucher_no: e.target.value.toUpperCase(),
//                       }))
//                     }
//                   />
//                 </div>

//                 <div>
//                   <Label>
//                     Survey Date <span className="text-red-500">*</span>
//                   </Label>

//                   <Popover
//                     open={isOpen.survey_calender}
//                     onOpenChange={(set) =>
//                       setIsOpen((prev) => ({ ...prev, survey_calender: set }))
//                     }
//                   >
//                     <PopoverTrigger asChild>
//                       <Button
//                         variant="outline"
//                         className="w-full justify-between font-normal"
//                       >
//                         {inputs.survey_calender
//                           ? getFormatedDate(inputs.survey_calender)
//                           : "Select date"}
//                         <ChevronDownIcon />
//                       </Button>
//                     </PopoverTrigger>

//                     <PopoverContent className="w-auto p-0">
//                       <Calendar
//                         mode="single"
//                         selected={inputs.survey_calender}
//                         captionLayout="dropdown"
//                         onSelect={(date) => {
//                           setInputs((prev) => ({
//                             ...prev,
//                             survey_calender: date,
//                           }));
//                           setIsOpen((prev) => ({
//                             ...prev,
//                             survey_calender: false,
//                           }));
//                         }}
//                       />
//                     </PopoverContent>
//                   </Popover>
//                 </div>

//                 <div className="flex flex-col gap-1 w-full mt-4">
//                   <label className="text-sm font-medium text-gray-700">
//                     Reason For Survey <span className="text-red-500">*</span>
//                   </label>

//                   <ComboBox
//                     options={surveyReason}
//                     className="w-[300px]"
//                     placeholder="Select reasons.."
//                     onCustomAdd={async (value) => {
//                       await addToDropdown("survey", value.name);
//                     }}
//                     onSelect={(value) => {
//                       setSelectedRow((prev) => ({
//                         ...prev,
//                         surveyReason: value.name,
//                       }));
//                     }}
//                     onDelete={async (value) => {
//                       try {
//                         await apiService.delete(`/config/${value.id}`);
//                         await fetchSurveyReason();
//                         toaster("success", "Deleted Successfully");
//                       } catch (error) {
//                         toaster("error", "Failed to delete the item");
//                       }
//                     }}
//                   />
//                 </div>

//                 <div className="mt-4">
//                   <Label>Remarks</Label>

//                   <Input
//                     className="mt-2"
//                     placeholder="Remarks"
//                     value={inputs.remarks}
//                     onChange={(e) =>
//                       setInputs((prev) => ({
//                         ...prev,
//                         remarks: e.target.value.toUpperCase(),
//                       }))
//                     }
//                   />
//                 </div>
//               </div>
//             </>
//           )}
//           <div>
//             <div className="flex items-center mt-4 gap-4 justify-end">
//               <Button
//                 variant="destructive"
//                 onClick={() => {
//                   resetSurveyDialog();
//                   setIsOpen((prev) => ({ ...prev, survey: false }));
//                 }}
//               >
//                 Cancel
//               </Button>
//               <SpinnerButton
//                 loading={isLoading.survey}
//                 disabled={isLoading.survey}
//                 loadingText="Submitting..."
//                 className="text-white hover:bg-primary/85 cursor-pointer"
//                 onClick={handleServay}
//               >
//                 Submit
//               </SpinnerButton>
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
//               Are you sure you want to rollback this Survey?
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

//       {/* Add Survey Dialog - With Search and 200 Initial Items */}
//       <Dialog
//         open={isOpen.addSurvey}
//         onOpenChange={(open) => {
//           if (!open) {
//             resetAddSurveyDialog();
//             setItemSearchTerm("");
//             setSearchedItems([]);
//             setIsItemDropdownOpen(false);
//             setManualSurveyDate(new Date());
//           }
//           setIsOpen((prev) => ({ ...prev, addSurvey: open }));
//         }}
//       >
//         <DialogContent
//           showCloseButton
//           onPointerDownOutside={(e) => {
//             e.preventDefault();
//           }}
//           className="max-w-lg"
//         >
//           <DialogTitle>Add Survey Item</DialogTitle>

//           {/* Select Item - Searchable Combobox */}
//           <div className="mt-4">
//             <Label>
//               Select Item <span className="text-red-500">*</span>
//             </Label>

//             <div className="relative mt-1">
//               {/* Custom Combobox */}
//               <div className="relative">
//                 <button
//                   type="button"
//                   onClick={() => setIsItemDropdownOpen(!isItemDropdownOpen)}
//                   className="w-full p-2 border rounded-md bg-white text-left flex justify-between items-center hover:bg-gray-50"
//                 >
//                   <span
//                     className={selectedItem ? "text-gray-900" : "text-gray-400"}
//                   >
//                     {selectedItem
//                       ? `${selectedItem.description} (${selectedItem.category}) - ${selectedItem.type === "spare" ? "SPARE" : "TOOL"}`
//                       : "Search and Select Items..."}
//                   </span>
//                   <ChevronDownIcon
//                     className={`size-4 transition-transform ${isItemDropdownOpen ? "rotate-180" : ""}`}
//                   />
//                 </button>

//                 {/* Dropdown with search */}
//                 {isItemDropdownOpen && (
//                   <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
//                     {/* Search input inside dropdown */}
//                     <div className="p-2 border-b">
//                       <div className="relative">
//                         <input
//                           type="text"
//                           placeholder="Search by description, part no., item code, or equipment..."
//                           className="w-full p-2 pl-8 border rounded-md"
//                           value={itemSearchTerm}
//                           onChange={(e) => setItemSearchTerm(e.target.value)}
//                           autoFocus
//                         />
//                         <FaMagnifyingGlass className="absolute left-2 top-3 text-gray-400 size-4" />
//                         {itemSearchTerm && (
//                           <button
//                             onClick={() => setItemSearchTerm("")}
//                             className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
//                           >
//                             ✕
//                           </button>
//                         )}
//                       </div>
//                     </div>

//                     {/* Search mode */}
//                     {itemSearchTerm && (
//                       <div className="max-h-60 overflow-y-auto">
//                         {isSearchingItems && (
//                           <div className="p-4 text-center text-gray-500">
//                             <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
//                             Searching...
//                           </div>
//                         )}

//                         {!isSearchingItems && (
//                           <>
//                             {searchedItems.length === 0 ? (
//                               <div className="p-4 text-center text-gray-500 text-sm">
//                                 No items found matching "{itemSearchTerm}"
//                               </div>
//                             ) : (
//                               <>
//                                 <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 border-b sticky top-0">
//                                   Search Results ({searchedItems.length})
//                                 </div>
//                                 {searchedItems.map((item) => (
//                                   <div
//                                     key={`${item.type}-${item.id}`}
//                                     className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
//                                     onClick={() => {
//                                       setSelectedItem(item);
//                                       setIsItemDropdownOpen(false);
//                                       setItemSearchTerm("");
//                                       setSearchedItems([]);
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
//                       </div>
//                     )}

//                     {/* Initial items mode (no search) */}
//                     {!itemSearchTerm && (
//                       <div className="max-h-60 overflow-y-auto">
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
//                                   setSelectedItem(item);
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
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Selected item details panel */}
//             {selectedItem && (
//               <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
//                 <p className="text-xs text-green-800 mb-2 font-medium flex items-center gap-2">
//                   <span>✓ Selected Item Details:</span>
//                   <span className="px-2 py-0.5 bg-green-200 rounded text-xs font-semibold">
//                     {selectedItem.type === "spare" ? "SPARE" : "TOOL"}
//                   </span>
//                 </p>
//                 <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
//                   <div className="col-span-2">
//                     <span className="font-semibold text-gray-600">
//                       Description:
//                     </span>
//                     <span className="ml-2 text-gray-700">
//                       {selectedItem.description || "--"}
//                     </span>
//                   </div>
//                   <div>
//                     <span className="font-semibold text-gray-600">
//                       Category:
//                     </span>
//                     <span className="ml-2 text-gray-700">
//                       {selectedItem.category || "--"}
//                     </span>
//                   </div>
//                   <div>
//                     <span className="font-semibold text-gray-600">
//                       IN Part No.:
//                     </span>
//                     <span className="ml-2 text-gray-700 font-mono text-xs">
//                       {selectedItem.indian_pattern || "--"}
//                     </span>
//                   </div>
//                   <div>
//                     <span className="font-semibold text-gray-600">
//                       Item Code:
//                     </span>
//                     <span className="ml-2 text-gray-700 font-mono text-xs">
//                       {selectedItem.item_code || "--"}
//                     </span>
//                   </div>
//                   <div className="col-span-2">
//                     <span className="font-semibold text-gray-600">
//                       Equipment/System:
//                     </span>
//                     <span className="ml-2 text-gray-700">
//                       {selectedItem.equipment_system || "--"}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Qty to be surveyed - Always visible */}
//           <div className="mt-4">
//             <Label>
//               Qty to be surveyed <span className="text-red-500">*</span>
//             </Label>
//             <Input
//               type="number"
//               min="1"
//               placeholder="Enter Survey Qty"
//               value={withdrawlQty}
//               onChange={(e) => setWithdrawlQty(e.target.value)}
//               className="mt-1"
//             />
//           </div>
//           <div>
//             <Label className="mt-4 mb-1">
//               To be Surveyed Date <span className="text-red-500">*</span>
//             </Label>

//             <Popover
//               open={isOpen.survey_calender}
//               onOpenChange={(set) =>
//                 setIsOpen((prev) => ({ ...prev, survey_calender: set }))
//               }
//             >
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="outline"
//                   className="w-full justify-between font-normal"
//                 >
//                   {manualSurveyDate
//                     ? getFormatedDate(manualSurveyDate)
//                     : "Select date"}
//                   <ChevronDownIcon />
//                 </Button>
//               </PopoverTrigger>

//               <PopoverContent className="w-auto p-0">
//                 <Calendar
//                   mode="single"
//                   selected={manualSurveyDate}
//                   captionLayout="dropdown"
//                   onSelect={(date) => {
//                     setManualSurveyDate(date);
//                     setIsOpen((prev) => ({
//                       ...prev,
//                       survey_calender: false,
//                     }));
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
//                 resetAddSurveyDialog();
//                 setIsOpen((prev) => ({ ...prev, addSurvey: false }));
//                 setItemSearchTerm("");
//                 setSelectedItem(null);
//                 setIsItemDropdownOpen(false);
//                 setSearchedItems([]);
//               }}
//             >
//               Cancel
//             </Button>

//             <Button
//               className="text-white"
//               onClick={async () => {
//                 if (!selectedItem) {
//                   return toaster("error", "Please select an item");
//                 }

//                 if (!withdrawlQty || withdrawlQty <= 0) {
//                   return toaster(
//                     "error",
//                     "Please enter a valid quantity greater than 0",
//                   );
//                 }

//                 if (!manualSurveyDate) {
//                   return toaster("error", "Please select a survey date");
//                 }

//                 try {
//                   await apiService.post("/survey/manual-add", {
//                     spare_id:
//                       selectedItem.type === "spare" ? selectedItem.id : null,
//                     tool_id:
//                       selectedItem.type === "tool" ? selectedItem.id : null,
//                     withdrawl_qty: parseInt(withdrawlQty),
//                     survey_date: formatDate(manualSurveyDate),
//                   });

//                   toaster("success", "Survey item added successfully");

//                   resetAddSurveyDialog();
//                   setIsOpen((prev) => ({ ...prev, addSurvey: false }));
//                   setItemSearchTerm("");
//                   setSelectedItem(null);
//                   setIsItemDropdownOpen(false);
//                   setSearchedItems([]);
//                   setManualSurveyDate(new Date());
//                   fetchdata();
//                 } catch (error) {
//                   console.error("Error adding survey item:", error);
//                   toaster(
//                     "error",
//                     error.response?.data?.message ||
//                       "Failed to add survey item",
//                   );
//                 }
//               }}
//             >
//               Submit
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//       {/* Category Selection Dialog for Items with Null/Unknown Category */}
//       <Dialog
//         open={categoryDialog.open}
//         onOpenChange={(open) => {
//           if (!open) {
//             setCategoryDialog({
//               open: false,
//               selectedRow: null,
//               selectedCategory: "",
//             });
//           }
//         }}
//       >
//         <DialogContent className="max-w-md">
//           <DialogTitle>Select Category</DialogTitle>
//           <DialogDescription>
//             This item doesn't have a category assigned. Please select a category
//             to proceed.
//           </DialogDescription>

//           <div className="mt-4">
//             <Label className="mb-2 block">
//               Category <span className="text-red-500">*</span>
//             </Label>
//             <select
//               className="w-full border rounded-md px-3 py-2"
//               value={categoryDialog.selectedCategory}
//               onChange={(e) =>
//                 setCategoryDialog((prev) => ({
//                   ...prev,
//                   selectedCategory: e.target.value,
//                 }))
//               }
//             >
//               <option value="">Select</option>
//               <option value="P">P</option>
//               <option value="R">R</option>
//               <option value="C">C</option>
//               <option value="LP">LP</option>
//             </select>

//             <div className="mt-3 text-sm text-gray-600">
//               <p className="font-semibold">Note:</p>
//               <ul className="list-disc list-inside mt-1 space-y-1">
//                 <li>
//                   If you select <span className="font-semibold">C or LP</span>:
//                   Item will be moved to{" "}
//                   <span className="font-semibold">
//                     Pending for Demand
//                   </span>
//                 </li>
//                 <li>
//                   If you select <span className="font-semibold">P or R</span>:
//                   Item will remain in Survey with the updated category
//                 </li>
//               </ul>
//             </div>
//           </div>

//           <DialogFooter className="mt-6">
//             <Button
//               variant="outline"
//               onClick={() =>
//                 setCategoryDialog({
//                   open: false,
//                   selectedRow: null,
//                   selectedCategory: "",
//                 })
//               }
//             >
//               Cancel
//             </Button>
//             <SpinnerButton
//               loading={isUpdatingCategory}
//               disabled={isUpdatingCategory || !categoryDialog.selectedCategory}
//               loadingText="Processing..."
//               onClick={handleCategoryUpdateAndRoute}
//             >
//               Proceed
//             </SpinnerButton>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default PendingSurvey;


//------------------New survey code with category select--------------------//

import { useContext, useEffect, useMemo, useState } from "react";
import { FaChevronRight, FaMagnifyingGlass } from "react-icons/fa6";
import { IoMdRefresh } from "react-icons/io";

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
import ComboBox from "../components/ComboBox";

import { Context } from "../utils/Context";
import apiService from "../utils/apiService";
import PaginationTable from "../components/PaginationTableTwo";
import SpinnerButton from "../components/ui/spinner-button";
import toaster from "../utils/toaster";
import { ChevronDownIcon, Plus } from "lucide-react";
import {
  formatDate,
  getFormatedDate,
  getTimeDate,
} from "../utils/helperFunctions";
import Spinner from "../components/Spinner";
import Chip from "../components/Chip";

const PendingSurvey = () => {
  const { config, user, surveyReason, fetchSurveyReason } = useContext(Context);

  const proceedWithSurvey = (row) => {
    setSelectedRow(row);
    setRepairStatus(null);
    setShowCategorySelection(false);
    setIsOpen((prev) => ({ ...prev, survey: true }));
  };

  const handleProceedClick = (row) => {
    // Check if category exists
    if (!row.category || row.category === "" || row.category === null) {
      // For items without category, first show repair status question
      setSelectedRow(row);
      setShowCategorySelection(false);
      setRepairStatus(null);
      setIsOpen((prev) => ({ ...prev, survey: true }));
    } else {
      // Category exists, proceed directly
      proceedWithSurvey(row);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "description",
        header: "Item Description",
        width: "max-w-[90px] px-0",
      },
      {
        key: "indian_pattern",
        header: (
          <span>
            <i>IN</i> Part No.
          </span>
        ),
        width: "max-w-[80px] px-0",
      },
      { key: "category", header: "Category", width: "max-w-[20px] px-0" },
      { key: "denos", header: "Denos.", width: "max-w-[20px] px-0" },
      {
        key: "withdrawl_date_str",
        header: "Withdrawal Date / Survey Date",
        width: "max-w-[40px] px-0",
      },
      { key: "service_no", header: "Service No.", width: "max-w-[40px] px-0" },
      { key: "issue_to", header: "Issued To", width: "max-w-[30px] px-0" },
      {
        key: "withdrawl_qty",
        header: <span>Withdrawal Qty / Survey Qty</span>,
        width: "max-w-[30px] px-0",
      },
      {
        key: "survey_quantity",
        header: "Surveyed Qty",
        width: "max-w-[30px]",
      },
      { key: "remarks_survey", header: "Remarks", width: "max-w-[45px]" },

      ...(user.role != "user"
        ? [{ key: "processed", header: "Proceed", width: "max-w-[25px] px-0" }]
        : []),

      ...(user.role === "officer"
        ? [{ key: "rollback", header: "Rollback", width: "max-w-[45px] px-0" }]
        : []),
    ],
    [user.role],
  );

  const options = [
    { value: "description", label: "Item Description" },
    {
      value: "indian_pattern",
      label: (
        <span>
          <i>IN</i> Part No.
        </span>
      ),
      width: "min-w-[40px]",
    },
    { value: "category", label: "Category" },
    { value: "denos", label: "Denos." },
    { value: "withdrawl_date", label: "Withdrawal Date" },
    { value: "service_no", label: "Service No." },
    { value: "issue_to", label: "Issued To" },
    { value: "remarks_survey", label: "Remarks" },
  ];

  // Rollback states
  const [rollbackDialog, setRollbackDialog] = useState(false);
  const [rollbackChoice, setRollbackChoice] = useState("yes");
  const [rollbackIssueId, setRollbackIssueId] = useState(null);
  const [rollbackItemDesc, setRollbackItemDesc] = useState("");

  // Add survey states
  const [itemsList, setItemsList] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [withdrawlQty, setWithdrawlQty] = useState("");
  const [manualSurveyDate, setManualSurveyDate] = useState(new Date());

  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const [initialItems, setInitialItems] = useState([]);
  const [initialItemsPage, setInitialItemsPage] = useState(1);
  const [hasMoreInitial, setHasMoreInitial] = useState(true);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isSearchingItems, setIsSearchingItems] = useState(false);
  const [searchedItems, setSearchedItems] = useState([]);

  // Category selection states
  const [showCategorySelection, setShowCategorySelection] = useState(false);
  const [tempCategory, setTempCategory] = useState("");
  const [repairStatus, setRepairStatus] = useState(null);

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
    survey: false,
  });
  const [actualSearch, setActualSearch] = useState("");
  const [inputs, setInputs] = useState({
    search: "",
    voucher_no: "",
    survey_calender: new Date(),
    quantity: "",
    remarks: "",
  });
  const [isOpen, setIsOpen] = useState({
    survey: false,
    survey_calender: false,
    addSurvey: false,
  });
  const [selectedRow, setSelectedRow] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCategoryUpdate = async () => {
    if (!tempCategory) {
      toaster("error", "Please select a category");
      return;
    }

    setIsProcessing(true);

    try {
      const itemId = selectedRow.spare_id || selectedRow.tool_id;
      const itemType = selectedRow.spare_id ? "spare" : "tool";

      // Update category
      await apiService.post("/survey/update-category", {
        item_id: itemId,
        item_type: itemType,
        category: tempCategory.toUpperCase(),
      });

      toaster("success", `Category updated to ${tempCategory.toUpperCase()}`);

      if (tempCategory.toUpperCase() === "C") {
        // Move to Demand
        await apiService.post("/survey/move-from-survey", {
          survey_id: selectedRow.id,
          category: tempCategory.toUpperCase(),
        });
        toaster("success", "Item moved to Pending for Demand");
        await fetchdata(currentPage, actualSearch, selectedValues);
        setIsOpen((prev) => ({ ...prev, survey: false }));
        resetSurveyDialog();
      } else if (tempCategory.toUpperCase() === "LP") {
        // Move to Procurement
        await apiService.post("/survey/move-from-survey", {
          survey_id: selectedRow.id,
          category: tempCategory.toUpperCase(),
        });
        toaster("success", "Item moved to Pending for Procurement");
        await fetchdata(currentPage, actualSearch, selectedValues);
        setIsOpen((prev) => ({ ...prev, survey: false }));
        resetSurveyDialog();
      } else if (
        tempCategory.toUpperCase() === "P" ||
        tempCategory.toUpperCase() === "R"
      ) {
        // Update category and continue with survey
        await fetchdata(currentPage, actualSearch, selectedValues);
        setShowCategorySelection(false);
        setTempCategory("");
      }
    } catch (error) {
      console.error("Error:", error);
      toaster("error", error.response?.data?.message || error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRepairStatusChange = (value) => {
    setRepairStatus(value);

    // Check if item has no category and "No" is selected
    if (
      value === "no" &&
      (!selectedRow.category ||
        selectedRow.category === "" ||
        selectedRow.category === null)
    ) {
      setShowCategorySelection(true);
    }
  };

  const handleRollback = (issueId, description) => {
    setRollbackIssueId(issueId);
    setRollbackItemDesc(description);
    setRollbackChoice("yes");
    setRollbackDialog(true);
  };

  const confirmRollback = async () => {
    if (rollbackChoice !== "yes") {
      setRollbackDialog(false);
      return;
    }

    try {
      const response = await apiService.post("/survey/reverse", {
        survey_id: rollbackIssueId,
      });

      if (response.success) {
        toaster("success", "Survey rolled back successfully");
        fetchdata();
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      toaster("error", error.response?.data?.message || error.message);
    } finally {
      setRollbackDialog(false);
    }
  };

  const fetchInitialItems = async (page = 1) => {
    if (isLoadingInitial) return;

    setIsLoadingInitial(true);
    try {
      const response = await apiService.get("/survey/items", {
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

  const searchSurveyItems = async (searchTerm) => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setSearchedItems([]);
      return;
    }

    setIsSearchingItems(true);
    try {
      const response = await apiService.get("/survey/items", {
        params: { search: searchTerm },
      });
      setSearchedItems(response.data.items || []);
    } catch (error) {
      console.error("Error searching items:", error);
      setSearchedItems([]);
    } finally {
      setIsSearchingItems(false);
    }
  };

  useEffect(() => {
    if (isOpen.addSurvey && initialItems.length === 0) {
      fetchInitialItems(1);
    }
  }, [isOpen.addSurvey]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (isItemDropdownOpen && itemSearchTerm) {
        searchSurveyItems(itemSearchTerm);
      } else if (!itemSearchTerm) {
        setSearchedItems([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [itemSearchTerm, isItemDropdownOpen]);

  const resetSurveyDialog = () => {
    setRepairStatus(null);
    setShowCategorySelection(false);
    setTempCategory("");
    setInputs({
      search: "",
      voucher_no: "",
      survey_calender: new Date(),
      quantity: "",
      remarks: "",
    });
    setSelectedRow({});
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isItemDropdownOpen && !event.target.closest(".relative")) {
        setIsItemDropdownOpen(false);
        setItemSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isItemDropdownOpen]);

  const addToDropdown = async (type, value) => {
    try {
      const data = {
        type,
        attr: [value],
      };

      const response = await apiService.post("/config/add", data);
      if (response.success) {
        toaster("success", "Data Added");
        if (type === "survey") {
          await fetchSurveyReason();
        }
      }
    } catch (error) {
      console.error(error);
      toaster("error", "Failed to add");
    }
  };

  const fetchSurveyItems = async () => {
    try {
      const response = await apiService.get("/survey/items");
      setItemsList(response.data.items || []);
    } catch (error) {
      console.error("Error fetching survey items:", error);
      toaster("error", "Failed to fetch items");
    }
  };

  const fetchdata = async (
    page = currentPage,
    search = inputs.search,
    cols = selectedValues,
  ) => {
    try {
      setIsLoading((prev) => ({ ...prev, table: true }));

      const response = await apiService.get("/survey", {
        params: {
          page,
          search,
          // limit: config.row_per_page,
          limit: 2000,
          status: "pending",
          cols: cols.length ? cols.join(",") : "",
        },
      });

      setFetchedData(response.data);
    } catch (error) {
      console.log(error);
      toaster.error(error.response?.data?.message);
    } finally {
      setIsLoading((prev) => ({ ...prev, table: false }));
    }
  };

  useEffect(() => {
    if (isOpen.addSurvey) {
      fetchSurveyItems();
    }
  }, [isOpen.addSurvey]);

  const handleSearch = async () => {
    const searchTerm = inputs.search.trim();
    if (searchTerm === actualSearch) return;

    setActualSearch(searchTerm);
    setIsLoading((prev) => ({ ...prev, search: true }));
    await fetchdata(1, searchTerm, selectedValues);
    setCurrentPage(1);
    setIsLoading((prev) => ({ ...prev, search: false }));
  };

  const handleRefresh = () => {
    setInputs((prev) => ({ ...prev, search: "" }));
    setSelectedValues([]);
    setCurrentPage(1);
    setActualSearch("");
    fetchdata(1, "");
  };

  const handleSurvey = async () => {
    try {
      const qty = Number(inputs.quantity);

      if (!qty || qty < 0) {
        return toaster("error", "Qty must be greater than 0");
      }
      setIsLoading((prev) => ({ ...prev, survey: true }));

      if (repairStatus === "yes") {
        await apiService.post("/demand/repair-stock", {
          spare_id: selectedRow.spare_id,
          tool_id: selectedRow.tool_id,
          repairable_qty: inputs.quantity,
          transaction_id: selectedRow.transaction_id,
        });
        toaster("success", "Item sent to repair stock");
      } else {
        if (!selectedRow.surveyReason) {
          return toaster("error", "Please select reason for survey");
        }
        await apiService.post("/demand/create", {
          spare_id: selectedRow.spare_id,
          tool_id: selectedRow.tool_id,
          survey_qty: inputs.quantity,
          survey_voucher_no: inputs.voucher_no,
          survey_date: formatDate(inputs.survey_calender),
          transaction_id: selectedRow.transaction_id,
          reason_for_survey: selectedRow.surveyReason,
          remarks: inputs.remarks,
        });
        toaster("success", "Survey completed successfully");
      }

      setIsOpen((prev) => ({ ...prev, survey: false }));
      fetchdata();
    } catch (error) {
      toaster("error", error.response?.data?.message);
    } finally {
      setIsLoading((prev) => ({ ...prev, survey: false }));
    }
  };

  const resetAddSurveyDialog = () => {
    setSelectedItem(null);
    setWithdrawlQty("");
    setItemsList([]);
  };

  useEffect(() => {
    fetchdata(currentPage, actualSearch, selectedValues);
  }, [currentPage]);

  // useEffect(() => {
  //   const t = fetchedData.items.map((row) => {
  //     return {
  //       ...row,
  //       survey_quantity: row.survey_quantity || "0",
  //       issue_date: getFormatedDate(row.issue_date),
  //       withdrawl_date_str: row.withdrawl_date
  //         ? getFormatedDate(row.withdrawl_date)
  //         : "---",
  //       created_at: getTimeDate(row.created_at),
  //       status:
  //         row.status?.toLowerCase() == "pending" ? (
  //           <Chip text="Pending" variant="info" />
  //         ) : (
  //           <Chip text="Completed" variant="success" />
  //         ),
  //       processed: (
  //         <Button
  //           size="icon"
  //           disabled={row.issue_to?.toLowerCase() === "special_demand"}
  //           className={`bg-white text-black shadow-md border hover:bg-gray-100
  //             ${row.issue_to?.toLowerCase() === "special_demand" ? "opacity-40 cursor-not-allowed" : ""}`}
  //           onClick={() => handleProceedClick(row)}
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
  //             onClick={() => handleRollback(row.id, row.description)}
  //           >
  //             Rollback
  //           </Button>
  //         ) : null,
  //     };
  //   });
  //   setTableData(t);
  // }, [fetchedData]);

  useEffect(() => {
    const t = fetchedData.items.map((row) => {
      // Check if this is a PTS item (completed status with PTS remarks)
      const isPTS = row.status === "completed" && row.remarks_survey === "PTS";

      return {
        ...row,
        survey_quantity: row.survey_quantity || "0",
        issue_date: getFormatedDate(row.issue_date),
        withdrawl_date_str: row.withdrawl_date
          ? getFormatedDate(row.withdrawl_date)
          : "---",
        created_at: getTimeDate(row.created_at),
        status: isPTS ? (
          <Chip text="PTS" variant="info" />
        ) : row.status?.toLowerCase() == "pending" ? (
          <Chip text="Pending" variant="info" />
        ) : (
          <Chip text="Completed" variant="success" />
        ),
        processed: (
          <Button
            size="icon"
            disabled={
              row.issue_to?.toLowerCase() === "special_demand" || isPTS // Disable for PTS items
            }
            className={`bg-white text-black shadow-md border hover:bg-gray-100
            ${
              row.issue_to?.toLowerCase() === "special_demand" || isPTS
                ? "opacity-40 cursor-not-allowed"
                : ""
            }`}
            onClick={() => handleProceedClick(row)}
          >
            <FaChevronRight />
          </Button>
        ),
        rollback:
          user.role === "officer" && !isPTS ? ( // Don't allow rollback for PTS items
            <Button
              variant="destructive"
              className="bg-red-600 text-white hover:bg-red-700"
              size="sm"
              onClick={() => handleRollback(row.id, row.description)}
            >
              Rollback
            </Button>
          ) : null,
      };
    });
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
          placeholder="Search Survey Items"
          className="bg-white"
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
          onClick={() => setIsOpen((prev) => ({ ...prev, addSurvey: true }))}
        >
          <Plus className="size-4" />
          Add Survey
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
            hover:bg-gray-200 hover:scale-105 transition-all duration-200"
          onClick={handleRefresh}
          title="Reset Search"
        >
          <IoMdRefresh
            className="size-7 font-bold hover:rotate-180 transition-transform duration-300"
            style={{
              color: "#109240",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          />
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

      {/* Main Survey Dialog */}
      <Dialog
        open={isOpen.survey}
        onOpenChange={(open) => {
          if (!open) resetSurveyDialog();
          setIsOpen((prev) => ({ ...prev, survey: open }));
        }}
      >
        <DialogContent
          onPointerDownOutside={(e) => {
            e.preventDefault();
          }}
          className="unbounded w-full !max-w-2xl"
        >
          <div className="sticky top-0 z-10 bg-background grid grid-cols-2 items-center pb-2 border-b">
            <DialogTitle className="capitalize">
              Issue {selectedRow.spare_id ? "spare" : "tool"}
            </DialogTitle>
            <button
              type="button"
              onClick={() => {
                resetSurveyDialog();
                setIsOpen((prev) => ({ ...prev, survey: false }));
              }}
              className="justify-self-end rounded-md p-1 transition"
            >
              ✕
            </button>
          </div>

          {/* Show category selection after "No" is selected for items without category */}
          {showCategorySelection ? (
            <>
              <div className="mt-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ This item doesn't have a category assigned. Please select
                    a category to proceed.
                  </p>
                </div>

                <Label className="mb-2 block">
                  Category <span className="text-red-500">*</span>
                </Label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={tempCategory}
                  onChange={(e) => setTempCategory(e.target.value)}
                >
                  <option value="">Select Category</option>
                  <option value="P">P</option>
                  <option value="R">R</option>
                  <option value="C">C</option>
                  <option value="LP">LP</option>
                </select>

                <div className="mt-3 text-sm text-gray-600">
                  <p className="font-semibold">Note:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>
                      If you select{" "}
                      <span className="font-semibold text-red-600">C</span>:
                      Item will be moved to{" "}
                      <span className="font-semibold">Pending for Demand</span>
                    </li>
                    <li>
                      If you select{" "}
                      <span className="font-semibold text-blue-600">LP</span>:
                      Item will be moved to{" "}
                      <span className="font-semibold">
                        Pending for Procurement
                      </span>
                    </li>
                    <li>
                      If you select{" "}
                      <span className="font-semibold text-gray-900">
                        P or R
                      </span>
                      : Item will remain in{" "}
                      <span className="font-semibold">
                        Survey with the updated category
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center mt-4 gap-4 justify-end">
                <Button
                  variant="destructive"
                  onClick={() => {
                    resetSurveyDialog();
                    setIsOpen((prev) => ({ ...prev, survey: false }));
                  }}
                >
                  Cancel
                </Button>
                <SpinnerButton
                  loading={isProcessing}
                  disabled={isProcessing || !tempCategory}
                  loadingText="Processing..."
                  className="text-white hover:bg-primary/85 cursor-pointer"
                  onClick={handleCategoryUpdate}
                >
                  Proceed
                </SpinnerButton>
              </div>
            </>
          ) : (
            <>
              {/* Normal Survey Flow */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-1 mb-3">
                  <span className="font-semibold text-gray-700">
                    Item Description:
                  </span>
                  <span className="text-gray-900">
                    {selectedRow?.description || "-"}
                  </span>
                </div>

                <div className="flex flex-col gap-2 mb-3">
                  <Label className="font-semibold">
                    Item Repaired / Serviceable?
                  </Label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="repairStatus"
                        value="yes"
                        checked={repairStatus === "yes"}
                        onChange={() => handleRepairStatusChange("yes")}
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="repairStatus"
                        value="no"
                        checked={repairStatus === "no"}
                        onChange={() => handleRepairStatusChange("no")}
                      />
                      No
                    </label>
                  </div>
                </div>
              </div>

              <DialogDescription className="hidden" />

              {repairStatus === "yes" && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label>Withdrawal Qty</Label>
                    <Input value={selectedRow?.withdrawl_qty ?? 0} readOnly />
                  </div>
                  <div>
                    <Label>Previously Stocked In Qty</Label>
                    <Input value={selectedRow?.survey_quantity ?? 0} readOnly />
                  </div>
                  <div>
                    <Label>
                      Repairable Qty <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Enter Repairable Qty"
                      value={inputs.quantity}
                      onChange={(e) =>
                        setInputs((prev) => ({
                          ...prev,
                          quantity: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              )}

              {repairStatus === "no" && (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label>Withdrawal Qty</Label>
                      <Input value={selectedRow?.withdrawl_qty ?? 0} readOnly />
                    </div>
                    <div>
                      <Label>Previously Surveyed Qty</Label>
                      <Input
                        value={selectedRow?.survey_quantity ?? 0}
                        readOnly
                      />
                    </div>
                    <div>
                      <Label>
                        Survey Qty <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Enter Survey Qty"
                        value={inputs.quantity}
                        onChange={(e) =>
                          setInputs((prev) => ({
                            ...prev,
                            quantity: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>
                        Survey Voucher No.{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="Enter Survey Voucher No."
                        value={inputs.voucher_no}
                        onChange={(e) =>
                          setInputs((prev) => ({
                            ...prev,
                            voucher_no: e.target.value.toUpperCase(),
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Label>
                        Survey Date <span className="text-red-500">*</span>
                      </Label>
                      <Popover
                        open={isOpen.survey_calender}
                        onOpenChange={(set) =>
                          setIsOpen((prev) => ({
                            ...prev,
                            survey_calender: set,
                          }))
                        }
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between font-normal"
                          >
                            {inputs.survey_calender
                              ? getFormatedDate(inputs.survey_calender)
                              : "Select date"}
                            <ChevronDownIcon />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={inputs.survey_calender}
                            captionLayout="dropdown"
                            onSelect={(date) => {
                              setInputs((prev) => ({
                                ...prev,
                                survey_calender: date,
                              }));
                              setIsOpen((prev) => ({
                                ...prev,
                                survey_calender: false,
                              }));
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="flex flex-col gap-1 w-full mt-4">
                      <label className="text-sm font-medium text-gray-700">
                        Reason For Survey{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <ComboBox
                        options={surveyReason}
                        className="w-[300px]"
                        placeholder="Select reasons.."
                        onCustomAdd={async (value) => {
                          await addToDropdown("survey", value.name);
                        }}
                        onSelect={(value) => {
                          setSelectedRow((prev) => ({
                            ...prev,
                            surveyReason: value.name,
                          }));
                        }}
                        onDelete={async (value) => {
                          try {
                            await apiService.delete(`/config/${value.id}`);
                            await fetchSurveyReason();
                            toaster("success", "Deleted Successfully");
                          } catch (error) {
                            toaster("error", "Failed to delete the item");
                          }
                        }}
                      />
                    </div>

                    <div className="mt-4">
                      <Label>Remarks</Label>
                      <Input
                        className="mt-2"
                        placeholder="Remarks"
                        value={inputs.remarks}
                        onChange={(e) =>
                          setInputs((prev) => ({
                            ...prev,
                            remarks: e.target.value.toUpperCase(),
                          }))
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              {(repairStatus === "yes" || repairStatus === "no") && (
                <div className="flex items-center mt-4 gap-4 justify-end">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      resetSurveyDialog();
                      setIsOpen((prev) => ({ ...prev, survey: false }));
                    }}
                  >
                    Cancel
                  </Button>
                  <SpinnerButton
                    loading={isLoading.survey}
                    disabled={isLoading.survey}
                    loadingText="Submitting..."
                    className="text-white hover:bg-primary/85 cursor-pointer"
                    onClick={handleSurvey}
                  >
                    Submit
                  </SpinnerButton>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Rollback Dialog */}
      <Dialog open={rollbackDialog} onOpenChange={setRollbackDialog}>
        <DialogContent className="w-[420px] p-6">
          <DialogTitle>
            Rollback:{" "}
            <span className="text-sm">{rollbackItemDesc || "Item"}</span>
          </DialogTitle>
          <div className="mt-4">
            <p className="mb-3 text-sm text-gray-700">
              Are you sure you want to rollback this Survey?
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

      {/* Add Survey Dialog */}
      <Dialog
        open={isOpen.addSurvey}
        onOpenChange={(open) => {
          if (!open) {
            resetAddSurveyDialog();
            setItemSearchTerm("");
            setSearchedItems([]);
            setIsItemDropdownOpen(false);
            setManualSurveyDate(new Date());
          }
          setIsOpen((prev) => ({ ...prev, addSurvey: open }));
        }}
      >
        <DialogContent
          showCloseButton
          onPointerDownOutside={(e) => {
            e.preventDefault();
          }}
          className="max-w-lg"
        >
          <DialogTitle>Add Survey Item</DialogTitle>

          {/* Select Item - Searchable Combobox */}
          <div className="mt-4">
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
                    className={selectedItem ? "text-gray-900" : "text-gray-400"}
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
                                    onClick={() => {
                                      setSelectedItem(item);
                                      setIsItemDropdownOpen(false);
                                      setItemSearchTerm("");
                                      setSearchedItems([]);
                                    }}
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
                              Popular Items (First {initialItems.length} of{" "}
                              {initialItems.length}+)
                            </div>
                            {initialItems.map((item) => (
                              <div
                                key={`${item.type}-${item.id}`}
                                className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setIsItemDropdownOpen(false);
                                  setItemSearchTerm("");
                                }}
                              >
                                <div className="flex-1">
                                  <div className="font-medium">
                                    {item.description}
                                    <span className="ml-2 text-xs text-gray-500">
                                      ({item.category})
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1 space-x-2">
                                    <span className="font-semibold">Type:</span>
                                    <span className="text-blue-600 font-semibold">
                                      {item.type === "spare" ? "SPARE" : "TOOL"}
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
                                    : "Load More (200 more)"}
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
                      Item Code:
                    </span>
                    <span className="ml-2 text-gray-700 font-mono text-xs">
                      {selectedItem.item_code || "--"}
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

          {/* Qty to be surveyed - Always visible */}
          <div className="mt-4">
            <Label>
              Qty to be surveyed <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              min="1"
              placeholder="Enter Survey Qty"
              value={withdrawlQty}
              onChange={(e) => setWithdrawlQty(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="mt-4 mb-1">
              To be Surveyed Date <span className="text-red-500">*</span>
            </Label>

            <Popover
              open={isOpen.survey_calender}
              onOpenChange={(set) =>
                setIsOpen((prev) => ({ ...prev, survey_calender: set }))
              }
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between font-normal"
                >
                  {manualSurveyDate
                    ? getFormatedDate(manualSurveyDate)
                    : "Select date"}
                  <ChevronDownIcon />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={manualSurveyDate}
                  captionLayout="dropdown"
                  onSelect={(date) => {
                    setManualSurveyDate(date);
                    setIsOpen((prev) => ({
                      ...prev,
                      survey_calender: false,
                    }));
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
                resetAddSurveyDialog();
                setIsOpen((prev) => ({ ...prev, addSurvey: false }));
                setItemSearchTerm("");
                setSelectedItem(null);
                setIsItemDropdownOpen(false);
                setSearchedItems([]);
              }}
            >
              Cancel
            </Button>

            <Button
              className="text-white"
              onClick={async () => {
                if (!selectedItem) {
                  return toaster("error", "Please select an item");
                }

                if (!withdrawlQty || withdrawlQty <= 0) {
                  return toaster(
                    "error",
                    "Please enter a valid quantity greater than 0",
                  );
                }

                if (!manualSurveyDate) {
                  return toaster("error", "Please select a survey date");
                }

                try {
                  await apiService.post("/survey/manual-add", {
                    spare_id:
                      selectedItem.type === "spare" ? selectedItem.id : null,
                    tool_id:
                      selectedItem.type === "tool" ? selectedItem.id : null,
                    withdrawl_qty: parseInt(withdrawlQty),
                    survey_date: formatDate(manualSurveyDate),
                  });

                  toaster("success", "Survey item added successfully");

                  resetAddSurveyDialog();
                  setIsOpen((prev) => ({ ...prev, addSurvey: false }));
                  setItemSearchTerm("");
                  setSelectedItem(null);
                  setIsItemDropdownOpen(false);
                  setSearchedItems([]);
                  setManualSurveyDate(new Date());
                  fetchdata();
                } catch (error) {
                  console.error("Error adding survey item:", error);
                  toaster(
                    "error",
                    error.response?.data?.message ||
                      "Failed to add survey item",
                  );
                }
              }}
            >
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PendingSurvey;