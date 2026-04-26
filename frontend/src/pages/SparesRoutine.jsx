// SparesForRoutines.jsx
// import { useState, useEffect, useContext, useMemo } from "react";
// import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from "react-icons/fa";
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

// const SparesForRoutines = () => {
//   const { equipment_system, fetchEquipment } = useContext(Context);

//   const [selectedEquipment, setSelectedEquipment] = useState("");
//   const [selectedRoutine, setSelectedRoutine] = useState("");
//   const [routines, setRoutines] = useState([]);
//   const [availableSpares, setAvailableSpares] = useState([]);
//   const [assignedSpares, setAssignedSpares] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [editingRoutine, setEditingRoutine] = useState(null);
//   const [newRoutineName, setNewRoutineName] = useState("");
//   const [searchTerm, setSearchTerm] = useState("");

//   // New routine dialog states
//   const [isRoutineDialogOpen, setIsRoutineDialogOpen] = useState(false);
//   const [routineSpares, setRoutineSpares] = useState([]);
//   const [tempSelectedSpares, setTempSelectedSpares] = useState([]);

//   // Fetch all spares from master inventory
//   const fetchAvailableSpares = async () => {
//     try {
//       const response = await apiService.get("/spares/all", {
//         params: { limit: 1000 },
//       });
//       setAvailableSpares(response.data.items || []);
//     } catch (error) {
//       console.error("Failed to fetch spares:", error);
//       toaster("error", "Failed to fetch spares");
//     }
//   };

//   // Fetch routines for selected equipment
//   const fetchRoutines = async (equipmentId) => {
//     if (!equipmentId) return;
//     setIsLoading(true);
//     try {
//       const response = await apiService.get(
//         `/routines/equipment/${equipmentId}`,
//       );
//       setRoutines(response.data || []);
//     } catch (error) {
//       console.error("Failed to fetch routines:", error);
//       toaster("error", "Failed to fetch routines");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Fetch spares assigned to a routine
//   const fetchRoutineSpares = async (routineId) => {
//     if (!routineId) return;
//     setIsLoading(true);
//     try {
//       const response = await apiService.get(`/routines/${routineId}/spares`);
//       setAssignedSpares(response.data || []);
//     } catch (error) {
//       console.error("Failed to fetch routine spares:", error);
//       toaster("error", "Failed to fetch routine spares");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Handle equipment selection change
//   const handleEquipmentChange = (equipmentName) => {
//     setSelectedEquipment(equipmentName);
//     setSelectedRoutine("");
//     setAssignedSpares([]);
//     if (equipmentName) {
//       fetchRoutines(equipmentName);
//     } else {
//       setRoutines([]);
//     }
//   };

//   // Handle routine selection change
//   const handleRoutineChange = (routine) => {
//     setSelectedRoutine(routine);
//     if (routine && routine.id) {
//       fetchRoutineSpares(routine.id);
//     } else {
//       setAssignedSpares([]);
//     }
//   };

//   // Open dialog to add/edit routine
//   const openRoutineDialog = (routine = null) => {
//     setEditingRoutine(routine);
//     setNewRoutineName(routine ? routine.name : "");
//     setTempSelectedSpares(routine ? routine.spare_ids || [] : []);
//     setIsRoutineDialogOpen(true);
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

//     setIsLoading(true);
//     try {
//       const payload = {
//         name: newRoutineName.trim(),
//         equipment_system: selectedEquipment,
//         spare_ids: tempSelectedSpares,
//       };

//       let response;
//       if (editingRoutine) {
//         response = await apiService.put(
//           `/routines/${editingRoutine.id}`,
//           payload,
//         );
//       } else {
//         response = await apiService.post("/routines", payload);
//       }

//       if (response.success) {
//         toaster(
//           "success",
//           editingRoutine ? "Routine updated" : "Routine created",
//         );
//         setIsRoutineDialogOpen(false);
//         fetchRoutines(selectedEquipment);
//         setEditingRoutine(null);
//         setNewRoutineName("");
//         setTempSelectedSpares([]);
//       } else {
//         toaster("error", response.message || "Failed to save routine");
//       }
//     } catch (error) {
//       console.error("Failed to save routine:", error);
//       toaster("error", "Failed to save routine");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Delete routine
//   const deleteRoutine = async (routineId) => {
//     if (!confirm("Are you sure you want to delete this routine?")) return;

//     setIsLoading(true);
//     try {
//       const response = await apiService.delete(`/routines/${routineId}`);
//       if (response.success) {
//         toaster("success", "Routine deleted");
//         if (selectedRoutine?.id === routineId) {
//           setSelectedRoutine("");
//           setAssignedSpares([]);
//         }
//         fetchRoutines(selectedEquipment);
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

//   // Toggle spare selection in dialog
//   const toggleSpareSelection = (spareId) => {
//     setTempSelectedSpares((prev) =>
//       prev.includes(spareId)
//         ? prev.filter((id) => id !== spareId)
//         : [...prev, spareId],
//     );
//   };

//   // Filter spares based on search term
//   const filteredAvailableSpares = useMemo(() => {
//     if (!searchTerm) return availableSpares;
//     return availableSpares.filter(
//       (spare) =>
//         spare.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         spare.indian_pattern
//           ?.toLowerCase()
//           .includes(searchTerm.toLowerCase()) ||
//         spare.item_code?.toLowerCase().includes(searchTerm.toLowerCase()),
//     );
//   }, [availableSpares, searchTerm]);

//   // Get spare details by ID
//   const getSpareDetails = (spareId) => {
//     return availableSpares.find((s) => s.id === spareId);
//   };

