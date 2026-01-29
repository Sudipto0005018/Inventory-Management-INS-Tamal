import { useContext, useEffect, useMemo, useState } from "react";
import { Context } from "../utils/Context";
import PaginationTable from "../components/PaginationTableTwo";
import apiService from "../utils/apiService";
import { Button } from "../components/ui/button";
import { FaChevronRight } from "react-icons/fa6";
import {
  addDate,
  formatSimpleDate,
  getDate,
  getFormatedDate,
} from "../utils/helperFunctions";
import BoxNoDeposit from "../components/BoxNoDeposit";

import { FormattedDatePicker } from "@/components/FormattedDatePicker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
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
    { key: "equipment_system", header: "Equipment/ System" },
    { key: "qty_withdrawn", header: "Issued Qty" },
    { key: "service_no", header: "Service No." },
    { key: "issue_to", header: "Issued to" },
    { key: "issue_date_formated", header: "Issued Date" },
    { key: "loan_duration", header: "Loan Duration (days)" },
    { key: "submission_date", header: "Expected Return Date" },
    { key: "received_quantity", header: "Qty returned" },
    { key: "returned_date_formatted", header: "Returned Date" },
    { key: "status", header: "Status" },
    { key: "receive", header: "Proceed" },
  ]);
  const [actionType, setActionType] = useState("returned");
  // "returned" | "utilised"

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
  const [receiveHistory, setReceiveHistory] = useState([]);
  const fetchdata = async () => {
    try {
      const response = await apiService.get("/temporaryIssue/issue", {
        params: {
          page: currentPage,
          limit: config.row_per_page,
        },
      });

      if (response.success) {
        // Always normalize to array
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

  const fetchLoanReceiveHistory = async () => {
    try {
      const response = await apiService.get(
        "/loan/temp-loans-history/" + selectedRow.id,
      );
      if (response.success) {
        setReceiveHistory(response.data);
        console.log(response.data);
      } else {
        setReceiveHistory([]);
      }
    } catch (error) {
      toaster("error", error.message);
    }
  };
  const handleReceive = async () => {
    if (actionType === "returned") {
      if (!inputs.quantity_received) {
        toaster("error", "Quantity is required");
        return;
      } else if (inputs.quantity_received <= 0) {
        toaster("error", "Quantity cannot be less than one");
        return;
      } else if (inputs.quantity_received > selectedRow.quantity) {
        toaster("error", "Quantity cannot be greater than issued quantity");
        return;
      } else if (!inputs.receive_date) {
        toaster("error", "Receive date is required");
        return;
      }
    }

    setIsLoading((prev) => ({ ...prev, receive: true }));

    try {
      let response;
      if (actionType === "returned") {
        response = await apiService.put("/temporaryIssue/issue", {
          id: selectedRow.id,
          qty_received: Number(inputs.quantity_received),
          return_date: formatSimpleDate(inputs.receive_date),
          box_no: boxNo,
          approve: true,
        });
      } else {
        const nextStatus = ["P", "R"].includes(selectedRow.category)
          ? "PENDING_SURVEY"
          : "PENDING_DEMAND";

        response = await apiService.post("/loan/temp-loans-utilised", {
          loan_id: selectedRow.id,
          status: nextStatus,
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

        fetchdata();
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message || error.message || "Operation failed";
      toaster("error", errMsg);
    } finally {
      setIsLoading((prev) => ({ ...prev, receive: false }));
    }
  };

  useEffect(() => {
    fetchdata();
  }, [currentPage]);
  useEffect(() => {
    if (isOpen.receive) {
      fetchLoanReceiveHistory();
    }
  }, [isOpen.receive]);

  useEffect(() => {
    if (!Array.isArray(fetchedData.items)) return;

    const t = fetchedData.items.map((row) => {
      const issuedQty = Number(row.qty_withdrawn || 0);

      return {
        ...row,

        quantity: issuedQty,

        issue_to: row.issue_to?.toUpperCase() || "-",

        loan_duration: row.loan_duration ?? "-",

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
      <div className="w-full h-full rounded-md bg-white">
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
          onPointerDownOutside={(e) => {
            // e.preventDefault();
          }}
          onCloseAutoFocus={() => {
            setInputs((prev) => ({
              ...prev,
            }));
          }}
        >
          <DialogTitle className="capitalize">
            Temporary Issue Local - Item Returned Details
          </DialogTitle>

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
              {/* {receiveHistory.length > 0 && <ReturnHistoryTable />} */}

              <DialogDescription className="hidden" />
              <div className="">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label className="mb-1 ms-2 gap-1" htmlFor="quantity">
                      Qty Issued<span className="text-red-500">*</span>
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
                      label="Returned Date"
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
                <BoxNoDeposit
                  className="mt-4"
                  value={boxNo}
                  onChange={(val) => {
                    setBoxNo(val);
                  }}
                />
              </div>
              {/* {receiveHistory.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold">Return History</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Returned Quantity</TableHead>
                        <TableHead>Returned Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receiveHistory.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{row.quantity}</TableCell>
                          <TableCell>{getDate(row.date)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )} */}
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
