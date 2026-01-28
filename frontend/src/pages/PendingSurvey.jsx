import { useContext, useEffect, useMemo, useState } from "react";
import { FaChevronRight, FaMagnifyingGlass } from "react-icons/fa6";
import { AiTwotonePrinter } from "react-icons/ai";

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
import { ChevronDownIcon, Plus } from "lucide-react";
import {
  formatDate,
  formatSimpleDate,
  getDate,
} from "../utils/helperFunctions";
import Spinner from "../components/Spinner";
// substitute in pattern name (non men)
// oem/vendor details (non men)
// local terminology (non men)
const Pending = () => {
  const { config } = useContext(Context);
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
    { key: "issue_date", header: "Date of Issue", width: "min-w-[40px]" },
    { key: "quantity", header: "Issued Qty", width: "min-w-[40px]" },
    {
      key: "survey_quantity",
      header: "Surveyed Qty",
      width: "min-w-[40px]",
    },
    //   { key: "status", header: "Status" },
    { key: "processed", header: "Proceed", width: "min-w-[40px]" },
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
        <p>
          <i>IN</i> Part No.
        </p>
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
    issue: false,
  });
  const [actualSearch, setActualSearch] = useState("");
  const [inputs, setInputs] = useState({
    search: "",
    issued_to: "",
    issued_type: "single",
    servay_number: "",
    voucher_no: "",
    demand_no: "",
    demand_type: "nac",
    nac_no: "",
    nac_date: "",
    rate: "",
    issue_calender: new Date(),
    survey_calender: new Date(),
    demand_calender: new Date(),
    quantity: "",
  });
  const [isOpen, setIsOpen] = useState({
    issue: false,
    survey: false,
    demand: false,
    nac: false,
    nac_calendar: false,
    procurement: false,
    pending_issue: false,
    issue_calender: false,
    survey_calender: false,
    demand_calender: false,
  });
  const [selectedRow, setSelectedRow] = useState({});

  const fetchdata = async () => {
    try {
      const response = await apiService.get("/pending/non-pending", {
        params: {
          page: currentPage,
          search: inputs.search,
          limit: config.row_per_page,
        },
      });
      setFetchedData(response.data);
    } catch (error) {
      console.log(error);
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
  const handleServay = async () => {
    if (!inputs.voucher_no || !inputs.quantity || !inputs.survey_calender) {
      toaster("error", "All fields are required");
      return;
    }
    setIsLoading((prev) => ({ ...prev, survey: true }));
    try {
      const response = await apiService.post("/pending/servay", {
        id: selectedRow.id,
        voucher_no: inputs.voucher_no,
        survey_date: formatSimpleDate(inputs.survey_calender),
        quantity: inputs.quantity,
        issued_quantity: selectedRow.quantity,
      });
      if (response.success) {
        toaster("success", "Item submitted successfully");
        setIsOpen((prev) => ({ ...prev, survey: false }));
        setInputs((prev) => ({
          ...prev,
          survey_number: "",
          voucher_no: "",
        }));
        fetchdata();
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message || error.message || "Failed to survey";
      toaster("error", errMsg);
    } finally {
      setIsLoading((prev) => ({ ...prev, survey: false }));
    }
  };
  const handleDemand = async () => {
    setIsLoading((prev) => ({ ...prev, demand: true }));
    try {
      const response = await apiService.post("/pending/demand", {
        id: selectedRow.id,
        demand_no: inputs.demand_no,
        demand_type: inputs.demand_type,
        source: selectedRow.source,
      });
      if (response.success) {
        toaster("success", "Item demand successfully");
        setIsOpen((prev) => ({ ...prev, demand: false }));
        setInputs((prev) => ({
          ...prev,
          demand_no: "",
        }));
        fetchdata();
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message || error.message || "Failed to demand";
      toaster("error", errMsg);
    } finally {
      setIsLoading((prev) => ({ ...prev, demand: false }));
    }
  };
  const handleNAC = async () => {
    setIsLoading((prev) => ({ ...prev, nac: true }));
    try {
      const response = await apiService.post("/pending/nac", {
        id: selectedRow.id,
        nac_no: inputs.nac_no,
        nac_date: formatSimpleDate(inputs.nac_date),
        rate: inputs.rate,
        source: selectedRow.source,
      });
      if (response.success) {
        toaster("success", "Item NAC successfully");
        setIsOpen((prev) => ({ ...prev, nac: false }));
        setInputs((prev) => ({
          ...prev,
          nac_no: "",
          nac_date: "",
          rate: "",
        }));
        fetchdata();
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message || error.message || "Failed to demand";
      toaster("error", errMsg);
    } finally {
      setIsLoading((prev) => ({ ...prev, nac: false }));
    }
  };
  const handleProcure = async () => {
    setIsLoading((prev) => ({ ...prev, procurement: true }));
    try {
      const response = await apiService.post("/pending/procure", {
        id: selectedRow.id,
        source: selectedRow.source,
      });
      if (response.success) {
        toaster("success", "Item procurement successfully");
        setIsOpen((prev) => ({ ...prev, procurement: false }));
        fetchdata();
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to procurement";
      toaster("error", errMsg);
    } finally {
      setIsLoading((prev) => ({ ...prev, procurement: false }));
    }
  };
  const printPdf = async (id, source) => {
    setIsLoading((prev) => ({ ...prev, print: true }));
    try {
      await apiService.openPdfForPrint("/pending/print/", { id, source });
    } catch (error) {
      const errMsg =
        error.response?.data?.message || error.message || "Failed to print";
      toaster("error", errMsg);
    } finally {
      setIsLoading((prev) => ({ ...prev, print: false }));
    }
  };
  const handlePendingIssue = async () => {
    setIsLoading((prev) => ({ ...prev, pending_issue: true }));
    try {
      const response = await apiService.post("/pending/pending-issue", {
        id: selectedRow.id,
        source: selectedRow.source,
      });
      if (response.success) {
        toaster("success", "Item processed successfully");
        setIsOpen((prev) => ({ ...prev, pending_issue: false }));
        fetchdata();
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message || error.message || "Failed to process";
      toaster("error", errMsg);
    } finally {
      setIsLoading((prev) => ({ ...prev, pending_issue: false }));
    }
  };

  useEffect(() => {
    fetchdata();
  }, [currentPage]);

  useEffect(() => {
    const t = fetchedData.items.map((row) => ({
      ...row,
      survey_quantity: row.survey_quantity || "0",
      issue_date: getDate(row.issue_date),
      status:
        row.status == "issued"
          ? "Pending for Survey"
          : row.status == "servayed"
          ? "Pending for Demand"
          : row.status == "demanded"
          ? row.demand_type == "nac"
            ? "NAC"
            : "Pending for Issue"
          : row.status == "naced"
          ? "Pending for Procurement"
          : row.status == "pending_stock"
          ? "Pending for Stocking"
          : row.status,
      processed: (
        <Button
          size="icon"
          className="bg-white text-black shadow-md border hover:bg-gray-100"
          onClick={() => {
            setSelectedRow(row);
            console.log(row.status);

            if (
              row.category?.toLowerCase() == "p" ||
              row.category?.toLowerCase() == "r" ||
              !row.category
            ) {
              if (row.status == "pending") {
                setIsOpen((prev) => ({ ...prev, issue: true }));
              } else if (row.status == "issued") {
                console.log("a");

                setIsOpen((prev) => ({ ...prev, survey: true }));
              } else if (row.status === "surveyed") {
                setIsOpen((prev) => ({ ...prev, demand: true }));
              } else if (
                row.status === "demanded" &&
                row.demand_type === "nac"
              ) {
                setIsOpen((prev) => ({ ...prev, nac: true }));
              } else if (row.status === "naced") {
                setIsOpen((prev) => ({ ...prev, procurement: true }));
              } else if (row.status === "procured") {
                printPdf(row.id, row.source);
              } else if (
                row.demand_type === "pending_issue" &&
                row.status !== "pending_stock"
              ) {
                setIsOpen((prev) => ({ ...prev, pending_issue: true }));
              } else if (row.status === "pending_stock") {
                printPdf(row.id, row.source);
              }
            }
          }}
        >
          {row.status == "procured" || row.status == "pending_stock" ? (
            isLoading.print ? (
              <Spinner />
            ) : (
              <AiTwotonePrinter />
            )
          ) : (
            <FaChevronRight />
          )}
        </Button>
      ),
    }));
    setTableData(t);
  }, [fetchedData]);

  return (
    <div className="px-2 w-full">
      <div className="mb-2">
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
      <div className="flex items-center mb-4 gap-4 w-full">
        <Input
          type="text"
          placeholder="Search survey items"
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
        <Button>
          <Plus />
          Add New Survey
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
        onOpenChange={(set) =>
          setIsOpen((prev) => {
            if (!set) {
              setInputs((prev) => ({
                ...prev,
                servay_number: "",
                voucher_no: "",
              }));
            }
            return { ...prev, survey: set };
          })
        }
      >
        <DialogContent
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
          <DialogTitle className="capitalize">
            Survey {selectedRow.source == "spares" ? "spare" : "tool"}
          </DialogTitle>
          <DialogDescription className="hidden" />
          <div>
            <Label htmlFor="servay_quantity" className="mb-2 gap-1">
              Survey Quantity<span className="text-red-500">*</span>
            </Label>
            <Input
              id="servay_quantity"
              type="text"
              placeholder="Survey Number"
              name="quantity"
              value={inputs.quantity}
              onChange={(e) =>
                setInputs((prev) => ({ ...prev, quantity: e.target.value }))
              }
            />
            <Label htmlFor="voucher_no" className="mt-4 mb-2 gap-1">
              Survey Voucher No<span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              placeholder="Survey Voucher No"
              name="voucher_no"
              value={inputs.voucher_no}
              onChange={(e) =>
                setInputs((prev) => ({ ...prev, voucher_no: e.target.value }))
              }
            />
            <Label htmlFor="servay_number" className="mb-2 mt-4 gap-1">
              Survey Date<span className="text-red-500">*</span>
            </Label>
            <Popover
              open={isOpen.survey_calender}
              onOpenChange={(set) => {
                setIsOpen((prev) => ({ ...prev, survey_calender: set }));
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  id="date"
                  className="w-full justify-between font-normal"
                >
                  {inputs.survey_calender
                    ? formatDate(inputs.survey_calender)
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
            <div>
              <div className="flex items-center mt-4 gap-4 justify-end">
                <Button
                  variant="destructive"
                  onClick={() =>
                    setIsOpen((prev) => ({ ...prev, survey: false }))
                  }
                >
                  Cancel
                </Button>
                <SpinnerButton
                  loading={isLoading.servay}
                  disabled={isLoading.survey}
                  loadingText="Submitting..."
                  className="text-white hover:bg-primary/85 cursor-pointer"
                  onClick={handleServay}
                >
                  Submit
                </SpinnerButton>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isOpen.demand}
        onOpenChange={(set) => setIsOpen((prev) => ({ ...prev, demand: set }))}
      >
        <DialogContent
          onPointerDownOutside={(e) => {
            e.preventDefault();
          }}
          onCloseAutoFocus={() => {
            setInputs((prev) => ({
              ...prev,
              demand_no: "",
              demand_type: "nac",
              demand_calender: new Date(),
            }));
          }}
        >
          <DialogTitle className="capitalize">
            Demand {selectedRow.source == "spares" ? "spare" : "tool"}
          </DialogTitle>
          <DialogDescription className="hidden" />
          <div>
            <Label htmlFor="demand_no" className="ms-2 mb-2">
              Demand No<span className="text-red-500">*</span>
            </Label>
            <Input
              id="demand_no"
              type="text"
              placeholder="Demand No"
              name="demand_no"
              value={inputs.demand_no}
              onChange={(e) =>
                setInputs((prev) => ({ ...prev, demand_no: e.target.value }))
              }
            />
            {/* <Label htmlFor="demand_type" className="mt-4 mb-2 ms-2">
                            Demand Type
                        </Label>
                        <Select
                            value={inputs.demand_type}
                            onValueChange={(value) =>
                                setInputs((prev) => ({ ...prev, demand_type: value }))
                            }
                        >
                            <SelectTrigger className="w-[175px]">
                                <SelectValue className="" placeholder="Demand Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="nac">NAC</SelectItem>
                                <SelectItem value="pending_issue">Pending for Issue</SelectItem>
                            </SelectContent>
                        </Select> */}
            <Label htmlFor="servay_number" className="mb-2 mt-4">
              Demand Date
            </Label>
            <Popover
              open={isOpen.demand_calender}
              onOpenChange={(set) => {
                setIsOpen((prev) => ({ ...prev, demand_calender: set }));
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  id="date"
                  className="w-full justify-between font-normal"
                >
                  {inputs.demand_calender
                    ? formatDate(inputs.demand_calender)
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
                  selected={inputs.demand_calender}
                  captionLayout="dropdown"
                  onSelect={(date) => {
                    setInputs((prev) => ({
                      ...prev,
                      demand_calender: date,
                    }));
                    setIsOpen((prev) => ({
                      ...prev,
                      demand_calender: false,
                    }));
                  }}
                />
              </PopoverContent>
            </Popover>
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
                loading={isLoading.demand}
                disabled={isLoading.demand}
                loadingText="Demanding..."
                className="text-white hover:bg-primary/85 cursor-pointer"
                onClick={handleDemand}
              >
                Issue
              </SpinnerButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isOpen.nac}
        onOpenChange={(set) => setIsOpen((prev) => ({ ...prev, nac: set }))}
      >
        <DialogContent
          onPointerDownOutside={(e) => {
            e.preventDefault();
          }}
          onCloseAutoFocus={() => {
            setInputs((prev) => ({
              ...prev,
              nac_date: "",
              rate: "",
              nac_no: "",
            }));
          }}
        >
          <DialogTitle className="capitalize">
            NAC {selectedRow.source == "spares" ? "spare" : "tool"}
          </DialogTitle>
          <DialogDescription className="hidden" />
          <div>
            <Label htmlFor="nac_no" className="mb-2 ms-2">
              NAC Number<span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="nac_no"
              value={inputs.nac}
              placeholder="NAC Number"
              onChange={(e) =>
                setInputs((prev) => ({ ...prev, nac_no: e.target.value }))
              }
            />
            <Label htmlFor="nac_no" className="mt-4 mb-2 ms-2">
              NAC Date<span className="text-red-500">*</span>
            </Label>
            <Popover
              open={isOpen.nac_calendar}
              onOpenChange={(e) =>
                setIsOpen((prev) => ({ ...prev, nac_calendar: e }))
              }
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  id="date"
                  className="w-full justify-between font-normal"
                >
                  {inputs.nac_date
                    ? formatDate(inputs.nac_date)
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
                  selected={inputs.nac_date}
                  captionLayout="dropdown"
                  onSelect={(date) => {
                    setInputs((prev) => ({
                      ...prev,
                      nac_date: date,
                    }));
                    setIsOpen((prev) => ({ ...prev, nac_calendar: false }));
                  }}
                />
              </PopoverContent>
            </Popover>
            <Label htmlFor="rate" className="mt-4 mb-2 ms-2">
              Rate per Unit<span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              id="rate"
              value={inputs.rate}
              placeholder="Rate per Unit"
              onChange={(e) =>
                setInputs((prev) => ({ ...prev, rate: e.target.value }))
              }
            />
            <div className="flex items-center mt-4 gap-4 justify-end">
              <Button
                variant="destructive"
                onClick={() => {
                  setIsOpen((prev) => ({ ...prev, nac: false }));
                }}
              >
                Cancel
              </Button>
              <SpinnerButton
                loading={isLoading.nac}
                disabled={isLoading.nac}
                loadingText="Processing..."
                onClick={handleNAC}
              >
                Processed
              </SpinnerButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isOpen.procurement}
        onOpenChange={(set) =>
          setIsOpen((prev) => ({ ...prev, procurement: set }))
        }
      >
        <DialogContent
          onPointerDownOutside={(e) => {
            e.preventDefault();
          }}
        >
          <DialogTitle className="capitalize">
            Procure {selectedRow.source == "spares" ? "spare" : "tool"}
          </DialogTitle>
          <DialogDescription className="">
            Do you want to procure {selectedRow.description}?
          </DialogDescription>
          <div className="flex items-center mt-4 gap-4 justify-end">
            <Button
              variant="destructive"
              onClick={() => {
                setIsOpen((prev) => ({ ...prev, procurement: false }));
              }}
            >
              Cancel
            </Button>
            <SpinnerButton
              disabled={isLoading.procurement}
              loading={isLoading.procurement}
              loadingText="Procuring..."
              onClick={handleProcure}
            >
              Procure
            </SpinnerButton>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isOpen.pending_issue}
        onOpenChange={(set) =>
          setIsOpen((prev) => ({ ...prev, pending_issue: set }))
        }
      >
        <DialogContent
          onPointerDownOutside={(e) => {
            e.preventDefault();
          }}
        >
          <DialogTitle className="capitalize">
            Issue {selectedRow.source == "spares" ? "spare" : "tool"}
          </DialogTitle>
          <DialogDescription className="">
            Do you want to issue {selectedRow.description}?
          </DialogDescription>
          <div className="flex items-center mt-4 gap-4 justify-end">
            <Button
              variant="destructive"
              onClick={() => {
                setIsOpen((prev) => ({ ...prev, pending_issue: false }));
              }}
            >
              Cancel
            </Button>
            <SpinnerButton
              disabled={isLoading.procurement}
              loading={isLoading.procurement}
              loadingText="Issueing..."
              onClick={handlePendingIssue}
            >
              Issue
            </SpinnerButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pending;