//   useEffect(() => {
//     fetchAvailableSpares();
//   }, []);

//   return (
//     <div className="p-4 h-full">
//       <div className="grid grid-cols-12 gap-4 h-full">
//         {/* Left Panel - Equipment & Routine Selection */}
//         <div className="col-span-4 space-y-4">
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-lg">Equipment / System</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <select
//                 className="w-full border rounded-md px-3 py-2"
//                 value={selectedEquipment}
//                 onChange={(e) => handleEquipmentChange(e.target.value)}
//               >
//                 <option value="">Select Equipment...</option>
//                 {equipment_system?.map((eq) => (
//                   <option key={eq.id || eq.name} value={eq.name}>
//                     {eq.name}
//                   </option>
//                 ))}
//               </select>
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
//                       No routines found
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
//                         <span className="font-medium">{routine.name}</span>
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

//         {/* Right Panel - Spares/Tools List */}
//         <div className="col-span-8">
//           <Card className="h-full">
//             <CardHeader>
//               <CardTitle className="text-lg">
//                 {selectedRoutine
//                   ? `Spares/Tools for ${selectedRoutine.name}`
//                   : "Select a routine to view spares"}
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               {selectedRoutine && (
//                 <div className="overflow-x-auto">
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead>Item Description</TableHead>
//                         <TableHead>IN Part No.</TableHead>
//                         <TableHead>Item Code</TableHead>
//                         <TableHead>Category</TableHead>
//                         <TableHead>OBS Authorised</TableHead>
//                         <TableHead>Storage Location</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {isLoading ? (
//                         <TableRow>
//                           <TableCell colSpan={6} className="text-center">
//                             Loading...
//                           </TableCell>
//                         </TableRow>
//                       ) : assignedSpares.length === 0 ? (
//                         <TableRow>
//                           <TableCell colSpan={6} className="text-center">
//                             No spares/tools assigned to this routine
//                           </TableCell>
//                         </TableRow>
//                       ) : (
//                         assignedSpares.map((spare) => (
//                           <TableRow key={spare.id}>
//                             <TableCell>{spare.description || "--"}</TableCell>
//                             <TableCell>
//                               {spare.indian_pattern || "--"}
//                             </TableCell>
//                             <TableCell>{spare.item_code || "--"}</TableCell>
//                             <TableCell>{spare.category || "--"}</TableCell>
//                             <TableCell>{spare.obs_authorised || 0}</TableCell>
//                             <TableCell>
//                               {spare.box_no
//                                 ? JSON.parse(spare.box_no)
//                                     .map((b) => b.location)
//                                     .join(", ")
//                                 : "--"}
//                             </TableCell>
//                           </TableRow>
//                         ))
//                       )}
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
//           className="max-w-[80vw] max-h-[120vh] overflow-y-auto"
//           size="full"
//           unbounded={true}
//         >
//           <DialogTitle>
//             {editingRoutine ? "Edit Routine" : "Create New Routine"}
//           </DialogTitle>

//           <div className="space-y-4">
//             <div>
//               <Label>Routine Name *</Label>
//               <Input
//                 value={newRoutineName}
//                 onChange={(e) => setNewRoutineName(e.target.value)}
//                 placeholder="Enter routine name..."
//                 className="mt-1"
//               />
//             </div>

//             <div>
//               <Label>Select Spares for this Routine</Label>
//               <div className="mt-2">
//                 <Input
//                   placeholder="Search spares..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="mb-3"
//                 />

//                 <div className="border rounded-md max-h-[400px] overflow-y-auto">
//                   <Table>
//                     <TableHeader className="sticky top-0 bg-white">
//                       <TableRow>
//                         <TableHead className="w-12">Select</TableHead>
//                         <TableHead>Description</TableHead>
//                         <TableHead>IN Part No.</TableHead>
//                         <TableHead>Item Code</TableHead>
//                         <TableHead>Category</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {filteredAvailableSpares.map((spare) => (
//                         <TableRow key={spare.id}>
//                           <TableCell>
//                             <Checkbox
//                               checked={tempSelectedSpares.includes(spare.id)}
//                               onCheckedChange={() =>
//                                 toggleSpareSelection(spare.id)
//                               }
//                             />
//                           </TableCell>
//                           <TableCell>{spare.description || "--"}</TableCell>
//                           <TableCell>{spare.indian_pattern || "--"}</TableCell>
//                           <TableCell>{spare.item_code || "--"}</TableCell>
//                           <TableCell>{spare.category || "--"}</TableCell>
//                         </TableRow>
//                       ))}
//                       {filteredAvailableSpares.length === 0 && (
//                         <TableRow>
//                           <TableCell colSpan={5} className="text-center">
//                             No spares found
//                           </TableCell>
//                         </TableRow>
//                       )}
//                     </TableBody>
//                   </Table>
//                 </div>
//               </div>
//             </div>

//             <div className="text-sm text-gray-500">
//               Selected: {tempSelectedSpares.length} spares/tools
//             </div>
//           </div>

//           <DialogFooter>
//             <Button
//               variant="outline"
//               onClick={() => setIsRoutineDialogOpen(false)}
//             >
//               Cancel
//             </Button>
//             <Button onClick={saveRoutine} disabled={isLoading}>
//               <FaSave className="h-4 w-4 mr-2" />
//               {editingRoutine ? "Update" : "Create"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default SparesForRoutines;



// SparesForRoutines.jsx - Without Tabs Component
// SparesForRoutines.jsx - Fixed Version
import { useState, useEffect, useContext, useMemo } from "react";
import { 
  FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaSearch, 
  FaChevronLeft, FaChevronRight, FaCheckCircle,
  FaInfoCircle, FaBoxes, FaTags, FaBarcode, FaLayerGroup,
  FaExclamationTriangle
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

const SparesForRoutines = () => {
  const { equipment_system, fetchEquipment } = useContext(Context);

  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [routines, setRoutines] = useState([]);
  const [availableSpares, setAvailableSpares] = useState([]);
  const [assignedSpares, setAssignedSpares] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSpares, setIsFetchingSpares] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [newRoutineName, setNewRoutineName] = useState("");
  const [newRoutineDescription, setNewRoutineDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // New routine dialog states
  const [isRoutineDialogOpen, setIsRoutineDialogOpen] = useState(false);
  const [tempSelectedSpares, setTempSelectedSpares] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectAllPage, setSelectAllPage] = useState(false);

  // Fetch all spares from master inventory
  const fetchAvailableSpares = async () => {
    try {
      const response = await apiService.get("/spares/all", {
        params: { limit: 1000 },
      });
      setAvailableSpares(response.data.items || []);
    } catch (error) {
      console.error("Failed to fetch spares:", error);
      toaster("error", "Failed to fetch spares");
    }
  };

  // Fetch routines for selected equipment
  const fetchRoutines = async (equipmentName) => {
    if (!equipmentName) return;
    setIsLoading(true);
    try {
      const response = await apiService.get(
        `/routines/equipment/${encodeURIComponent(equipmentName)}`,
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

  // Fetch spares assigned to a routine
  const fetchRoutineSpares = async (routineId) => {
    if (!routineId) return;
    setIsFetchingSpares(true);
    try {
      const response = await apiService.get(`/routines/${routineId}/spares`);
      console.log("Fetched assigned spares:", response.data);
      setAssignedSpares(response.data || []);
    } catch (error) {
      console.error("Failed to fetch routine spares:", error);
      toaster("error", "Failed to fetch routine spares");
      setAssignedSpares([]);
    } finally {
      setIsFetchingSpares(false);
    }
  };

  // Handle equipment selection change
  const handleEquipmentChange = (equipmentName) => {
    setSelectedEquipment(equipmentName);
    setSelectedRoutine(null);
    setAssignedSpares([]);
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
      fetchRoutineSpares(routine.id);
    } else {
      setAssignedSpares([]);
    }
  };

  // Open dialog to add/edit routine
  const openRoutineDialog = (routine = null) => {
    setEditingRoutine(routine);
    setNewRoutineName(routine ? routine.name : "");
    setNewRoutineDescription(routine ? routine.description || "" : "");
    setTempSelectedSpares(routine ? routine.spare_ids || [] : []);
    setCurrentStep(1);
    setSearchTerm("");
    setCategoryFilter("all");
    setCurrentPage(1);
    setSelectAllPage(false);
    setIsRoutineDialogOpen(true);
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

    if (tempSelectedSpares.length === 0) {
      toaster("error", "Please select at least one spare for this routine");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: newRoutineName.trim(),
        description: newRoutineDescription.trim(),
        equipment_system: selectedEquipment,
        spare_ids: tempSelectedSpares,
      };

      let response;
      if (editingRoutine) {
        response = await apiService.put(
          `/routines/${editingRoutine.id}`,
          payload,
        );
      } else {
        response = await apiService.post("/routines", payload);
      }

      if (response.success) {
        toaster(
          "success",
          editingRoutine ? "Routine updated" : "Routine created",
        );
        setIsRoutineDialogOpen(false);
        await fetchRoutines(selectedEquipment);
        resetDialogState();
      } else {
        toaster("error", response.message || "Failed to save routine");
      }
    } catch (error) {
      console.error("Failed to save routine:", error);
      toaster("error", error.response?.data?.message || "Failed to save routine");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset dialog state
  const resetDialogState = () => {
    setEditingRoutine(null);
    setNewRoutineName("");
    setNewRoutineDescription("");
    setTempSelectedSpares([]);
    setSearchTerm("");
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
      const response = await apiService.delete(`/routines/${routineId}`);
      if (response.success) {
        toaster("success", "Routine deleted");
        if (selectedRoutine?.id === routineId) {
          setSelectedRoutine(null);
          setAssignedSpares([]);
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

  // Toggle spare selection in dialog
  const toggleSpareSelection = (spareId) => {
    setTempSelectedSpares((prev) =>
      prev.includes(spareId)
        ? prev.filter((id) => id !== spareId)
        : [...prev, spareId],
    );
    setSelectAllPage(false);
  };

  // Bulk select/deselect all spares on current page
  const handleSelectAllPage = () => {
    if (selectAllPage) {
      const currentPageSpareIds = paginatedSpares.map(spare => spare.id);
      setTempSelectedSpares(prev => 
        prev.filter(id => !currentPageSpareIds.includes(id))
      );
    } else {
      const currentPageSpareIds = paginatedSpares.map(spare => spare.id);
      const newSelections = currentPageSpareIds.filter(
        id => !tempSelectedSpares.includes(id)
      );
      setTempSelectedSpares(prev => [...prev, ...newSelections]);
    }
    setSelectAllPage(!selectAllPage);
  };

  // Select all spares matching current filter
  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredAvailableSpares.map(spare => spare.id);
    setTempSelectedSpares(allFilteredIds);
    setSelectAllPage(false);
    toaster("success", `Selected ${allFilteredIds.length} spares`);
  };

  // Clear all selections
  const handleClearAllSelections = () => {
    setTempSelectedSpares([]);
    setSelectAllPage(false);
    toaster("info", "All selections cleared");
  };

  // Get unique categories for filter
  const uniqueCategories = useMemo(() => {
    const categories = new Set();
    availableSpares.forEach(spare => {
      if (spare.category) categories.add(spare.category);
    });
    return Array.from(categories).sort();
  }, [availableSpares]);

  // Filter spares based on search term and category
  const filteredAvailableSpares = useMemo(() => {
    let filtered = availableSpares;
    
    if (searchTerm) {
      filtered = filtered.filter(
        (spare) =>
          spare.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          spare.indian_pattern?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          spare.item_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (categoryFilter !== "all") {
      filtered = filtered.filter(spare => spare.category === categoryFilter);
    }
    
    return filtered;
  }, [availableSpares, searchTerm, categoryFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAvailableSpares.length / itemsPerPage);
  const paginatedSpares = filteredAvailableSpares.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get selected spares details
  const selectedSparesDetails = useMemo(() => {
    return availableSpares.filter(spare => tempSelectedSpares.includes(spare.id));
  }, [availableSpares, tempSelectedSpares]);

  useEffect(() => {
    fetchAvailableSpares();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectAllPage(false);
  }, [searchTerm, categoryFilter]);

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center font-semibold",
          currentStep >= 1 ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
        )}>1</div>
        <div className={cn(
          "w-16 h-1 mx-2",
          currentStep >= 2 ? "bg-blue-600" : "bg-gray-300"
        )} />
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center font-semibold",
          currentStep >= 2 ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
        )}>2</div>
        <div className={cn(
          "w-16 h-1 mx-2",
          currentStep >= 3 ? "bg-blue-600" : "bg-gray-300"
        )} />
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center font-semibold",
          currentStep >= 3 ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
        )}>3</div>
      </div>
    </div>
  );

  return (
    <div className="p-4 h-full">
      <div className="grid grid-cols-12 gap-4 h-full">
        {/* Left Panel - Equipment & Routine Selection */}
        <div className="col-span-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Equipment / System</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={selectedEquipment}
                onChange={(e) => handleEquipmentChange(e.target.value)}
              >
                <option value="">Select Equipment...</option>
                {equipment_system?.map((eq) => (
                  <option key={eq.id || eq.name} value={eq.name}>
                    {eq.name}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          {selectedEquipment && (
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
                            {routine.total_spares || 0} spares
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
          )}
        </div>

        {/* Right Panel - Spares/Tools List */}
        <div className="col-span-8">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedRoutine
                  ? `Spares for "${selectedRoutine.name}"`
                  : "Select a routine to view Spare"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedRoutine ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <FaBoxes className="h-12 w-12 mb-3 text-gray-300" />
                  <p className="text-lg font-medium">No Routine Selected</p>
                  <p className="text-sm">Please select a routine from the left panel to view its spares</p>
                </div>
              ) : isFetchingSpares ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Loading spares...</span>
                </div>
              ) : assignedSpares.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <FaExclamationTriangle className="h-12 w-12 mb-3 text-yellow-400" />
                  <p className="text-lg font-medium">No Spares Assigned</p>
                  <p className="text-sm">This routine has no spares/tools assigned yet.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => openRoutineDialog(selectedRoutine)}
                  >
                    <FaEdit className="mr-2 h-4 w-4" />
                    Edit Routine to Add Spares
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
                        <TableHead>OBS Authorised</TableHead>
                        <TableHead>Storage Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignedSpares.map((spare) => (
                        <TableRow key={spare.id}>
                          <TableCell>{spare.description || "--"}</TableCell>
                          <TableCell>
                            {spare.indian_pattern || "--"}
                          </TableCell>
                          <TableCell>{spare.item_code || "--"}</TableCell>
                          <TableCell>{spare.category || "--"}</TableCell>
                          <TableCell>{spare.obs_authorised || 0}</TableCell>
                          <TableCell>
                            {spare.box_no
                              ? (() => {
                                  try {
                                    return JSON.parse(spare.box_no)
                                      .map((b) => b.location)
                                      .join(", ");
                                  } catch {
                                    return "--";
                                  }
                                })()
                              : "--"}
                          </TableCell>
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
          style={{ maxWidth: '90vw', width: '90vw' }}
        >
          <DialogTitle className="text-xl">
            {editingRoutine ? "Edit Routine" : "Create New Routine"}
          </DialogTitle>

          <StepIndicator />

          {/* Rest of the dialog remains the same */}
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
            </div>
          )}

          {/* Step 2: Select Spares */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex-1 min-w-[200px] relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search spares..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">All Categories</option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <Button variant="outline" size="sm" onClick={handleSelectAllFiltered}>
                  <FaCheckCircle className="mr-2 h-3 w-3" />
                  Select All ({filteredAvailableSpares.length})
                </Button>

                <Button variant="outline" size="sm" onClick={handleClearAllSelections}>
                  <FaTimes className="mr-2 h-3 w-3" />
                  Clear All
                </Button>
              </div>

              <div className="flex justify-between items-center">
                <span className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-blue-100 text-blue-800">
                  Selected: {tempSelectedSpares.length} spares
                </span>
                <Button variant="ghost" size="sm" onClick={handleSelectAllPage}>
                  {selectAllPage ? "Deselect All on Page" : "Select All on Page"}
                </Button>
              </div>

              <div className="border rounded-md max-h-[450px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-gray-50">
                    <TableRow>
                      <TableHead className="w-12">Select</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>IN Part No.</TableHead>
                      <TableHead>Item Code</TableHead>
                      <TableHead>Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSpares.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          No spares found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedSpares.map((spare) => (
                        <TableRow key={spare.id}>
                          <TableCell>
                            <Checkbox
                              checked={tempSelectedSpares.includes(spare.id)}
                              onCheckedChange={() => toggleSpareSelection(spare.id)}
                            />
                          </TableCell>
                          <TableCell>{spare.description || "--"}</TableCell>
                          <TableCell>{spare.indian_pattern || "--"}</TableCell>
                          <TableCell>{spare.item_code || "--"}</TableCell>
                          <TableCell>{spare.category || "--"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
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
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
                <p><strong>Name:</strong> {newRoutineName}</p>
                {newRoutineDescription && <p><strong>Description:</strong> {newRoutineDescription}</p>}
                <p><strong>Equipment:</strong> {selectedEquipment}</p>
                <p><strong>Total Spares:</strong> {tempSelectedSpares.length}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            {currentStep > 1 && (
              <Button variant="outline" onClick={() => setCurrentStep((step) => step - 1)}>
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
            
            <Button variant="outline" onClick={() => setIsRoutineDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SparesForRoutines;








// // SparesForRoutines.jsx - Without Tabs Component
// import { useState, useEffect, useContext, useMemo } from "react";
// import { 
//   FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaSearch, 
//   FaChevronLeft, FaChevronRight, FaCheckCircle,
//   FaInfoCircle, FaBoxes, FaTags, FaBarcode, FaLayerGroup
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

// const SparesForRoutines = () => {
//   const { equipment_system, fetchEquipment } = useContext(Context);

//   const [selectedEquipment, setSelectedEquipment] = useState("");
//   const [selectedRoutine, setSelectedRoutine] = useState("");
//   const [routines, setRoutines] = useState([]);
//   const [availableSpares, setAvailableSpares] = useState([]);
//   const [assignedSpares, setAssignedSpares] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [editingRoutine, setEditingRoutine] = useState(null);
//   const [newRoutineName, setNewRoutineName] = useState("");
//   const [newRoutineDescription, setNewRoutineDescription] = useState("");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [categoryFilter, setCategoryFilter] = useState("all");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage] = useState(10);

//   // New routine dialog states
//   const [isRoutineDialogOpen, setIsRoutineDialogOpen] = useState(false);
//   const [tempSelectedSpares, setTempSelectedSpares] = useState([]);
//   const [currentStep, setCurrentStep] = useState(1); // 1: Details, 2: Select, 3: Review
//   const [selectAllPage, setSelectAllPage] = useState(false);

//   // Fetch all spares from master inventory
//   const fetchAvailableSpares = async () => {
//     try {
//       const response = await apiService.get("/spares/all", {
//         params: { limit: 1000 },
//       });
//       setAvailableSpares(response.data.items || []);
//     } catch (error) {
//       console.error("Failed to fetch spares:", error);
//       toaster("error", "Failed to fetch spares");
//     }
//   };

//   // Fetch routines for selected equipment
//   const fetchRoutines = async (equipmentId) => {
//     if (!equipmentId) return;
//     setIsLoading(true);
//     try {
//       const response = await apiService.get(
//         `/routines/equipment/${equipmentId}`,
//       );
//       setRoutines(response.data || []);
//     } catch (error) {
//       console.error("Failed to fetch routines:", error);
//       toaster("error", "Failed to fetch routines");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Fetch spares assigned to a routine
//   const fetchRoutineSpares = async (routineId) => {
//     if (!routineId) return;
//     setIsLoading(true);
//     try {
//       const response = await apiService.get(`/routines/${routineId}/spares`);
//       setAssignedSpares(response.data || []);
//     } catch (error) {
//       console.error("Failed to fetch routine spares:", error);
//       toaster("error", "Failed to fetch routine spares");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Handle equipment selection change
//   const handleEquipmentChange = (equipmentName) => {
//     setSelectedEquipment(equipmentName);
//     setSelectedRoutine("");
//     setAssignedSpares([]);
//     if (equipmentName) {
//       fetchRoutines(equipmentName);
//     } else {
//       setRoutines([]);
//     }
//   };

//   // Handle routine selection change
//   const handleRoutineChange = (routine) => {
//     setSelectedRoutine(routine);
//     if (routine && routine.id) {
//       fetchRoutineSpares(routine.id);
//     } else {
//       setAssignedSpares([]);
//     }
//   };

//   // Open dialog to add/edit routine
//   const openRoutineDialog = (routine = null) => {
//     setEditingRoutine(routine);
//     setNewRoutineName(routine ? routine.name : "");
//     setNewRoutineDescription(routine ? routine.description || "" : "");
//     setTempSelectedSpares(routine ? routine.spare_ids || [] : []);
//     setCurrentStep(1);
//     setSearchTerm("");
//     setCategoryFilter("all");
//     setCurrentPage(1);
//     setSelectAllPage(false);
//     setIsRoutineDialogOpen(true);
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

//     if (tempSelectedSpares.length === 0) {
//       toaster("error", "Please select at least one spare for this routine");
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const payload = {
//         name: newRoutineName.trim(),
//         description: newRoutineDescription.trim(),
//         equipment_system: selectedEquipment,
//         spare_ids: tempSelectedSpares,
//       };

//       let response;
//       if (editingRoutine) {
//         response = await apiService.put(
//           `/routines/${editingRoutine.id}`,
//           payload,
//         );
//       } else {
//         response = await apiService.post("/routines", payload);
//       }

//       if (response.success) {
//         toaster(
//           "success",
//           editingRoutine ? "Routine updated" : "Routine created",
//         );
//         setIsRoutineDialogOpen(false);
//         fetchRoutines(selectedEquipment);
//         resetDialogState();
//       } else {
//         toaster("error", response.message || "Failed to save routine");
//       }
//     } catch (error) {
//       console.error("Failed to save routine:", error);
//       toaster("error", error.response?.data?.message || "Failed to save routine");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Reset dialog state
//   const resetDialogState = () => {
//     setEditingRoutine(null);
//     setNewRoutineName("");
//     setNewRoutineDescription("");
//     setTempSelectedSpares([]);
//     setSearchTerm("");
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
//       const response = await apiService.delete(`/routines/${routineId}`);
//       if (response.success) {
//         toaster("success", "Routine deleted");
//         if (selectedRoutine?.id === routineId) {
//           setSelectedRoutine("");
//           setAssignedSpares([]);
//         }
//         fetchRoutines(selectedEquipment);
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

//   // Toggle spare selection in dialog
//   const toggleSpareSelection = (spareId) => {
//     setTempSelectedSpares((prev) =>
//       prev.includes(spareId)
//         ? prev.filter((id) => id !== spareId)
//         : [...prev, spareId],
//     );
//     setSelectAllPage(false);
//   };

//   // Bulk select/deselect all spares on current page
//   const handleSelectAllPage = () => {
//     if (selectAllPage) {
//       const currentPageSpareIds = paginatedSpares.map(spare => spare.id);
//       setTempSelectedSpares(prev => 
//         prev.filter(id => !currentPageSpareIds.includes(id))
//       );
//     } else {
//       const currentPageSpareIds = paginatedSpares.map(spare => spare.id);
//       const newSelections = currentPageSpareIds.filter(
//         id => !tempSelectedSpares.includes(id)
//       );
//       setTempSelectedSpares(prev => [...prev, ...newSelections]);
//     }
//     setSelectAllPage(!selectAllPage);
//   };

//   // Select all spares matching current filter
//   const handleSelectAllFiltered = () => {
//     const allFilteredIds = filteredAvailableSpares.map(spare => spare.id);
//     setTempSelectedSpares(allFilteredIds);
//     setSelectAllPage(false);
//     toaster("success", `Selected ${allFilteredIds.length} spares`);
//   };

//   // Clear all selections
//   const handleClearAllSelections = () => {
//     setTempSelectedSpares([]);
//     setSelectAllPage(false);
//     toaster("info", "All selections cleared");
//   };

//   // Get unique categories for filter
//   const uniqueCategories = useMemo(() => {
//     const categories = new Set();
//     availableSpares.forEach(spare => {
//       if (spare.category) categories.add(spare.category);
//     });
//     return Array.from(categories).sort();
//   }, [availableSpares]);

//   // Filter spares based on search term and category
//   const filteredAvailableSpares = useMemo(() => {
//     let filtered = availableSpares;
    
//     if (searchTerm) {
//       filtered = filtered.filter(
//         (spare) =>
//           spare.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           spare.indian_pattern?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           spare.item_code?.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//     }
    
//     if (categoryFilter !== "all") {
//       filtered = filtered.filter(spare => spare.category === categoryFilter);
//     }
    
//     return filtered;
//   }, [availableSpares, searchTerm, categoryFilter]);

//   // Pagination
//   const totalPages = Math.ceil(filteredAvailableSpares.length / itemsPerPage);
//   const paginatedSpares = filteredAvailableSpares.slice(
//     (currentPage - 1) * itemsPerPage,
//     currentPage * itemsPerPage
//   );

//   // Get selected spares details
//   const selectedSparesDetails = useMemo(() => {
//     return availableSpares.filter(spare => tempSelectedSpares.includes(spare.id));
//   }, [availableSpares, tempSelectedSpares]);

//   useEffect(() => {
//     fetchAvailableSpares();
//   }, []);

//   // Reset page when filters change
//   useEffect(() => {
//     setCurrentPage(1);
//     setSelectAllPage(false);
//   }, [searchTerm, categoryFilter]);

//   // Step indicator component
//   const StepIndicator = () => (
//     <div className="flex items-center justify-center mb-6">
//       <div className="flex items-center">
//         <div className={cn(
//           "w-8 h-8 rounded-full flex items-center justify-center font-semibold",
//           currentStep >= 1 ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
//         )}>1</div>
//         <div className={cn(
//           "w-16 h-1 mx-2",
//           currentStep >= 2 ? "bg-blue-600" : "bg-gray-300"
//         )} />
//         <div className={cn(
//           "w-8 h-8 rounded-full flex items-center justify-center font-semibold",
//           currentStep >= 2 ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
//         )}>2</div>
//         <div className={cn(
//           "w-16 h-1 mx-2",
//           currentStep >= 3 ? "bg-blue-600" : "bg-gray-300"
//         )} />
//         <div className={cn(
//           "w-8 h-8 rounded-full flex items-center justify-center font-semibold",
//           currentStep >= 3 ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
//         )}>3</div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="p-4 h-full">
//       <div className="grid grid-cols-12 gap-4 h-full">
//         {/* Left Panel - Equipment & Routine Selection */}
//         <div className="col-span-4 space-y-4">
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-lg">Equipment / System</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <select
//                 className="w-full border rounded-md px-3 py-2"
//                 value={selectedEquipment}
//                 onChange={(e) => handleEquipmentChange(e.target.value)}
//               >
//                 <option value="">Select Equipment...</option>
//                 {equipment_system?.map((eq) => (
//                   <option key={eq.id || eq.name} value={eq.name}>
//                     {eq.name}
//                   </option>
//                 ))}
//               </select>
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
//                       No routines found
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
//                             {routine.total_spares || 0} spares
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

//         {/* Right Panel - Spares/Tools List */}
//         <div className="col-span-8">
//           <Card className="h-full">
//             <CardHeader>
//               <CardTitle className="text-lg">
//                 {selectedRoutine
//                   ? `Spares/Tools for ${selectedRoutine.name}`
//                   : "Select a routine to view spares"}
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               {selectedRoutine && (
//                 <div className="overflow-x-auto">
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead>Item Description</TableHead>
//                         <TableHead>IN Part No.</TableHead>
//                         <TableHead>Item Code</TableHead>
//                         <TableHead>Category</TableHead>
//                         <TableHead>OBS Authorised</TableHead>
//                         <TableHead>Storage Location</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {isLoading ? (
//                         <TableRow>
//                           <TableCell colSpan={6} className="text-center">
//                             Loading...
//                           </TableCell>
//                         </TableRow>
//                       ) : assignedSpares.length === 0 ? (
//                         <TableRow>
//                           <TableCell colSpan={6} className="text-center">
//                             No spares/tools assigned to this routine
//                           </TableCell>
//                         </TableRow>
//                       ) : (
//                         assignedSpares.map((spare) => (
//                           <TableRow key={spare.id}>
//                             <TableCell>{spare.description || "--"}</TableCell>
//                             <TableCell>
//                               {spare.indian_pattern || "--"}
//                             </TableCell>
//                             <TableCell>{spare.item_code || "--"}</TableCell>
//                             <TableCell>{spare.category || "--"}</TableCell>
//                             <TableCell>{spare.obs_authorised || 0}</TableCell>
//                             <TableCell>
//                               {spare.box_no
//                                 ? JSON.parse(spare.box_no)
//                                     .map((b) => b.location)
//                                     .join(", ")
//                                 : "--"}
//                             </TableCell>
//                           </TableRow>
//                         ))
//                       )}
//                     </TableBody>
//                   </Table>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </div>
//       </div>

//       {/* Add/Edit Routine Dialog - Step based without Tabs */}
//       <Dialog open={isRoutineDialogOpen} onOpenChange={setIsRoutineDialogOpen}>
//         <DialogContent
//           className="max-w-[80vw] w-[90vw] max-h-[90vh] overflow-y-auto"
//           size="full" 
//           unbounded={true}
//         >
//           <DialogTitle className="text-xl">
//             {editingRoutine ? "Edit Routine" : "Create New Routine"}
//           </DialogTitle>

//           <StepIndicator />

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
//                   placeholder="e.g., Daily Inspection, Weekly Maintenance, Quarterly Service"
//                   className="mt-1"
//                   autoFocus
//                 />
//                 <p className="text-xs text-gray-500 mt-1">
//                   Give your routine a clear, descriptive name
//                 </p>
//               </div>

//               <div>
//                 <Label className="text-sm font-semibold">
//                   Description (Optional)
//                 </Label>
//                 <textarea
//                   value={newRoutineDescription}
//                   onChange={(e) => setNewRoutineDescription(e.target.value)}
//                   placeholder="Describe what this routine entails, frequency, special instructions..."
//                   className="w-full border rounded-md px-3 py-2 mt-1 min-h-[100px] resize-vertical"
//                 />
//               </div>

//               <div className="bg-blue-50 p-4 rounded-lg">
//                 <div className="flex items-start gap-2">
//                   <FaInfoCircle className="text-blue-500 mt-0.5" />
//                   <div className="text-sm text-blue-800">
//                     <p className="font-semibold mb-1">Equipment Selected:</p>
//                     <p>{selectedEquipment || "Not selected yet"}</p>
//                     {!selectedEquipment && (
//                       <p className="text-xs mt-1 text-blue-600">
//                         Note: You need to select equipment first before creating
//                         a routine
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Step 2: Select Spares */}
//           {currentStep === 2 && (
//             <div className="space-y-4">
//               {/* Filters Bar */}
//               <div className="flex flex-wrap gap-3 items-center justify-between">
//                 <div className="flex-1 min-w-[200px] relative">
//                   <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                   <Input
//                     placeholder="Search by description, IN part no., or item code..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="pl-9"
//                   />
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

//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={handleSelectAllFiltered}
//                 >
//                   <FaCheckCircle className="mr-2 h-3 w-3" />
//                   Select All ({filteredAvailableSpares.length})
//                 </Button>

//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={handleClearAllSelections}
//                 >
//                   <FaTimes className="mr-2 h-3 w-3" />
//                   Clear All
//                 </Button>
//               </div>

//               {/* Selected Count Badge */}
//               <div className="flex justify-between items-center">
//                 <span className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-blue-100 text-blue-800">
//                   Selected: {tempSelectedSpares.length} spares
//                 </span>
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   onClick={handleSelectAllPage}
//                   className="text-xs"
//                 >
//                   {selectAllPage
//                     ? "Deselect All on Page"
//                     : "Select All on Page"}
//                 </Button>
//               </div>

//               {/* Spares Table */}
//               <div className="border rounded-md max-h-[450px] overflow-auto">
//                 <Table>
//                   <TableHeader className="sticky top-0 bg-gray-50">
//                     <TableRow>
//                       <TableHead className="w-12">Select</TableHead>
//                       <TableHead>
//                         <div className="flex items-center gap-1">
//                           <FaBoxes className="h-3 w-3" />
//                           Description
//                         </div>
//                       </TableHead>
//                       <TableHead>
//                         <div className="flex items-center gap-1">
//                           <FaBarcode className="h-3 w-3" />
//                           IN Part No.
//                         </div>
//                       </TableHead>
//                       <TableHead>
//                         <div className="flex items-center gap-1">
//                           <FaTags className="h-3 w-3" />
//                           Item Code
//                         </div>
//                       </TableHead>
//                       <TableHead>
//                         <div className="flex items-center gap-1">
//                           <FaLayerGroup className="h-3 w-3" />
//                           Category
//                         </div>
//                       </TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {paginatedSpares.length === 0 ? (
//                       <TableRow>
//                         <TableCell colSpan={5} className="text-center py-8">
//                           <div className="text-gray-500">
//                             <FaSearch className="h-8 w-8 mx-auto mb-2 text-gray-300" />
//                             No spares found matching your criteria
//                           </div>
//                         </TableCell>
//                       </TableRow>
//                     ) : (
//                       paginatedSpares.map((spare) => (
//                         <TableRow key={spare.id} className="hover:bg-gray-50">
//                           <TableCell>
//                             <Checkbox
//                               checked={tempSelectedSpares.includes(spare.id)}
//                               onCheckedChange={() =>
//                                 toggleSpareSelection(spare.id)
//                               }
//                             />
//                           </TableCell>
//                           <TableCell className="font-medium">
//                             {spare.description || "--"}
//                           </TableCell>
//                           <TableCell>{spare.indian_pattern || "--"}</TableCell>
//                           <TableCell>{spare.item_code || "--"}</TableCell>
//                           <TableCell>
//                             <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 rounded">
//                               {spare.category || "N/A"}
//                             </span>
//                           </TableCell>
//                         </TableRow>
//                       ))
//                     )}
//                   </TableBody>
//                 </Table>
//               </div>

//               {/* Pagination */}
//               {totalPages > 1 && (
//                 <div className="flex items-center justify-between pt-4">
//                   <div className="text-sm text-gray-500">
//                     Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
//                     {Math.min(
//                       currentPage * itemsPerPage,
//                       filteredAvailableSpares.length,
//                     )}{" "}
//                     of {filteredAvailableSpares.length} spares
//                   </div>
//                   <div className="flex gap-2">
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
//                       disabled={currentPage === 1}
//                     >
//                       <FaChevronLeft className="h-3 w-3" />
//                     </Button>
//                     <span className="px-3 py-1 text-sm">
//                       Page {currentPage} of {totalPages}
//                     </span>
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() =>
//                         setCurrentPage((p) => Math.min(totalPages, p + 1))
//                       }
//                       disabled={currentPage === totalPages}
//                     >
//                       <FaChevronRight className="h-3 w-3" />
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
//                     <strong>Routine Name:</strong> {newRoutineName}
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
//                     <strong>Total Spares Selected:</strong>{" "}
//                     {tempSelectedSpares.length}
//                   </p>
//                 </div>
//               </div>

//               <div>
//                 <h3 className="font-semibold text-md mb-2">
//                   Selected Spares/Tools
//                 </h3>
//                 <div className="border rounded-md max-h-[300px] overflow-auto">
//                   <Table>
//                     <TableHeader className="sticky top-0 bg-gray-50">
//                       <TableRow>
//                         <TableHead>Description</TableHead>
//                         <TableHead>IN Part No.</TableHead>
//                         <TableHead>Item Code</TableHead>
//                         <TableHead>Category</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {selectedSparesDetails.length === 0 ? (
//                         <TableRow>
//                           <TableCell colSpan={4} className="text-center">
//                             No spares selected
//                           </TableCell>
//                         </TableRow>
//                       ) : (
//                         selectedSparesDetails.map((spare) => (
//                           <TableRow key={spare.id}>
//                             <TableCell>{spare.description || "--"}</TableCell>
//                             <TableCell>
//                               {spare.indian_pattern || "--"}
//                             </TableCell>
//                             <TableCell>{spare.item_code || "--"}</TableCell>
//                             <TableCell>{spare.category || "--"}</TableCell>
//                           </TableRow>
//                         ))
//                       )}
//                     </TableBody>
//                   </Table>
//                 </div>
//               </div>
//             </div>
//           )}

//           <DialogFooter>
//             {currentStep > 1 && (
//               <Button
//                 variant="outline"
//                 onClick={() => setCurrentStep((step) => step - 1)}
//               >
//                 <FaChevronLeft className="mr-2 h-4 w-4" />
//                 Back
//               </Button>
//             )}

//             {currentStep < 3 ? (
//               <Button
//                 onClick={() => {
//                   if (
//                     currentStep === 1 &&
//                     (!selectedEquipment || !newRoutineName.trim())
//                   ) {
//                     toaster(
//                       "error",
//                       "Please fill in routine name and select equipment",
//                     );
//                     return;
//                   }
//                   if (currentStep === 2 && tempSelectedSpares.length === 0) {
//                     toaster("error", "Please select at least one spare");
//                     return;
//                   }
//                   setCurrentStep((step) => step + 1);
//                 }}
//               >
//                 Next
//                 <FaChevronRight className="ml-2 h-4 w-4" />
//               </Button>
//             ) : (
//               <Button onClick={saveRoutine} disabled={isLoading}>
//                 {isLoading ? (
//                   <div className="flex items-center gap-2">
//                     <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
//                     {editingRoutine ? "Updating..." : "Creating..."}
//                   </div>
//                 ) : (
//                   <>
//                     <FaSave className="mr-2 h-4 w-4" />
//                     {editingRoutine ? "Update Routine" : "Create Routine"}
//                   </>
//                 )}
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

// export default SparesForRoutines;