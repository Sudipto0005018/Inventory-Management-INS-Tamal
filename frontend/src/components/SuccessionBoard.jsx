// // components/SuccessionBoard.jsx
// import { useState, useEffect, useContext } from "react";
// import {
//   FaPlus,
//   FaEdit,
//   FaTrash,
//   FaSave,
//   FaTimes,
//   FaUserTie,
//   FaUserCog,
//   FaUserAlt,
//   FaCalendarAlt,
//   FaStar,
//   FaHistory,
//   FaUserPlus,
// } from "react-icons/fa";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Dialog,
//   DialogContent,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { FormattedDatePicker } from "@/components/FormattedDatePicker";
// import toaster from "../utils/toaster";
// import apiService from "../utils/apiService";
// import { Context } from "../utils/Context";
// import { cn } from "../lib/utils";

// const SuccessionBoard = () => {
//   const { user } = useContext(Context);
//   const [boardData, setBoardData] = useState({
//     officer_incharge: null,
//     storekeeper: null,
//     asst_storekeeper: null,
//   });
//   const [isLoading, setIsLoading] = useState(false);
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
//   const [editingPosition, setEditingPosition] = useState(null);
//   const [selectedPosition, setSelectedPosition] = useState(null);
//   const [formData, setFormData] = useState({
//     position: "",
//     name: "",
//     rank: "",
//     service_no: "",
//     contact: "",
//     from_date: new Date(),
//     to_date: null,
//   });

