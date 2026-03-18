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
    { key: "description", header: "Item Description" },
    {
      key: "indian_pattern",
      header: (
        <p>
          <i>IN</i> Part No.
        </p>
      ),
      width: "min-w-[40px]",
    },
    { key: "category", header: "Category", width: "min-w-[40px]" },
    {
      key: "survey_voucher_no",
      header: "Survey Voucher No.",
      width: "min-w-[40px]",
    },
    {
      key: "survey_qty",
      header: "Surveyed / Utilised Qty",
      width: "max-w-[100px]",
    },
    {
      key: "survey_date",
      header: "Surveyed Date / Utilised Date",
      width: "min-w-[40px]",
    },
    ...(user.role != "user"
      ? [{ key: "processed", header: "Proceed", width: "min-w-[40px]" }]
      : []),
    ...(user.role === "officer"
      ? [{ key: "rollback", header: "Rollback" }]
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
    {
      value: "survey_voucher_no",
      label: "Survey Voucher No.",
      width: "min-w-[40px]",
    },
    {
      value: "survey_qty",
      label: "Surveyed / Utilised Qty",
      width: "min-w-[40px]",
    },
    {
      value: "survey_date",
      label: "Surveyed Date / Utilised Date",
      width: "min-w-[40px]",
    },
  ];

