// components/SuccessionBoard.jsx
import { useState, useEffect, useContext } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaUserTie,
  FaUserCog,
  FaUserAlt,
  FaCalendarAlt,
  FaStar,
  FaHistory,
  FaUserPlus,
} from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormattedDatePicker } from "@/components/FormattedDatePicker";
import toaster from "../utils/toaster";
import apiService from "../utils/apiService";
import { Context } from "../utils/Context";
import { cn } from "../lib/utils";

const SuccessionBoard = () => {
  const { user } = useContext(Context);
  const [boardData, setBoardData] = useState({
    officer_incharge: null,
    storekeeper: null,
    asst_storekeeper: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [formData, setFormData] = useState({
    position: "",
    name: "",
    rank: "",
    service_no: "",
    contact: "",
    from_date: new Date(),
    to_date: null,
  });

  // Fetch succession board data
  const fetchBoardData = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.get("/succession-board");
      setBoardData(response.data || {});
    } catch (error) {
      console.error("Failed to fetch board data:", error);
      toaster("error", "Failed to fetch succession board data");
    } finally {
      setIsLoading(false);
    }
  };

  // Add new succession record (can add multiple officers over time)
  const saveSuccession = async () => {
    if (!formData.position) {
      toaster("error", "Position is required");
      return;
    }
    if (!formData.name.trim()) {
      toaster("error", "Name is required");
      return;
    }
    if (!formData.rank.trim()) {
      toaster("error", "Rank is required");
      return;
    }
    if (!formData.service_no.trim()) {
      toaster("error", "Service No. is required");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.post("/succession-board", formData);
      if (response.success) {
        toaster(
          "success",
          `${getPositionLabel(formData.position)} record added successfully`,
        );
        setIsDialogOpen(false);
        resetForm();
        fetchBoardData();
      } else {
        toaster("error", response.message || "Failed to save");
      }
    } catch (error) {
      console.error("Failed to save:", error);
      toaster("error", error.response?.data?.message || "Failed to save");
    } finally {
      setIsLoading(false);
    }
  };

  // Update existing record
  const updateSuccession = async () => {
    if (!formData.name.trim()) {
      toaster("error", "Name is required");
      return;
    }

    setIsLoading(true);
    try {
      const updateData = {
        name: formData.name,
        rank: formData.rank,
        service_no: formData.service_no,
        contact: formData.contact,
        from_date: formData.from_date,
      };

      const response = await apiService.put(
        `/succession-board/${formData.record_id}`,
        updateData,
      );
      if (response.success) {
        toaster("success", "Record updated successfully");
        setIsDialogOpen(false);
        resetForm();
        fetchBoardData();
      } else {
        toaster("error", response.message || "Failed to update");
      }
    } catch (error) {
      console.error("Failed to update:", error);
      toaster("error", error.response?.data?.message || "Failed to update");
    } finally {
      setIsLoading(false);
    }
  };

  // End current tenure and add as history
  const endTenure = async (record, position) => {
    const endDate = new Date();
    if (
      confirm(
        `End tenure for ${record.name} as ${getPositionLabel(position)}? This will move them to historical records.`,
      )
    ) {
      setIsLoading(true);
      try {
        const response = await apiService.put(
          `/succession-board/${record.id}`,
          {
            to_date: endDate,
          },
        );
        if (response.success) {
          toaster("success", `${record.name}'s tenure ended successfully`);
          fetchBoardData();
        } else {
          toaster("error", response.message || "Failed to end tenure");
        }
      } catch (error) {
        console.error("Failed to end tenure:", error);
        toaster(
          "error",
          error.response?.data?.message || "Failed to end tenure",
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Delete record
  const deleteRecord = async (id, name, position) => {
    if (
      !confirm(
        `Are you sure you want to delete ${name}'s record from ${getPositionLabel(position)}?`,
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.delete(`/succession-board/${id}`);
      if (response.success) {
        toaster("success", "Record deleted successfully");
        fetchBoardData();
      } else {
        toaster("error", response.message || "Failed to delete");
      }
    } catch (error) {
      console.error("Failed to delete:", error);
      toaster("error", error.response?.data?.message || "Failed to delete");
    } finally {
      setIsLoading(false);
    }
  };

  // Open add dialog
  const handleAdd = (position) => {
    setEditingPosition(null);
    setFormData({
      position: position,
      name: "",
      rank: "",
      service_no: "",
      contact: "",
      from_date: new Date(),
      to_date: null,
      record_id: null,
    });
    setIsDialogOpen(true);
  };

  // Open edit dialog
  const handleEdit = (record, position) => {
    setEditingPosition(position);
    setFormData({
      position: position,
      name: record.name,
      rank: record.rank,
      service_no: record.service_no,
      contact: record.contact || "",
      from_date: record.from_date ? new Date(record.from_date) : new Date(),
      to_date: null,
      record_id: record.id,
    });
    setIsDialogOpen(true);
  };

  // Open history dialog
  const handleViewHistory = (position) => {
    setSelectedPosition(position);
    setIsHistoryDialogOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setEditingPosition(null);
    setFormData({
      position: "",
      name: "",
      rank: "",
      service_no: "",
      contact: "",
      from_date: new Date(),
      to_date: null,
      record_id: null,
    });
  };

  // Get position label
  const getPositionLabel = (position) => {
    const labels = {
      officer_incharge: "Officer Incharge SPTA",
      storekeeper: "Storekeeper",
      asst_storekeeper: "Asst. Storekeeper",
    };
    return labels[position] || position;
  };

  // Get position icon
  const getPositionIcon = (position) => {
    const icons = {
      officer_incharge: <FaUserTie className="h-8 w-8" />,
      storekeeper: <FaUserCog className="h-8 w-8" />,
      asst_storekeeper: <FaUserAlt className="h-8 w-8" />,
    };
    return icons[position];
  };

  useEffect(() => {
    fetchBoardData();
  }, []);

  const renderBoardCard = (position, currentRecord) => {
    const historyRecords = boardData[`${position}_history`] || [];

    return (
      <div
        className="relative overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 hover:scale-[1.02]"
        style={{
          background:
            "linear-gradient(135deg, #3e2723 0%, #2c1a12 50%, #1a0f0a 100%)",
          border: "2px solid #b8860b",
          boxShadow:
            "0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        {/* Wood Grain Pattern */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, 
              transparent, 
              transparent 2px, 
              rgba(0,0,0,0.1) 2px, 
              rgba(0,0,0,0.1) 4px)`,
          }}
        />

        {/* Golden Border Accents */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>

        {/* Corner Wood Joints */}
        <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-amber-600/50 rounded-tl-lg"></div>
        <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-amber-600/50 rounded-tr-lg"></div>
        <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-amber-600/50 rounded-bl-lg"></div>
        <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-amber-600/50 rounded-br-lg"></div>

        {/* Content */}
        <div className="relative p-6 flex flex-col min-h-[380px]">
          {/* Header with Brass Plate Effect */}
          <div className="text-center mb-4 pb-3 border-b border-amber-600/30">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-2 rounded-full bg-amber-900/30 border-2 border-amber-600 shadow-inner">
              {getPositionIcon(position)}
            </div>
            <h3 className="text-amber-400 font-bold text-lg tracking-wide font-serif">
              {getPositionLabel(position)}
            </h3>
          </div>

          {/* Current Incumbent */}
          {currentRecord ? (
            <div className="space-y-3 mb-4">
              <div className="bg-black/30 rounded-lg p-3 border border-amber-600/30 shadow-inner">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-amber-400/80 text-xs font-semibold uppercase tracking-wider">
                      Current Incumbent
                    </p>
                    <p className="text-white text-lg font-bold">
                      {currentRecord.name}
                    </p>
                    <p className="text-amber-300 text-sm">
                      Rank: {currentRecord.rank}
                    </p>
                    <p className="text-gray-400 text-xs">
                      Service No: {currentRecord.service_no}
                    </p>
                    <p className="text-gray-400 text-xs">
                      Contact: {currentRecord.contact || "--"}
                    </p>
                    <p className="text-amber-500 text-xs mt-1">
                      Since:{" "}
                      {currentRecord.from_date
                        ? new Date(currentRecord.from_date).toLocaleDateString()
                        : "--"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-[10px]">Active</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleEdit(currentRecord, position)}
                  className="flex-1 bg-green-900 hover:bg-green-950 text-white text-sm"
                >
                  <FaEdit className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  onClick={() => endTenure(currentRecord, position)}
                  className="flex-1 bg-red-800 hover:bg-red-900 text-white text-sm"
                >
                  <FaTimes className="mr-1 h-3 w-3" />
                  End Tenure
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center mb-4">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-3 bg-amber-900/20 rounded-full flex items-center justify-center border-2 border-amber-600/50">
                  <FaStar className="text-amber-500 text-3xl" />
                </div>
                <p className="text-amber-400/60 text-sm">No one assigned</p>
                <p className="text-gray-500 text-xs mt-1">Click + to add</p>
              </div>
            </div>
          )}

          {/* History Link */}
          {historyRecords.length > 0 && (
            <button
              onClick={() => handleViewHistory(position)}
              className="mt-2 pt-2 text-center text-amber-500/70 hover:text-amber-400 text-xs flex items-center justify-center gap-1 transition-colors border-t border-amber-600/20"
            >
              <FaHistory className="h-3 w-3" />
              View Previous ({historyRecords.length})
            </button>
          )}

          {/* Add Button */}
          <Button
            size="sm"
            onClick={() => handleAdd(position)}
            className="mt-3 bg-emerald-900 hover:bg-emerald-950 text-white w-full"
          >
            <FaUserPlus className="mr-1 h-3 w-3" />
            Add New {getPositionLabel(position).split(" ")[0]}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div
      className="min-h-screen p-4"
      style={{
        background:
          "linear-gradient(135deg, #2c1810 0%, #1a0f0a 50%, #0d0805 100%)",
      }}
    >
      {/* Wood Texture Background Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, 
            transparent, 
            transparent 10px, 
            rgba(0,0,0,0.2) 10px, 
            rgba(0,0,0,0.2) 20px)`,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header with Wooden Plaque Style */}
        <div className="text-center mb-10">
          <div
            className="inline-block relative px-8 py-4 rounded-lg"
            style={{
              background: "linear-gradient(135deg, #5d3a1a 0%, #3e2723 100%)",
              border: "2px solid #b8860b",
              boxShadow:
                "0 10px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            <div
              className="absolute inset-0 rounded-lg opacity-30"
              style={{
                backgroundImage: `repeating-linear-gradient(90deg, 
                transparent, 
                transparent 2px, 
                rgba(0,0,0,0.2) 2px, 
                rgba(0,0,0,0.2) 4px)`,
              }}
            />
            <h1 className="relative text-5xl font-serif font-bold text-amber-300 mb-2 tracking-wider">
              Succession Board
            </h1>
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto my-2"></div>
            <p className="relative text-amber-400/70 text-sm font-serif italic">
              Line of Succession • Chain of Command
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && !boardData.officer_incharge && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-amber-400">Loading succession board...</p>
            </div>
          </div>
        )}

        {/* Board Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderBoardCard("officer_incharge", boardData.officer_incharge)}
          {renderBoardCard("storekeeper", boardData.storekeeper)}
          {renderBoardCard("asst_storekeeper", boardData.asst_storekeeper)}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="max-w-md"
          style={{
            background: "linear-gradient(135deg, #3e2723 0%, #2c1a12 100%)",
            border: "2px solid #b8860b",
          }}
        >
          <DialogTitle className="text-amber-400 font-serif text-xl">
            {editingPosition
              ? `Edit ${getPositionLabel(editingPosition)}`
              : `Add New ${getPositionLabel(formData.position)}`}
          </DialogTitle>
          <div className="space-y-4">
            <div>
              <Label className="text-amber-400">Full Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value.toUpperCase(),
                  })
                }
                placeholder="Enter full name"
                className="bg-gray-900/50 border-amber-600 text-white focus:border-amber-500"
              />
            </div>
            <div>
              <Label className="text-amber-400">Rank *</Label>
              <Input
                value={formData.rank}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rank: e.target.value.toUpperCase(),
                  })
                }
                placeholder="Enter rank"
                className="bg-gray-900/50 border-amber-600 text-white focus:border-amber-500"
              />
            </div>
            <div>
              <Label className="text-amber-400">Service No. *</Label>
              <Input
                value={formData.service_no}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    service_no: e.target.value.toUpperCase(),
                  })
                }
                placeholder="Enter service number"
                className="bg-gray-900/50 border-amber-600 text-white focus:border-amber-500"
              />
            </div>
            <div>
              <Label className="text-amber-400">Contact Number</Label>
              <Input
                value={formData.contact}
                onChange={(e) =>
                  setFormData({ ...formData, contact: e.target.value })
                }
                placeholder="Enter contact number"
                className="bg-gray-900/50 border-amber-600 text-white focus:border-amber-500"
              />
            </div>
            <div>
              <Label className="text-amber-400">From Date *</Label>
              <FormattedDatePicker
                value={formData.from_date}
                onChange={(date) =>
                  setFormData({ ...formData, from_date: date })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="border-amber-600 text-amber-400 hover:bg-amber-900/30"
            >
              Cancel
            </Button>
            <Button
              onClick={editingPosition ? updateSuccession : saveSuccession}
              disabled={isLoading}
              className="bg-green-900 hover:bg-green-950 text-white"
            >
              <FaSave className="mr-2" />
              {editingPosition ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent
          className="max-w-2xl max-h-[70vh] overflow-y-auto"
          style={{
            background: "linear-gradient(135deg, #3e2723 0%, #2c1a12 100%)",
            border: "2px solid #b8860b",
          }}
        >
          <DialogTitle className="text-amber-400 font-serif text-xl">
            Historical Records -{" "}
            {selectedPosition && getPositionLabel(selectedPosition)}
          </DialogTitle>
          <div className="space-y-3">
            {selectedPosition &&
              (boardData[`${selectedPosition}_history`] || []).map(
                (record, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-900/30 rounded-lg p-3 border border-amber-600/30"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-white font-bold">{record.name}</p>
                        <p className="text-amber-400 text-sm">
                          Rank: {record.rank}
                        </p>
                        <p className="text-gray-400 text-xs">
                          Service No: {record.service_no}
                        </p>
                        <p className="text-gray-400 text-xs">
                          Contact: {record.contact || "--"}
                        </p>
                        <p className="text-amber-500 text-xs mt-1">
                          Tenure:{" "}
                          {record.from_date
                            ? new Date(record.from_date).toLocaleDateString()
                            : "--"}{" "}
                          →
                          {record.to_date
                            ? new Date(record.to_date).toLocaleDateString()
                            : "Present"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          deleteRecord(record.id, record.name, selectedPosition)
                        }
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                      >
                        <FaTrash className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ),
              )}
            {selectedPosition &&
              (!boardData[`${selectedPosition}_history`] ||
                boardData[`${selectedPosition}_history`].length === 0) && (
                <div className="text-center py-8">
                  <p className="text-gray-400">No historical records found</p>
                </div>
              )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsHistoryDialogOpen(false)}
              className="bg-emerald-900 hover:bg-emerald-950 text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuccessionBoard;
