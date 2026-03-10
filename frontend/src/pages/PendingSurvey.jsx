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
// substitute in pattern name (non men)
// oem/vendor details (non men)
// local terminology (non men)
const PendingSurvey = () => {
  const { config, user, officer, surveyReason, fetchSurveyReason } =
    useContext(Context);
  const columns = useMemo(() => [
    { key: "description", header: "Item Description" },
    {
      key: "indian_pattern",
      header: (
        <span>
          <i>IN</i> Part No.
        </span>
      ),
      width: "min-w-[40px]",
    },
    { key: "category", header: "Category", width: "min-w-[40px]" },
    {
      key: "withdrawl_date_str",
      header: "Withdrawal Date",
      width: "min-w-[40px]",
    },
    { key: "service_no", header: "Service No.", width: "min-w-[40px]" },
    { key: "issue_to", header: "Issued To", width: "min-w-[40px]" },
    { key: "withdrawl_qty", header: "Withdrawal Qty", width: "min-w-[40px]" },
    {
      key: "survey_quantity",
      header: "Surveyed Qty",
      width: "max-w-[40px]",
    },
    ...(user.role != "user" ? [{ key: "processed", header: "Proceed" }] : []),
    ...(user.role === "officer"
      ? [{ key: "rollback", header: "Rollback" }]
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
    { value: "withdrawl_date", label: "Withdrawal Date" },
    { value: "service_no", label: "Service No." },
    { value: "issue_to", label: "Issued To" },
    { value: "withdrawl_qty", label: "Withdrawal Qty" },
    { value: "survey_quantity", label: "Surveyed Qty" },
  ];

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
  });
  const [selectedRow, setSelectedRow] = useState({});

  const handleRollback = async (row) => {
    const confirm = window.confirm(
      "Are you sure you want to revert this survey?",
    );
    if (!confirm) return;

    try {
      await apiService.post("/survey/reverse", {
        survey_id: row.id,
      });

      toaster("success", "Survey reverted successfully");

      // Remove row instantly from UI
      setFetchedData((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== row.id),
      }));
    } catch (error) {
      toaster("error", error.response?.data?.message || "Rollback failed");
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

  useEffect(() => {
    fetchdata(currentPage, actualSearch, selectedValues);
  }, [currentPage]);

  useEffect(() => {
    const t = fetchedData.items.map((row) => ({
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
        // row.status?.toLowerCase() == "pending" ? (
        <Button
          size="icon"
          className="bg-white text-black shadow-md border hover:bg-gray-100"
          onClick={() => {
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
          placeholder="Search survey items"
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
                  <Label>
                    Remarks <span className="text-red-500">*</span>
                  </Label>

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
    </div>
  );
};

export default PendingSurvey;
