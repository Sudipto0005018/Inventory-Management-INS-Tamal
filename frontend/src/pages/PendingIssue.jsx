import { useContext, useEffect, useMemo, useState } from "react";
import { FaChevronRight, FaMagnifyingGlass } from "react-icons/fa6";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { IoMdRefresh } from "react-icons/io";
import Chip from "../components/Chip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";

import SpinnerButton from "../components/ui/spinner-button";
import PaginationTable from "../components/PaginationTableTwo";
import { MultiSelect } from "../components/ui/multi-select";
import { FormattedDatePicker } from "@/components/FormattedDatePicker";

import { Context } from "../utils/Context";
import apiService from "../utils/apiService";
import toaster from "../utils/toaster";
import {
  formatSimpleDate,
  getFormatedDate,
  getTimeDate,
} from "../utils/helperFunctions";

import GenerateQRDialog from "../components/GenerateQRDialog";

const PermanentPendings = () => {
  const { config, user, officer } = useContext(Context);

  const options = [
    {
      value: "description",
      label: "Item Description",
    },
    {
      value: "indian_pattern",
      label: (
        <span>
          <i>IN</i> Part No.
        </span>
      ),
    },
    { value: "category", label: "Category" },
    { value: "denos", label: "Denos." },

    { value: "mo_no", label: "Demand No." },

    { value: "demand_date", label: "Demand Date" },

    { value: "remarks", label: "Remarks" },
  ];

  //pending-issue rollback states
 const [rollbackDialog, setRollbackDialog] = useState(false);
 const [rollbackChoice, setRollbackChoice] = useState("yes");
 const [rollbackIssueId, setRollbackIssueId] = useState(null);
 const [rollbackItemDesc, setRollbackItemDesc] = useState("");


  const [selectedValues, setSelectedValues] = useState([]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchData(1);
  };

  const handleRefresh = () => {
    setInputs((prev) => ({
      ...prev,
      search: "",
    }));

    setSelectedValues([]); // reset selected columns
    setCurrentPage(1);

    fetchData(1);
  };

  const columns = useMemo(
    () => [
      { key: "description", header: "Item Description", width: "max-w-[80px] px-0", },
      {
        key: "indian_pattern",
        header: (
          <span>
            <i>IN</i> Part No.
          </span>
        ),
      },
      { key: "category", header: "Category", width: "max-w-[25px] px-0" },
      { key: "denos", header: "Denos.", width: "max-w-[25px] px-0" },
      {
        key: "display_demand_no",
        header: "Demand No.",
        width: "max-w-[50px] px-0",
        // cell renderer receives row data (adjust prop names to your table library)
        cell: ({ row }) => {
          const demandNo = row?.demand_no || null;
          const moNo = row?.mo_no || null;
          if (!demandNo && !moNo) return null;
          return (
            <div>
              {demandNo && <div>{demandNo}</div>}
              {moNo && (
                <div style={{ color: "#666", fontSize: 12 }}>{moNo}</div>
              )}
            </div>
          );
        },
      },
      {
        key: "display_demand_date",
        header: "Demand Date",
        width: "max-w-[30px] px-0",
        cell: ({ row }) => {
          const demandDate = row?.demand_date || null;
          const moDate = row?.mo_date || null;
          if (!demandDate && !moDate) return null;
          return (
            <div>
              {demandDate && <div>{formatDate(demandDate)}</div>}
              {moDate && (
                <div style={{ color: "#666", fontSize: 12 }}>
                  {formatDate(moDate)}
                </div>
              )}
            </div>
          );
        },
      },
      {
        key: "demand_quantity",
        header: (
          <span>
            Demanded
            <br />Qty
          </span>
        ),
        width: "max-w-[30px] px-0",
      },
      {
        key: "stocked_nac_qty",
        header: (
          <span>
            MO Issued
            <br />/ NAC Qty
          </span>
        ),
        width: "max-w-[40px] px-0",
      },
      { key: "status_badge", header: "Status", width: "max-w-[50px] px-0" },
      { key: "remarks", header: "Remarks", width: "max-w-[40px] px-0" },
      ...(user.role != "user"
        ? [{ key: "processed", header: "Proceed", width: "max-w-[25px] px-0" }]
        : []),
      ...(user.role === "officer"
        ? [{ key: "rollback", header: "Rollback", width: "max-w-[45px] px-0" }]
        : []),
    ],
    [],
  );

  // helper date formatter (adjust to your needs)
  function formatDate(d) {
    if (!d) return "";
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString();
  }

  const [currentPage, setCurrentPage] = useState(1);
  const [tableData, setTableData] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);

  const [isQrOpen, setIsQrOpen] = useState(false);

  const [fetchedData, setFetchedData] = useState({
    items: [],
    totalPages: 1,
    currentPage: 1,
  });

  const [isOpen, setIsOpen] = useState({
    issue: false,
    inventory: false,
    demand_calender: false,
  });

  const [isLoading, setIsLoading] = useState({
    nac: false,
    mo: false,
    inventory: false,
    search: false,
  });

  const [procurementPending, setProcurementPending] = useState("no");

  const [inputs, setInputs] = useState({
    search: "",
    issue_type: "stocking",
    demand_quantity: "",
    nac_no: "",
    nac_calender: new Date(),
    validity: "",
    rate_unit: "",
    nac_qty: "",

    stocked_qty: "",
    mo_no: "",
    gate_pass_calender: new Date(),
  });

  // const handleRollback = async (row) => {
  //   const confirm = window.confirm(
  //     "Are you sure you want to rollback this Pending Issue?",
  //   );

  //   if (!confirm) return;

  //   try {
  //     const response = await apiService.post("/demand/pending-issue/reverse", {
  //       pending_issue_id: row.id,
  //     });
  //     console.log("reverse demand res", response);
  //     if (response.success) {
  //       toaster("success", "Pending Issue rolled back successfully");
  //       fetchData();
  //     } else {
  //       toaster("error", response.message);
  //     }
  //   } catch (error) {
  //     toaster("error", error.response?.data?.message || error.message);
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
      const response = await apiService.post("/demand/pending-issue/reverse", {
        pending_issue_id: rollbackIssueId,
      });

      if (response.success) {
        toaster("success", "Pending Issue rolled back successfully");
        fetchData();
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      toaster("error", error.response?.data?.message || error.message);
    } finally {
      setRollbackDialog(false);
    }
  };

  const fetchData = async (page = currentPage) => {
    try {
      const res = await apiService.get("/issue/pending-issue", {
        params: {
          page,
          // limit: config.row_per_page,
          limit: 40,
          search: inputs.search || "",
          cols: selectedValues.join(","),
        },
      });

      if (res.success) {
        setFetchedData(res.data);
      } else {
        toaster("error", res.message);
      }
    } catch (err) {
      console.log(err);
      toaster("error", err.message);
    } finally {
      setIsLoading((prev) => ({ ...prev, search: false }));
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchData(1);
  }, [selectedValues]);

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  useEffect(() => {
    const mapped = fetchedData.items.map((row) => {
      const statusBadge =
        row.status === "pending" ? (
          <Chip text="Pending" varient="info" />
        ) : (
          <Chip text="Partial" varient="success" />
        );
      return {
        ...row,
        display_demand_date: getFormatedDate(row.display_demand_date),
        demand_quantity: row.demand_quantity || "0",
        created_at: getTimeDate(row.created_at),
        status_badge: statusBadge,
        processed: (
          <Button
            size="icon"
            className="bg-white text-black shadow border"
            onClick={() => {
              setSelectedRow(row);
              setInputs({
                search: "",
                issue_type: "stocking", 
                demand_quantity: row.demand_quantity,
                nac_no: "",
                // nac_calender: new Date(),
                validity: "",
                rate_unit: "",
                nac_qty: "",
                stocked_qty: "",
                mo_no: "",
                // gate_pass_calender: new Date(),
              });
              setProcurementPending("no");
              setIsOpen((p) => ({ ...p, issue: true }));
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

    setTableData(mapped);
  }, [fetchedData]);

  const updatePendingIssue = async (payload) => {
    try {
      const res = await apiService.put(
        `/issue/pending-issue/${selectedRow.id}`,
        payload,
      );

      if (!res.success) {
        toaster("error", res.message);
        return false;
      }

      return true;
    } catch (err) {
      toaster("error", err.message);
      return false;
    }
  };

  const handleNAC = async () => {
    if (
      !inputs.nac_no ||
      !inputs.validity ||
      !inputs.rate_unit ||
      !inputs.nac_qty
    ) {
      toaster("error", "All NAC fields are required");
      return;
    }

    if (Number(inputs.nac_qty) > Number(inputs.demand_quantity)) {
      toaster("error", "NAC Qty cannot exceed demand qty");
      return;
    }

    setIsLoading((p) => ({ ...p, nac: true }));

    const payload = {
      issue_type: "nac",
      nac_qty: inputs.nac_qty,
      nac_no: inputs.nac_no,
      nac_date: formatSimpleDate(inputs.nac_calender),
      validity: inputs.validity,
      rate_unit: inputs.rate_unit,

      qty_withdrawn: inputs.nac_qty,
      status: "NAC_GENERATED",
    };

    const updated = await updatePendingIssue(payload);

    if (updated) {
      toaster("success", "NAC saved successfully");
      setIsOpen((p) => ({ ...p, issue: false }));
      fetchData();
    }

    setIsLoading((p) => ({ ...p, nac: false }));
  };

  const handleStocking = async () => {
    if (!inputs.mo_no || !inputs.stocked_qty) {
      toaster("error", "All stocking fields required");
      return;
    }

    if (Number(inputs.stocked_qty) > Number(inputs.demand_quantity)) {
      toaster("error", "Stocked qty cannot exceed demand qty");
      return;
    }

    setIsLoading((p) => ({ ...p, mo: true }));

    const payload = {
      issue_type: "stocking",
      stocked_in_qty: inputs.stocked_qty,
      mo_no: inputs.mo_no,
      mo_date: formatSimpleDate(inputs.gate_pass_calender),

      qty_withdrawn: inputs.stocked_qty,

      status: "STOCKED",
    };

    const updated = await updatePendingIssue(payload);

    if (updated) {
      toaster("success", "Item stocked successfully");
      setIsOpen((p) => ({ ...p, issue: false }));
      fetchData();
    }

    setIsLoading((p) => ({ ...p, mo: false }));
  };

  return (
    <>
      <div className="w-full px-2 pt-2 h-full rounded-md bg-white">
        <div className="mb-2">
          <Input
            type="text"
            placeholder="Search Pending for MO Issue..."
            className="bg-white "
            value={inputs.search}
            onChange={(e) =>
              setInputs((prev) => ({ ...prev, search: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
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
        <PaginationTable
          data={tableData}
          columns={columns}
          currentPage={fetchedData.currentPage}
          pageSize={config.row_per_page}
          totalPages={fetchedData.totalPages}
          onPageChange={setCurrentPage}
          className="h-[calc(94vh-210px)]"
        />
      </div>

      {/* ================= ISSUE DIALOG ================= */}
      <Dialog
        open={isOpen.issue}
        onOpenChange={(set) => setIsOpen((p) => ({ ...p, issue: set }))}
      >
        <DialogContent
          onInteractOutside={(e) => {
            e.preventDefault(); // 🚫 Prevent outside click close
          }}
          className="w-full !max-w-4xl"
        >
          <div
            className="sticky top-0 z-10 bg-background 
                grid grid-cols-2 items-center 
                pb-2 border-b"
          >
            <DialogTitle className="text-lg font-semibold">
              Updation for Qty NAC / Issued
            </DialogTitle>

            <button
              type="button"
              onClick={() => setIsOpen((prev) => ({ ...prev, issue: false }))}
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

          <RadioGroup
            value={inputs.issue_type}
            onValueChange={(v) => setInputs((p) => ({ ...p, issue_type: v }))}
            className="flex gap-8"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="stocking" />
              <Label>Stocking in Inventory</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="nac" />
              <Label>NAC</Label>
            </div>
          </RadioGroup>
          {/* <p>{inputs.demand_quantity}</p> */}

          {/* ---------- NAC ---------- */}
          {inputs.issue_type === "nac" && (
            <>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Demanded Qty</Label>
                  <Input
                    className="mt-3"
                    placeholder="Demanded Qty"
                    value={inputs.demand_quantity}
                  />
                </div>
                <div>
                  <Label>Previous NAC / MO Issued Qty</Label>
                  <Input
                    className="mt-3"
                    placeholder="Previous NAC Qty"
                    value={selectedRow?.stocked_nac_qty ?? 0}
                  />
                </div>
                <div>
                  <Label>
                    NAC Qty <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="mt-3"
                    placeholder="Enter NAC Qty"
                    type="number"
                    value={inputs.nac_qty}
                    onChange={(e) =>
                      setInputs((p) => ({ ...p, nac_qty: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label>
                    NAC No. <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="mt-3"
                    placeholder="Enter NAC No."
                    value={inputs.nac_no}
                    onChange={(e) =>
                      setInputs((p) => ({
                        ...p,
                        nac_no: e.target.value.toUpperCase(),
                      }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>
                    Validity (days) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="mt-3"
                    type="number"
                    placeholder="Enter Validity (days)"
                    value={inputs.validity}
                    onChange={(e) =>
                      setInputs((p) => ({ ...p, validity: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label>
                    Rate / Unit <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="mt-3"
                    type="number"
                    placeholder="Enter Rate / Unit"
                    value={inputs.rate_unit}
                    onChange={(e) =>
                      setInputs((p) => ({ ...p, rate_unit: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <FormattedDatePicker
                    className="w-full"
                    label={
                      <span>
                        NAC Date <span className="text-red-500">*</span>
                      </span>
                    }
                    value={inputs.nac_calender}
                    onChange={(d) =>
                      setInputs((p) => ({ ...p, nac_calender: d }))
                    }
                  />
                </div>
              </div>
            </>
          )}

          {/* ---------- STOCKING ---------- */}
          {inputs.issue_type === "stocking" && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Demanded Qty</Label>
                  <Input
                    className="mt-3"
                    placeholder="Demanded Qty"
                    value={inputs.demand_quantity}
                  />
                </div>
                <div>
                  <Label>Previous NAC / MO Issued Qty</Label>
                  <Input
                    className="mt-3"
                    placeholder="Previous MO Issued Qty"
                    value={selectedRow?.stocked_nac_qty ?? 0}
                  />
                </div>
                <div>
                  <Label>
                    MO Issued Qty <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="mt-3"
                    placeholder="Enter MO Issued Qty"
                    type="number"
                    value={inputs.stocked_qty}
                    onChange={(e) =>
                      setInputs((p) => ({ ...p, stocked_qty: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>
                    MO Gate Pass No. <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="mt-3"
                    placeholder="Enter MO Gate Pass No."
                    value={inputs.mo_no}
                    onChange={(e) =>
                      setInputs((p) => ({
                        ...p,
                        mo_no: e.target.value.toUpperCase(),
                      }))
                    }
                  />
                </div>
                <div>
                  <FormattedDatePicker
                    className="w-full"
                    label={
                      <span>
                        MO Date <span className="text-red-500">*</span>
                      </span>
                    }
                    value={inputs.gate_pass_calender}
                    onChange={(d) =>
                      setInputs((p) => ({ ...p, gate_pass_calender: d }))
                    }
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen((p) => ({ ...p, issue: false }))}
            >
              Cancel
            </Button>

            <SpinnerButton
              loading={
                inputs.issue_type === "nac" ? isLoading.nac : isLoading.mo
              }
              onClick={inputs.issue_type === "nac" ? handleNAC : handleStocking}
            >
              Submit
            </SpinnerButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= QR DIALOG ================= */}
      <GenerateQRDialog
        open={isQrOpen}
        setOpen={setIsQrOpen}
        row={selectedRow}
      />
      <Dialog open={rollbackDialog} onOpenChange={setRollbackDialog}>
        <DialogContent className="w-[420px] p-6">
          <DialogTitle>
            Rollback:{" "}
            <span className="text-sm">{rollbackItemDesc || "Item"}</span>
          </DialogTitle>

          <div className="mt-4">
            <p className="mb-3 text-sm text-gray-700">
              Are you sure you want to rollback this Pending Issue?
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
    </>
  );
};

export default PermanentPendings;
