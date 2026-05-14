// import { useState, useEffect, useContext, useMemo, useRef } from "react";
// import {
//   FaPlus,
//   FaEdit,
//   FaTrash,
//   FaSave,
//   FaTimes,
//   FaSearch,
//   FaChevronLeft,
//   FaChevronRight,
//   FaCheckCircle,
//   FaInfoCircle,
//   FaTools,
//   FaTags,
//   FaBarcode,
//   FaLayerGroup,
//   FaExclamationTriangle,
//   FaFilter,
//   FaChevronDown,
//   FaCube,
// } from "react-icons/fa";
// import { Button } from "../components/ui/button";
// import { Input } from "../components/ui/input";
// import { Label } from "../components/ui/label";
// import {
//   Dialog,
//   DialogContent,
//   DialogTitle,
//   DialogFooter,
// } from "../components/ui/dialog";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "../components/ui/table";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "../components/ui/card";
// import { Checkbox } from "../components/ui/checkbox";
// import toaster from "../utils/toaster";
// import apiService from "../utils/apiService";
// import { Context } from "../utils/Context";
// import { cn } from "../lib/utils";

// // Custom Searchable Select Component
// const SearchableSelect = ({ options, value, onChange, placeholder, label }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const dropdownRef = useRef(null);
//   const inputRef = useRef(null);

//   const filteredOptions = useMemo(() => {
//     if (!searchTerm) return options;
//     return options.filter((option) =>
//       option.name?.toLowerCase().includes(searchTerm.toLowerCase()),
//     );
//   }, [options, searchTerm]);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setIsOpen(false);
//         setSearchTerm("");
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const selectedOption = options.find((opt) => opt.name === value);

//   return (
//     <div className="relative" ref={dropdownRef}>
//       {label && (
//         <Label className="text-sm font-semibold mb-1 block">{label}</Label>
//       )}
//       <div
//         className="w-full border rounded-md px-3 py-2 cursor-pointer bg-white flex justify-between items-center"
//         onClick={() => {
//           setIsOpen(!isOpen);
//           if (!isOpen) setTimeout(() => inputRef.current?.focus(), 100);
//         }}
//       >
//         <span className={!selectedOption ? "text-gray-400" : "text-gray-900"}>
//           {selectedOption ? selectedOption.name : placeholder || "Select..."}
//         </span>
//         <FaChevronDown
//           className={cn(
//             "transition-transform duration-200",
//             isOpen && "transform rotate-180",
//           )}
//         />
//       </div>

//       {isOpen && (
//         <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-80 overflow-hidden">
//           <div className="p-2 border-b">
//             <div className="relative">
//               <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
//               <input
//                 ref={inputRef}
//                 type="text"
//                 placeholder="Search equipment..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//           </div>
//           <div className="overflow-y-auto max-h-64">
//             {filteredOptions.length === 0 ? (
//               <div className="p-4 text-center text-gray-500 text-sm">
//                 No equipment found
//               </div>
//             ) : (
//               filteredOptions.map((option) => (
//                 <div
//                   key={option.id || option.name}
//                   className={cn(
//                     "px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm",
//                     value === option.name && "bg-blue-100 text-blue-700",
//                   )}
//                   onClick={() => {
//                     onChange(option.name);
//                     setIsOpen(false);
//                     setSearchTerm("");
//                   }}
//                 >
//                   {option.name}
//                 </div>
//               ))
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// const ToolsForRoutines = () => {
//   const { equipment_system } = useContext(Context);

//   const [selectedEquipment, setSelectedEquipment] = useState("");
//   const [selectedRoutine, setSelectedRoutine] = useState(null);
//   const [routines, setRoutines] = useState([]);
//   const [availableTools, setAvailableTools] = useState([]);
//   const [assignedTools, setAssignedTools] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isFetchingTools, setIsFetchingTools] = useState(false);
//   const [editingRoutine, setEditingRoutine] = useState(null);
//   const [newRoutineName, setNewRoutineName] = useState("");
//   const [newRoutineDescription, setNewRoutineDescription] = useState("");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [equipmentFilter, setEquipmentFilter] = useState("all");
//   const [categoryFilter, setCategoryFilter] = useState("all");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage] = useState(10);

//   // New routine dialog states
//   const [isRoutineDialogOpen, setIsRoutineDialogOpen] = useState(false);
//   const [tempSelectedTools, setTempSelectedTools] = useState([]);
//   const [tempSelectedToolsWithQty, setTempSelectedToolsWithQty] = useState({});
//   const [currentStep, setCurrentStep] = useState(1);
//   const [selectAllPage, setSelectAllPage] = useState(false);
//   const [showQtyModal, setShowQtyModal] = useState(false);
//   const [pendingToolForQty, setPendingToolForQty] = useState(null);

//   // Fetch all tools from master inventory
//   const fetchAvailableTools = async () => {
//     try {
//       const response = await apiService.get("/tools/all", {
//         params: { limit: 1000 },
//       });
//       setAvailableTools(response.data.items || []);
//     } catch (error) {
//       console.error("Failed to fetch tools:", error);
//       toaster("error", "Failed to fetch tools");
//     }
//   };

//   // Fetch routines for selected equipment
//   const fetchRoutines = async (equipmentName) => {
//     if (!equipmentName) return;
//     setIsLoading(true);
//     try {
//       const response = await apiService.get(
//         `/routinesTool/equipment/${encodeURIComponent(equipmentName)}`,
//       );
//       console.log("Fetched routines:", response.data);
//       setRoutines(response.data || []);
//     } catch (error) {
//       console.error("Failed to fetch routines:", error);
//       toaster("error", "Failed to fetch routines");
//       setRoutines([]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Fetch tools assigned to a routine
//   const fetchRoutineTools = async (routineId) => {
//     if (!routineId) return;
//     setIsFetchingTools(true);
//     try {
//       const response = await apiService.get(`/routinesTool/${routineId}/tools`);
//       console.log("Fetched assigned tools:", response.data);
//       setAssignedTools(response.data || []);
//     } catch (error) {
//       console.error("Failed to fetch routine tools:", error);
//       toaster("error", "Failed to fetch routine tools");
//       setAssignedTools([]);
//     } finally {
//       setIsFetchingTools(false);
//     }
//   };

//   // Fetch complete routine details for editing
//   const fetchRoutineDetails = async (routineId) => {
//     try {
//       const response = await apiService.get(`/routinesTool/${routineId}/tools`);
//       return response.data || [];
//     } catch (error) {
//       console.error("Failed to fetch routine details:", error);
//       return [];
//     }
//   };

//   // Handle equipment selection change
//   const handleEquipmentChange = (equipmentName) => {
//     setSelectedEquipment(equipmentName);
//     setSelectedRoutine(null);
//     setAssignedTools([]);
//     if (equipmentName) {
//       fetchRoutines(equipmentName);
//     } else {
//       setRoutines([]);
//     }
//   };

//   // Handle routine selection change
//   const handleRoutineChange = (routine) => {
//     console.log("Selected routine:", routine);
//     setSelectedRoutine(routine);
//     if (routine && routine.id) {
//       fetchRoutineTools(routine.id);
//     } else {
//       setAssignedTools([]);
//     }
//   };

