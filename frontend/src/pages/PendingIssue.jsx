import { useContext, useEffect, useMemo, useState } from "react";
import { FaChevronRight, FaMagnifyingGlass } from "react-icons/fa6";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { IoMdRefresh } from "react-icons/io";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";

import SpinnerButton from "../components/ui/spinner-button";
import PaginationTable from "../components/PaginationTableTwo";
import { MultiSelect } from "../components/ui/multi-select";
import { FormattedDatePicker } from "@/components/FormattedDatePicker";

import { Context } from "../utils/Context";
import apiService from "../utils/apiService";
import toaster from "../utils/toaster";
import { formatSimpleDate, getFormatedDate } from "../utils/helperFunctions";

import GenerateQRDialog from "../components/GenerateQRDialog";

const PermanentPendings = () => {
  const { config } = useContext(Context);

  const options = [
    {
      value: "description",
      label: "Item Description",
      width: "min-w-[40px]",
    },
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
    { value: "survey_date", label: "Survey Date", width: "min-w-[40px]" },
    {
      value: "survey_quantity",
      label: "Surveyed / Consumable / Local Perchase Qty",
      width: "min-w-[40px]",
    },
    {
      value: "survey_voucher_no",
      label: "Survey Voucher No",
      width: "min-w-[40px]",
    },
  ];
  const [selectedValues, setSelectedValues] = useState([]);

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

  /* ----------------------- table columns ----------------------- */
  const columns = useMemo(
    () => [
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
      { key: "demand_no", header: "Demand No." },
      { key: "demand_date", header: "Demand Date" },
      { key: "demand_quantity", header: "Demanded Qty" },
      { key: "processed", header: "Proceed" },
    ],
    [],
  );

  /* ----------------------- states ----------------------- */
  const [currentPage, setCurrentPage] = useState(1);
  const [tableData, setTableData] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);

  const [isQrOpen, setIsQrOpen] = useState(false);

  const [fetchedData, setFetchedData] = useState({
    items: [],
    totalPages: 1,
    currentPage: 1,
  });

  const [isOpen, setIsOpen] = useState({
    issue: false,
    inventory: false,
    demand_calender: false,
  });

  const [isLoading, setIsLoading] = useState({
    nac: false,
    mo: false,
    inventory: false,
  });

  const [procurementPending, setProcurementPending] = useState("no");

  const [inputs, setInputs] = useState({
    issue_type: "nac",

    nac_no: "",
    nac_calender: new Date(),
    validity: "",
    rate_unit: "",

    mo_no: "",
    gate_pass_calender: new Date(),
  });

  const [boxNo, setBoxNo] = useState([]);

  /* ----------------------- fetch data ----------------------- */
  const fetchData = async () => {
    try {
      const res = await apiService.get("/demand/pending-issue", {
        params: {
          page: currentPage,
          limit: config.row_per_page,
        },
      });

      if (res.success) {
        setFetchedData(res.data);
      } else {
        toaster("error", res.message);
      }
    } catch (err) {
      toaster("error", err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  /* ----------------------- map table data ----------------------- */
  useEffect(() => {
    const mapped = fetchedData.items.map((row) => ({
      ...row,
      demand_date: getFormatedDate(row.demand_date),
      demand_quantity: row.demand_quantity || "0",
      processed: (
        <Button
          size="icon"
          className="bg-white text-black shadow border"
          onClick={() => {
            setSelectedRow(row);
            setProcurementPending("no");
            setIsOpen((p) => ({ ...p, issue: true }));
          }}
        >
          <FaChevronRight />
        </Button>
      ),
    }));

    setTableData(mapped);
  }, [fetchedData]);

  /* ----------------------- handlers ----------------------- */

  const updatePendingIssue = async (payload) => {
    try {
      const res = await apiService.put(
        `/demand/pending-issue/${selectedRow.id}`,
        payload,
      );

      if (!res.success) {
        toaster("error", res.message);
        return false;
      }

      return true;
    } catch (err) {
      toaster("error", err.message);
      return false;
    }
  };

  const handleNAC = async () => {
    if (!inputs.nac_no || !inputs.validity || !inputs.rate_unit) {
      toaster("error", "All NAC fields are required");
      return;
    }

    setIsLoading((p) => ({ ...p, nac: true }));

    const payload = {
      issue_type: "nac",
      nac_no: inputs.nac_no,
      nac_date: formatSimpleDate(inputs.nac_calender),
      validity: inputs.validity,
      rate_unit: inputs.rate_unit,
      procurement_pending: procurementPending === "yes" ? 1 : 0,
      status: "NAC_GENERATED",
    };

    const updated = await updatePendingIssue(payload);

    if (updated) {
      toaster("success", "NAC details saved successfully");
      setIsOpen((p) => ({ ...p, issue: false }));
      fetchData();
    }

    setIsLoading((p) => ({ ...p, nac: false }));
  };

  const handleStocking = async () => {
    if (!inputs.mo_no) {
      toaster("error", "MO Gate Pass No required");
      return;
    }

    setIsLoading((p) => ({ ...p, mo: true }));

    const payload = {
      issue_type: "stocking",
      mo_no: inputs.mo_no,
      mo_date: formatSimpleDate(inputs.gate_pass_calender),
      status: "STOCKED",
    };

    const updated = await updatePendingIssue(payload);

    if (updated) {
      toaster("success", "Item stocked successfully");
      setIsOpen((p) => ({ ...p, issue: false }));
      fetchData();
    }

    setIsLoading((p) => ({ ...p, mo: false }));
  };

  /* ----------------------- render ----------------------- */
  return (
    <>
      <div className="w-full px-2 pt-2 h-full rounded-md bg-white">
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
            placeholder="Search..."
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
          currentPage={fetchedData.currentPage}
          totalPages={fetchedData.totalPages}
          onPageChange={setCurrentPage}
          className="h-[calc(100vh-230px)]"
        />
      </div>

      {/* ================= ISSUE DIALOG ================= */}
      <Dialog
        open={isOpen.issue}
        onOpenChange={(set) => setIsOpen((p) => ({ ...p, issue: set }))}
      >
        <DialogContent className="max-w-xl">
          <DialogTitle>Item Issue Details</DialogTitle>
          <DialogDescription className="hidden" />

          <RadioGroup
            value={inputs.issue_type}
            onValueChange={(v) => setInputs((p) => ({ ...p, issue_type: v }))}
            className="flex gap-8"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="nac" />
              <Label>NAC</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="stocking" />
              <Label>Stocking in Inventory</Label>
            </div>
          </RadioGroup>

          {/* ---------- NAC ---------- */}
          {inputs.issue_type === "nac" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>NAC No.</Label>
                  <Input
                    className="mt-3"
                    placeholder="NAC No."
                    value={inputs.nac_no}
                    onChange={(e) =>
                      setInputs((p) => ({ ...p, nac_no: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <FormattedDatePicker
                    label="NAC Date"
                    value={inputs.nac_calender}
                    onChange={(d) =>
                      setInputs((p) => ({ ...p, nac_calender: d }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Validity (days)</Label>
                  <Input
                    className="mt-3"
                    type="number"
                    placeholder="Validity (days)"
                    value={inputs.validity}
                    onChange={(e) =>
                      setInputs((p) => ({ ...p, validity: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label>Rate / Unit</Label>
                  <Input
                    className="mt-3"
                    type="number"
                    placeholder="Rate / Unit"
                    value={inputs.rate_unit}
                    onChange={(e) =>
                      setInputs((p) => ({ ...p, rate_unit: e.target.value }))
                    }
                  />
                </div>
              </div>
            </>
          )}

          {/* ---------- STOCKING ---------- */}
          {inputs.issue_type === "stocking" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>MO Gate Pass No.</Label>
                  <Input
                    className="mt-3"
                    placeholder="MO Gate Pass No."
                    value={inputs.mo_no}
                    onChange={(e) =>
                      setInputs((p) => ({ ...p, mo_no: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <FormattedDatePicker
                    label="MO Date"
                    value={inputs.gate_pass_calender}
                    onChange={(d) =>
                      setInputs((p) => ({ ...p, gate_pass_calender: d }))
                    }
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen((p) => ({ ...p, issue: false }))}
            >
              Cancel
            </Button>

            <SpinnerButton
              loading={
                inputs.issue_type === "nac" ? isLoading.nac : isLoading.mo
              }
              onClick={inputs.issue_type === "nac" ? handleNAC : handleStocking}
            >
              Submit
            </SpinnerButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= QR DIALOG ================= */}
      <GenerateQRDialog
        open={isQrOpen}
        setOpen={setIsQrOpen}
        row={selectedRow}
      />
    </>
  );
};

export default PermanentPendings;
