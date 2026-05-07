import { useContext, useEffect, useMemo, useState } from "react";
import { FaChevronRight, FaMagnifyingGlass, FaPlus } from "react-icons/fa6";
import { FormattedDatePicker } from "@/components/FormattedDatePicker";
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

import { Context } from "../utils/Context";
import apiService from "../utils/apiService";
import PaginationTable from "../components/PaginationTableTwo";
import SpinnerButton from "../components/ui/spinner-button";
import toaster from "../utils/toaster";
import { getFormatedDate } from "../utils/helperFunctions";
import { MultiSelect } from "../components/ui/multi-select";
import AddStoredemDemand from "../components/AddStoredemDemand";

const PendingStoredem = () => {
  const { config, user } = useContext(Context);

  const columns = useMemo(() => [
    { key: "description", header: "Item Description" },
    {
      key: "indian_pattern",
      header: (
        <span>
          <i>IN</i> Part No.
        </span>
      ),
      width: "max-w-[180px]",
    },
    { key: "category", header: "Category", width: "max-w-[50px]" },
    { key: "denos", header: "Denos.", width: "max-w-[50px]" },
    {
      key: "quantity",
      header: <span>Qty Demanded</span>,
      width: "max-w-[35px]",
    },
    {
      key: "demand_type",
      header: <span>Demand Type</span>,
      width: "max-w-[100px]",
    },
    {
      key: "modemand",
      header: <span>DTG</span>,
      width: "max-w-[100px]",
    },
    { key: "status", header: "Status", width: "max-w-[100px]" },
    ...(user.role !== "user"
      ? [{ key: "processed", header: "Proceed", width: "min-w-[40px]" }]
      : []),
  ]);

  const options = [
    { value: "description", label: "Item Description" },
    { value: "indian_pattern", label: "IN Part No." },
    { value: "category", label: "Category" },
    { value: "denos", label: "Denos." },
    { value: "quantity", label: "Qty" },
    { value: "demand_type", label: "Demand Type" },
    { value: "mo_demand_no", label: "DTG" },
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
    update: false,
    inventory: false,
  });
  const [isOpen, setIsOpen] = useState({
    amend: false,
    inventory: false,
    addStoredem: false,
  });
  const [selectedRow, setSelectedRow] = useState({});

  const [inputs, setInputs] = useState({
    search: "",
    mo_demand_no: "",
    mo_demand_date: null,
  });

  const fetchData = async (page = currentPage) => {
    setIsLoading((prev) => ({ ...prev, table: true }));
    try {
      const response = await apiService.get("/storedem/storedem-demand", {
        params: {
          page,
          limit: 40,
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
    fetchData(1);
  };

  const handleRefresh = () => {
    setInputs((prev) => ({ ...prev, search: "" }));
    setSelectedValues([]);
    setCurrentPage(1);
    fetchData(1);
  };

  const handleUpdateDemand = async () => {
    if (!inputs.mo_demand_no) {
      toaster("error", "MO Demand No is required");
      return;
    }

    const payload = {
      id: selectedRow.id,
      mo_demand_no: inputs.mo_demand_no,
      mo_demand_date: inputs.mo_demand_date,
    };

    try {
      setIsLoading((prev) => ({ ...prev, update: true }));
      const response = await apiService.put(
        "/storedem/storedem-demand",
        payload,
      );
      if (response.success) {
        toaster("success", response.message);
        setIsOpen((prev) => ({ ...prev, amend: false }));
        fetchData();
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      toaster("error", error.response?.data?.message || "Update failed");
    } finally {
      setIsLoading((prev) => ({ ...prev, update: false }));
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    fetchData(1);
  }, [selectedValues]);

  const getStatus = (row) => {
    if (!row.mo_demand_no) return "Awaiting MO Demand No";
    return "MO Demand Added - Ready for Issue";
  };

  useEffect(() => {
    const t = fetchedData.items.map((row) => ({
      ...row,
      quantity: row.quantity || "--",
      created_at: getFormatedDate(row.created_at),
      modemand: row.mo_demand_no || "--",
      modate: row.mo_demand_date ? getFormatedDate(row.mo_demand_date) : "--",
      status: getStatus(row),
      processed: (
        <Button
          size="icon"
          className="bg-white text-black shadow-md border"
          onClick={() => {
            setSelectedRow(row);
            setInputs({
              mo_demand_no: row.mo_demand_no || "",
              mo_demand_date: row.mo_demand_date
                ? new Date(row.mo_demand_date)
                : null,
            });
            setIsOpen((prev) => ({ ...prev, amend: true }));
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
          <Input
            type="text"
            placeholder="Search STOREDEM / OPDEM.."
            className="bg-white"
            value={inputs.search}
            onChange={(e) =>
              setInputs((prev) => ({ ...prev, search: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
        </div>
        <div className="flex items-center mb-4 gap-4 w-[99%] mx-auto">
          <div className="w-full">
            <MultiSelect
              className="bg-white hover:bg-blue-50"
              options={options}
              placeholder="Select Fields"
              onValueChange={setSelectedValues}
              defaultValue={selectedValues}
              singleLine
              maxCount={7}
            />
          </div>

          <Button
            className="cursor-pointer hover:bg-primary/85 flex items-center gap-1 text-white"
            onClick={() =>
              setIsOpen((prev) => ({ ...prev, addStoredem: true }))
            }
          >
            <FaPlus className="size-3.5" />
            Add Storedem
          </Button>

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
            className="cursor-pointer flex items-center gap-1 bg-white hover:bg-gray-200 hover:scale-105 transition-all duration-200"
            onClick={handleRefresh}
            title="Reset Search"
          >
            <IoMdRefresh
              className="size-7 font-bold hover:rotate-180 transition-transform duration-300"
              style={{
                color: "#109240",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            />
          </Button>
        </div>

        <PaginationTable
          data={tableData}
          columns={columns}
          currentPage={fetchedData.currentPage || 1}
          pageSize={fetchedData.items?.length || 10}
          totalPages={fetchedData.totalPages || 1}
          onPageChange={setCurrentPage}
          className="w-[calc(100vw-35px)] h-[calc(95vh-210px)]"
        />
      </div>

      {/* Amend Demand Dialog - Add MO Demand No */}
      <Dialog
        open={isOpen.amend}
        onOpenChange={(set) => setIsOpen((prev) => ({ ...prev, amend: set }))}
      >
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
          <div className="sticky top-0 z-10 bg-background grid grid-cols-2 items-center pb-2 border-b">
            <DialogTitle className="text-lg font-semibold">
              Add MO Demand Details
            </DialogTitle>
            <button
              type="button"
              onClick={() => setIsOpen((prev) => ({ ...prev, amend: false }))}
              className="justify-self-end rounded-md p-1 transition"
            >
              ✕
            </button>
          </div>

          <div className="flex items-start gap-2 mb-3">
            <span className="font-semibold text-gray-700">
              Item Description:
            </span>
            <span className="text-gray-900 font-semibold ml-1">
              {selectedRow?.description || "-"}
            </span>
          </div>

          <div className="flex gap-4 w-full mt-4">
            <div className="w-full">
              <Label htmlFor="mo_demand_no" className="ms-2 mb-2">
                MO Demand No. <span className="text-red-500 mb-1">*</span>
              </Label>
              <Input
                type="text"
                id="mo_demand_no"
                value={inputs.mo_demand_no}
                placeholder="MO Demand No."
                onChange={(e) =>
                  setInputs((prev) => ({
                    ...prev,
                    mo_demand_no: e.target.value.toUpperCase(),
                  }))
                }
              />
            </div>

            <div className="w-full">
              <Label className="mb-2 block">
                MO Demand Date <span className="text-red-500 ml-1">*</span>
              </Label>
              <FormattedDatePicker
                value={inputs.mo_demand_date}
                onChange={(date) =>
                  setInputs((prev) => ({ ...prev, mo_demand_date: date }))
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-end mt-6 gap-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen((prev) => ({ ...prev, amend: false }))}
            >
              Cancel
            </Button>
            <SpinnerButton
              loading={isLoading.update}
              disabled={isLoading.update || !inputs.mo_demand_no}
              loadingText="Submitting..."
              onClick={handleUpdateDemand}
            >
              Submit
            </SpinnerButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add STOREDEM/OPDEM Demand Dialog */}
      <AddStoredemDemand
        open={isOpen.addStoredem}
        onOpenChange={(open) =>
          setIsOpen((prev) => ({ ...prev, addStoredem: open }))
        }
        onSuccess={() => {
          fetchData();
          setIsOpen((prev) => ({ ...prev, addStoredem: false }));
        }}
      />
    </>
  );
};

export default PendingStoredem;