//   // Open dialog to add/edit routine
//   const openRoutineDialog = async (routine = null) => {
//     setEditingRoutine(routine);
//     setNewRoutineName(routine ? routine.name : "");
//     setNewRoutineDescription(routine ? routine.description || "" : "");

//     if (routine && routine.id) {
//       setIsLoading(true);
//       try {
//         const routineTools = await fetchRoutineDetails(routine.id);
//         const toolIds = routineTools.map((t) => t.id);
//         const qtyMap = {};
//         routineTools.forEach((t) => {
//           qtyMap[t.id] = t.quantity_required || 1;
//         });
//         setTempSelectedTools(toolIds);
//         setTempSelectedToolsWithQty(qtyMap);
//         console.log("Loaded tools for edit:", toolIds, qtyMap);
//       } catch (error) {
//         console.error("Failed to load routine tools:", error);
//         setTempSelectedTools([]);
//         setTempSelectedToolsWithQty({});
//       } finally {
//         setIsLoading(false);
//       }
//     } else {
//       setTempSelectedTools([]);
//       setTempSelectedToolsWithQty({});
//     }

//     setCurrentStep(1);
//     setSearchTerm("");
//     setEquipmentFilter("all");
//     setCategoryFilter("all");
//     setCurrentPage(1);
//     setSelectAllPage(false);
//     setIsRoutineDialogOpen(true);
//   };

//   // Toggle tool selection with quantity prompt
//   const toggleToolSelection = (tool) => {
//     if (tempSelectedTools.includes(tool.id)) {
//       setTempSelectedTools((prev) => prev.filter((id) => id !== tool.id));
//       const newQtyMap = { ...tempSelectedToolsWithQty };
//       delete newQtyMap[tool.id];
//       setTempSelectedToolsWithQty(newQtyMap);
//     } else {
//       setPendingToolForQty(tool);
//       setShowQtyModal(true);
//     }
//   };

//   // Handle quantity submission
//   const handleQuantitySubmit = (quantity) => {
//     if (pendingToolForQty) {
//       setTempSelectedTools((prev) => [...prev, pendingToolForQty.id]);
//       setTempSelectedToolsWithQty((prev) => ({
//         ...prev,
//         [pendingToolForQty.id]: quantity,
//       }));
//       setShowQtyModal(false);
//       setPendingToolForQty(null);
//     }
//   };

//   // Save routine (create or update)
//   const saveRoutine = async () => {
//     if (!newRoutineName.trim()) {
//       toaster("error", "Routine name is required");
//       return;
//     }

//     if (!selectedEquipment) {
//       toaster("error", "Please select equipment first");
//       return;
//     }

//     if (tempSelectedTools.length === 0) {
//       toaster("error", "Please select at least one tool for this routine");
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const payload = {
//         name: newRoutineName.trim(),
//         description: newRoutineDescription.trim(),
//         equipment_system: selectedEquipment,
//         tools: tempSelectedTools.map((id) => ({
//           id: id,
//           quantity_required: tempSelectedToolsWithQty[id] || 1,
//         })),
//       };

//       let response;
//       if (editingRoutine) {
//         response = await apiService.put(
//           `/routinesTool/${editingRoutine.id}`,
//           payload,
//         );
//       } else {
//         response = await apiService.post("/routinesTool", payload);
//       }

//       if (response.success) {
//         toaster(
//           "success",
//           editingRoutine ? "Routine updated" : "Routine created",
//         );
//         setIsRoutineDialogOpen(false);
//         await fetchRoutines(selectedEquipment);
//         if (editingRoutine && selectedRoutine?.id === editingRoutine.id) {
//           await fetchRoutineTools(editingRoutine.id);
//         }
//         resetDialogState();
//       } else {
//         toaster("error", response.message || "Failed to save routine");
//       }
//     } catch (error) {
//       console.error("Failed to save routine:", error);
//       toaster(
//         "error",
//         error.response?.data?.message || "Failed to save routine",
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Reset dialog state
//   const resetDialogState = () => {
//     setEditingRoutine(null);
//     setNewRoutineName("");
//     setNewRoutineDescription("");
//     setTempSelectedTools([]);
//     setTempSelectedToolsWithQty({});
//     setSearchTerm("");
//     setEquipmentFilter("all");
//     setCategoryFilter("all");
//     setCurrentPage(1);
//     setSelectAllPage(false);
//     setCurrentStep(1);
//   };

//   // Delete routine
//   const deleteRoutine = async (routineId) => {
//     if (!confirm("Are you sure you want to delete this routine?")) return;

//     setIsLoading(true);
//     try {
//       const response = await apiService.delete(`/routinesTool/${routineId}`);
//       if (response.success) {
//         toaster("success", "Routine deleted");
//         if (selectedRoutine?.id === routineId) {
//           setSelectedRoutine(null);
//           setAssignedTools([]);
//         }
//         await fetchRoutines(selectedEquipment);
//       } else {
//         toaster("error", response.message || "Failed to delete routine");
//       }
//     } catch (error) {
//       console.error("Failed to delete routine:", error);
//       toaster("error", "Failed to delete routine");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Get unique equipment names for filter
//   const uniqueEquipment = useMemo(() => {
//     const equipment = new Set();
//     availableTools.forEach((tool) => {
//       if (tool.equipment_system) equipment.add(tool.equipment_system);
//     });
//     return Array.from(equipment).sort();
//   }, [availableTools]);

//   // Get unique categories for filter
//   const uniqueCategories = useMemo(() => {
//     const categories = new Set();
//     availableTools.forEach((tool) => {
//       if (tool.category) categories.add(tool.category);
//     });
//     return Array.from(categories).sort();
//   }, [availableTools]);

//   // Filter tools based on search term, equipment, and category
//   const filteredAvailableTools = useMemo(() => {
//     let filtered = availableTools;

//     if (searchTerm) {
//       filtered = filtered.filter(
//         (tool) =>
//           tool.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           tool.indian_pattern
//             ?.toLowerCase()
//             .includes(searchTerm.toLowerCase()) ||
//           tool.item_code?.toLowerCase().includes(searchTerm.toLowerCase()),
//       );
//     }

//     if (equipmentFilter !== "all") {
//       filtered = filtered.filter(
//         (tool) => tool.equipment_system === equipmentFilter,
//       );
//     }

//     if (categoryFilter !== "all") {
//       filtered = filtered.filter((tool) => tool.category === categoryFilter);
//     }

//     return filtered;
//   }, [availableTools, searchTerm, equipmentFilter, categoryFilter]);

//   // Check if a tool is already in the routine
//   const isToolAlreadyInRoutine = (toolId) => {
//     return assignedTools.some((tool) => tool.id === toolId);
//   };

//   // Pagination
//   const totalPages = Math.ceil(filteredAvailableTools.length / itemsPerPage);
//   const paginatedTools = filteredAvailableTools.slice(
//     (currentPage - 1) * itemsPerPage,
//     currentPage * itemsPerPage,
//   );

//   // Get selected tools details
//   const selectedToolsDetails = useMemo(() => {
//     return availableTools.filter((tool) => tempSelectedTools.includes(tool.id));
//   }, [availableTools, tempSelectedTools]);

//   useEffect(() => {
//     fetchAvailableTools();
//   }, []);

//   // Reset page when filters change
//   useEffect(() => {
//     setCurrentPage(1);
//     setSelectAllPage(false);
//   }, [searchTerm, equipmentFilter, categoryFilter]);

//   // Quantity Modal Component
//   const QuantityModal = () => (
//     <Dialog open={showQtyModal} onOpenChange={setShowQtyModal}>
//       <DialogContent className="max-w-md">
//         <DialogTitle>Enter Quantity Required</DialogTitle>
//         <div className="py-4">
//           <Label className="text-sm font-semibold">
//             {pendingToolForQty?.description}
//           </Label>
//           <Input
//             type="number"
//             min="1"
//             defaultValue="1"
//             id="quantity-input"
//             className="mt-2"
//             autoFocus
//             onKeyPress={(e) => {
//               if (e.key === "Enter") {
//                 const qty = parseInt(e.target.value);
//                 if (!isNaN(qty) && qty > 0) {
//                   handleQuantitySubmit(qty);
//                 }
//               }
//             }}
//           />
//         </div>
//         <DialogFooter>
//           <Button variant="outline" onClick={() => setShowQtyModal(false)}>
//             Cancel
//           </Button>
//           <Button
//             onClick={() => {
//               const input = document.getElementById("quantity-input");
//               const qty = parseInt(input?.value);
//               if (!isNaN(qty) && qty > 0) {
//                 handleQuantitySubmit(qty);
//               } else {
//                 toaster("error", "Please enter a valid quantity");
//               }
//             }}
//           >
//             Add Tool
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );

