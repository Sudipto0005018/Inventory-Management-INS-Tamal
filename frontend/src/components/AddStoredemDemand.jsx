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

const AddStoredemDemand = ({ open, onOpenChange, onSuccess }) => {
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
  const [demandType, setDemandType] = useState("");

  const [initialItemsPage, setInitialItemsPage] = useState(1);
  const [hasMoreInitial, setHasMoreInitial] = useState(true);

  const [formData, setFormData] = useState({
    quantity: "",
    mo_demand_no: "",
    mo_demand_date: null,
  });

  const fetchInitialItems = async (page = 1) => {
    setIsLoadingInitial(true);
    try {
      const response = await apiService.get("/storedem/items", {
        params: { page: page, limit: 50 },
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

  useEffect(() => {
    const searchItems = async () => {
      if (!itemSearchTerm.trim()) {
        setSearchedItems([]);
        return;
      }

      setIsSearchingItems(true);
      try {
        const response = await apiService.get("/storedem/items", {
          params: { search: itemSearchTerm, limit: 500 },
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

  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedItem(null);
      setDemandType("");
      setItemSearchTerm("");
      setSearchedItems([]);
      setFormData({
        quantity: "",
        mo_demand_no: "",
        mo_demand_date: null,
      });
    }
  }, [open]);

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
    if (!demandType) {
      toaster("error", "Please select demand type");
      return;
    }
    if (!formData.quantity || formData.quantity <= 0) {
      toaster("error", "Please enter valid quantity");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const payload = {
        spare_id: selectedItem.type === "spare" ? selectedItem.id : null,
        tool_id: selectedItem.type === "tool" ? selectedItem.id : null,
        quantity: formData.quantity,
        demand_type: demandType,
        mo_demand_no: formData.mo_demand_no || null,
        mo_demand_date: formData.mo_demand_date || null,
      };

      const response = await apiService.post(
        "/storedem/storedem-demand",
        payload,
      );
      if (response.success) {
        toaster("success", `${demandType} Demand added successfully`);
        resetForm();
        onSuccess();
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      toaster("error", error.response?.data?.message || "Failed to add Demand");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedItem(null);
    setDemandType("");
    setItemSearchTerm("");
    setSearchedItems([]);
    setInitialItems([]);
    setFormData({
      quantity: "",
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
        onPointerDownOutside={(e) => e.preventDefault()}
        className="max-w-2xl"
      >
        <DialogTitle className="text-lg font-semibold">
          {step === 1
            ? "Add Storedem - Select Item & Type"
            : "Add Storedem - Enter DTG Details"}
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

                  {isItemDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
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

                      {itemSearchTerm ? (
                        <div className="max-h-60 overflow-y-auto">
                          {isSearchingItems && (
                            <div className="p-4 text-center text-gray-500">
                              Searching...
                            </div>
                          )}
                          {!isSearchingItems && searchedItems.length === 0 && (
                            <div className="p-4 text-center text-gray-500">
                              No items found
                            </div>
                          )}
                          {searchedItems.map((item) => (
                            <div
                              key={`${item.type}-${item.id}`}
                              className="p-3 hover:bg-blue-50 cursor-pointer border-b"
                              onClick={() => handleItemSelect(item)}
                            >
                              <div className="font-medium">
                                {item.description}{" "}
                                <span className="ml-2 text-xs text-gray-500">
                                  ({item.category})
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                Type: {item.type === "spare" ? "SPARE" : "TOOL"}{" "}
                                | IN: {item.indian_pattern}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="max-h-60 overflow-y-auto">
                          {initialItems.length === 0 && isLoadingInitial && (
                            <div className="p-4 text-center text-gray-500">
                              Loading...
                            </div>
                          )}
                          {initialItems.map((item) => (
                            <div
                              key={`${item.type}-${item.id}`}
                              className="p-3 hover:bg-blue-50 cursor-pointer border-b"
                              onClick={() => handleItemSelect(item)}
                            >
                              <div className="font-medium">
                                {item.description}{" "}
                                <span className="ml-2 text-xs text-gray-500">
                                  ({item.category})
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                Type: {item.type === "spare" ? "SPARE" : "TOOL"}{" "}
                                | IN: {item.indian_pattern}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {selectedItem && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm font-medium text-green-800">
                    ✓ Selected Item:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                    <div>
                      <span className="font-semibold">Description:</span>{" "}
                      {selectedItem.description}
                    </div>
                    <div>
                      <span className="font-semibold">Category:</span>{" "}
                      {selectedItem.category}
                    </div>
                    <div>
                      <span className="font-semibold">IN Part No.:</span>{" "}
                      {selectedItem.indian_pattern}
                    </div>
                    <div>
                      <span className="font-semibold">Denos:</span>{" "}
                      {selectedItem.denos}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Demand Type Selection */}
            <div>
              <Label className="mb-2 block">
                Demand Type <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={demandType === "STOREDEM" ? "default" : "outline"}
                  onClick={() => setDemandType("STOREDEM")}
                >
                  STOREDEM
                </Button>
                <Button
                  type="button"
                  variant={demandType === "OPDEM" ? "default" : "outline"}
                  onClick={() => setDemandType("OPDEM")}
                >
                  OPDEM
                </Button>
              </div>
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
                  setFormData((prev) => ({ ...prev, quantity: e.target.value }))
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
                disabled={!selectedItem || !demandType || !formData.quantity}
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
                <strong>Demand Type:</strong> {demandType}
              </p>
              <p>
                <strong>Quantity:</strong> {formData.quantity}
              </p>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <Label className="mb-1">MO Demand No. (DTG)</Label>
                <Input
                  className="mt-2"
                  value={formData.mo_demand_no}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      mo_demand_no: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="MO Demand No."
                />
              </div>
              <div className="flex-1">
                <FormattedDatePicker
                  label="MO Demand Date"
                  value={formData.mo_demand_date}
                  onChange={(date) =>
                    setFormData((prev) => ({ ...prev, mo_demand_date: date }))
                  }
                />
              </div>
            </div>

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
                  disabled={isLoading}
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

export default AddStoredemDemand;