//demand rollback states
  const [rollbackDialog, setRollbackDialog] = useState(false);
  const [rollbackChoice, setRollbackChoice] = useState("yes");
  const [rollbackRow, setRollbackRow] = useState(null);
  const [rollbackItemDesc, setRollbackItemDesc] = useState("");


  //add demand states
  const [addDemandItems, setAddDemandItems] = useState([]);
  const [selectedDemandItem, setSelectedDemandItem] = useState(null);
  const [itemType, setItemType] = useState("");
  const [surveyQty, setSurveyQty] = useState("");


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
  });
  const [actualSearch, setActualSearch] = useState("");
  const [inputs, setInputs] = useState({
    search: "",
    demand_no: "",
    demand_date: new Date(),
  });
  const [isOpen, setIsOpen] = useState({
    demand: false,
    demand_date: false,
    addDemand: false,
    addSpare: false,
  });
  const [selectedRow, setSelectedRow] = useState({});

  // const handleRollback = async (row) => {
  //   const confirm = window.confirm(
  //     "Are you sure you want to rollback this transaction?",
  //   );
  //   if (!confirm) return;

  //   try {
  //     // Case 1️⃣ : Manual Withdrawl (C / LP → Demand)
  //     if (row.transaction_id?.startsWith("PI-")) {
  //       await apiService.post("/survey/reverse", {
  //         survey_id: row.id,
  //       });
  //     }

  //     // Case 2️⃣ : Survey → Demand (Pending Survey Flow)
  //     else {
  //       await apiService.post("/demand/reverse", {
  //         demand_id: row.id,
  //       });
  //     }

  //     toaster("success", "Rollback successful");

  //     // remove row instantly
  //     setFetchedData((prev) => ({
  //       ...prev,
  //       items: prev.items.filter((item) => item.id !== row.id),
  //     }));
  //   } catch (error) {
  //     toaster("error", error.response?.data?.message || "Rollback failed");
  //   }
  // };


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

  // Placeholder fetch function as requested
  const fetchdata = async (page = currentPage, search = inputs.search) => {
    console.log(selectedValues);

    try {
      setIsLoading((prev) => ({ ...prev, table: true }));
      const response = await apiService.get("/demand", {
        params: {
          page,
          search,
          cols: selectedValues.join(","),
          limit: config.row_per_page,
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
      // toaster.error(error.response?.data?.message || "Error fetching data");
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
    setItemType("");
    setSurveyQty("");
  };

  useEffect(() => {
    fetchdata();
  }, [currentPage]);

  useEffect(() => {
    const t = fetchedData.items.map((row) => ({
      ...row,
      survey_date: getFormatedDate(row.survey_date), // Assuming date format
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
          placeholder="Search..."
          className="bg-white "
          value={inputs.search}
          onChange={(e) =>
            setInputs((prev) => ({ ...prev, search: e.target.value }))
          }
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
          className="h-[calc(100vh-230px)] w-[calc(100vw-35px)]"
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
            e.preventDefault(); // 🚫 Prevent outside click close
          }}
          onPointerDownOutside={(e) => {
            e.preventDefault();
          }}
          onCloseAutoFocus={() => {
            setInputs((prev) => ({
              ...prev,
              demand_no: "",
              demand_date: new Date(),
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

      {/* add demand dialog */}
      <Dialog
        open={isOpen.addDemand}
        onOpenChange={(open) => {
          if (!open) resetAddDemandDialog();
          setIsOpen((prev) => ({ ...prev, addDemand: open }))
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

          {/* ITEM TYPE */}
          <div className="mt-4">
            <Label>Item Type</Label>

            <select
              className="w-full border rounded p-2 mt-1"
              value={itemType}
              onChange={async (e) => {
                const type = e.target.value;
                setItemType(type);

                if (!type) return;

                const response = await apiService.get(
                  type === "spare" ? "/spares" : "/tools",
                  {
                    params: {
                      limit: 100,
                      // category: "PR",
                    },
                  },
                );

                setAddDemandItems(response.data.items);
              }}
            >
              <option value="">Select Type</option>
              <option value="spare">Spares</option>
              <option value="tool">Tools</option>
            </select>
          </div>

          {/* ITEM LIST */}
          {/* {addDemandItems.length > 0 && (
            <div className="mt-4">
              <Label>Select Item</Label>

              <select
                className="w-full border rounded p-2 mt-1"
                onChange={(e) => {
                  const item = addDemandItems.find(
                    (i) => i.id == e.target.value,
                  );
                  setSelectedDemandItem(item);
                }} */}
          {itemType && (
            <div className="mt-4">
              <Label>Select Item</Label>

              <select
                className="w-full border rounded p-2 mt-1"
                onChange={(e) => {
                  const value = e.target.value;

                  if (value === "custom") {
                    if (itemType === "spare") {
                      setIsOpen((prev) => ({ ...prev, addSpare: true }));
                    }

                    if (itemType === "tool") {
                      setIsOpen((prev) => ({ ...prev, addTool: true }));
                    }

                    return;
                  }

                  const item = addDemandItems.find((i) => i.id == value);
                  setSelectedDemandItem(item);
                }}
              >
                <option>Select Item</option>

                {addDemandItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.description} ({item.category})
                  </option>
                ))}
                <option value="custom">➕ Add New {itemType}</option>
              </select>
            </div>
          )}

          {/* SURVEY QTY */}
          <div className="mt-4">
            <Label>
              Qty to be demanded<span className="text-red-500">*</span>
            </Label>

            <Input
              type="number"
              min="1"
              placeholder="Enter quantity"
              value={surveyQty}
              onChange={(e) => setSurveyQty(e.target.value)}
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="destructive"
              onClick={() => {
                resetAddDemandDialog();
                setIsOpen((prev) => ({ ...prev, addDemand: false }))
              }}
            >
              Cancel
            </Button>

            <Button
              className="text-white"
              onClick={async () => {
                if (!selectedDemandItem) {
                  return toaster("error", "Please select item");
                }

                if (!surveyQty || Number(surveyQty) <= 0) {
                  return toaster("error", "Survey Qty must be greater than 0");
                }

                await apiService.post("/demand/manual-add", {
                  spare_id: itemType === "spare" ? selectedDemandItem.id : null,
                  tool_id: itemType === "tool" ? selectedDemandItem.id : null,
                  survey_qty: Number(surveyQty),
                });

                toaster("success", "Demand item added");

                setSurveyQty("");
                setSelectedDemandItem(null);
                setItemType("");

                setIsOpen((prev) => ({ ...prev, addDemand: false }));

                fetchdata();
              }}
            >
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD SPARE */}

      <Dialog
        open={isOpen.addSpare}
        onOpenChange={(open) =>
          setIsOpen((prev) => ({ ...prev, addSpare: open }))
        }
      >
        <DialogContent>
          <DialogTitle>Add Spare</DialogTitle>

          <p>Reuse your existing Add Spare form here.</p>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen((prev) => ({ ...prev, addSpare: false }));
                navigate("/spares", {
                  state: {
                    add_spare: true,
                  },
                });
              }}
            >
             Open
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD TOOL */}

      <Dialog
        open={isOpen.addTool}
        onOpenChange={(open) =>
          setIsOpen((prev) => ({ ...prev, addTool: open }))
        }
      >
        <DialogContent>
          <DialogTitle>Add Tool</DialogTitle>

          <p>Reuse your existing Add Tool form here.</p>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen((prev) => ({ ...prev, addTool: false }));
                navigate("/tools", {
                  state: {
                    add_tool: true,
                  },
                });
              }}
            >
              Open
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PendingDemand;