//   return (
//     <div className="p-4 h-full">
//       <QuantityModal />

//       <div className="grid grid-cols-12 gap-4 h-full">
//         {/* Left Panel - Equipment & Routine Selection */}
//         <div className="col-span-3 space-y-4">
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-lg">DA - 250 HOURLY</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <SearchableSelect
//                 options={equipment_system || []}
//                 value={selectedEquipment}
//                 onChange={handleEquipmentChange}
//                 placeholder="Select Equipment..."
//                 label="Select Equipment"
//               />
//             </CardContent>
//           </Card>

//           {selectedEquipment && (
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between">
//                 <CardTitle className="text-lg">Routines</CardTitle>
//                 <Button
//                   size="sm"
//                   onClick={() => openRoutineDialog()}
//                   className="h-8"
//                 >
//                   <FaPlus className="h-3 w-3 mr-1" />
//                   Add Routine
//                 </Button>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-2 max-h-[400px] overflow-y-auto">
//                   {isLoading ? (
//                     <div className="text-center py-4">Loading...</div>
//                   ) : routines.length === 0 ? (
//                     <div className="text-center py-4 text-gray-500">
//                       No routines found. Click "Add Routine" to create one.
//                     </div>
//                   ) : (
//                     routines.map((routine) => (
//                       <div
//                         key={routine.id}
//                         className={cn(
//                           "p-3 border rounded-lg cursor-pointer transition-all flex justify-between items-center",
//                           selectedRoutine?.id === routine.id
//                             ? "bg-blue-100 border-blue-500"
//                             : "hover:bg-gray-50",
//                         )}
//                         onClick={() => handleRoutineChange(routine)}
//                       >
//                         <div className="flex-1">
//                           <span className="font-medium">{routine.name}</span>
//                           {routine.description && (
//                             <p className="text-xs text-gray-500 mt-1">
//                               {routine.description}
//                             </p>
//                           )}
//                           <span className="inline-block mt-1 text-xs bg-gray-100 px-2 py-0.5 rounded">
//                             {routine.total_tools || 0} tools
//                           </span>
//                         </div>
//                         <div className="flex gap-2">
//                           <button
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               openRoutineDialog(routine);
//                             }}
//                             className="text-blue-600 hover:text-blue-800"
//                           >
//                             <FaEdit className="h-4 w-4" />
//                           </button>
//                           <button
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               deleteRoutine(routine.id);
//                             }}
//                             className="text-red-600 hover:text-red-800"
//                           >
//                             <FaTrash className="h-4 w-4" />
//                           </button>
//                         </div>
//                       </div>
//                     ))
//                   )}
//                 </div>
//               </CardContent>
//             </Card>
//           )}
//         </div>

