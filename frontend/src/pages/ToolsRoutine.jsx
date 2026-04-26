// ToolsForRoutines.jsx
import { useState, useEffect, useContext, useMemo } from "react";
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
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // New routine dialog states
  const [isRoutineDialogOpen, setIsRoutineDialogOpen] = useState(false);
  const [tempSelectedTools, setTempSelectedTools] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectAllPage, setSelectAllPage] = useState(false);

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
      // Changed from /routines to /routinesTool
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
      // Changed from /routines to /routinesTool
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
  const openRoutineDialog = (routine = null) => {
    setEditingRoutine(routine);
    setNewRoutineName(routine ? routine.name : "");
    setNewRoutineDescription(routine ? routine.description || "" : "");
    setTempSelectedTools(routine ? routine.tool_ids || [] : []);
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
        tool_ids: tempSelectedTools,
      };

      let response;
      if (editingRoutine) {
        // Changed from /routines to /routinesTool
        response = await apiService.put(
          `/routinesTool/${editingRoutine.id}`,
          payload,
        );
      } else {
        // Changed from /routines to /routinesTool
        response = await apiService.post("/routinesTool", payload);
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
      // Changed from /routines to /routinesTool
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

  // Toggle tool selection in dialog
  const toggleToolSelection = (toolId) => {
    setTempSelectedTools((prev) =>
      prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId],
    );
    setSelectAllPage(false);
  };

  // Bulk select/deselect all tools on current page
  const handleSelectAllPage = () => {
    if (selectAllPage) {
      const currentPageToolIds = paginatedTools.map((tool) => tool.id);
      setTempSelectedTools((prev) =>
        prev.filter((id) => !currentPageToolIds.includes(id)),
      );
    } else {
      const currentPageToolIds = paginatedTools.map((tool) => tool.id);
      const newSelections = currentPageToolIds.filter(
        (id) => !tempSelectedTools.includes(id),
      );
      setTempSelectedTools((prev) => [...prev, ...newSelections]);
    }
    setSelectAllPage(!selectAllPage);
  };

  // Select all tools matching current filter
  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredAvailableTools.map((tool) => tool.id);
    setTempSelectedTools(allFilteredIds);
    setSelectAllPage(false);
    toaster("success", `Selected ${allFilteredIds.length} tools`);
  };

  // Clear all selections
  const handleClearAllSelections = () => {
    setTempSelectedTools([]);
    setSelectAllPage(false);
    toaster("info", "All selections cleared");
  };

  // Get unique categories for filter
  const uniqueCategories = useMemo(() => {
    const categories = new Set();
    availableTools.forEach((tool) => {
      if (tool.category) categories.add(tool.category);
    });
    return Array.from(categories).sort();
  }, [availableTools]);

  // Filter tools based on search term and category
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

    if (categoryFilter !== "all") {
      filtered = filtered.filter((tool) => tool.category === categoryFilter);
    }

    return filtered;
  }, [availableTools, searchTerm, categoryFilter]);

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
  }, [searchTerm, categoryFilter]);

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center font-semibold",
            currentStep >= 1
              ? "bg-blue-600 text-white"
              : "bg-gray-300 text-gray-600",
          )}
        >
          1
        </div>
        <div
          className={cn(
            "w-16 h-1 mx-2",
            currentStep >= 2 ? "bg-blue-600" : "bg-gray-300",
          )}
        />
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center font-semibold",
            currentStep >= 2
              ? "bg-blue-600 text-white"
              : "bg-gray-300 text-gray-600",
          )}
        >
          2
        </div>
        <div
          className={cn(
            "w-16 h-1 mx-2",
            currentStep >= 3 ? "bg-blue-600" : "bg-gray-300",
          )}
        />
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center font-semibold",
            currentStep >= 3
              ? "bg-blue-600 text-white"
              : "bg-gray-300 text-gray-600",
          )}
        >
          3
        </div>
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
          )}
        </div>

        {/* Right Panel - Tools List */}
        <div className="col-span-8">
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
                        <TableHead>OBS Authorised</TableHead>
                        <TableHead>Storage Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignedTools.map((tool) => (
                        <TableRow key={tool.id}>
                          <TableCell>{tool.description || "--"}</TableCell>
                          <TableCell>{tool.indian_pattern || "--"}</TableCell>
                          <TableCell>{tool.item_code || "--"}</TableCell>
                          <TableCell>{tool.category || "--"}</TableCell>
                          <TableCell>{tool.obs_authorised || 0}</TableCell>
                          <TableCell>
                            {tool.box_no
                              ? (() => {
                                  try {
                                    return JSON.parse(tool.box_no)
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
          style={{ maxWidth: "90vw", width: "90vw" }}
        >
          <DialogTitle className="text-xl">
            {editingRoutine ? "Edit Routine" : "Create New Routine"}
          </DialogTitle>

          <StepIndicator />

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

          {/* Step 2: Select Tools */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex-1 min-w-[200px] relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search tools..."
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
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllFiltered}
                >
                  <FaCheckCircle className="mr-2 h-3 w-3" />
                  Select All ({filteredAvailableTools.length})
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllSelections}
                >
                  <FaTimes className="mr-2 h-3 w-3" />
                  Clear All
                </Button>
              </div>

              <div className="flex justify-between items-center">
                <span className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-blue-100 text-blue-800">
                  Selected: {tempSelectedTools.length} tools
                </span>
                <Button variant="ghost" size="sm" onClick={handleSelectAllPage}>
                  {selectAllPage
                    ? "Deselect All on Page"
                    : "Select All on Page"}
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
                    {paginatedTools.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          No tools found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedTools.map((tool) => (
                        <TableRow key={tool.id}>
                          <TableCell>
                            <Checkbox
                              checked={tempSelectedTools.includes(tool.id)}
                              onCheckedChange={() =>
                                toggleToolSelection(tool.id)
                              }
                            />
                          </TableCell>
                          <TableCell>{tool.description || "--"}</TableCell>
                          <TableCell>{tool.indian_pattern || "--"}</TableCell>
                          <TableCell>{tool.item_code || "--"}</TableCell>
                          <TableCell>{tool.category || "--"}</TableCell>
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
              </div>
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
