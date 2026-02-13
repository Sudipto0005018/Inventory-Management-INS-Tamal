import { useContext, useEffect, useMemo, useState } from "react";
import { Context } from "../utils/Context";
import PaginationTable from "../components/PaginationTableTwo";
import apiService from "../utils/apiService";
import { Button } from "../components/ui/button";
import { IoMdRefresh } from "react-icons/io";
import { FaChevronRight, FaMagnifyingGlass } from "react-icons/fa6";
import Chip from "../components/Chip";
import { FaTriangleExclamation } from "react-icons/fa6";
import { FaBell } from "react-icons/fa";
import { FaClock } from "react-icons/fa";
import {
  addDate,
  formatSimpleDate,
  getDate,
  getFormatedDate,
} from "../utils/helperFunctions";
import BoxNoDeposit from "../components/BoxNoDeposit";
import { MultiSelect } from "../components/ui/multi-select";

import GenerateQRDialog from "../components/GenerateQRDialog";
import { FormattedDatePicker } from "@/components/FormattedDatePicker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import toaster from "../utils/toaster";
import SpinnerButton from "../components/ui/spinner-button";

const PendingTempLoan = () => {
  const { config } = useContext(Context);
  const columns = useMemo(() => [
    { key: "description", header: "Item Description" },
    {
      key: "indian_pattern",
      header: (
        <span>
          <i>IN</i> Part No.
        </span>
      ),
    },
    { key: "category", header: "Category" },
    { key: "equipment_system", header: "Equipment / System" },
    { key: "qty_withdrawn", header: "Issued Qty" },
    { key: "service_no", header: "Service No." },
    { key: "issue_to", header: "Issued to" },
    { key: "issue_date_formated", header: "Issued Date" },
    { key: "loan_duration", header: "Loan Duration (days)" },
    { key: "submission_date", header: "Expected Return Date" },
    { key: "days_until_return", header: "Days Until Return" },
    { key: "qty_received", header: "Returned Qty" },
    { key: "status", header: "Status" },
    { key: "receive", header: "Proceed" },
  ]);

  const options = [
    {
      value: "description",
      label: "Item Description",
      width: "min-w-[40px]",
    },
    {
      value: "vue",
      label: (
        <span>
          <i>IN</i> Part No.
        </span>
      ),
      width: "min-w-[40px]",
    },
    { value: "category", label: "Category", width: "min-w-[40px]" },
    { value: "quantity", label: "Issued Quantity", width: "min-w-[40px]" },
    {
      value: "survey_quantity",
      label: "Surveyed Quantity",
      width: "min-w-[40px]",
    },
    { value: "status", label: "Status", width: "min-w-[40px]" },
  ];
  const [selectedValues, setSelectedValues] = useState([]);
  const [actionType, setActionType] = useState("returned");
  // "returned" | "utilised"

  //Generate QR state
  const [generateQR, setGenerateQR] = useState("no");
  const [openQRDialog, setOpenQRDialog] = useState(false);

  const [boxNo, setBoxNo] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [fetchedData, setFetchedData] = useState({
    items: [],
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
  });
  const [selectedRow, setSelectedRow] = useState({});
  const [isOpen, setIsOpen] = useState({
    receive: false,
    receive_calender: false,
  });
  const [inputs, setInputs] = useState({
    receive_date: new Date(),
    quantity_received: "",
  });
  const [isLoading, setIsLoading] = useState({
    receive: false,
  });
  const fetchdata = async () => {
    try {
      const response = await apiService.get("/temporaryIssue/issue", {
        params: {
          page: currentPage,
          limit: config.row_per_page,
        },
      });

      if (response.success) {
        const items = Array.isArray(response.data)
          ? response.data
          : response.data?.items || [];

        setFetchedData({
          items,
          totalItems: response.data?.totalItems || items.length,
          totalPages: response.data?.totalPages || 1,
          currentPage,
        });
      }
    } catch (error) {
      toaster("error", error.message);
    }
  };

  const handleSearch = async (e) => {
    const service_no = inputs.search.trim();
    if (service_no === actualSearch) {
      return;
    } else {
      setActualSearch(service_no);
    }
    setIsLoading((prev) => ({ ...prev, search: true }));
    await fetchdata();
    setIsLoading((prev) => ({ ...prev, search: false }));
  };

  const getDepositQty = () => {
    if (!Array.isArray(boxNo)) return 0;

    return boxNo.reduce((sum, row) => {
      const depositQty = Number(row?.deposit || 0);
      return sum + depositQty;
    }, 0);
  };

  const handleRefresh = () => {
    setInputs((prev) => ({
      ...prev,
      search: "",
    }));

    setSelectedSearchFields([]);
    setCurrentPage(1);
    setActualSearch("");
    // setSelectedRowIndex(null);
    setPanelProduct({ critical_spare: "no" });
    fetchdata("", 1);
  };

  const getDaysUntilReturn = (
    issueDate,
    loanDuration,
    qtyWithdrawn,
    qtyReceived,
  ) => {
    if (!issueDate || loanDuration == null) return "-";

    // If fully returned
    if (Number(qtyReceived || 0) >= Number(qtyWithdrawn || 0)) {
      return "Returned";
    }

    const issue = new Date(issueDate);

    const expected = new Date(issue);
    expected.setDate(expected.getDate() + Number(loanDuration));

    const today = new Date();

    // Remove time for accurate diff
    expected.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = expected - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return `+${diffDays} days`;
    if (diffDays === 0) return "0 days";
    return `${diffDays} days`; // negative → overdue
  };

  useEffect(() => {
    if (!Array.isArray(fetchedData.items)) return;

    const t = fetchedData.items.map((row) => ({
      ...row,

      issued_to: row.issue_to?.toUpperCase() || "-",

      loan_duration: row.loan_duration ?? "-",

      loan_status:
        Number(row.qty_received || 0) >= Number(row.qty_withdrawn || 0)
          ? "Completed"
          : "Pending",

      quantity: row.qty_withdrawn ?? 0,

      service_no: row.service_no || "-",

      issue_date_formated: row.issue_date ? getDate(row.issue_date) : "-",

      received_quantity: row.qty_received ?? 0,

      status: (() => {
        const s = row.loan_status?.toLowerCase();
        if (s === "pending") {
          return <Chip text="Pending" varient="info" />;
        }

        if (s === "partial") {
          return <Chip text="Partial" varient="success" />;
        }

        if (s === "complete") {
          return <Chip text="Completed" varient="success" />;
        }

        if (s === "overdue") {
          return <Chip text="Overdue" varient="danger" />;
        }

        return <Chip text="Unknown" varient="default" />;
      })(),

      receive: (
        <Button
          size="icon"
          className="bg-white text-black shadow-md border hover:bg-gray-100"
          onClick={() => {
            setSelectedRow(row);
            setIsOpen((prev) => ({ ...prev, receive: true }));
          }}
        >
          <FaChevronRight />
        </Button>
      ),
    }));

    setTableData(t);
  }, [fetchedData]);

  async function updateDetails() {
    setIsLoading((prev) => ({ ...prev, receive: true }));

    try {
      let response;

      if (actionType === "returned") {
        /** ITEM RETURNED */
        response = await apiService.put("/temporaryIssue/issue", {
          id: selectedRow.id,
          qty_received: Number(inputs.quantity_received),
          return_date: formatSimpleDate(inputs.receive_date),
          box_no: boxNo,
          approve: true,
        });
      } else {
        /** ITEM UTILISED */
        response = await apiService.post("/temporaryIssue/category-update", {
          id: selectedRow.id,
        });
      }

      if (response.success) {
        toaster(
          "success",
          actionType === "returned"
            ? "Item received successfully"
            : "Item marked as utilised successfully",
        );

        setIsOpen((prev) => ({ ...prev, receive: false }));
        setInputs({
          quantity_received: "",
          receive_date: new Date(),
        });
        setActionType("returned");
        setBoxNo([]);
        setOpenQRDialog(false);
        fetchdata();
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      toaster(
        "error",
        error.response?.data?.message || error.message || "Operation failed",
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, receive: false }));
    }
  }

  const handleReceive = async () => {
    if (actionType === "returned") {
      const returnedQty = Number(inputs.quantity_received);
      const depositQty = Number(getDepositQty());

      // 🔴 No field should be less than zero
      const fieldsToValidate = [
        { value: returnedQty, label: "Returned quantity" },
        { value: depositQty, label: "Deposit quantity" },
      ];

      for (const field of fieldsToValidate) {
        if (field.value < 0) {
          toaster("error", `${field.label} cannot be less than zero`);
          return;
        }
      }

      if (!returnedQty) {
        toaster("error", "Quantity is required");
        return;
      }

      if (returnedQty > selectedRow.quantity) {
        toaster("error", "Quantity cannot be greater than issued quantity");
        return;
      }

      if (!inputs.receive_date) {
        toaster("error", "Receive date is required");
        return;
      }

      // ❌ No single deposit qty can be less than 0
      const hasNegativeDepositRow = boxNo.some(
        (row) => Number(row.deposit) < 0,
      );

      if (hasNegativeDepositRow) {
        toaster(
          "error",
          "Deposit quantity in any box cannot be less than zero",
        );
        return;
      }

      if (depositQty !== returnedQty) {
        toaster("error", "Deposit quantity must be equal to returned quantity");
        return;
      }
    }
    if (generateQR != "no") {
      setOpenQRDialog(true);
      return;
    }
    await updateDetails();
  };

  useEffect(() => {
    fetchdata();
  }, [currentPage]);

  useEffect(() => {
    if (!Array.isArray(fetchedData.items)) return;

    const t = fetchedData.items.map((row) => {
      const issuedQty = Number(row.qty_withdrawn || 0);

      return {
        ...row,

        quantity: issuedQty,

        issue_to: row.issue_to?.toUpperCase() || "-",

        loan_duration: row.loan_duration ?? "-",
        returned_date_formatted: getFormatedDate(row.return_date),

        loan_status:
          Number(row.qty_received || 0) >= issuedQty ? "Completed" : "Pending",

        service_no: row.service_no || "-",

        issue_date_formated: row.issue_date
          ? getFormatedDate(row.issue_date)
          : "-",

        submission_date: row.issue_date
          ? getFormatedDate(
              addDate(row.issue_date, parseInt(row.loan_duration || 0)),
            )
          : "-",

        received_quantity: row.qty_received ?? 0,

        days_until_return: (() => {
          const result = getDaysUntilReturn(
            row.issue_date,
            row.loan_duration,
            row.qty_withdrawn,
            row.qty_received,
          );

          /** 🔹 UI Styling like screenshot */
          if (result === "Returned") {
            return <span className="text-gray-500 font-medium">Returned</span>;
          }

          const days = parseInt(result);

          if (!isNaN(days)) {
            if (days < 0) {
              // Overdue
              return (
                <span className="flex items-center justify-start gap-1 leading-none whitespace-nowrap text-red-600 font-semibold">
                  <FaTriangleExclamation className="text-sm relative top-[1px] ml-5" />
                  <span>{result}</span>
                </span>
              );
            }

            if (days <= 1) {
              // Reminder (1 day / today)
              return (
                <span className="flex items-center justify-start gap-1 leading-none whitespace-nowrap text-blue-500 font-semibold">
                  <FaBell className="text-sm relative top-[1px] ml-5" />
                  <span>{result}</span>
                </span>
              );
            }

            // Safe
            return (
              <span className="flex items-center justify-start gap-1 leading-none whitespace-nowrap text-green-600 font-medium">
                <FaClock className="text-sm relative top-[1px] ml-5" />
                <span>{result}</span>
              </span>
            );
          }

          return result;
        })(),

        status: (() => {
          const s = row.loan_status?.toLowerCase();
          if (s === "pending") {
            return <Chip text="Pending" varient="info" />;
          }

          if (s === "partial") {
            return <Chip text="Partial" varient="success" />;
          }

          if (s === "complete") {
            return <Chip text="Completed" varient="success" />;
          }

          if (s === "overdue") {
            return <Chip text="Overdue" varient="danger" />;
          }

          return <Chip text="Unknown" varient="default" />;
        })(),

        receive: (
          <Button
            size="icon"
            className="bg-white text-black shadow-md border hover:bg-gray-100"
            onClick={() => {
              let parsedBoxNo = [];

              try {
                if (Array.isArray(row.box_no)) {
                  parsedBoxNo = row.box_no;
                } else if (typeof row.box_no === "string") {
                  parsedBoxNo = JSON.parse(row.box_no);
                }
              } catch (e) {
                console.error("Invalid box_no JSON", e);
              }
              setSelectedRow({
                ...row,
                quantity: issuedQty,
              });
              setBoxNo(parsedBoxNo);
              setIsOpen((prev) => ({ ...prev, receive: true }));
            }}
          >
            <FaChevronRight />
          </Button>
        ),
      };
    });

    setTableData(t);
  }, [fetchedData]);

  const updateTablePreview = (updates) => {
    setTableData((prev) =>
      prev.map((row) =>
        row.id === selectedRow.id ? { ...row, ...updates } : row,
      ),
    );
  };

  const closeDialog = () => {
    setIsOpen((prev) => ({ ...prev, receive: false }));
    setBoxNo([]);
    setInputs({
      receive_date: new Date(),
      quantity_received: "",
    });
  };

  return (
    <>
      <div className="w-table-2 pt-2 h-full rounded-md bg-white">
        <div className="mb-2 px-3">
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
        <div className="flex items-center mb-4 gap-4 w-[98%] mx-auto">
          <Input
            type="text"
            placeholder="Search items"
            className="bg-white "
            value={inputs.search}
            onChange={(e) =>
              setInputs((prev) => ({ ...prev, search: e.target.value }))
            }
          />
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
            className="cursor-pointer flex items-center gap-1 
            hover:bg-gray-200 font-extrabold
            hover:scale-105 
            transition-all duration-200"
            onClick={handleRefresh}
            title="Reset Search"
          >
            <IoMdRefresh
              className="size-7
              hover:rotate-180 
              transition-transform duration-300"
              style={{
                color: "#109240",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            />
            <span className="text-md font-bold text-green-700"></span>
          </Button>
        </div>
        <PaginationTable
          data={tableData}
          columns={columns}
          currentPage={fetchedData.currentPage || 1}
          pageSize={fetchedData.items?.length || 10}
          totalPages={fetchedData.totalPages || 1}
          onPageChange={setCurrentPage}
          hasSearch={false}
        />
      </div>

      <Dialog
        open={isOpen.receive}
        onOpenChange={(set) =>
          setIsOpen((prev) => {
            return { ...prev, receive: set };
          })
        }
      >
        <DialogContent
          unbounded
          className="w-[55vw] p-6"
          onInteractOutside={(e) => {
            e.preventDefault(); // 🚫 Prevent outside click close
          }}
          onPointerDownOutside={(e) => {
            // e.preventDefault();
          }}
          onCloseAutoFocus={() => {
            setInputs((prev) => ({
              ...prev,
            }));
          }}
        >
          <div
            className="sticky top-0 z-10 bg-background 
                grid grid-cols-2 items-center 
                px-4 py-2 border-b"
          >
            <DialogTitle className="capitalize">
              Temporary Issue Local Details
            </DialogTitle>
            <button
              type="button"
              onClick={() => setIsOpen((prev) => ({ ...prev, receive: false }))}
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
          <div className="mb-4">
            <Label className="mb-2 block">Action Type</Label>
            <div className="flex gap-6 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="actionType"
                  value="returned"
                  checked={actionType === "returned"}
                  onChange={() => setActionType("returned")}
                />
                Item Returned
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="actionType"
                  value="utilised"
                  checked={actionType === "utilised"}
                  onChange={() => setActionType("utilised")}
                />
                Item Utilised
              </label>
            </div>
          </div>
          {actionType === "returned" && (
            <>
              <div className="grid grid-cols-3 gap-4"></div>

              <DialogDescription className="hidden" />
              <div className="">
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label className="mb-1 ms-2 gap-1" htmlFor="quantity">
                      Qty Issued
                    </Label>
                    <Input
                      className="mt-2"
                      id="quantity"
                      type="number"
                      placeholder="Quantity"
                      value={selectedRow?.quantity ?? 0}
                      readOnly
                    />
                  </div>
                  <div>
                    <Label className="mb-1 ms-2">Previously Received Qty</Label>
                    <Input
                      className="mt-2"
                      value={selectedRow?.qty_received ?? 0}
                      readOnly
                    />
                  </div>
                  <div>
                    <Label className="mb-1 ms-2 gap-1" htmlFor="quantity">
                      Qty Returned<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      className="mt-2"
                      id="quantity"
                      visibleColums={[]}
                      type="number"
                      placeholder="Quantity"
                      value={inputs.quantity_received}
                      onChange={(e) => {
                        const value = e.target.value;
                        setInputs((prev) => ({
                          ...prev,
                          quantity_received: value,
                        }));

                        updateTablePreview({
                          qty_received: value,
                          received_quantity: value,
                        });
                      }}
                    />
                  </div>
                  <div className="">
                    <FormattedDatePicker
                      label="Returned Date *"
                      className="w-full"
                      value={inputs.receive_date}
                      onChange={(date) => {
                        setInputs((prev) => ({
                          ...prev,
                          receive_date: date,
                        }));

                        updateTablePreview({
                          returned_date: date,
                          returned_date_formatted: getDate(date),
                        });
                      }}
                    />
                  </div>
                </div>
                <Label className="ms-2 mb-1 mt-6" htmlFor="box_no">
                  Box Wise Segregation
                </Label>
                <BoxNoDeposit
                  className="mt-4"
                  value={boxNo}
                  onChange={(val) => {
                    setBoxNo(val);
                  }}
                />
                <div className="mt-4">
                  <Label className="ms-2 mb-2 block">Generate QR</Label>

                  <div className="flex gap-6 ms-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="generate_qr"
                        value="no"
                        checked={generateQR === "no"}
                        onChange={() => {
                          setGenerateQR("no");
                        }}
                      />
                      No
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="generate_qr"
                        value="yes"
                        checked={generateQR === "yes"}
                        onChange={() => {
                          setGenerateQR("yes");
                        }}
                      />
                      Yes
                    </label>
                  </div>
                </div>
                <GenerateQRDialog
                  open={openQRDialog}
                  setOpen={setOpenQRDialog}
                  row={selectedRow}
                  boxesData={boxNo}
                  updateDetails={updateDetails}
                />
              </div>
            </>
          )}
          {actionType === "utilised" && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm">
              <p>
                This item has been marked as <b>Utilised</b>.
              </p>

              <p className="mt-2">
                Item will move to:
                <b className="ml-1">
                  {["P", "R"].includes(selectedRow?.category)
                    ? "Pending for Survey"
                    : "Pending for Demand"}
                </b>
              </p>
            </div>
          )}
          <div className="flex items-center mt-4 gap-4 justify-end">
            <Button onClick={closeDialog} variant="outline">
              Cancel
            </Button>
            <SpinnerButton
              loading={isLoading.receive}
              disabled={isLoading.receive}
              loadingText="Receiving..."
              onClick={handleReceive}
              className="text-white hover:bg-primary/85 cursor-pointer"
            >
              Submit
            </SpinnerButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PendingTempLoan;
