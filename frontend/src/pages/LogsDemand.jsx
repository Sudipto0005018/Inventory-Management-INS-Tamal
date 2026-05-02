import { useContext, useEffect, useMemo, useState } from "react";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { IoMdRefresh } from "react-icons/io";

import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { MultiSelect } from "../components/ui/multi-select";

import { Context } from "../utils/Context";
import apiService from "../utils/apiService";
import PaginationTable from "../components/PaginationTableTwo";
import SpinnerButton from "../components/ui/spinner-button";
import { getFormatedDate, getTimeDate } from "../utils/helperFunctions";
import Spinner from "../components/Spinner";

const PendingDemand = () => {
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
    // {
    //   key: "item_type",
    //   header: "Type",
    //   width: "min-w-[40px]",
    // },
    { key: "category", header: "Category", width: "min-w-[40px]" },
    { key: "denos", header: "Denos.", width: "min-w-[40px]" },
    { key: "issue_to", header: "Issued To" },
    { key: "service_no", header: "Service No." },
    { key: "name", header: "Name" },
    { key: "demand_no", header: "Demand No." },
    { key: "demand_date", header: "Demand Date" },
    { key: "demand_quantity", header: "Qty Demanded", width: "min-w-[40px]" },
    { key: "remarks", header: "Remarks", width: "min-w-[40px]" },
  ]);

  const options = [
    { value: "description", label: "Item Description", width: "min-w-[40px]" },
    {
      value: "indian_pattern",
      label: (
        <span>
          <i>IN</i> Part No.
        </span>
      ),
      width: "min-w-[40px]",
    },
    { value: "category", label: "Category", width: "min-w-[40px]" },
    { value: "denos", label: "Denos.", width: "min-w-[40px]" },
    { value: "issue_to", label: "Issued To", width: "min-w-[40px]" },
    { value: "service_no", label: "Service No.", width: "min-w-[40px]" },
    { value: "name", label: "Name", width: "min-w-[40px]" },
    { value: "demand_no", label: "Demand No.", width: "min-w-[40px]" },
    { value: "demand_date", label: "Demand Date", width: "min-w-[40px]" },
    { value: "remarks", label: "Remarks", width: "min-w-[40px]" },
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
    submit: false,
  });
  const [actualSearch, setActualSearch] = useState("");
  const [inputs, setInputs] = useState({
    search: "",
    demand_no: "",
    demand_date: new Date(),
  });
  const [isOpen, setIsOpen] = useState({
    demand: false,
    demand_date: false,
  });
  const [selectedRow, setSelectedRow] = useState({});

  // Placeholder fetch function as requested
  const fetchdata = async (page = currentPage, search = inputs.search) => {
    try {
      setIsLoading((prev) => ({ ...prev, table: true }));
      const response = await apiService.get("/demand/logs", {
        params: {
          page,
          search,
          cols: selectedValues.join(","),
          // limit: config.row_per_page,
          limit: 40,
        },
      });
      console.log("API DATA:", response.data.items);

      setFetchedData(response.data);
    } catch (error) {
      console.log(error);
      setFetchedData({
        items: [],
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
      });
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
    setInputs((prev) => ({ ...prev, search: "" }));
    setSelectedValues([]);
    setCurrentPage(1);
    setActualSearch("");
    fetchdata(1, "");
  };

  useEffect(() => {
    fetchdata();
  }, [currentPage]);

  useEffect(() => {
    const t = fetchedData.items.map((row) => ({
      ...row,
      demand_date: getFormatedDate(row.demand_date),
      item_type: row.spare_id ? "Spare" : row.tool_id ? "Tool" : "-",
      survey_date: getFormatedDate(row.survey_date),
      created_at: getTimeDate(row.created_at),
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
          placeholder="Search Demand..."
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
      <div className="min-w-0 overflow-x-auto">
        <PaginationTable
          data={tableData}
          columns={columns}
          currentPage={fetchedData.currentPage || 1}
          pageSize={fetchedData.items?.length || 10}
          totalPages={fetchedData.totalPages || 1}
          onPageChange={setCurrentPage}
          className="h-[calc(95vh-210px)] w-[calc(100vw-35px)]"
        />
      </div>
    </div>
  );
};

export default PendingDemand;
