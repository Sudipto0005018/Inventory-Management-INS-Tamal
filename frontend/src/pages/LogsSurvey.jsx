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
import toaster from "../utils/toaster";
import { getFormatedDate, getTimeDate } from "../utils/helperFunctions";
import Spinner from "../components/Spinner";

const PendingSurvey = () => {
  const { config } = useContext(Context);
  const columns = useMemo(() => [
    { key: "equipment_system", header: "Equipment/ System" },
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
    { key: "category", header: "Category", width: "min-w-[40px]" },
    { key: "denos", header: "Denos.", width: "min-w-[40px]" },
    {
      key: "survey_quantity",
      header: "Qty Surveyed",
      width: "max-w-[50px]",
    },
    {
      key: "reason_for_survey",
      header: (
        <span>
          Reason for
          <br />
          Survey
        </span>
      ),
      width: "min-w-[30px]",
    },
    {
      key: "survey_voucher_no",
      header: (
        <span>
          Survey Voucher <br />
          No.
        </span>
      ),
      width: "min-w-[40px]",
    },
    { key: "survey_date", header: "Survey Date", width: "min-w-[40px]" },
    { key: "remarks", header: "Remarks", width: "min-w-[40px]" },
    // {
    //   key: "withdrawl_qty",
    //   header: (
    //     <span>
    //       Withdrawal
    //       <br />
    //       Qty
    //     </span>
    //   ),
    //   width: "min-w-[40px]",
    // },
    // {
    //   key: "withdrawl_date_str",
    //   header: (
    //     <span>
    //       Withdrawal
    //       <br />
    //       Date
    //     </span>
    //   ),
    //   width: "min-w-[40px]",
    // },
    // { key: "service_no", header: "Service No.", width: "min-w-[40px]" },
    // { key: "issue_to", header: "Issued To", width: "min-w-[40px]" },
    // { key: "created_at", header: "Created On", width: "min-w-[40px]" },
  ]);
  const options = [
    { value: "equipment_system", label: "Equipment / System" },
    { value: "description", label: "Item Description" },
    {
      value: "indian_pattern",
      label: (
        <span>
          <i>IN</i> Part No.
        </span>
      ),
    },
    { value: "item_type", label: "Type" },
    { value: "category", label: "Category" },
    { value: "denos", label: "Denos." },
    { value: "survey_quantity", label: "Qty Surveyed" },
    { value: "reason_for_survey", label: "Reason for Survey" },
    { value: "survey_voucher_no", label: "Survey Voucher No." },
    { value: "remarks", label: "Remarks" },
    // { value: "survey_date", label: "Survey Date" },
    // { value: "withdrawl_qty", label: "Withdrawal Qty" },
    // { value: "withdrawl_date", label: "Withdrawal Date" },
    // { value: "service_no", label: "Service No." },
    // { value: "issue_to", label: "Issued To" },
    // { value: "created_at", label: "Created On" },
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
    survey: false,
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

  const fetchdata = async (page = currentPage, search = inputs.search) => {
    try {
      setIsLoading((prev) => ({ ...prev, table: true }));
      const response = await apiService.get("/survey/logs", {
        params: {
          page,
          search,
          cols: selectedValues.join(","),
          limit: config.row_per_page,
          status: "pending",
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
    await fetchdata(1, searchTerm);
    setCurrentPage(1);
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
      survey_date: getFormatedDate(row.survey_date),
      survey_quantity: row.survey_quantity || "0",
      issue_date: getFormatedDate(row.issue_date),
      withdrawl_date_str: getFormatedDate(row.withdrawl_date),
      created_at: getTimeDate(row.created_at),
      item_type: row.spare_id ? "Spare" : row.tool_id ? "Tool" : "-",
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
          placeholder="Search survey items"
          className="bg-white "
          value={inputs.search}
          onChange={(e) =>
            setInputs((prev) => ({ ...prev, search: e.target.value }))
          }
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
          className="h-[calc(100vh-230px)] w-[calc(100vw-35px)]"
        />
      </div>
    </div>
  );
};

export default PendingSurvey;
