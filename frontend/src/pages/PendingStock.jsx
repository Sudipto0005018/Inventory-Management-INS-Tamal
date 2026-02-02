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
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";

import { Context } from "../utils/Context";
import apiService from "../utils/apiService";
import PaginationTable from "../components/PaginationTableTwo";
import SpinnerButton from "../components/ui/spinner-button";
import toaster from "../utils/toaster";
import { ChevronDownIcon } from "lucide-react";
import {
  formatDate,
  formatSimpleDate,
  getDate,
} from "../utils/helperFunctions";
import BoxNoInputs from "../components/BoxNoInputsTwo";
import { MultiSelect } from "../components/ui/multi-select";

const PermanentPendings = () => {
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
    { key: "category", header: "Category" },
    { key: "demand_no", header: "Demand No." },
    { key: "demand_date", header: "Demand Date." },
    { key: "demand_quantity", header: "Demanded Qty" },
    { key: "mo_no", header: "MO Gate Pass No." },
    { key: "mo_date", header: "MO Date" },
    { key: "processed", header: "Proceed" },
  ]);

  const options = [
    { value: "description", label: "Item Description" },
    { value: "vue", label: "IN Part No." },
    { value: "category", label: "Category" },
    { value: "quantity", label: "Issued Quantity" },
    { value: "survey_quantity", label: "Surveyed Quantity" },
    { value: "status", label: "Status" },
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
    demand: false,
    nac: false,
    mo: false,
    inventory: false,
    issue: false,
  });
  const [isOpen, setIsOpen] = useState({
    demand: false,
    issue: false,
    demand_calender: false,
    nac_calender: false,
    gate_pass_calender: false,
    inventory: false,
  });
  const [selectedRow, setSelectedRow] = useState({});
  const [inputs, setInputs] = useState({
    demand_no: "",
    demand_calender: new Date(),
    issue_type: "nac",
    nac_no: "",
    nac_calender: new Date(),
    validity: "",
    rate: "",
    mo_no: "",
    gate_pass_calender: new Date(),
    search: "",
  });
  const [boxNo, setBoxNo] = useState([{ qn: "", no: "" }]);

  const fetchdata = async () => {
    try {
      setIsLoading((prev) => ({ ...prev, table: true }));

      const response = await apiService.get("/demand/pending-issue", {
        params: {
          page: currentPage,
          limit: config.row_per_page,
          search: inputs.search || "",
          cols: selectedValues.join(","), // 🔥 important
          status: "STOCKED",
        },
      });
      console.log(response);

      if (response.success) {
        setFetchedData(response.data);
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      console.error(error);
      toaster("error", error.message || "Failed to fetch pending issues");
    } finally {
      setIsLoading((prev) => ({ ...prev, table: false }));
    }
  };

  const handleSearch = () => {
    setCurrentPage(1); // reset pagination
    fetchdata();
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
  const handleDemand = async () => {
    if (!inputs.demand_no || !inputs.demand_calender) {
      toaster("error", "All fields are required");
      return;
    }
    setIsLoading((prev) => ({ ...prev, demand: true }));
    try {
      const response = await apiService.post("/pending/demand", {
        id: selectedRow.id,
        demand_no: inputs.demand_no,
        demand_date: formatSimpleDate(inputs.demand_calender),
      });
      if (response.success) {
        toaster("success", "Item demand successfully");
        setIsOpen((prev) => ({ ...prev, demand: false }));
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
    if (
      !inputs.nac_no ||
      !inputs.nac_calender ||
      !inputs.validity ||
      !inputs.rate
    ) {
      toaster("error", "All fields are required");
      return;
    }
    setIsLoading((prev) => ({ ...prev, nac: true }));
    try {
      const response = await apiService.post("/pending/nac", {
        id: selectedRow.id,
        nac_no: inputs.nac_no,
        nac_date: formatSimpleDate(inputs.nac_calender),
        validity: inputs.validity,
        rate: inputs.rate,
      });
      if (response.success) {
        toaster("success", "Item NAC successfully");
        setIsOpen((prev) => ({ ...prev, issue: false }));
        fetchdata();
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message || error.message || "Failed to Issue";
      toaster("error", errMsg);
    } finally {
      setIsLoading((prev) => ({ ...prev, nac: false }));
    }
  };
  const handleStocking = async () => {
    if (!inputs.mo_no || !inputs.gate_pass_calender) {
      toaster("error", "All fields are required");
      return;
    }
    setIsLoading((prev) => ({ ...prev, mo: true }));
    try {
      const response = await apiService.post("/demand/pending-issue", {
        id: selectedRow.id,
        mo_no: inputs.mo_no,
        gate_pass_date: formatSimpleDate(inputs.gate_pass_calender),
      });
      if (response.success) {
        toaster("success", "Item issued successfully");
        setIsOpen((prev) => ({ ...prev, issue: false }));
        fetchdata();
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message || error.message || "Failed to issue";
      toaster("error", errMsg);
    } finally {
      setIsLoading((prev) => ({ ...prev, mo: false }));
    }
  };
  const handleInventory = async () => {
    let total = 0;
    for (let i = 0; i < boxNo.length; i++) {
      total += parseInt(boxNo[i].wd || "0");
      if (!boxNo[i].no) {
        toaster("error", "Box number is required");
        return;
      }
      console.log(boxNo, selectedRow.quantity);
    }
    if (total !== parseInt(selectedRow.quantity)) {
      toaster("error", "Stock quantity is not matched with survey quantity");
      return;
    }
    setIsLoading((prev) => ({ ...prev, inventory: true }));
    try {
      const response = await apiService.post("/pending/inventory", {
        id: selectedRow.id,
        box_no: JSON.stringify(boxNo),
        source: selectedRow.source,
        uid: selectedRow.uid,
      });
      if (response.success) {
        toaster("success", "Item added in inventory successfully");
        setIsOpen((prev) => ({ ...prev, inventory: false }));
        fetchdata();
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to add in inventory";
      toaster("error", errMsg);
    } finally {
      setIsLoading((prev) => ({ ...prev, inventory: false }));
    }
  };

  useEffect(() => {
    fetchdata();
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    fetchdata();
  }, [selectedValues]);

  useEffect(() => {
    const t = fetchedData.items.map((row) => ({
      ...row,
      survey_quantity: row.survey_quantity || "0",
      // issue_date: getDate(row.issue_date),
      // survey_date: getDate(row.date),
      processed: (
        <Button
          size="icon"
          className="bg-white text-black shadow-md border hover:bg-gray-100"
          onClick={() => {
            setSelectedRow(row);
            setBoxNo(JSON.parse(row.box_no));
            if (
              row.category.toLowerCase() == "p" ||
              row.category.toLowerCase() == "r"
            ) {
              if (row.status == "surveyed") {
                setIsOpen((prev) => ({ ...prev, demand: true }));
              } else if (row.status == "demanded") {
                setIsOpen((prev) => ({ ...prev, issue: true }));
              } else if (row.status == "stocked" || row.status == "naced") {
                setIsOpen((prev) => ({ ...prev, inventory: true }));
              }
            }
          }}
        >
          <FaChevronRight />
        </Button>
      ),
    }));
    setTableData(t);
  }, [fetchedData]);

  return (
    <>
      <div className="w-table-2 pt-2 h-full rounded-md bg-white">
        <div className="px-3 mb-2">
          <MultiSelect
            className="bg-white hover:bg-blue-50"
            options={options}
            placeholder="Select columns"
            onValueChange={setSelectedValues}
            defaultValue={selectedValues}
            singleLine
            maxCount={7}
          />
        </div>
        <div className="flex items-center mb-4 gap-4 w-[98%] mx-auto">
          <Input
            type="text"
            placeholder="Search survey items"
            className="bg-white"
            value={inputs.search}
            onChange={(e) =>
              setInputs((prev) => ({ ...prev, search: e.target.value }))
            }
          />
          <SpinnerButton
            className="cursor-pointer hover:bg-primary/85"
            // onClick={handleSearch}
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
          currentPage={fetchedData.currentPage || 1}
          pageSize={fetchedData.items?.length || 10}
          totalPages={fetchedData.totalPages || 1}
          onPageChange={setCurrentPage}
          className="h-[calc(100vh-230px)]"
        />
      </div>
      <Dialog
        open={isOpen.demand}
        onOpenChange={(set) => setIsOpen((prev) => ({ ...prev, demand: set }))}
      >
        <DialogContent
          onPointerDownOutside={(e) => {
            // e.preventDefault();
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
        open={isOpen.issue}
        onOpenChange={(set) => setIsOpen((prev) => ({ ...prev, issue: set }))}
      >
        <DialogContent
          onCloseAutoFocus={() => {
            setInputs((prev) => ({
              ...prev,
              nac_no: "",
              nac_calender: new Date(),
              validity: "",
              rate: "",
              mo_no: "",
              gate_pass_calender: new Date(),
            }));
          }}
        >
          <DialogTitle className="capitalize">
            Issue {selectedRow.source == "spares" ? "spare" : "tool"}
          </DialogTitle>
          <DialogDescription className="hidden" />
          <div>
            <div className="flex items-center">
              <p className="text-sm ms-2">Select Issue type: </p>
              <RadioGroup
                value={inputs.issue_type}
                onValueChange={(value) =>
                  setInputs((prev) => ({ ...prev, issue_type: value }))
                }
                className="flex gap-8 ms-2"
              >
                <div className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="nac" id="nac" />
                  <Label className="pointer-text" htmlFor="nac">
                    NAC
                  </Label>
                </div>
                <div className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="stocking" id="stocking" />
                  <Label className="pointer-text" htmlFor="stocking">
                    Socking in Inventory
                  </Label>
                </div>
              </RadioGroup>
            </div>
            {inputs.issue_type == "nac" && (
              <>
                <Label htmlFor="nac_no" className="ms-2 mb-2 mt-4">
                  NAC Number<span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  id="nac_no"
                  value={inputs.nac_no}
                  placeholder="NAC Number"
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, nac_no: e.target.value }))
                  }
                />
                <Label htmlFor="nac_no" className="ms-2 mb-2 mt-4">
                  NAC Date<span className="text-red-500">*</span>
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
                      {inputs.nac_calender
                        ? formatDate(inputs.nac_calender)
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
                      selected={inputs.nac_calender}
                      captionLayout="dropdown"
                      onSelect={(date) => {
                        setInputs((prev) => ({
                          ...prev,
                          nac_calender: date,
                        }));
                        setIsOpen((prev) => ({
                          ...prev,
                          nac_calender: false,
                        }));
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <Label htmlFor="validity" className="ms-2 mb-2 mt-4">
                  Validity<span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  id="validity"
                  value={inputs.validity}
                  placeholder="Validity"
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, validity: e.target.value }))
                  }
                />
                <Label htmlFor="rate" className="ms-2 mb-2 mt-4">
                  Rate/Unit<span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  id="rate"
                  value={inputs.rate}
                  placeholder="Rate"
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, rate: e.target.value }))
                  }
                />
                <div className="flex items-center justify-end mt-6 gap-4">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setIsOpen((prev) => ({ ...prev, issue: false }))
                    }
                  >
                    Cancel
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
                </div>
              </>
            )}
            {inputs.issue_type == "stocking" && (
              <>
                <Label htmlFor="mo_no" className="ms-2 mb-2 mt-4">
                  MO Gate Pass Number<span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  id="mo_no"
                  value={inputs.mo_no}
                  placeholder="MO Gate Pass Number"
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, mo_no: e.target.value }))
                  }
                />
                <Label htmlFor="gate_pass_date" className="ms-2 mb-2 mt-4">
                  Date<span className="text-red-500">*</span>
                </Label>
                <Popover
                  open={isOpen.gate_pass_calender}
                  onOpenChange={(set) => {
                    setIsOpen((prev) => ({ ...prev, gate_pass_calender: set }));
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="date"
                      className="w-full justify-between font-normal"
                    >
                      {inputs.gate_pass_calender
                        ? formatDate(inputs.gate_pass_calender)
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
                      selected={inputs.gate_pass_calender}
                      captionLayout="dropdown"
                      onSelect={(date) => {
                        setInputs((prev) => ({
                          ...prev,
                          gate_pass_calender: date,
                        }));
                        setIsOpen((prev) => ({
                          ...prev,
                          gate_pass_calender: false,
                        }));
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex items-center justify-end mt-6 gap-4">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setIsOpen((prev) => ({ ...prev, issue: false }))
                    }
                  >
                    Cancel
                  </Button>
                  <SpinnerButton
                    loading={isLoading.nac}
                    disabled={isLoading.nac}
                    loadingText="Submitting..."
                    onClick={handleStocking}
                  >
                    Submit
                  </SpinnerButton>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isOpen.inventory}
        onOpenChange={(set) =>
          setIsOpen((prev) => ({ ...prev, inventory: set }))
        }
      >
        <DialogContent
          onCloseAutoFocus={() => {
            setInputs((prev) => ({
              ...prev,
            }));
          }}
        >
          <DialogTitle className="capitalize">Box wise segregation</DialogTitle>
          <DialogDescription className="hidden" />
          <div>
            <BoxNoInputs
              value={boxNo}
              onChange={setBoxNo}
              isAddRow={false}
              isBoxnumberDisable={true}
              isStocking={true}
            />
            <div className="flex items-center justify-end mt-6 gap-4">
              <Button
                variant="outline"
                onClick={() =>
                  setIsOpen((prev) => ({ ...prev, inventory: false }))
                }
              >
                Cancel
              </Button>
              <SpinnerButton
                loading={isLoading.mo}
                disabled={isLoading.mo}
                loadingText="Submitting..."
                onClick={handleInventory}
              >
                Submit
              </SpinnerButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PermanentPendings;
