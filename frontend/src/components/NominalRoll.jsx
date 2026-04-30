import { useState, useEffect, useContext } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaExchangeAlt,
  FaSave,
  FaTimes,
  FaSearch,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { FormattedDatePicker } from "@/components/FormattedDatePicker";
import toaster from "../utils/toaster";
import apiService from "../utils/apiService";
import { Context } from "../utils/Context";
import { cn } from "../lib/utils";

const NominalRoll = () => {
  const { user } = useContext(Context);
  const [activeTab, setActiveTab] = useState("present");
  const [presentPersonnel, setPresentPersonnel] = useState([]);
  const [exPersonnel, setExPersonnel] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [transferDate, setTransferDate] = useState(new Date());

  // Form state
  const [formData, setFormData] = useState({
    service_no: "",
    name: "",
    rank: "",
    contact_no: "",
    date_of_reporting: new Date(),
  });

  // Fetch present personnel
  const fetchPresentPersonnel = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.get("/nominal-roll/present");
      setPresentPersonnel(response.data || []);
    } catch (error) {
      console.error("Failed to fetch present personnel:", error);
      toaster("error", "Failed to fetch present personnel");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch ex-Tamal personnel
  const fetchExPersonnel = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.get("/nominal-roll/ex");
      setExPersonnel(response.data || []);
    } catch (error) {
      console.error("Failed to fetch ex-personnel:", error);
      toaster("error", "Failed to fetch ex-personnel");
    } finally {
      setIsLoading(false);
    }
  };

  // Add new personnel
  const addPersonnel = async () => {
    if (!formData.service_no.trim()) {
      toaster("error", "Service No. is required");
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

    setIsLoading(true);
    try {
      const response = await apiService.post("/nominal-roll", formData);
      if (response.success) {
        toaster("success", "Personnel added successfully");
        setIsDialogOpen(false);
        resetForm();
        fetchPresentPersonnel();
      } else {
        toaster("error", response.message || "Failed to add personnel");
      }
    } catch (error) {
      console.error("Failed to add personnel:", error);
      toaster(
        "error",
        error.response?.data?.message || "Failed to add personnel",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Update personnel (service_no is NOT sent in update)
  const updatePersonnel = async () => {
    if (!formData.name.trim()) {
      toaster("error", "Name is required");
      return;
    }

    setIsLoading(true);
    try {
      // Only send updatable fields (exclude service_no)
      const updateData = {
        name: formData.name,
        rank: formData.rank,
        contact_no: formData.contact_no,
        date_of_reporting: formData.date_of_reporting,
      };
      
      const response = await apiService.put(
        `/nominal-roll/${editingPerson.id}`,
        updateData,
      );
      if (response.success) {
        toaster("success", "Personnel updated successfully");
        setIsDialogOpen(false);
        resetForm();
        fetchPresentPersonnel();
        fetchExPersonnel();
      } else {
        toaster("error", response.message || "Failed to update personnel");
      }
    } catch (error) {
      console.error("Failed to update personnel:", error);
      toaster(
        "error",
        error.response?.data?.message || "Failed to update personnel",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Transfer personnel to Ex-Tamal
  const transferToEx = async () => {
    if (!selectedPerson) return;

    setIsLoading(true);
    try {
      const response = await apiService.post(
        `/nominal-roll/${selectedPerson.id}/transfer`,
        {
          transfer_date: transferDate,
        },
      );
      if (response.success) {
        toaster("success", "Personnel transferred to Ex-Tamal successfully");
        setIsTransferDialogOpen(false);
        setSelectedPerson(null);
        setTransferDate(new Date());
        fetchPresentPersonnel();
        fetchExPersonnel();
      } else {
        toaster("error", response.message || "Failed to transfer personnel");
      }
    } catch (error) {
      console.error("Failed to transfer personnel:", error);
      toaster(
        "error",
        error.response?.data?.message || "Failed to transfer personnel",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Delete personnel
  const deletePersonnel = async (person, isEx = false) => {
    if (
      !confirm(
        `Are you sure you want to delete ${person.name} from ${isEx ? "Ex-Tamal" : "Present"} Nominal Roll?`,
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.delete(`/nominal-roll/${person.id}`);
      if (response.success) {
        toaster("success", "Personnel deleted successfully");
        fetchPresentPersonnel();
        fetchExPersonnel();
      } else {
        toaster("error", response.message || "Failed to delete personnel");
      }
    } catch (error) {
      console.error("Failed to delete personnel:", error);
      toaster(
        "error",
        error.response?.data?.message || "Failed to delete personnel",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Open edit dialog
  const handleEdit = (person) => {
    setEditingPerson(person);
    setFormData({
      service_no: person.service_no,
      name: person.name,
      rank: person.rank || "",
      contact_no: person.contact_no || "",
      date_of_reporting: person.date_of_reporting
        ? new Date(person.date_of_reporting)
        : new Date(),
    });
    setIsDialogOpen(true);
  };

  // Open transfer dialog
  const handleTransfer = (person) => {
    setSelectedPerson(person);
    setTransferDate(new Date());
    setIsTransferDialogOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setEditingPerson(null);
    setFormData({
      service_no: "",
      name: "",
      rank: "",
      contact_no: "",
      date_of_reporting: new Date(),
    });
  };

  // Filter personnel based on search term
  const filterPersonnel = (personnel) => {
    if (!searchTerm) return personnel;
    const term = searchTerm.toLowerCase();
    return personnel.filter(
      (p) =>
        p.service_no?.toLowerCase().includes(term) ||
        p.name?.toLowerCase().includes(term) ||
        p.rank?.toLowerCase().includes(term),
    );
  };

  useEffect(() => {
    fetchPresentPersonnel();
    fetchExPersonnel();
  }, []);

  const filteredPresent = filterPersonnel(presentPersonnel);
  const filteredEx = filterPersonnel(exPersonnel);

  return (
    <div className="p-4 h-full">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex gap-2">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by Service No., Name, or Rank..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-120 bg-white"
            />
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
          >
            <FaUserPlus className="mr-2" />
            Add Personnel
          </Button>
        </div>
      </div>

      {/* Custom Tab Buttons */}
      <div className="flex gap-2 mb-4 border-b">
        <button
          onClick={() => setActiveTab("present")}
          className={cn(
            "px-4 py-2 font-medium transition-colors relative",
            activeTab === "present"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700",
          )}
        >
          Present Nominal Roll ({filteredPresent.length})
        </button>
        <button
          onClick={() => setActiveTab("ex")}
          className={cn(
            "px-4 py-2 font-medium transition-colors relative",
            activeTab === "ex"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700",
          )}
        >
          Ex-Tamal Nominal Roll ({filteredEx.length})
        </button>
      </div>

      {/* Present Tab Content */}
      {activeTab === "present" && (
        <Card className="h-full">
          <CardContent className="p-0 h-[calc(100vh-200px)] overflow-auto">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white">
                  <TableRow>
                    <TableHead>Service No.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Rank</TableHead>
                    <TableHead>Contact No.</TableHead>
                    <TableHead>Date of Reporting</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredPresent.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No personnel found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPresent.map((person) => (
                      <TableRow key={person.id}>
                        <TableCell className="font-medium">
                          {person.service_no}
                        </TableCell>
                        <TableCell>{person.name}</TableCell>
                        <TableCell>{person.rank || "--"}</TableCell>
                        <TableCell>{person.contact_no || "--"}</TableCell>
                        <TableCell>
                          {person.date_of_reporting
                            ? new Date(
                                person.date_of_reporting,
                              ).toLocaleDateString()
                            : "--"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-4">
                            <button
                              onClick={() => handleEdit(person)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <FaEdit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleTransfer(person)}
                              className="text-orange-600 hover:text-orange-800"
                              title="Transfer Out"
                            >
                              <FaExchangeAlt className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deletePersonnel(person, false)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <FaTrash className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ex-Tamal Tab Content */}
      {activeTab === "ex" && (
        <Card className="h-full">
          <CardContent className="p-0 h-[calc(100vh-200px)] overflow-auto">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white">
                  <TableRow>
                    <TableHead>Service No.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Rank</TableHead>
                    <TableHead>Contact No.</TableHead>
                    <TableHead>Date of Reporting</TableHead>
                    <TableHead>Date of Transfer</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredEx.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        No ex-personnel found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEx.map((person) => (
                      <TableRow key={person.id}>
                        <TableCell className="font-medium">
                          {person.service_no}
                        </TableCell>
                        <TableCell>{person.name}</TableCell>
                        <TableCell>{person.rank || "--"}</TableCell>
                        <TableCell>{person.contact_no || "--"}</TableCell>
                        <TableCell>
                          {person.date_of_reporting
                            ? new Date(
                                person.date_of_reporting,
                              ).toLocaleDateString()
                            : "--"}
                        </TableCell>
                        <TableCell>
                          {person.transfer_date
                            ? new Date(
                                person.transfer_date,
                              ).toLocaleDateString()
                            : "--"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <button
                              onClick={() => deletePersonnel(person, true)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <FaTrash className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Personnel Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          showCloseButton
          onPointerDownOutside={(e) => {
            e.preventDefault();
          }}
          className="max-w-md"
        >
          <DialogTitle>
            {editingPerson ? "Edit Personnel" : "Add New Personnel"}
          </DialogTitle>
          <div className="space-y-4">
            <div>
              <Label>
                Service No.<span className="text-red-600">*</span>
                {/* {editingPerson && (
                  <span className="text-gray-400 text-sm ml-2">
                    (Cannot be updated)
                  </span>
                )} */}
              </Label>
              <Input
                disabled={!!editingPerson} // Only disabled when editing
                value={formData.service_no}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    service_no: e.target.value.toUpperCase(),
                  })
                }
                placeholder="Enter Service No."
                className={editingPerson ? "bg-gray-100" : ""}
              />
              {editingPerson && (
                <p className="text-xs text-gray-400 mt-1">
                  Service number cannot be changed once added
                </p>
              )}
            </div>
            <div>
              <Label>
                Name<span className="text-red-600">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value.toUpperCase(),
                  })
                }
                placeholder="Enter Full Name"
              />
            </div>
            <div>
              <Label>
                Rank<span className="text-red-600">*</span>
              </Label>
              <Input
                value={formData.rank}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rank: e.target.value.toUpperCase(),
                  })
                }
                placeholder="Enter Rank"
              />
            </div>
            <div>
              <Label>Contact No.</Label>
              <Input
                value={formData.contact_no}
                onChange={(e) =>
                  setFormData({ ...formData, contact_no: e.target.value })
                }
                placeholder="Enter Contact Number"
              />
            </div>
            <div>
              <Label>Date of Reporting</Label>
              <FormattedDatePicker
                value={formData.date_of_reporting}
                onChange={(date) =>
                  setFormData({ ...formData, date_of_reporting: date })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={editingPerson ? updatePersonnel : addPersonnel}
              disabled={isLoading}
            >
              <FaSave className="mr-2" />
              {editingPerson ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog
        open={isTransferDialogOpen}
        onOpenChange={setIsTransferDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogTitle>Transfer Personnel</DialogTitle>
          <div className="space-y-4">
            <p>
              Are you sure you want to transfer{" "}
              <strong>{selectedPerson?.name}</strong> to Ex-Tamal Nominal Roll?
            </p>
            <div>
              <Label>Date of Transfer *</Label>
              <FormattedDatePicker
                value={transferDate}
                onChange={setTransferDate}
              />
            </div>
            <p className="text-sm text-gray-500">
              Note: This action will move the personnel to Ex-Tamal section but
              will not affect any existing logs or records in the system.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsTransferDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={transferToEx}
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <FaExchangeAlt className="mr-2" />
              Transfer Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NominalRoll;