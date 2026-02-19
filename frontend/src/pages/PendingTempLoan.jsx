import { useContext, useEffect, useMemo, useState } from "react";
import { Context } from "../utils/Context";
import PaginationTable from "../components/PaginationTableTwo";
import apiService from "../utils/apiService";
import { Button } from "../components/ui/button";
import { FaChevronRight } from "react-icons/fa6";
import {
  addDate,
  formatDate,
  formatSimpleDate,
  getDate,
  getDateStrToDate,
} from "../utils/helperFunctions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { ChevronDownIcon } from "lucide-react";
import { Calendar } from "../components/ui/calendar";
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
    { key: "issued_to", header: "Issued To" },
    { key: "loan_duration", header: "Loan Duration" },
    { key: "loan_status", header: "Status" },
    { key: "quantity", header: "Quantity" },
    { key: "issue_date_formated", header: "Issue Date" },
    { key: "submission_date", header: "Max Return Date" },
    { key: "received_quantity", header: "Received Quantity" },
    { key: "receive", header: "Receive" },
  ]);
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
      setIsLoading((prev) => ({ ...prev, table: true }));
      const response = await apiService.get("/loan/temp-loans", {
        params: {
          page: currentPage,
          search: "",
          limit: config.row_per_page,
        },
      });
      setFetchedData(response.data);
      console.log(response);
    } catch (error) {
      console.log(error);
    }
  };
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
    setIsLoading((prev) => ({ ...prev, receive: true }));
    try {
      const response = await apiService.post("/loan/temp-loans-receive", {
        loan_id: selectedRow.id,
        quantity: inputs.quantity_received,
        date: formatSimpleDate(inputs.receive_date),
        issued_quantity: selectedRow.quantity,
      });
      if (response.success) {
        toaster("success", "Item received successfully");
        setIsOpen((prev) => ({ ...prev, receive: false }));
        setInputs((prev) => ({
          ...prev,
          quantity_received: "",
          receive_date: new Date(),
        }));
        fetchdata();
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to issue item";
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
    const t = fetchedData.items.map((row) => {
      return {
        ...row,
        loan_status: row.loan_status == "pending" ? "Pending" : "Completed",
        issued_to: row.issued_to.toUpperCase(),
        issue_date_formated: getDate(row.issue_date),
        submission_date: getDate(
          formatSimpleDate(
            addDate(
              getDateStrToDate(row.issue_date),
              parseInt(row.loan_duration),
            ),
          ),
        ),
        received_quantity: row.received_quantity || "0",
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
      };
    });
    setTableData(t);
  }, [fetchedData]);

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
          onPointerDownOutside={(e) => {
            // e.preventDefault();
          }}
          className="max-h-[90%] overflow-y-auto"
          onCloseAutoFocus={() => {
            setInputs((prev) => ({
              ...prev,
            }));
          }}
        >
          <DialogTitle className="capitalize">Returned details</DialogTitle>
          <DialogDescription className="hidden" />
          <div className="">
            <Label className="mb-1 ms-2 gap-1" htmlFor="quantity">
              Returned Quantity<span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              placeholder="Quantity"
              className="w-full"
              value={inputs.quantity_received}
              onChange={(e) =>
                setInputs((prev) => ({
                  ...prev,
                  quantity_received: e.target.value,
                }))
              }
            />
            <Label htmlFor="receive_date" className="mb-1 ms-2 gap-1 mt-3">
              Returned Date<span className="text-red-500">*</span>
            </Label>
            <Popover
              open={isOpen.receive_calender}
              onOpenChange={(set) => {
                setIsOpen((prev) => ({ ...prev, receive_calender: set }));
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  id="date"
                  className="w-full justify-between font-normal"
                >
                  {inputs.receive_date
                    ? formatDate(inputs.receive_date)
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
                  selected={inputs.receive_date}
                  captionLayout="dropdown"
                  onSelect={(date) => {
                    setInputs((prev) => ({
                      ...prev,
                      receive_date: date,
                    }));
                    setIsOpen((prev) => ({
                      ...prev,
                      receive_calender: false,
                    }));
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          {receiveHistory.length > 0 && (
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
          )}
          <div className="flex items-center mt-4 gap-4 justify-end">
            <Button
              onClick={() => setIsOpen((prev) => ({ ...prev, receive: false }))}
              variant="outline"
            >
              Cancel
            </Button>
            <SpinnerButton
              loading={isLoading.receive}
              disabled={isLoading.receive}
              loadingText="Receiving..."
              onClick={handleReceive}
              className="text-white hover:bg-primary/85 cursor-pointer"
            >
              Receive
            </SpinnerButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PendingTempLoan;
