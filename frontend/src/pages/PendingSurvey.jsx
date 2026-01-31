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
import { ChevronDownIcon, Plus } from "lucide-react";
import { getFormatedDate } from "../utils/helperFunctions";
import Spinner from "../components/Spinner";
import Chip from "../components/Chip";
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
    {
      key: "withdrawl_date_str",
      header: "Withdrawal Date",
      width: "min-w-[40px]",
    },
    { key: "issue_to", header: "Issued To", width: "min-w-[40px]" },
    { key: "withdrawl_qty", header: "Withdrawal Qty", width: "min-w-[40px]" },
    {
      key: "survey_quantity",
      header: "Surveyed Qty",
      width: "max-w-[40px]",
    },
    { key: "status", header: "Status" },
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
    voucher_no: "",
    survey_calender: new Date(),
    quantity: "",
  });
  const [isOpen, setIsOpen] = useState({
    survey: false,
    survey_calender: false,
  });
  const [selectedRow, setSelectedRow] = useState({});

  const fetchdata = async () => {
    try {
      setIsLoading((prev) => ({ ...prev, table: true }));
      const response = await apiService.get("/survey/", {
        params: {
          page: currentPage,
          search: inputs.search,
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
      toaster.error(error.response.data.message);
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
  const handleServay = async () => {};

  useEffect(() => {
    fetchdata();
  }, [currentPage]);

  useEffect(() => {
    const t = fetchedData.items.map((row) => ({
      ...row,
      survey_quantity: row.survey_quantity || "0",
      issue_date: getFormatedDate(row.issue_date),
      withdrawl_date_str: getFormatedDate(row.withdrawl_date),
      status:
        row.status?.toLowerCase() == "pending" ? (
          <Chip text="Pending" varient="info" />
        ) : (
          <Chip text="Completed" varient="success" />
        ),
      processed: (
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
    }));
    setTableData(t);
  }, [fetchedData]);

  if (isLoading.table) {
    return <Spinner />;
  }

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
        <Button
          variant="outline"
          className="cursor-pointer flex items-center gap-1 bg-gray-100
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
            Survey {selectedRow.spare_id ? "spare" : "tool"}
          </DialogTitle>
          <DialogDescription className="hidden" />
          <div>
            <Label htmlFor="servay_quantity" className="mb-2 gap-1">
              Survey Quantity<span className="text-red-500">*</span>
            </Label>
            <Input
              id="servay_quantity"
              type="text"
              placeholder="Survey Quantity"
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
                    ? getFormatedDate(inputs.survey_calender)
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
    </div>
  );
};

export default Pending;
