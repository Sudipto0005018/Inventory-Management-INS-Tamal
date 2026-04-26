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
import { useNavigate } from "react-router";

const PendingSurvey = () => {
  const { config, user, surveyReason, fetchSurveyReason } = useContext(Context);
  const navigate = useNavigate();
  const columns = useMemo(() => [
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
      header: "Withdrawal Date",
      width: "max-w-[40px] px-0",
    },
    { key: "service_no", header: "Service No.", width: "max-w-[40px] px-0" },
    { key: "issue_to", header: "Issued To", width: "max-w-[30px] px-0" },
    {
      key: "withdrawl_qty",
      header: <span>Withdrawal Qty</span>,
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
  ]);
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

  //rollback states
  const [rollbackDialog, setRollbackDialog] = useState(false);
  const [rollbackChoice, setRollbackChoice] = useState("yes");
  const [rollbackIssueId, setRollbackIssueId] = useState(null);
  const [rollbackItemDesc, setRollbackItemDesc] = useState("");

  //add survey states
  const [itemType, setItemType] = useState("");
  const [itemsList, setItemsList] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [withdrawlQty, setWithdrawlQty] = useState("");

  //for survey-stockin
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

  // const handleRollback = async (row) => {
  //   const confirm = window.confirm(
  //     "Are you sure you want to revert this survey?",
  //   );
  //   if (!confirm) return;

  //   try {
  //     await apiService.post("/survey/reverse", {
  //       survey_id: row.id,
  //     });

  //     toaster("success", "Survey reverted successfully");

  //     // Remove row instantly from UI
  //     setFetchedData((prev) => ({
  //       ...prev,
  //       items: prev.items.filter((item) => item.id !== row.id),
  //     }));
  //   } catch (error) {
  //     toaster("error", error.response?.data?.message || "Rollback failed");
  //   }
  // };

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

  const resetSurveyDialog = () => {
    setRepairStatus(null);

    setInputs({
      search: "",
      voucher_no: "",
      survey_calender: new Date(),
      quantity: "",
      remarks: "",
    });

    setSelectedRow({});
  };
  const addToDropdown = async (type, value) => {
    try {
      const data = {
        type,
        attr: [value],
      };

      const response = await apiService.post("/config/add", data);
      console.log("ADD RESPONSE:", response);
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
          limit: config.row_per_page,
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

  const handleServay = async () => {
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
    setItemType("");
    setItemsList([]);
    setSelectedItem(null);
    setWithdrawlQty("");
  };

  useEffect(() => {
    fetchdata(currentPage, actualSearch, selectedValues);
  }, [currentPage]);

  useEffect(() => {
    const t = fetchedData.items.map((row) => {
      console.log("SOURCE TYPE:", row.source_type, row);

      return {
        ...row,
        survey_quantity: row.survey_quantity || "0",
        issue_date: getFormatedDate(row.issue_date),
        withdrawl_date_str: getFormatedDate(row.withdrawl_date),
        created_at: getTimeDate(row.created_at),
        status:
          row.status?.toLowerCase() == "pending" ? (
            <Chip text="Pending" varient="info" />
          ) : (
            <Chip text="Completed" varient="success" />
          ),
        processed: (
          <Button
            size="icon"
            disabled={row.issue_to?.toLowerCase() === "special_demand"}
            className={`bg-white text-black shadow-md border hover:bg-gray-100
      ${row.source_type?.toLowerCase() === "special_demand" ? "opacity-40 cursor-not-allowed" : ""}`}
            onClick={() => {
              if (row.issue_to?.toLowerCase() === "special_demand") return;

              setSelectedRow(row);
              setIsOpen((prev) => ({ ...prev, survey: true }));
            }}
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
        open={isOpen.survey}
        onOpenChange={(open) => {
          if (!open) resetSurveyDialog();
          setIsOpen((prev) => ({ ...prev, survey: open }));
        }}
      >
        <DialogContent
          className="unbounded w-full !max-w-2xl"
          onInteractOutside={(e) => {
            e.preventDefault(); // 🚫 Prevent outside click close
          }}
          onPointerDownOutside={(e) => {
            e.preventDefault();
          }}
          onCloseAutoFocus={() => {
            setInputs((prev) => ({
              ...prev,
              servay_number: "",
              voucher_no: "",
              survey_calender: new Date(),
            }));
          }}
        >
          <div
            className="sticky top-0 z-10 bg-background
                grid grid-cols-2 items-center
                pb-2 border-b"
          >
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

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-1 mb-3">
              <span className="font-semibold text-gray-700">
                Item Description :
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
                    onChange={() => setRepairStatus("yes")}
                  />
                  Yes
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="repairStatus"
                    value="no"
                    checked={repairStatus === "no"}
                    onChange={() => setRepairStatus("no")}
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
                  <Input value={selectedRow?.survey_quantity ?? 0} readOnly />
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
                    Survey Voucher No. <span className="text-red-500">*</span>
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
                      setIsOpen((prev) => ({ ...prev, survey_calender: set }))
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
                    Reason For Survey <span className="text-red-500">*</span>
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
          <div>
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
                onClick={handleServay}
              >
                Submit
              </SpinnerButton>
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

      {/* add syrvey dialog */}

      <Dialog
        open={isOpen.addSurvey}
        onOpenChange={(open) => {
          if (!open) resetAddSurveyDialog();
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
                  type === "spare" ? "/spares/surveyAdd" : "/tools/surveyAdd",
                  {
                    params: {
                      limit: 100,
                      category: "PR",
                    },
                  },
                );

                setItemsList(response.data.items);
              }}
            >
              <option value="">Select Type</option>
              <option value="spare">Spares</option>
              <option value="tool">Tools</option>
            </select>
          </div>

          {/* ITEM LIST */}
          {/* {itemsList.length > 0 && (
            <div className="mt-4">
              <Label>Select Item</Label>

              <select
                className="w-full border rounded p-2 mt-1"
                onChange={(e) => {
                  const item = itemsList.find((i) => i.id == e.target.value);
                  setSelectedItem(item);
                }}
              >
                <option>Select Item</option>
                {itemsList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.description} ({item.category})
                  </option>
                ))}
              </select>
            </div>
          )} */}

          {itemType && (
            <div className="mt-4">
              <Label>Select Item</Label>

              {/* <select
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

                  const item = itemsList.find((i) => i.id == value);
                  setSelectedItem(item);
                }}
              >
                <option>Select Item</option>

                {itemsList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.description} ({item.category})
                  </option>
                ))}
                <option value="custom">+ Add New {itemType}</option>
              </select> */}

              <ComboBox
                className="w-full"
                options={itemsList.map((item) => ({
                  id: item.id,
                  name: `${item.description} (${item.category})`,
                  raw: item,
                }))}
                placeholder="Search and select item..."
                onSelect={(value) => {
                  setSelectedItem(value.raw);
                }}
              />
            </div>
          )}

          {/* WITHDRAWAL QTY */}
          {selectedItem && (
            <div className="mt-4">
              <Label>
                Qty to be surveyed <span className="text-red-500">*</span>
              </Label>

              <Input
                type="number"
                placeholder="Enter Survey Qty"
                value={withdrawlQty}
                onChange={(e) => setWithdrawlQty(e.target.value)}
              />
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="destructive"
              onClick={() => {
                resetAddSurveyDialog();
                setIsOpen((prev) => ({ ...prev, addSurvey: false }));
              }}
            >
              Cancel
            </Button>

            <Button
              className="text-white"
              onClick={async () => {
                if (!selectedItem) {
                  return toaster("error", "Please select item");
                }

                if (!withdrawlQty) {
                  return toaster("error", "Please enter Withdrawal Qty");
                }

                if (withdrawlQty <= 0) {
                  return toaster(
                    "error",
                    "Withdrawal Qty must be greater than 0",
                  );
                }

                await apiService.post("/survey/manual-add", {
                  spare_id: itemType === "spare" ? selectedItem.id : null,
                  tool_id: itemType === "tool" ? selectedItem.id : null,
                  withdrawl_qty: withdrawlQty,
                });

                toaster("success", "Survey item added");

                setWithdrawlQty("");
                setSelectedItem(null);
                setItemsList([]);
                setItemType("");

                setIsOpen((prev) => ({ ...prev, addSurvey: false }));
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

          <p>Redirecting to Add Spare form</p>
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

          <p>Redirecting to Add Tool form</p>
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

export default PendingSurvey;