//   // Fetch succession board data
//   const fetchBoardData = async () => {
//     setIsLoading(true);
//     try {
//       const response = await apiService.get("/succession-board");
//       setBoardData(response.data || {});
//     } catch (error) {
//       console.error("Failed to fetch board data:", error);
//       toaster("error", "Failed to fetch succession board data");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Add new succession record (can add multiple officers over time)
//   const saveSuccession = async () => {
//     if (!formData.position) {
//       toaster("error", "Position is required");
//       return;
//     }
//     if (!formData.name.trim()) {
//       toaster("error", "Name is required");
//       return;
//     }
//     if (!formData.rank.trim()) {
//       toaster("error", "Rank is required");
//       return;
//     }
//     if (!formData.service_no.trim()) {
//       toaster("error", "Service No. is required");
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const response = await apiService.post("/succession-board", formData);
//       if (response.success) {
//         toaster(
//           "success",
//           `${getPositionLabel(formData.position)} record added successfully`,
//         );
//         setIsDialogOpen(false);
//         resetForm();
//         fetchBoardData();
//       } else {
//         toaster("error", response.message || "Failed to save");
//       }
//     } catch (error) {
//       console.error("Failed to save:", error);
//       toaster("error", error.response?.data?.message || "Failed to save");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Update existing record
//   const updateSuccession = async () => {
//     if (!formData.name.trim()) {
//       toaster("error", "Name is required");
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const updateData = {
//         name: formData.name,
//         rank: formData.rank,
//         service_no: formData.service_no,
//         contact: formData.contact,
//         from_date: formData.from_date,
//       };

//       const response = await apiService.put(
//         `/succession-board/${formData.record_id}`,
//         updateData,
//       );
//       if (response.success) {
//         toaster("success", "Record updated successfully");
//         setIsDialogOpen(false);
//         resetForm();
//         fetchBoardData();
//       } else {
//         toaster("error", response.message || "Failed to update");
//       }
//     } catch (error) {
//       console.error("Failed to update:", error);
//       toaster("error", error.response?.data?.message || "Failed to update");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // End current tenure and add as history
//   const endTenure = async (record, position) => {
//     const endDate = new Date();
//     if (
//       confirm(
//         `End tenure for ${record.name} as ${getPositionLabel(position)}? This will move them to historical records.`,
//       )
//     ) {
//       setIsLoading(true);
//       try {
//         const response = await apiService.put(
//           `/succession-board/${record.id}`,
//           {
//             to_date: endDate,
//           },
//         );
//         if (response.success) {
//           toaster("success", `${record.name}'s tenure ended successfully`);
//           fetchBoardData();
//         } else {
//           toaster("error", response.message || "Failed to end tenure");
//         }
//       } catch (error) {
//         console.error("Failed to end tenure:", error);
//         toaster(
//           "error",
//           error.response?.data?.message || "Failed to end tenure",
//         );
//       } finally {
//         setIsLoading(false);
//       }
//     }
//   };

//   // Delete record
//   const deleteRecord = async (id, name, position) => {
//     if (
//       !confirm(
//         `Are you sure you want to delete ${name}'s record from ${getPositionLabel(position)}?`,
//       )
//     ) {
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const response = await apiService.delete(`/succession-board/${id}`);
//       if (response.success) {
//         toaster("success", "Record deleted successfully");
//         fetchBoardData();
//       } else {
//         toaster("error", response.message || "Failed to delete");
//       }
//     } catch (error) {
//       console.error("Failed to delete:", error);
//       toaster("error", error.response?.data?.message || "Failed to delete");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Open add dialog
//   const handleAdd = (position) => {
//     setEditingPosition(null);
//     setFormData({
//       position: position,
//       name: "",
//       rank: "",
//       service_no: "",
//       contact: "",
//       from_date: new Date(),
//       to_date: null,
//       record_id: null,
//     });
//     setIsDialogOpen(true);
//   };

//   // Open edit dialog
//   const handleEdit = (record, position) => {
//     setEditingPosition(position);
//     setFormData({
//       position: position,
//       name: record.name,
//       rank: record.rank,
//       service_no: record.service_no,
//       contact: record.contact || "",
//       from_date: record.from_date ? new Date(record.from_date) : new Date(),
//       to_date: null,
//       record_id: record.id,
//     });
//     setIsDialogOpen(true);
//   };

//   // Open history dialog
//   const handleViewHistory = (position) => {
//     setSelectedPosition(position);
//     setIsHistoryDialogOpen(true);
//   };

//   // Reset form
//   const resetForm = () => {
//     setEditingPosition(null);
//     setFormData({
//       position: "",
//       name: "",
//       rank: "",
//       service_no: "",
//       contact: "",
//       from_date: new Date(),
//       to_date: null,
//       record_id: null,
//     });
//   };

//   // Get position label
//   const getPositionLabel = (position) => {
//     const labels = {
//       officer_incharge: "Officer Incharge SPTA",
//       storekeeper: "Storekeeper",
//       asst_storekeeper: "Asst. Storekeeper",
//     };
//     return labels[position] || position;
//   };

//   // Get position icon
//   const getPositionIcon = (position) => {
//     const icons = {
//       officer_incharge: <FaUserTie className="h-8 w-8" />,
//       storekeeper: <FaUserCog className="h-8 w-8" />,
//       asst_storekeeper: <FaUserAlt className="h-8 w-8" />,
//     };
//     return icons[position];
//   };

//   useEffect(() => {
//     fetchBoardData();
//   }, []);

//   const renderBoardCard = (position, currentRecord) => {
//     const historyRecords = boardData[`${position}_history`] || [];

//     return (
//       <div
//         className="relative overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 hover:scale-[1.02]"
//         style={{
//           background:
//             "linear-gradient(135deg, #3e2723 0%, #2c1a12 50%, #1a0f0a 100%)",
//           border: "2px solid #b8860b",
//           boxShadow:
//             "0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
//         }}
//       >
//         {/* Wood Grain Pattern */}
//         <div
//           className="absolute inset-0 opacity-10 pointer-events-none"
//           style={{
//             backgroundImage: `repeating-linear-gradient(90deg,
//               transparent,
//               transparent 2px,
//               rgba(0,0,0,0.1) 2px,
//               rgba(0,0,0,0.1) 4px)`,
//           }}
//         />

//         {/* Golden Border Accents */}
//         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
//         <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>

//         {/* Corner Wood Joints */}
//         <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-amber-600/50 rounded-tl-lg"></div>
//         <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-amber-600/50 rounded-tr-lg"></div>
//         <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-amber-600/50 rounded-bl-lg"></div>
//         <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-amber-600/50 rounded-br-lg"></div>

//         {/* Content */}
//         <div className="relative p-6 flex flex-col min-h-[380px]">
//           {/* Header with Brass Plate Effect */}
//           <div className="text-center mb-4 pb-3 border-b border-amber-600/30">
//             <div className="inline-flex items-center justify-center w-16 h-16 mb-2 rounded-full bg-amber-900/30 border-2 border-amber-600 shadow-inner">
//               {getPositionIcon(position)}
//             </div>
//             <h3 className="text-amber-400 font-bold text-lg tracking-wide font-serif">
//               {getPositionLabel(position)}
//             </h3>
//           </div>

//           {/* Current Incumbent */}
//           {currentRecord ? (
//             <div className="space-y-3 mb-4">
//               <div className="bg-black/30 rounded-lg p-3 border border-amber-600/30 shadow-inner">
//                 <div className="flex justify-between items-start">
//                   <div className="flex-1">
//                     <p className="text-amber-400/80 text-xs font-semibold uppercase tracking-wider">
//                       Current Incumbent
//                     </p>
//                     <p className="text-white text-lg font-bold">
//                       {currentRecord.name}
//                     </p>
//                     <p className="text-amber-300 text-sm">
//                       Rank: {currentRecord.rank}
//                     </p>
//                     <p className="text-gray-400 text-xs">
//                       Service No: {currentRecord.service_no}
//                     </p>
//                     <p className="text-gray-400 text-xs">
//                       Contact: {currentRecord.contact || "--"}
//                     </p>
//                     <p className="text-amber-500 text-xs mt-1">
//                       Since:{" "}
//                       {currentRecord.from_date
//                         ? new Date(currentRecord.from_date).toLocaleDateString()
//                         : "--"}
//                     </p>
//                   </div>
//                   <div className="flex flex-col gap-1">
//                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
//                     <span className="text-green-400 text-[10px]">Active</span>
//                   </div>
//                 </div>
//               </div>

//               {/* Action Buttons */}
//               <div className="flex gap-2">
//                 <Button
//                   size="sm"
//                   onClick={() => handleEdit(currentRecord, position)}
//                   className="flex-1 bg-green-900 hover:bg-green-950 text-white text-sm"
//                 >
//                   <FaEdit className="mr-1 h-3 w-3" />
//                   Edit
//                 </Button>
//                 <Button
//                   size="sm"
//                   onClick={() => endTenure(currentRecord, position)}
//                   className="flex-1 bg-red-800 hover:bg-red-900 text-white text-sm"
//                 >
//                   <FaTimes className="mr-1 h-3 w-3" />
//                   End Tenure
//                 </Button>
//               </div>
//             </div>
//           ) : (
//             <div className="flex-1 flex items-center justify-center mb-4">
//               <div className="text-center">
//                 <div className="w-20 h-20 mx-auto mb-3 bg-amber-900/20 rounded-full flex items-center justify-center border-2 border-amber-600/50">
//                   <FaStar className="text-amber-500 text-3xl" />
//                 </div>
//                 <p className="text-amber-400/60 text-sm">No one assigned</p>
//                 <p className="text-gray-500 text-xs mt-1">Click + to add</p>
//               </div>
//             </div>
//           )}

//           {/* History Link */}
//           {historyRecords.length > 0 && (
//             <button
//               onClick={() => handleViewHistory(position)}
//               className="mt-2 pt-2 text-center text-amber-500/70 hover:text-amber-400 text-xs flex items-center justify-center gap-1 transition-colors border-t border-amber-600/20"
//             >
//               <FaHistory className="h-3 w-3" />
//               View Previous ({historyRecords.length})
//             </button>
//           )}

//           {/* Add Button */}
//           <Button
//             size="sm"
//             onClick={() => handleAdd(position)}
//             className="mt-3 bg-emerald-900 hover:bg-emerald-950 text-white w-full"
//           >
//             <FaUserPlus className="mr-1 h-3 w-3" />
//             Add New {getPositionLabel(position).split(" ")[0]}
//           </Button>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div
//       className="min-h-screen p-4"
//       style={{
//         background:
//           "linear-gradient(135deg, #2c1810 0%, #1a0f0a 50%, #0d0805 100%)",
//       }}
//     >
//       {/* Wood Texture Background Overlay */}
//       <div
//         className="fixed inset-0 pointer-events-none opacity-5"
//         style={{
//           backgroundImage: `repeating-linear-gradient(45deg,
//             transparent,
//             transparent 10px,
//             rgba(0,0,0,0.2) 10px,
//             rgba(0,0,0,0.2) 20px)`,
//         }}
//       />

//       <div className="relative z-10 max-w-7xl mx-auto">
//         {/* Header with Wooden Plaque Style */}
//         <div className="text-center mb-10">
//           <div
//             className="inline-block relative px-8 py-4 rounded-lg"
//             style={{
//               background: "linear-gradient(135deg, #5d3a1a 0%, #3e2723 100%)",
//               border: "2px solid #b8860b",
//               boxShadow:
//                 "0 10px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
//             }}
//           >
//             <div
//               className="absolute inset-0 rounded-lg opacity-30"
//               style={{
//                 backgroundImage: `repeating-linear-gradient(90deg,
//                 transparent,
//                 transparent 2px,
//                 rgba(0,0,0,0.2) 2px,
//                 rgba(0,0,0,0.2) 4px)`,
//               }}
//             />
//             <h1 className="relative text-5xl font-serif font-bold text-amber-300 mb-2 tracking-wider">
//               Succession Board
//             </h1>
//             <div className="w-32 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto my-2"></div>
//             <p className="relative text-amber-400/70 text-sm font-serif italic">
//               Line of Succession • Chain of Command
//             </p>
//           </div>
//         </div>

//         {/* Loading State */}
//         {isLoading && !boardData.officer_incharge && (
//           <div className="flex items-center justify-center h-64">
//             <div className="text-center">
//               <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//               <p className="text-amber-400">Loading succession board...</p>
//             </div>
//           </div>
//         )}

//         {/* Board Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           {renderBoardCard("officer_incharge", boardData.officer_incharge)}
//           {renderBoardCard("storekeeper", boardData.storekeeper)}
//           {renderBoardCard("asst_storekeeper", boardData.asst_storekeeper)}
//         </div>
//       </div>

//       {/* Add/Edit Dialog */}
//       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//         <DialogContent
//           className="max-w-md"
//           style={{
//             background: "linear-gradient(135deg, #3e2723 0%, #2c1a12 100%)",
//             border: "2px solid #b8860b",
//           }}
//         >
//           <DialogTitle className="text-amber-400 font-serif text-xl">
//             {editingPosition
//               ? `Edit ${getPositionLabel(editingPosition)}`
//               : `Add New ${getPositionLabel(formData.position)}`}
//           </DialogTitle>
//           <div className="space-y-4">
//             <div>
//               <Label className="text-amber-400">Full Name *</Label>
//               <Input
//                 value={formData.name}
//                 onChange={(e) =>
//                   setFormData({
//                     ...formData,
//                     name: e.target.value.toUpperCase(),
//                   })
//                 }
//                 placeholder="Enter full name"
//                 className="bg-gray-900/50 border-amber-600 text-white focus:border-amber-500"
//               />
//             </div>
//             <div>
//               <Label className="text-amber-400">Rank *</Label>
//               <Input
//                 value={formData.rank}
//                 onChange={(e) =>
//                   setFormData({
//                     ...formData,
//                     rank: e.target.value.toUpperCase(),
//                   })
//                 }
//                 placeholder="Enter rank"
//                 className="bg-gray-900/50 border-amber-600 text-white focus:border-amber-500"
//               />
//             </div>
//             <div>
//               <Label className="text-amber-400">Service No. *</Label>
//               <Input
//                 value={formData.service_no}
//                 onChange={(e) =>
//                   setFormData({
//                     ...formData,
//                     service_no: e.target.value.toUpperCase(),
//                   })
//                 }
//                 placeholder="Enter service number"
//                 className="bg-gray-900/50 border-amber-600 text-white focus:border-amber-500"
//               />
//             </div>
//             <div>
//               <Label className="text-amber-400">Contact Number</Label>
//               <Input
//                 value={formData.contact}
//                 onChange={(e) =>
//                   setFormData({ ...formData, contact: e.target.value })
//                 }
//                 placeholder="Enter contact number"
//                 className="bg-gray-900/50 border-amber-600 text-white focus:border-amber-500"
//               />
//             </div>
//             <div>
//               <Label className="text-amber-400">From Date *</Label>
//               <FormattedDatePicker
//                 value={formData.from_date}
//                 onChange={(date) =>
//                   setFormData({ ...formData, from_date: date })
//                 }
//               />
//             </div>
//           </div>
//           <DialogFooter>
//             <Button
//               variant="outline"
//               onClick={() => setIsDialogOpen(false)}
//               className="border-amber-600 text-amber-400 hover:bg-amber-900/30"
//             >
//               Cancel
//             </Button>
//             <Button
//               onClick={editingPosition ? updateSuccession : saveSuccession}
//               disabled={isLoading}
//               className="bg-green-900 hover:bg-green-950 text-white"
//             >
//               <FaSave className="mr-2" />
//               {editingPosition ? "Update" : "Add"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* History Dialog */}
//       <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
//         <DialogContent
//           className="max-w-2xl max-h-[70vh] overflow-y-auto"
//           style={{
//             background: "linear-gradient(135deg, #3e2723 0%, #2c1a12 100%)",
//             border: "2px solid #b8860b",
//           }}
//         >
//           <DialogTitle className="text-amber-400 font-serif text-xl">
//             Historical Records -{" "}
//             {selectedPosition && getPositionLabel(selectedPosition)}
//           </DialogTitle>
//           <div className="space-y-3">
//             {selectedPosition &&
//               (boardData[`${selectedPosition}_history`] || []).map(
//                 (record, idx) => (
//                   <div
//                     key={idx}
//                     className="bg-gray-900/30 rounded-lg p-3 border border-amber-600/30"
//                   >
//                     <div className="flex justify-between items-start">
//                       <div className="flex-1">
//                         <p className="text-white font-bold">{record.name}</p>
//                         <p className="text-amber-400 text-sm">
//                           Rank: {record.rank}
//                         </p>
//                         <p className="text-gray-400 text-xs">
//                           Service No: {record.service_no}
//                         </p>
//                         <p className="text-gray-400 text-xs">
//                           Contact: {record.contact || "--"}
//                         </p>
//                         <p className="text-amber-500 text-xs mt-1">
//                           Tenure:{" "}
//                           {record.from_date
//                             ? new Date(record.from_date).toLocaleDateString()
//                             : "--"}{" "}
//                           →
//                           {record.to_date
//                             ? new Date(record.to_date).toLocaleDateString()
//                             : "Present"}
//                         </p>
//                       </div>
//                       <Button
//                         size="sm"
//                         variant="ghost"
//                         onClick={() =>
//                           deleteRecord(record.id, record.name, selectedPosition)
//                         }
//                         className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
//                       >
//                         <FaTrash className="h-3 w-3" />
//                       </Button>
//                     </div>
//                   </div>
//                 ),
//               )}
//             {selectedPosition &&
//               (!boardData[`${selectedPosition}_history`] ||
//                 boardData[`${selectedPosition}_history`].length === 0) && (
//                 <div className="text-center py-8">
//                   <p className="text-gray-400">No historical records found</p>
//                 </div>
//               )}
//           </div>
//           <DialogFooter>
//             <Button
//               onClick={() => setIsHistoryDialogOpen(false)}
//               className="bg-emerald-900 hover:bg-emerald-950 text-white"
//             >
//               Close
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default SuccessionBoard;




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
  FaCrown,
  FaMedal,
  FaGem,
  FaShieldAlt,
  FaClock,
  FaPhoneAlt,
  FaIdCard,
  FaArrowRight,
  FaCheckCircle,
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
  const [hoveredCard, setHoveredCard] = useState(null);
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
      officer_incharge: <FaCrown className="h-8 w-8" />,
      storekeeper: <FaGem className="h-8 w-8" />,
      asst_storekeeper: <FaShieldAlt className="h-8 w-8" />,
    };
    return icons[position];
  };

  // Get position gradient
  const getPositionGradient = (position) => {
    const gradients = {
      officer_incharge: "from-amber-900 via-yellow-800 to-amber-900",
      storekeeper: "from-blue-900 via-indigo-800 to-blue-900",
      asst_storekeeper: "from-emerald-900 via-teal-800 to-emerald-900",
    };
    return gradients[position];
  };

  // Get position border color
  const getPositionBorderColor = (position) => {
    const colors = {
      officer_incharge: "border-yellow-500",
      storekeeper: "border-blue-500",
      asst_storekeeper: "border-emerald-500",
    };
    return colors[position];
  };

  useEffect(() => {
    fetchBoardData();
  }, []);

  const renderBoardCard = (position, currentRecord) => {
    const historyRecords = boardData[`${position}_history`] || [];
    const isHovered = hoveredCard === position;
    const gradient = getPositionGradient(position);
    const borderColor = getPositionBorderColor(position);

    return (
      <div
        onMouseEnter={() => setHoveredCard(position)}
        onMouseLeave={() => setHoveredCard(null)}
        className="relative group"
      >
        {/* Animated glow effect */}
        <div
          className={cn(
            "absolute -inset-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition duration-500 blur-xl",
            gradient
              .replace("from-", "from-")
              .replace("via-", "via-")
              .replace("to-", "to-"),
          )}
        />

        {/* Main Card */}
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl shadow-2xl transition-all duration-500",
            "bg-gradient-to-br backdrop-blur-sm",
            gradient,
            "border-2",
            borderColor,
            isHovered ? "scale-105 shadow-2xl" : "scale-100",
          )}
          style={{
            boxShadow: isHovered
              ? "0 25px 50px -12px rgba(0,0,0,0.5)"
              : "0 10px 30px -10px rgba(0,0,0,0.3)",
          }}
        >
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: "20px 20px",
              }}
            />
          </div>

          {/* Shimmer effect on hover */}
          <div
            className={cn(
              "absolute inset-0 transform -skew-x-12 -translate-x-full transition-transform duration-1000",
              "bg-gradient-to-r from-transparent via-white/20 to-transparent",
              isHovered && "translate-x-full",
            )}
          />

          {/* Corner decorations */}
          <div
            className={cn(
              "absolute top-0 left-0 w-16 h-16 opacity-30",
              "border-t-2 border-l-2",
              borderColor,
              "rounded-tl-2xl",
            )}
          >
            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-current opacity-50"></div>
          </div>
          <div
            className={cn(
              "absolute top-0 right-0 w-16 h-16 opacity-30",
              "border-t-2 border-r-2",
              borderColor,
              "rounded-tr-2xl",
            )}
          >
            <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-current opacity-50"></div>
          </div>

          {/* Content */}
          <div className="relative p-6 flex flex-col h-auto">
            {/* Header with Glassmorphism Effect */}
            <div className="text-center mb-4 pb-3 relative">
              <div
                className={cn(
                  "absolute inset-x-0 bottom-0 h-px bg-gradient-to-r",
                  "from-transparent via-current to-transparent",
                  "opacity-30",
                )}
              />

              {/* Icon with animated ring */}
              <div className="relative inline-block mb-3">
                <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div
                  className={cn(
                    "relative z-10 inline-flex items-center justify-center w-20 h-20 rounded-full",
                    "bg-black/30 backdrop-blur-sm",
                    "border-2",
                    borderColor,
                    "shadow-xl",
                    "group-hover:scale-110 transition-transform duration-300",
                  )}
                >
                  <div className="text-white/90">
                    {getPositionIcon(position)}
                  </div>
                </div>
              </div>

              <h3 className="text-white font-bold text-xl tracking-wide uppercase mb-1">
                {getPositionLabel(position).split(" ")[0]}
              </h3>
              <p className="text-white/60 text-xs font-medium tracking-wider">
                {getPositionLabel(position).split(" ").slice(1).join(" ")}
              </p>
            </div>

            {/* Current Incumbent */}
            {currentRecord ? (
              <div className="space-y-3 mb-4">
                <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10 shadow-inner">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FaCheckCircle className="text-green-400 text-xs" />
                        <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">
                          Current Incumbent
                        </p>
                      </div>
                      <p className="text-white text-xl font-bold mb-1 tracking-tight">
                        {currentRecord.name}
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <FaMedal className="text-yellow-400 text-xs" />
                          <p className="text-white/80 text-sm">
                            Rank:{" "}
                            <span className="font-semibold">
                              {currentRecord.rank}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaIdCard className="text-blue-400 text-xs" />
                          <p className="text-white/60 text-xs">
                            Service No: {currentRecord.service_no}
                          </p>
                        </div>
                        {currentRecord.contact && (
                          <div className="flex items-center gap-2">
                            <FaPhoneAlt className="text-green-400 text-xs" />
                            <p className="text-white/60 text-xs">
                              Contact: {currentRecord.contact}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <FaClock className="text-purple-400 text-xs" />
                          <p className="text-amber-300 text-xs font-medium">
                            Since:{" "}
                            {currentRecord.from_date
                              ? new Date(
                                  currentRecord.from_date,
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "--"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="relative">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-50"></div>
                      </div>
                      <span className="text-green-400 text-[10px] font-semibold tracking-wider">
                        ACTIVE
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleEdit(currentRecord, position)}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
                  >
                    <FaEdit className="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => endTenure(currentRecord, position)}
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 backdrop-blur-sm"
                  >
                    <FaTimes className="mr-2 h-3 w-3" />
                    End Tenure
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center mb-4 min-h-[150px]">
                <div className="text-center">
                  <div className="relative mb-3">
                    <div className="w-24 h-24 mx-auto bg-white/5 rounded-full flex items-center justify-center border-2 border-white/20 backdrop-blur-sm">
                      <FaStar className="text-white/40 text-4xl" />
                    </div>
                    <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-white/0 via-white/5 to-white/0 animate-pulse"></div>
                  </div>
                  <p className="text-white/40 text-sm">No one assigned</p>
                  <p className="text-white/20 text-xs mt-1">Click + to add</p>
                </div>
              </div>
            )}

            {/* History Link */}
            {historyRecords.length > 0 && (
              <button
                onClick={() => handleViewHistory(position)}
                className="mt-2 pt-2 text-white/50 hover:text-white/80 text-xs flex items-center justify-center gap-2 transition-all duration-300 border-t border-white/10 group-hover:border-white/20"
              >
                <FaHistory className="h-3 w-3" />
                <span>View Previous ({historyRecords.length})</span>
                <FaArrowRight className="h-2 w-2 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {/* Add Button */}
            <Button
              size="sm"
              onClick={() => handleAdd(position)}
              className="mt-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm w-full group/btn"
            >
              <FaUserPlus className="mr-2 h-3 w-3 group-hover/btn:scale-110 transition-transform" />
              Add New
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="h-auto min-h-screen pt-6 relative overflow-hidden mt-[-30px]"
      style={{
        background: "radial-gradient(ellipse at top, #1a1a2e, #0a0a0f)",
      }}
    >
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-amber-500/5 to-red-500/5 rounded-full blur-3xl"></div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Premium Header */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            {/* Animated rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 border border-amber-500/20 rounded-full animate-ping"></div>
              <div className="absolute w-24 h-24 border border-amber-500/30 rounded-full animate-pulse"></div>
            </div>

            {/* Main Header Content */}
            <div className="relative bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl px-10 py-6 border border-white/10 shadow-2xl">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10"></div>

              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-20 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
              <div className="absolute top-0 right-0 w-20 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-20 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
              <div className="absolute bottom-0 right-0 w-20 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>

              <FaCrown className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-amber-500 text-2xl" />

              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent mb-3 tracking-tight">
                Succession Board
              </h1>
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="h-px w-16 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
                <FaMedal className="text-amber-500/60 text-xl" />
                <div className="h-px w-16 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
              </div>
              <p className="text-white/50 text-sm tracking-wider">
                LINE OF SUCCESSION • CHAIN OF COMMAND
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && !boardData.officer_incharge && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-amber-600/20 border-t-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
                <div className="absolute inset-0 w-16 h-16 mx-auto border-4 border-transparent border-t-amber-400 rounded-full animate-ping opacity-25"></div>
              </div>
              <p className="text-white/60">Loading succession board...</p>
            </div>
          </div>
        )}

        {/* Board Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {renderBoardCard("officer_incharge", boardData.officer_incharge)}
          {renderBoardCard("storekeeper", boardData.storekeeper)}
          {renderBoardCard("asst_storekeeper", boardData.asst_storekeeper)}
        </div>
      </div>

      {/* Premium Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md border-0 overflow-hidden p-0">
          <div className="relative bg-gradient-to-br from-gray-900 to-gray-800">
            {/* Decorative header bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500"></div>

            <div className="p-6">
              <DialogTitle className="text-white font-bold text-2xl mb-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
                  {editingPosition ? (
                    <FaEdit className="text-white text-sm" />
                  ) : (
                    <FaUserPlus className="text-white text-sm" />
                  )}
                </div>
                <span className="bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
                  {editingPosition
                    ? `Edit ${getPositionLabel(editingPosition)}`
                    : `Add New ${getPositionLabel(formData.position)}`}
                </span>
              </DialogTitle>

              <div className="space-y-4 mt-6">
                <div>
                  <Label className="text-white/80 text-sm font-medium mb-2 block">
                    Full Name *
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="Enter full name"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-amber-500 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <Label className="text-white/80 text-sm font-medium mb-2 block">
                    Rank *
                  </Label>
                  <Input
                    value={formData.rank}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rank: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="Enter rank"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-amber-500 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <Label className="text-white/80 text-sm font-medium mb-2 block">
                    Service No. *
                  </Label>
                  <Input
                    value={formData.service_no}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        service_no: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="Enter service number"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-amber-500 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <Label className="text-white/80 text-sm font-medium mb-2 block">
                    Contact Number
                  </Label>
                  <Input
                    value={formData.contact}
                    onChange={(e) =>
                      setFormData({ ...formData, contact: e.target.value })
                    }
                    placeholder="Enter contact number"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-amber-500 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <Label className="text-white/80 text-sm font-medium mb-2 block">
                    From Date *
                  </Label>
                  <FormattedDatePicker
                    value={formData.from_date}
                    onChange={(date) =>
                      setFormData({ ...formData, from_date: date })
                    }
                  />
                </div>
              </div>

              <DialogFooter className="mt-6 gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingPosition ? updateSuccession : saveSuccession}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white shadow-lg"
                >
                  <FaSave className="mr-2" />
                  {editingPosition ? "Update" : "Add"}
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Premium History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[75vh] overflow-hidden p-0 border-0">
          <div className="relative bg-gradient-to-br from-gray-900 to-gray-800">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500"></div>

            <div className="p-6">
              <DialogTitle className="text-white font-bold text-2xl mb-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <FaHistory className="text-white text-sm" />
                </div>
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Historical Records
                </span>
              </DialogTitle>
              <p className="text-white/50 text-sm mb-6">
                {selectedPosition && getPositionLabel(selectedPosition)}
              </p>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {selectedPosition &&
                  (boardData[`${selectedPosition}_history`] || []).map(
                    (record, idx) => (
                      <div
                        key={idx}
                        className="group relative bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/10"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-white font-bold text-lg mb-1">
                              {record.name}
                            </p>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <FaMedal className="text-yellow-400 text-xs" />
                                <p className="text-white/70 text-sm">
                                  Rank:{" "}
                                  <span className="font-semibold">
                                    {record.rank}
                                  </span>
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <FaIdCard className="text-blue-400 text-xs" />
                                <p className="text-white/50 text-xs">
                                  Service No: {record.service_no}
                                </p>
                              </div>
                              {record.contact && (
                                <div className="flex items-center gap-2">
                                  <FaPhoneAlt className="text-green-400 text-xs" />
                                  <p className="text-white/50 text-xs">
                                    Contact: {record.contact}
                                  </p>
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <FaClock className="text-purple-400 text-xs" />
                                <p className="text-amber-400/80 text-xs font-medium">
                                  Tenure:{" "}
                                  {record.from_date
                                    ? new Date(
                                        record.from_date,
                                      ).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                      })
                                    : "--"}{" "}
                                  →{" "}
                                  {record.to_date
                                    ? new Date(
                                        record.to_date,
                                      ).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                      })
                                    : "Present"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              deleteRecord(
                                record.id,
                                record.name,
                                selectedPosition,
                              )
                            }
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FaTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ),
                  )}
                {selectedPosition &&
                  (!boardData[`${selectedPosition}_history`] ||
                    boardData[`${selectedPosition}_history`].length === 0) && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                        <FaHistory className="text-white/20 text-3xl" />
                      </div>
                      <p className="text-white/30">
                        No historical records found
                      </p>
                    </div>
                  )}
              </div>

              <DialogFooter className="mt-6">
                <Button
                  onClick={() => setIsHistoryDialogOpen(false)}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuccessionBoard;