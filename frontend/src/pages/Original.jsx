import { useContext, useEffect, useMemo, useState } from "react";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { IoMdRefresh } from "react-icons/io";

import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

import { Context } from "../utils/Context";
import apiService from "../utils/apiService";
import PaginationTable from "../components/PaginationTableTwo";
import SpinnerButton from "../components/ui/spinner-button";
import toaster from "../utils/toaster";
import { MultiSelect } from "../components/ui/multi-select";

const Original = () => {
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
    {
      key: "equipment_system",
      header: (
        <span>
          Equipment/
          <br /> System
        </span>
      ),
    },
    { key: "quantity", header: "Increase Qty" },
    { key: "modified_obs", header: "OBS Authorised" },
    { key: "obs_maintained", header: "OBS Maintained" },
    { key: "obs_held", header: "OBS Held" },
    { key: "maintained_qty", header: "Maintained Qty" },
    { key: "qty_held", header: "Qty Held" },
  ]);

  const options = [
    { value: "description", label: "Item Description" },
    { value: "indian_pattern", label: "IN Part No." },
    { value: "category", label: "Category" },
    { value: "obs_increase_qty", label: "Increase Qty" },
    { value: "obs_authorised", label: "OBS Authorised" },
    { value: "obs_maintained", label: "OBS Maintained" },
    { value: "obs_held", label: "OBS Held" },
    { value: "maintained_qty", label: "Maintained Qty" },
    { value: "qty_held", label: "Qty Held" },
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
    requisition: false,
    mo: false,
    inventory: false,
    issue: false,
  });
  const [isOpen, setIsOpen] = useState({
    demand: false,
    issue: false,
    demand_calender: false,
    requisition_calender: false,
    gate_pass_calender: false,
    inventory: false,
  });
  const [selectedRow, setSelectedRow] = useState({});

  const [inputs, setInputs] = useState({
    search: "",
    internal_demand_no: "",
    internal_demand_date: null,
    requisition_no: "",
    requisition_date: null,

    mo_demand_no: "",
    mo_demand_date: null,
  });

  const [boxNo, setBoxNo] = useState([{ qn: "", no: "" }]);

  const fetchdata = async (page = currentPage) => {
    try {
      const response = await apiService.get("/specialDemand/d787", {
        params: {
          page,
          limit: config.row_per_page,
          search: inputs.search || "",
          cols: selectedValues.join(","),
        },
      });
      if (response.success) {
        setFetchedData(response.data);
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      console.log(error);
      toaster("error", error.message);
    } finally {
      setIsLoading((prev) => ({ ...prev, table: false }));
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchdata(1);
  };

  const handleRefresh = () => {
    setInputs((prev) => ({
      ...prev,
      search: "",
    }));

    setSelectedValues([]);
    setCurrentPage(1);

    fetchdata(1);
  };

  // Pagination change
  useEffect(() => {
    fetchdata(currentPage);
  }, [currentPage]);

  // Column change auto search
  useEffect(() => {
    setCurrentPage(1);
    fetchdata(1);
  }, [selectedValues]);

  useEffect(() => {
    const t = fetchedData.items.map((row) => ({
      ...row,

      quantity: row.obs_increase_qty || "--",
      modified_obs: row.obs_authorised || "--",

      obs_maintained: row.obs_maintained || "--",
      obs_held: row.obs_held || "--",

      maintained_qty: row.maintained_qty || "--",
      qty_held: row.qty_held || "--",
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
            placeholder="Search Special Demands"
            className="bg-white"
            value={inputs.search}
            onChange={(e) =>
              setInputs((prev) => ({ ...prev, search: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
          <SpinnerButton
            className="cursor-pointer hover:bg-primary/85"
            onClick={handleSearch}
            loading={isLoading.table}
            disabled={isLoading.table}
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

export default Original;