//         {/* Right Panel - Tools List */}
//         <div className="col-span-9">
//           <Card className="h-full">
//             <CardHeader>
//               <CardTitle className="text-lg">
//                 {selectedRoutine
//                   ? `Tools for "${selectedRoutine.name}"`
//                   : "Select a routine to view Tools"}
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               {!selectedRoutine ? (
//                 <div className="flex flex-col items-center justify-center py-12 text-gray-500">
//                   <FaTools className="h-12 w-12 mb-3 text-gray-300" />
//                   <p className="text-lg font-medium">No Routine Selected</p>
//                   <p className="text-sm">
//                     Please select a routine from the left panel to view its
//                     tools
//                   </p>
//                 </div>
//               ) : isFetchingTools ? (
//                 <div className="flex items-center justify-center py-12">
//                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//                   <span className="ml-2">Loading tools...</span>
//                 </div>
//               ) : assignedTools.length === 0 ? (
//                 <div className="flex flex-col items-center justify-center py-12 text-gray-500">
//                   <FaExclamationTriangle className="h-12 w-12 mb-3 text-yellow-400" />
//                   <p className="text-lg font-medium">No Tools Assigned</p>
//                   <p className="text-sm">
//                     This routine has no tools assigned yet.
//                   </p>
//                   <Button
//                     variant="outline"
//                     className="mt-4"
//                     onClick={() => openRoutineDialog(selectedRoutine)}
//                   >
//                     <FaEdit className="mr-2 h-4 w-4" />
//                     Edit Routine to Add Tools
//                   </Button>
//                 </div>
//               ) : (
//                 <div className="overflow-x-auto">
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead>Item Description</TableHead>
//                         <TableHead>IN Part No.</TableHead>
//                         <TableHead>Item Code</TableHead>
//                         <TableHead>Category</TableHead>
//                         <TableHead>Qty Required</TableHead>
//                         <TableHead>OBS Maintained</TableHead>
//                         <TableHead>OBS Held</TableHead>
//                         {/* <TableHead>Box No.</TableHead>
//                         <TableHead>Item Distribution</TableHead> */}
//                         <TableHead>Storage Location</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {assignedTools.map((tool) => (
//                         <TableRow key={tool.id}>
//                           <TableCell className="font-medium">
//                             {tool.description || "--"}
//                             {tool.critical_tool === 1 && (
//                               <span className="ml-2 inline-block px-1 py-0.5 text-xs bg-red-100 text-red-700 rounded">
//                                 Critical
//                               </span>
//                             )}
//                           </TableCell>
//                           <TableCell>{tool.indian_pattern || "--"}</TableCell>
//                           <TableCell>{tool.item_code || "--"}</TableCell>
//                           <TableCell>{tool.category || "--"}</TableCell>
//                           <TableCell>
//                             <span className="font-semibold text-blue-600">
//                               {tool.quantity_required || 1}
//                             </span>
//                           </TableCell>
//                           <TableCell>{tool.obs_maintained || 0}</TableCell>
//                           <TableCell>{tool.obs_held || 0}</TableCell>
//                           <TableCell>
//                             {tool.box_no ? (
//                               <div className="text-xs space-y-1">
//                                 {(() => {
//                                   try {
//                                     const boxes = JSON.parse(tool.box_no);
//                                     return boxes.map((b, idx) => (
//                                       <div
//                                         key={idx}
//                                         className="whitespace-nowrap"
//                                       >
//                                         📦 {b.location}
//                                       </div>
//                                     ));
//                                   } catch {
//                                     return tool.box_no;
//                                   }
//                                 })()}
//                               </div>
//                             ) : (
//                               "--"
//                             )}
//                           </TableCell>
//                           {/* <TableCell>
//                             {tool.item_distribution || "--"}
//                           </TableCell>
//                           <TableCell>{tool.storage_location || "--"}</TableCell> */}
//                         </TableRow>
//                       ))}
//                     </TableBody>
//                   </Table>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </div>
//       </div>

//       {/* Add/Edit Routine Dialog */}
//       <Dialog open={isRoutineDialogOpen} onOpenChange={setIsRoutineDialogOpen}>
//         <DialogContent
//           className="!max-w-[90vw] w-[90vw] max-h-[90vh] overflow-y-auto"
//           style={{ maxWidth: "90vw", width: "90vw" }}
//         >
//           <DialogTitle className="text-xl">
//             {editingRoutine ? "Edit Routine" : "Create New Routine"}
//           </DialogTitle>

//           {/* Step 1: Basic Details */}
//           {currentStep === 1 && (
//             <div className="space-y-4">
//               <div>
//                 <Label className="text-sm font-semibold">
//                   Routine Name <span className="text-red-500">*</span>
//                 </Label>
//                 <Input
//                   value={newRoutineName}
//                   onChange={(e) => setNewRoutineName(e.target.value)}
//                   placeholder="e.g., Daily Inspection, Weekly Maintenance"
//                   className="mt-1"
//                   autoFocus
//                 />
//               </div>

//               <div>
//                 <Label className="text-sm font-semibold">
//                   Description (Optional)
//                 </Label>
//                 <textarea
//                   value={newRoutineDescription}
//                   onChange={(e) => setNewRoutineDescription(e.target.value)}
//                   placeholder="Describe what this routine entails..."
//                   className="w-full border rounded-md px-3 py-2 mt-1 min-h-[100px] resize-vertical"
//                 />
//               </div>

//               <div className="bg-blue-50 p-4 rounded-lg">
//                 <div className="flex items-start gap-2">
//                   <FaInfoCircle className="text-blue-500 mt-0.5" />
//                   <div className="text-sm text-blue-800">
//                     <p className="font-semibold mb-1">Equipment Selected:</p>
//                     <p>{selectedEquipment || "Not selected yet"}</p>
//                   </div>
//                 </div>
//               </div>

//               {editingRoutine && tempSelectedTools.length > 0 && (
//                 <div className="bg-green-50 p-4 rounded-lg">
//                   <div className="flex items-center gap-2">
//                     <FaCheckCircle className="text-green-500" />
//                     <div className="text-sm text-green-800">
//                       <p className="font-semibold">Currently selected tools:</p>
//                       <p>
//                         {tempSelectedTools.length} tools with total quantity{" "}
//                         {Object.values(tempSelectedToolsWithQty).reduce(
//                           (a, b) => a + b,
//                           0,
//                         )}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Step 2: Select Tools with Equipment Filter */}
//           {currentStep === 2 && (
//             <div className="space-y-4">
//               {/* Filter Section */}
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//                 <div className="relative">
//                   <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                   <Input
//                     placeholder="Search tools..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="pl-9"
//                   />
//                 </div>

//                 <div className="relative">
//                   <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                   <select
//                     value={equipmentFilter}
//                     onChange={(e) => setEquipmentFilter(e.target.value)}
//                     className="w-full border rounded-md pl-9 pr-3 py-2 text-sm"
//                   >
//                     <option value="all">All Equipment</option>
//                     {uniqueEquipment.map((eq) => (
//                       <option key={eq} value={eq}>
//                         {eq}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <select
//                   value={categoryFilter}
//                   onChange={(e) => setCategoryFilter(e.target.value)}
//                   className="border rounded-md px-3 py-2 text-sm"
//                 >
//                   <option value="all">All Categories</option>
//                   {uniqueCategories.map((cat) => (
//                     <option key={cat} value={cat}>
//                       {cat}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* Selection Summary */}
//               <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
//                 <div className="flex items-center gap-4">
//                   <span className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-blue-100 text-blue-800">
//                     Selected: {tempSelectedTools.length} items
//                   </span>
//                   <span className="text-sm text-gray-600">
//                     Total qty:{" "}
//                     {Object.values(tempSelectedToolsWithQty).reduce(
//                       (a, b) => a + b,
//                       0,
//                     )}
//                   </span>
//                 </div>
//                 <div className="flex gap-2">
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => {
//                       const allFilteredIds = filteredAvailableTools.map(
//                         (tool) => tool.id,
//                       );
//                       setTempSelectedTools(allFilteredIds);
//                       const qtyMap = { ...tempSelectedToolsWithQty };
//                       allFilteredIds.forEach((id) => {
//                         if (!qtyMap[id]) qtyMap[id] = 1;
//                       });
//                       setTempSelectedToolsWithQty(qtyMap);
//                     }}
//                   >
//                     Select All
//                   </Button>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => {
//                       setTempSelectedTools([]);
//                       setTempSelectedToolsWithQty({});
//                     }}
//                   >
//                     Clear All
//                   </Button>
//                 </div>
//               </div>

//               {/* Tools Table */}
//               <div className="border rounded-md max-h-[450px] overflow-auto">
//                 <Table>
//                   <TableHeader className="sticky top-0 bg-gray-50">
//                     <TableRow>
//                       <TableHead className="w-12">Select</TableHead>
//                       <TableHead>Item Description</TableHead>
//                       <TableHead>IN Part No.</TableHead>
//                       <TableHead>Item Code</TableHead>
//                       <TableHead>Category</TableHead>
//                       <TableHead>Equipment /System</TableHead>
//                       <TableHead>Status</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {paginatedTools.length === 0 ? (
//                       <TableRow>
//                         <TableCell colSpan={7} className="text-center py-8">
//                           No tools found
//                         </TableCell>
//                       </TableRow>
//                     ) : (
//                       paginatedTools.map((tool) => {
//                         const isSelected = tempSelectedTools.includes(tool.id);
//                         const isAlreadyInRoutine =
//                           editingRoutine &&
//                           isToolAlreadyInRoutine(tool.id) &&
//                           !isSelected;

//                         return (
//                           <TableRow
//                             key={tool.id}
//                             className={cn(
//                               isAlreadyInRoutine && "bg-yellow-50 opacity-75",
//                             )}
//                           >
//                             <TableCell>
//                               <Checkbox
//                                 checked={isSelected}
//                                 onCheckedChange={() =>
//                                   toggleToolSelection(tool)
//                                 }
//                                 disabled={isAlreadyInRoutine}
//                               />
//                             </TableCell>
//                             <TableCell>
//                               <div className="flex flex-col">
//                                 <span>{tool.description || "--"}</span>
//                                 {isSelected &&
//                                   tempSelectedToolsWithQty[tool.id] && (
//                                     <span className="text-xs text-green-600 mt-1">
//                                       Qty: {tempSelectedToolsWithQty[tool.id]}
//                                     </span>
//                                   )}
//                               </div>
//                             </TableCell>
//                             <TableCell>{tool.indian_pattern || "--"}</TableCell>
//                             <TableCell>{tool.item_code || "--"}</TableCell>
//                             <TableCell>{tool.category || "--"}</TableCell>
//                             <TableCell>
//                               {tool.equipment_system || "--"}
//                             </TableCell>
//                             <TableCell>
//                               {isSelected && (
//                                 <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
//                                   Selected
//                                 </span>
//                               )}
//                               {isAlreadyInRoutine && !isSelected && (
//                                 <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
//                                   Already in routine
//                                 </span>
//                               )}
//                               {tool.critical_tool === 1 &&
//                                 !isSelected &&
//                                 !isAlreadyInRoutine && (
//                                   <span className="inline-block px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
//                                     Critical
//                                   </span>
//                                 )}
//                             </TableCell>
//                           </TableRow>
//                         );
//                       })
//                     )}
//                   </TableBody>
//                 </Table>
//               </div>

//               {/* Pagination */}
//               {totalPages > 1 && (
//                 <div className="flex items-center justify-between pt-4">
//                   <div className="text-sm text-gray-500">
//                     Page {currentPage} of {totalPages} (
//                     {filteredAvailableTools.length} items)
//                   </div>
//                   <div className="flex gap-2">
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
//                       disabled={currentPage === 1}
//                     >
//                       <FaChevronLeft />
//                     </Button>
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() =>
//                         setCurrentPage((p) => Math.min(totalPages, p + 1))
//                       }
//                       disabled={currentPage === totalPages}
//                     >
//                       <FaChevronRight />
//                     </Button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Step 3: Review & Confirm */}
//           {currentStep === 3 && (
//             <div className="space-y-4">
//               <div className="bg-gray-50 p-4 rounded-lg">
//                 <h3 className="font-semibold text-lg mb-2">Routine Summary</h3>
//                 <div className="space-y-2">
//                   <p>
//                     <strong>Name:</strong> {newRoutineName}
//                   </p>
//                   {newRoutineDescription && (
//                     <p>
//                       <strong>Description:</strong> {newRoutineDescription}
//                     </p>
//                   )}
//                   <p>
//                     <strong>Equipment:</strong> {selectedEquipment}
//                   </p>
//                   <p>
//                     <strong>Total Tools:</strong> {tempSelectedTools.length}
//                   </p>
//                   <p>
//                     <strong>Total Quantity:</strong>{" "}
//                     {Object.values(tempSelectedToolsWithQty).reduce(
//                       (a, b) => a + b,
//                       0,
//                     )}
//                   </p>
//                 </div>
//               </div>

//               {/* Selected Tools Summary */}
//               {selectedToolsDetails.length > 0 && (
//                 <div className="border rounded-lg p-4">
//                   <h4 className="font-semibold mb-2">Selected Tools:</h4>
//                   <div className="space-y-1 max-h-[200px] overflow-y-auto">
//                     {selectedToolsDetails.map((tool) => (
//                       <div
//                         key={tool.id}
//                         className="text-sm flex justify-between items-center py-1 border-b"
//                       >
//                         <span>{tool.description}</span>
//                         <span className="font-semibold text-blue-600">
//                           Qty: {tempSelectedToolsWithQty[tool.id] || 1}
//                         </span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}

//           <DialogFooter>
//             {currentStep > 1 && (
//               <Button
//                 variant="outline"
//                 onClick={() => setCurrentStep((step) => step - 1)}
//               >
//                 <FaChevronLeft className="mr-2" /> Back
//               </Button>
//             )}

//             {currentStep < 3 ? (
//               <Button onClick={() => setCurrentStep((step) => step + 1)}>
//                 Next <FaChevronRight className="ml-2" />
//               </Button>
//             ) : (
//               <Button onClick={saveRoutine} disabled={isLoading}>
//                 <FaSave className="mr-2" />
//                 {editingRoutine ? "Update" : "Create"}
//               </Button>
//             )}

//             <Button
//               variant="outline"
//               onClick={() => setIsRoutineDialogOpen(false)}
//             >
//               Cancel
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default ToolsForRoutines;

import { useState, useEffect, useContext, useMemo, useRef } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaCheckCircle,
  FaInfoCircle,
  FaTools,
  FaTags,
  FaBarcode,
  FaLayerGroup,
  FaExclamationTriangle,
  FaFilter,
  FaChevronDown,
  FaCube,
} from "react-icons/fa";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import toaster from "../utils/toaster";
import apiService from "../utils/apiService";
import { Context } from "../utils/Context";
import { cn } from "../lib/utils";

// Custom Searchable Select Component
const SearchableSelect = ({ options, value, onChange, placeholder, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter((option) =>
      option.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [options, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.name === value);

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <Label className="text-sm font-semibold mb-1 block">{label}</Label>
      )}
      <div
        className="w-full border rounded-md px-3 py-2 cursor-pointer bg-white flex justify-between items-center"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setTimeout(() => inputRef.current?.focus(), 100);
        }}
      >
        <span className={!selectedOption ? "text-gray-400" : "text-gray-900"}>
          {selectedOption ? selectedOption.name : placeholder || "Select..."}
        </span>
        <FaChevronDown
          className={cn(
            "transition-transform duration-200",
            isOpen && "transform rotate-180",
          )}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-80 overflow-hidden">
          <div className="p-2 border-b">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search equipment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-64">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No equipment found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.id || option.name}
                  className={cn(
                    "px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm",
                    value === option.name && "bg-blue-100 text-blue-700",
                  )}
                  onClick={() => {
                    onChange(option.name);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                >
                  {option.name}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ToolsForRoutines = () => {
  const { equipment_system } = useContext(Context);

  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [routines, setRoutines] = useState([]);
  const [availableTools, setAvailableTools] = useState([]);
  const [assignedTools, setAssignedTools] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingTools, setIsFetchingTools] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [newRoutineName, setNewRoutineName] = useState("");
  const [newRoutineDescription, setNewRoutineDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // New routine dialog states
  const [isRoutineDialogOpen, setIsRoutineDialogOpen] = useState(false);
  const [tempSelectedTools, setTempSelectedTools] = useState([]);
  const [tempSelectedToolsWithQty, setTempSelectedToolsWithQty] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [selectAllPage, setSelectAllPage] = useState(false);
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [pendingToolForQty, setPendingToolForQty] = useState(null);

  // Fetch all tools from master inventory
  const fetchAvailableTools = async () => {
    try {
      const response = await apiService.get("/tools/all", {
        params: { limit: 1000 },
      });
      setAvailableTools(response.data.items || []);
    } catch (error) {
      console.error("Failed to fetch tools:", error);
      toaster("error", "Failed to fetch tools");
    }
  };

  // Fetch routines for selected equipment
  const fetchRoutines = async (equipmentName) => {
    if (!equipmentName) return;
    setIsLoading(true);
    try {
      const response = await apiService.get(
        `/routinesTool/equipment/${encodeURIComponent(equipmentName)}`,
      );
      console.log("Fetched routines:", response.data);
      setRoutines(response.data || []);
    } catch (error) {
      console.error("Failed to fetch routines:", error);
      toaster("error", "Failed to fetch routines");
      setRoutines([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch tools assigned to a routine
  const fetchRoutineTools = async (routineId) => {
    if (!routineId) return;
    setIsFetchingTools(true);
    try {
      const response = await apiService.get(`/routinesTool/${routineId}/tools`);
      console.log("Fetched assigned tools:", response.data);
      setAssignedTools(response.data || []);
    } catch (error) {
      console.error("Failed to fetch routine tools:", error);
      toaster("error", "Failed to fetch routine tools");
      setAssignedTools([]);
    } finally {
      setIsFetchingTools(false);
    }
  };

  // Fetch complete routine details for editing
  const fetchRoutineDetails = async (routineId) => {
    try {
      const response = await apiService.get(`/routinesTool/${routineId}/tools`);
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch routine details:", error);
      return [];
    }
  };

  // Handle equipment selection change
  const handleEquipmentChange = (equipmentName) => {
    setSelectedEquipment(equipmentName);
    setSelectedRoutine(null);
    setAssignedTools([]);
    if (equipmentName) {
      fetchRoutines(equipmentName);
    } else {
      setRoutines([]);
    }
  };

  // Handle routine selection change
  const handleRoutineChange = (routine) => {
    console.log("Selected routine:", routine);
    setSelectedRoutine(routine);
    if (routine && routine.id) {
      fetchRoutineTools(routine.id);
    } else {
      setAssignedTools([]);
    }
  };

  // Open dialog to add/edit routine
  const openRoutineDialog = async (routine = null) => {
    setEditingRoutine(routine);
    setNewRoutineName(routine ? routine.name : "");
    setNewRoutineDescription(routine ? routine.description || "" : "");

    if (routine && routine.id) {
      setIsLoading(true);
      try {
        const routineTools = await fetchRoutineDetails(routine.id);
        const toolIds = routineTools.map((t) => t.id);
        const qtyMap = {};
        routineTools.forEach((t) => {
          qtyMap[t.id] = t.quantity_required || 1;
        });
        setTempSelectedTools(toolIds);
        setTempSelectedToolsWithQty(qtyMap);
        console.log("Loaded tools for edit:", toolIds, qtyMap);
      } catch (error) {
        console.error("Failed to load routine tools:", error);
        setTempSelectedTools([]);
        setTempSelectedToolsWithQty({});
      } finally {
        setIsLoading(false);
      }
    } else {
      setTempSelectedTools([]);
      setTempSelectedToolsWithQty({});
    }

    setCurrentStep(1);
    setSearchTerm("");
    setEquipmentFilter("all");
    setCategoryFilter("all");
    setCurrentPage(1);
    setSelectAllPage(false);
    setIsRoutineDialogOpen(true);
  };

  // Toggle tool selection with quantity prompt
  const toggleToolSelection = (tool) => {
    if (tempSelectedTools.includes(tool.id)) {
      setTempSelectedTools((prev) => prev.filter((id) => id !== tool.id));
      const newQtyMap = { ...tempSelectedToolsWithQty };
      delete newQtyMap[tool.id];
      setTempSelectedToolsWithQty(newQtyMap);
    } else {
      setPendingToolForQty(tool);
      setShowQtyModal(true);
    }
  };

  // Handle quantity submission
  const handleQuantitySubmit = (quantity) => {
    if (pendingToolForQty) {
      setTempSelectedTools((prev) => [...prev, pendingToolForQty.id]);
      setTempSelectedToolsWithQty((prev) => ({
        ...prev,
        [pendingToolForQty.id]: quantity,
      }));
      setShowQtyModal(false);
      setPendingToolForQty(null);
    }
  };

  // Save routine (create or update)
  const saveRoutine = async () => {
    if (!newRoutineName.trim()) {
      toaster("error", "Routine name is required");
      return;
    }

    if (!selectedEquipment) {
      toaster("error", "Please select equipment first");
      return;
    }

    if (tempSelectedTools.length === 0) {
      toaster("error", "Please select at least one tool for this routine");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: newRoutineName.trim(),
        description: newRoutineDescription.trim(),
        equipment_system: selectedEquipment,
        tools: tempSelectedTools.map((id) => ({
          id: id,
          quantity_required: tempSelectedToolsWithQty[id] || 1,
        })),
      };

      let response;
      if (editingRoutine) {
        response = await apiService.put(
          `/routinesTool/${editingRoutine.id}`,
          payload,
        );
      } else {
        response = await apiService.post("/routinesTool", payload);
      }

      if (response.success) {
        toaster(
          "success",
          editingRoutine ? "Routine updated" : "Routine created",
        );
        setIsRoutineDialogOpen(false);
        await fetchRoutines(selectedEquipment);
        if (editingRoutine && selectedRoutine?.id === editingRoutine.id) {
          await fetchRoutineTools(editingRoutine.id);
        }
        resetDialogState();
      } else {
        toaster("error", response.message || "Failed to save routine");
      }
    } catch (error) {
      console.error("Failed to save routine:", error);
      toaster(
        "error",
        error.response?.data?.message || "Failed to save routine",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Reset dialog state
  const resetDialogState = () => {
    setEditingRoutine(null);
    setNewRoutineName("");
    setNewRoutineDescription("");
    setTempSelectedTools([]);
    setTempSelectedToolsWithQty({});
    setSearchTerm("");
    setEquipmentFilter("all");
    setCategoryFilter("all");
    setCurrentPage(1);
    setSelectAllPage(false);
    setCurrentStep(1);
  };

  // Delete routine
  const deleteRoutine = async (routineId) => {
    if (!confirm("Are you sure you want to delete this routine?")) return;

    setIsLoading(true);
    try {
      const response = await apiService.delete(`/routinesTool/${routineId}`);
      if (response.success) {
        toaster("success", "Routine deleted");
        if (selectedRoutine?.id === routineId) {
          setSelectedRoutine(null);
          setAssignedTools([]);
        }
        await fetchRoutines(selectedEquipment);
      } else {
        toaster("error", response.message || "Failed to delete routine");
      }
    } catch (error) {
      console.error("Failed to delete routine:", error);
      toaster("error", "Failed to delete routine");
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique equipment names for filter
  const uniqueEquipment = useMemo(() => {
    const equipment = new Set();
    availableTools.forEach((tool) => {
      if (tool.equipment_system) equipment.add(tool.equipment_system);
    });
    return Array.from(equipment).sort();
  }, [availableTools]);

  // Get unique categories for filter
  const uniqueCategories = useMemo(() => {
    const categories = new Set();
    availableTools.forEach((tool) => {
      if (tool.category) categories.add(tool.category);
    });
    return Array.from(categories).sort();
  }, [availableTools]);

  // Filter tools based on search term, equipment, and category
  const filteredAvailableTools = useMemo(() => {
    let filtered = availableTools;

    if (searchTerm) {
      filtered = filtered.filter(
        (tool) =>
          tool.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tool.indian_pattern
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          tool.item_code?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (equipmentFilter !== "all") {
      filtered = filtered.filter(
        (tool) => tool.equipment_system === equipmentFilter,
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((tool) => tool.category === categoryFilter);
    }

    return filtered;
  }, [availableTools, searchTerm, equipmentFilter, categoryFilter]);

  // Check if a tool is already in the routine
  const isToolAlreadyInRoutine = (toolId) => {
    return assignedTools.some((tool) => tool.id === toolId);
  };

  // Pagination
  const totalPages = Math.ceil(filteredAvailableTools.length / itemsPerPage);
  const paginatedTools = filteredAvailableTools.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Get selected tools details
  const selectedToolsDetails = useMemo(() => {
    return availableTools.filter((tool) => tempSelectedTools.includes(tool.id));
  }, [availableTools, tempSelectedTools]);

  useEffect(() => {
    fetchAvailableTools();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectAllPage(false);
  }, [searchTerm, equipmentFilter, categoryFilter]);

  // Quantity Modal Component
  const QuantityModal = () => (
    <Dialog open={showQtyModal} onOpenChange={setShowQtyModal}>
      <DialogContent className="max-w-md">
        <DialogTitle>Enter Quantity Required</DialogTitle>
        <div className="py-4">
          <Label className="text-sm font-semibold">
            {pendingToolForQty?.description}
          </Label>
          <Input
            type="number"
            min="1"
            defaultValue="1"
            id="quantity-input"
            className="mt-2"
            autoFocus
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                const qty = parseInt(e.target.value);
                if (!isNaN(qty) && qty > 0) {
                  handleQuantitySubmit(qty);
                }
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowQtyModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const input = document.getElementById("quantity-input");
              const qty = parseInt(input?.value);
              if (!isNaN(qty) && qty > 0) {
                handleQuantitySubmit(qty);
              } else {
                toaster("error", "Please enter a valid quantity");
              }
            }}
          >
            Add Tool
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="p-4 h-full">
      <QuantityModal />

      <div className="grid grid-cols-12 gap-4 h-full">
        {/* Left Panel - Equipment & Routine Selection */}
        <div className="col-span-3 space-y-4">
          {/* <Card>
            <CardHeader>
              <CardTitle className="text-lg">DA - 250 HOURLY</CardTitle>
            </CardHeader>
            <CardContent>
              <SearchableSelect
                options={equipment_system || []}
                value={selectedEquipment}
                onChange={handleEquipmentChange}
                placeholder="Select Equipment..."
                label="Select Equipment"
              />
            </CardContent>
          </Card> */}

          {/* {selectedEquipment && ( */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Routines</CardTitle>
                <Button
                  size="sm"
                  onClick={() => openRoutineDialog()}
                  className="h-8"
                >
                  <FaPlus className="h-3 w-3 mr-1" />
                  Add Routine
                </Button>
              </CardHeader>
              <CardContent>
                <SearchableSelect
                  options={equipment_system || []}
                  value={selectedEquipment}
                  onChange={handleEquipmentChange}
                  placeholder="Select Equipment..."
                  label="Select Equipment"
                />
              </CardContent>
              <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {isLoading ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : routines.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No routines found. Click "Add Routine" to create one.
                    </div>
                  ) : (
                    routines.map((routine) => (
                      <div
                        key={routine.id}
                        className={cn(
                          "p-3 border rounded-lg cursor-pointer transition-all flex justify-between items-center",
                          selectedRoutine?.id === routine.id
                            ? "bg-blue-100 border-blue-500"
                            : "hover:bg-gray-50",
                        )}
                        onClick={() => handleRoutineChange(routine)}
                      >
                        <div className="flex-1">
                          <span className="font-medium">{routine.name}</span>
                          {routine.description && (
                            <p className="text-xs text-gray-500 mt-1">
                              {routine.description}
                            </p>
                          )}
                          <span className="inline-block mt-1 text-xs bg-gray-100 px-2 py-0.5 rounded">
                            {routine.total_tools || 0} tools
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openRoutineDialog(routine);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FaEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteRoutine(routine.id);
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FaTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          {/* )} */}
        </div>

        {/* Right Panel - Tools List */}
        <div className="col-span-9">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedRoutine
                  ? `Tools for "${selectedRoutine.name}"`
                  : "Select a routine to view Tools"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedRoutine ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <FaTools className="h-12 w-12 mb-3 text-gray-300" />
                  <p className="text-lg font-medium">No Routine Selected</p>
                  <p className="text-sm">
                    Please select a routine from the left panel to view its
                    tools
                  </p>
                </div>
              ) : isFetchingTools ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Loading tools...</span>
                </div>
              ) : assignedTools.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <FaExclamationTriangle className="h-12 w-12 mb-3 text-yellow-400" />
                  <p className="text-lg font-medium">No Tools Assigned</p>
                  <p className="text-sm">
                    This routine has no tools assigned yet.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => openRoutineDialog(selectedRoutine)}
                  >
                    <FaEdit className="mr-2 h-4 w-4" />
                    Edit Routine to Add Tools
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Description</TableHead>
                        <TableHead>IN Part No.</TableHead>
                        <TableHead>Item Code</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Qty Required</TableHead>
                        <TableHead>OBS Maintained</TableHead>
                        <TableHead>OBS Held</TableHead>
                        {/* <TableHead>Box No.</TableHead>
                        <TableHead>Item Distribution</TableHead> */}
                        <TableHead>Storage Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignedTools.map((tool) => (
                        <TableRow key={tool.id}>
                          <TableCell className="font-medium">
                            {tool.description || "--"}
                            {tool.critical_tool === 1 && (
                              <span className="ml-2 inline-block px-1 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                                Critical
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{tool.indian_pattern || "--"}</TableCell>
                          <TableCell>{tool.item_code || "--"}</TableCell>
                          <TableCell>{tool.category || "--"}</TableCell>
                          <TableCell>
                            <span className="font-semibold text-blue-600">
                              {tool.quantity_required || 1}
                            </span>
                          </TableCell>
                          <TableCell>{tool.obs_maintained || 0}</TableCell>
                          <TableCell>{tool.obs_held || 0}</TableCell>
                          <TableCell>
                            {tool.box_no ? (
                              <div className="text-xs space-y-1">
                                {(() => {
                                  try {
                                    const boxes = JSON.parse(tool.box_no);
                                    return boxes.map((b, idx) => (
                                      <div
                                        key={idx}
                                        className="whitespace-nowrap"
                                      >
                                        📦 {b.location}
                                      </div>
                                    ));
                                  } catch {
                                    return tool.box_no;
                                  }
                                })()}
                              </div>
                            ) : (
                              "--"
                            )}
                          </TableCell>
                          {/* <TableCell>
                            {tool.item_distribution || "--"}
                          </TableCell>
                          <TableCell>{tool.storage_location || "--"}</TableCell> */}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Routine Dialog */}
      <Dialog open={isRoutineDialogOpen} onOpenChange={setIsRoutineDialogOpen}>
        <DialogContent
          className="!max-w-[90vw] w-[90vw] max-h-[90vh] overflow-y-auto"
          style={{ maxWidth: "90vw", width: "90vw" }}
        >
          <DialogTitle className="text-xl">
            {editingRoutine ? "Edit Routine" : "Create New Routine"}
          </DialogTitle>

          {/* Step 1: Basic Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">
                  Routine Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={newRoutineName}
                  onChange={(e) => setNewRoutineName(e.target.value)}
                  placeholder="e.g., Daily Inspection, Weekly Maintenance"
                  className="mt-1"
                  autoFocus
                />
              </div>

              <div>
                <Label className="text-sm font-semibold">
                  Description (Optional)
                </Label>
                <textarea
                  value={newRoutineDescription}
                  onChange={(e) => setNewRoutineDescription(e.target.value)}
                  placeholder="Describe what this routine entails..."
                  className="w-full border rounded-md px-3 py-2 mt-1 min-h-[100px] resize-vertical"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <FaInfoCircle className="text-blue-500 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Equipment Selected:</p>
                    <p>{selectedEquipment || "Not selected yet"}</p>
                  </div>
                </div>
              </div>

              {editingRoutine && tempSelectedTools.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-green-500" />
                    <div className="text-sm text-green-800">
                      <p className="font-semibold">Currently selected tools:</p>
                      <p>
                        {tempSelectedTools.length} tools with total quantity{" "}
                        {Object.values(tempSelectedToolsWithQty).reduce(
                          (a, b) => a + b,
                          0,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Tools with Equipment Filter */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Filter Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search tools..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="relative">
                  <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={equipmentFilter}
                    onChange={(e) => setEquipmentFilter(e.target.value)}
                    className="w-full border rounded-md pl-9 pr-3 py-2 text-sm"
                  >
                    <option value="all">All Equipment</option>
                    {uniqueEquipment.map((eq) => (
                      <option key={eq} value={eq}>
                        {eq}
                      </option>
                    ))}
                  </select>
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">All Categories</option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selection Summary */}
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-blue-100 text-blue-800">
                    Selected: {tempSelectedTools.length} items
                  </span>
                  <span className="text-sm text-gray-600">
                    Total qty:{" "}
                    {Object.values(tempSelectedToolsWithQty).reduce(
                      (a, b) => a + b,
                      0,
                    )}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allFilteredIds = filteredAvailableTools.map(
                        (tool) => tool.id,
                      );
                      setTempSelectedTools(allFilteredIds);
                      const qtyMap = { ...tempSelectedToolsWithQty };
                      allFilteredIds.forEach((id) => {
                        if (!qtyMap[id]) qtyMap[id] = 1;
                      });
                      setTempSelectedToolsWithQty(qtyMap);
                    }}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTempSelectedTools([]);
                      setTempSelectedToolsWithQty({});
                    }}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Tools Table */}
              <div className="border rounded-md max-h-[450px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-gray-50">
                    <TableRow>
                      <TableHead className="w-12">Select</TableHead>
                      <TableHead>Item Description</TableHead>
                      <TableHead>IN Part No.</TableHead>
                      <TableHead>Item Code</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Equipment /System</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTools.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No tools found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedTools.map((tool) => {
                        const isSelected = tempSelectedTools.includes(tool.id);
                        const isAlreadyInRoutine =
                          editingRoutine &&
                          isToolAlreadyInRoutine(tool.id) &&
                          !isSelected;

                        return (
                          <TableRow
                            key={tool.id}
                            className={cn(
                              isAlreadyInRoutine && "bg-yellow-50 opacity-75",
                            )}
                          >
                            <TableCell>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() =>
                                  toggleToolSelection(tool)
                                }
                                disabled={isAlreadyInRoutine}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{tool.description || "--"}</span>
                                {isSelected &&
                                  tempSelectedToolsWithQty[tool.id] && (
                                    <span className="text-xs text-green-600 mt-1">
                                      Qty: {tempSelectedToolsWithQty[tool.id]}
                                    </span>
                                  )}
                              </div>
                            </TableCell>
                            <TableCell>{tool.indian_pattern || "--"}</TableCell>
                            <TableCell>{tool.item_code || "--"}</TableCell>
                            <TableCell>{tool.category || "--"}</TableCell>
                            <TableCell>
                              {tool.equipment_system || "--"}
                            </TableCell>
                            <TableCell>
                              {isSelected && (
                                <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                                  Selected
                                </span>
                              )}
                              {isAlreadyInRoutine && !isSelected && (
                                <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
                                  Already in routine
                                </span>
                              )}
                              {tool.critical_tool === 1 &&
                                !isSelected &&
                                !isAlreadyInRoutine && (
                                  <span className="inline-block px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                                    Critical
                                  </span>
                                )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages} (
                    {filteredAvailableTools.length} items)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <FaChevronLeft />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      <FaChevronRight />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review & Confirm */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Routine Summary</h3>
                <div className="space-y-2">
                  <p>
                    <strong>Name:</strong> {newRoutineName}
                  </p>
                  {newRoutineDescription && (
                    <p>
                      <strong>Description:</strong> {newRoutineDescription}
                    </p>
                  )}
                  <p>
                    <strong>Equipment:</strong> {selectedEquipment}
                  </p>
                  <p>
                    <strong>Total Tools:</strong> {tempSelectedTools.length}
                  </p>
                  <p>
                    <strong>Total Quantity:</strong>{" "}
                    {Object.values(tempSelectedToolsWithQty).reduce(
                      (a, b) => a + b,
                      0,
                    )}
                  </p>
                </div>
              </div>

              {/* Selected Tools Summary */}
              {selectedToolsDetails.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Selected Tools:</h4>
                  <div className="space-y-1 max-h-[200px] overflow-y-auto">
                    {selectedToolsDetails.map((tool) => (
                      <div
                        key={tool.id}
                        className="text-sm flex justify-between items-center py-1 border-b"
                      >
                        <span>{tool.description}</span>
                        <span className="font-semibold text-blue-600">
                          Qty: {tempSelectedToolsWithQty[tool.id] || 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep((step) => step - 1)}
              >
                <FaChevronLeft className="mr-2" /> Back
              </Button>
            )}

            {currentStep < 3 ? (
              <Button onClick={() => setCurrentStep((step) => step + 1)}>
                Next <FaChevronRight className="ml-2" />
              </Button>
            ) : (
              <Button onClick={saveRoutine} disabled={isLoading}>
                <FaSave className="mr-2" />
                {editingRoutine ? "Update" : "Create"}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => setIsRoutineDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ToolsForRoutines;