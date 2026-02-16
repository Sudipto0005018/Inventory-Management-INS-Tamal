import { useContext, useEffect, useMemo, useState } from "react";
import { FaChevronRight, FaMagnifyingGlass } from "react-icons/fa6";
import { IoMdRefresh } from "react-icons/io";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Context } from "../utils/Context";
import apiService from "../utils/apiService";
import PaginationTable from "../components/PaginationTableTwo";
import SpinnerButton from "../components/ui/spinner-button";
import toaster from "../utils/toaster";
import { getFormatedDate, getTimeDate } from "../utils/helperFunctions";
import { MultiSelect } from "../components/ui/multi-select";

const Procurement = () => {
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
      width: "min-w-[40px]",
    },
    {
      key: "item_type",
      header: "Type",
      width: "min-w-[40px]",
    },
    { key: "category", header: "Category" },
    { key: "demand_no", header: "Demand No." },
    { key: "demand_date", header: "Demand Date" },
    { key: "demand_quantity", header: "Ordered Qty" },
    { key: "nac_qty", header: "NAC Qty" },
    { key: "nac_no", header: "NAC No." },
    { key: "nac_date", header: "NAC Date" },
    { key: "validity", header: "Validity" },
    { key: "rate_unit", header: "Rate/ Unit" },
    { key: "qty_received", header: "Received Qty" },
    { key: "created_at", header: "Created On" },
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
    receive: false,
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
    receive_date: new Date(),
  });
  const [boxNo, setBoxNo] = useState([{ qn: "", no: "" }]);

  const fetchdata = async () => {
    try {
      setIsLoading((prev) => ({ ...prev, table: true }));

      const response = await apiService.get("/stocks/logsProcure", {
        params: {
          page: currentPage,
          limit: config.row_per_page,
          search: inputs.search || "",
          cols: selectedValues.join(","),
          status: "complete",
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

  const getDepositQty = () => {
    if (!Array.isArray(boxNo)) return 0;

    return boxNo.reduce((sum, row) => {
      const depositQty = Number(row?.deposit || 0);
      return sum + depositQty;
    }, 0);
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
      created_at: getTimeDate(row.created_at),
      item_type: row.spare_id ? "Spare" : row.tool_id ? "Tool" : "-",
      demand_date: row.demand_date ? getFormatedDate(row.demand_date) : "-",
      nac_date: row.nac_date ? getFormatedDate(row.nac_date) : "-",
      qty_received:
        row.qty_received && row.qty_received > 0 ? row.qty_received : null,
      processed: (
        <Button
          size="icon"
          className="bg-white text-black shadow-md border hover:bg-gray-100"
          onClick={() => {
            setSelectedRow(row);
            console.log(row);

            const parsedBoxNo = row.box_no ? JSON.parse(row.box_no) : [];

            setBoxNo(normalizeBoxNoForDeposit(parsedBoxNo));

            setIsOpen((prev) => ({ ...prev, receive: true }));
          }}
        >
          <FaChevronRight />
        </Button>
      ),
    }));
    setTableData(t);
  }, [fetchedData]);

  const normalizeBoxNoForDeposit = (boxNo = []) => {
    return boxNo.map((item) => ({
      no: item.no || item.box_no || "",
      qn: Number(item.authorised_qty ?? item.qn ?? item.qty ?? 0),
      qtyHeld: Number(item.qty_held ?? item.qtyHeld ?? 0),
      deposit: Number(
        item.deposit ??
          item.deposit_qty ??
          Math.max(
            Number(item.authorised_qty ?? item.qty ?? 0) -
              Number(item.qty_held ?? 0),
            0,
          ),
      ),
    }));
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
    </>
  );
};

export default Procurement;
