import { useContext, useEffect, useMemo, useState } from "react";
import { FaChevronRight, FaMagnifyingGlass } from "react-icons/fa6";
import { FormattedDatePicker } from "@/components/FormattedDatePicker";

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
import {
  formatDate,
  formatSimpleDate,
  getDate,
  getFormatedDate,
  getISTTimestamp,
} from "../utils/helperFunctions";
import BoxNoInputs from "../components/BoxNoInputsTwo";
import { MultiSelect } from "../components/ui/multi-select";

const PendingSpecial = () => {
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
    { key: "quantity", header: "Qty" },
    { key: "modified_obs", header: "Modified OBS Authorised" },
    { key: "demandno", header: "Internal Demand No." },
    { key: "demanddate", header: "Internal Demand Date." },
    { key: "requisition", header: "Requisition No." },
    { key: "Reqdate", header: "Requisition Date." },
    { key: "modemand", header: "MO Demand No." },
    { key: "modate", header: "MO Demand Date" },
    { key: "status", header: "Status" },
    { key: "processed", header: "Proceed" },
  ]);

  const options = [
    { value: "description", label: "Item Description" },
    { value: "vue", label: "IN Part No." },
    { value: "category", label: "Category" },
    { value: "quantity", label: "Issued Quantity" },
    { value: "survey_quantity", label: "Surveyed Quantity" },
    { value: "modified_obs", label: "Modified OBS Authorised" },
    { value: "demandno", label: "Internal Demand No." },
    { value: "demanddate", label: "Internal Demand Date." },
    { value: "requisition", label: "Requisition No." },
    { value: "Reqdate", label: "Requisition Date." },
    { value: "modemand", label: "MO Demand No." },
    { value: "modate", label: "MO Demand Date" },
    { value: "status", label: "Status" },
  ];

  const [date, setDate] = useState(new Date());
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
    internal_demand_no: "",
    internal_demand_date: null,
    requisition_no: "",
    requisition_date: null,

    mo_demand_no: "",
    mo_demand_date: null,
  });

  const [boxNo, setBoxNo] = useState([{ qn: "", no: "" }]);

  const fetchdata = async () => {
    try {
      const response = await apiService.get(
        "http://localhost:7777/api/v1/specialDemand/special-demand",
        {
          params: {
            page: currentPage,
            limit: config.row_per_page,
          },
        },
      );
      if (response.success) {
        setFetchedData(response.data);
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      console.log(error);
      toaster("error", error.message);
    }
  };
  const handleSubmitSpecialDemand = async () => {
    const payload = {
      id: selectedRow.id,
    };

    if (inputs.internal_demand_no) {
      payload.internal_demand_no = inputs.internal_demand_no;
      payload.internal_demand_date = getFormatedDate(
        inputs.internal_demand_date,
      );
    }

    if (inputs.requisition_no) {
      payload.requisition_no = inputs.requisition_no;
      payload.requisition_date = getFormatedDate(inputs.requisition_date);
    }

    if (inputs.mo_demand_no) {
      payload.mo_demand_no = inputs.mo_demand_no;
      payload.mo_demand_date = getFormatedDate(inputs.mo_demand_date);
    }

    try {
      setIsLoading((p) => ({ ...p, issue: true }));

      const response = await apiService.put(
        "http://localhost:7777/api/v1/specialDemand/special-demand",
        payload,
      );

      if (response.success) {
        toaster("success", "Special demand updated successfully");
        setIsOpen((p) => ({ ...p, issue: false }));
        fetchdata();
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      toaster("error", error.response?.data?.message || "Update failed");
    } finally {
      setIsLoading((p) => ({ ...p, issue: false }));
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
      const response = await apiService.post(
        "http://localhost:7777/api/v1/specialDemand/special-demand",
        {
          id: selectedRow.id,
          box_no: JSON.stringify(boxNo),
          source: selectedRow.source,
          uid: selectedRow.uid,
        },
      );
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
  const getSpecialDemandStatus = (row) => {
    if (!row.internal_demand_no) return "Awaiting for Internal Demand No";

    if (row.internal_demand_no && !row.requisition_no)
      return "Awaiting for Requisition No";

    if (row.requisition_no && !row.mo_demand_no)
      return "Awaiting for MO Demand No";

    return "Completed";
  };
  useEffect(() => {
    const t = fetchedData.items.map((row) => ({
      ...row,

      // ✅ Qty increased from spares
      quantity: row.obs_increase_qty || "--",

      // ✅ Final expected OBS qty
      modified_obs: row.obs_authorised || "--",

      demandno: row.internal_demand_no || "--",
      demanddate: row.internal_demand_date
        ? getFormatedDate(row.internal_demand_date)
        : "--",

      requisition: row.requisition_no || "--",
      Reqdate: row.requisition_date
        ? getFormatedDate(row.requisition_date)
        : "--",

      modemand: row.mo_demand_no || "--",
      modate: row.mo_demand_date ? getFormatedDate(row.mo_demand_date) : "--",

      status: getSpecialDemandStatus(row),

      processed: (
        <Button
          size="icon"
          className="bg-white text-black shadow-md border"
          onClick={() => {
            setSelectedRow(row);

            // 🔥 FINAL STEP — prefill dialog fields
            setInputs({
              internal_demand_no: row.internal_demand_no || "",
              internal_demand_date: row.internal_demand_date
                ? new Date(row.internal_demand_date)
                : null,

              requisition_no: row.requisition_no || "",
              requisition_date: row.requisition_date
                ? new Date(row.requisition_date)
                : null,

              mo_demand_no: row.mo_demand_no || "",
              mo_demand_date: row.mo_demand_date
                ? new Date(row.mo_demand_date)
                : null,
            });

            // open dialog
            setIsOpen((prev) => ({ ...prev, issue: true }));
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
        open={isOpen.issue}
        onOpenChange={(set) => setIsOpen((prev) => ({ ...prev, issue: set }))}
      >
        <DialogContent
          onCloseAutoFocus={() => {
            setInputs({
              internal_demand_no: "",
              internal_demand_date: null,
              requisition_no: "",
              requisition_date: null,
              mo_demand_no: "",
              mo_demand_date: null,
            });
          }}
        >
          <DialogTitle className="capitalize">
            {/* Issue {selectedRow.source == "spares" ? "spare" : "tool"} */}
            Amend Special Demand
          </DialogTitle>
          <DialogDescription className="hidden" />
          <div>
            <>
              <div className="flex gap-4 w-full">
                {/* Demand No */}
                <div className="w-full">
                  <Label
                    htmlFor="internal_demand_no"
                    className="ms-2 mb-2 mt-4"
                  >
                    Internal Demand No.
                  </Label>
                  <Input
                    type="text"
                    id="internal_demand_no"
                    value={inputs.internal_demand_no}
                    placeholder="Internal Demand No."
                    onChange={(e) =>
                      setInputs((prev) => ({
                        ...prev,
                        internal_demand_no: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="w-full mt-3">
                  <FormattedDatePicker
                    label="Internal Demand Date"
                    value={inputs.internal_demand_date}
                    onChange={(date) =>
                      setInputs((prev) => ({
                        ...prev,
                        internal_demand_date: date,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex gap-4 w-full">
                {/* Requisition No */}
                <div className="w-full">
                  <Label htmlFor="requisition_no" className="ms-2 mb-2 mt-5">
                    Requisition No.
                  </Label>
                  <Input
                    type="text"
                    id="requisition_no"
                    value={inputs.requisition_no}
                    placeholder="Requisition No."
                    onChange={(e) =>
                      setInputs((prev) => ({
                        ...prev,
                        requisition_no: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="w-full mt-4">
                  <FormattedDatePicker
                    label="Requisition Date"
                    value={inputs.requisition_date}
                    onChange={(date) =>
                      setInputs((prev) => ({
                        ...prev,
                        requisition_date: date,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex gap-4 w-full">
                {/* MO Demand No */}
                <div className="w-full">
                  <Label htmlFor="nmo_demand_no" className="ms-2 mb-2 mt-7">
                    MO Demand No.
                  </Label>
                  <Input
                    type="text"
                    id="mo_demand_no"
                    value={inputs.mo_demand_no}
                    placeholder="MO Demand No."
                    onChange={(e) =>
                      setInputs((prev) => ({
                        ...prev,
                        mo_demand_no: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="w-full mt-6">
                  <FormattedDatePicker
                    label="MO Demand Date"
                    value={inputs.mo_demand_date}
                    onChange={(date) =>
                      setInputs((prev) => ({
                        ...prev,
                        mo_demand_date: date,
                      }))
                    }
                  />
                </div>
              </div>

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
                  onClick={handleSubmitSpecialDemand}
                >
                  Submit
                </SpinnerButton>
              </div>
            </>
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

export default PendingSpecial;

// import { useContext, useEffect, useMemo, useState } from "react";
// import { FaChevronRight, FaMagnifyingGlass } from "react-icons/fa6";

// import { Input } from "../components/ui/input";
// import { Button } from "../components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogTitle,
// } from "../components/ui/dialog";
// import { Label } from "../components/ui/label";

// import { Context } from "../utils/Context";
// import apiService from "../utils/apiService";
// import PaginationTable from "../components/PaginationTableTwo";
// import SpinnerButton from "../components/ui/spinner-button";
// import toaster from "../utils/toaster";
// import { formatSimpleDate, getDate } from "../utils/helperFunctions";
// import { MultiSelect } from "../components/ui/multi-select";
// import { FormattedDatePicker } from "@/components/FormattedDatePicker";

// const PendingSpecial = () => {
//   const { config } = useContext(Context);

//   /* ================= TABLE COLUMNS ================= */
//   const columns = useMemo(
//     () => [
//       { key: "description", header: "Item Description" },
//       { key: "indian_pattern", header: "IN Part No." },
//       { key: "category", header: "Category" },
//       { key: "quantity", header: "Qty" },
//       { key: "demandno", header: "Internal Demand No" },
//       { key: "demanddate", header: "Internal Demand Date" },
//       { key: "requisition", header: "Requisition No" },
//       { key: "Reqdate", header: "Requisition Date" },
//       { key: "modemand", header: "MO Demand No" },
//       { key: "modate", header: "MO Demand Date" },
//       { key: "status", header: "Status" },
//       { key: "processed", header: "Action" },
//     ],
//     [],
//   );

//   /* ================= STATE ================= */
//   const [tableData, setTableData] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [selectedRow, setSelectedRow] = useState(null);

//   const [isOpen, setIsOpen] = useState({ amend: false });
//   const [isLoading, setIsLoading] = useState(false);

//   const [inputs, setInputs] = useState({
//     internal_demand_no: "",
//     internal_demand_date: null,
//     requisition_no: "",
//     requisition_date: null,
//     mo_demand_no: "",
//     mo_demand_date: null,
//   });

//   const [fetchedData, setFetchedData] = useState({
//     items: [],
//     totalPages: 1,
//     currentPage: 1,
//   });

//   /* ================= FETCH ================= */
//   const fetchdata = async () => {
//     try {
//       const res = await apiService.get("/pending/surveyed", {
//         params: {
//           page: currentPage,
//           limit: config.row_per_page,
//         },
//       });

//       if (res.success) setFetchedData(res.data);
//       else toaster("error", res.message);
//     } catch (err) {
//       toaster("error", err.message);
//     }
//   };

//   /* ================= STATUS DECIDER ================= */
//   const getNextStatus = () => {
//     const {
//       internal_demand_no,
//       internal_demand_date,
//       requisition_no,
//       requisition_date,
//       mo_demand_no,
//       mo_demand_date,
//     } = inputs;

//     if (
//       !internal_demand_no &&
//       !internal_demand_date &&
//       !requisition_no &&
//       !requisition_date &&
//       !mo_demand_no &&
//       !mo_demand_date
//     )
//       return "awaiting_internal_demand";

//     if (
//       internal_demand_no &&
//       internal_demand_date &&
//       !requisition_no &&
//       !requisition_date
//     )
//       return "awaiting_requisition";

//     if (requisition_no && requisition_date && !mo_demand_no && !mo_demand_date)
//       return "awaiting_mo_demand";

//     if (mo_demand_no && mo_demand_date) return "completed";

//     return "awaiting_internal_demand";
//   };

//   /* ================= SUBMIT ================= */
//   const handleSubmit = async () => {
//     setIsLoading(true);

//     try {
//       const status = getNextStatus();

//       const res = await apiService.post("/pending/amend-special-demand", {
//         id: selectedRow.id,

//         internal_demand_no: inputs.internal_demand_no,
//         internal_demand_date: inputs.internal_demand_date
//           ? formatSimpleDate(inputs.internal_demand_date)
//           : null,

//         requisition_no: inputs.requisition_no,
//         requisition_date: inputs.requisition_date
//           ? formatSimpleDate(inputs.requisition_date)
//           : null,

//         mo_demand_no: inputs.mo_demand_no,
//         mo_demand_date: inputs.mo_demand_date
//           ? formatSimpleDate(inputs.mo_demand_date)
//           : null,

//         status,
//       });

//       if (res.success) {
//         toaster("success", "Special demand updated");
//         setIsOpen({ amend: false });
//         fetchdata();
//       } else toaster("error", res.message);
//     } catch (err) {
//       toaster("error", err.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   /* ================= EFFECTS ================= */
//   useEffect(() => {
//     fetchdata();
//   }, [currentPage]);

//   useEffect(() => {
//     const t = fetchedData.items.map((row) => ({
//       ...row,
//       demanddate: getDate(row.demanddate),
//       Reqdate: getDate(row.Reqdate),
//       modate: getDate(row.modate),
//       status:
//         row.status === "awaiting_internal_demand"
//           ? "Awaiting for Internal Demand No"
//           : row.status === "awaiting_requisition"
//             ? "Awaiting for Requisition No"
//             : row.status === "awaiting_mo_demand"
//               ? "Awaiting for MO Demand No"
//               : row.status === "completed"
//                 ? "Completed"
//                 : row.status,
//       processed: (
//         <Button
//           size="icon"
//           variant="outline"
//           onClick={() => {
//             setSelectedRow(row);
//             setInputs({
//               internal_demand_no: row.demandno || "",
//               internal_demand_date: row.demanddate || null,
//               requisition_no: row.requisition || "",
//               requisition_date: row.Reqdate || null,
//               mo_demand_no: row.modemand || "",
//               mo_demand_date: row.modate || null,
//             });
//             setIsOpen({ amend: true });
//           }}
//         >
//           <FaChevronRight />
//         </Button>
//       ),
//     }));

//     setTableData(t);
//   }, [fetchedData]);

//   /* ================= UI ================= */
//   return (
//     <>
//       <PaginationTable
//         data={tableData}
//         columns={columns}
//         currentPage={fetchedData.currentPage}
//         totalPages={fetchedData.totalPages}
//         onPageChange={setCurrentPage}
//       />

//       {/* ================= AMEND DIALOG ================= */}
//       <Dialog
//         open={isOpen.amend}
//         onOpenChange={() => setIsOpen({ amend: false })}
//       >
//         <DialogContent>
//           <DialogTitle>Amend Special Demand</DialogTitle>
//           <DialogDescription />

//           {/* Internal Demand */}
//           <Label>Internal Demand No</Label>
//           <Input
//             value={inputs.internal_demand_no}
//             onChange={(e) =>
//               setInputs((p) => ({ ...p, internal_demand_no: e.target.value }))
//             }
//           />
//           <FormattedDatePicker
//             label="Internal Demand Date"
//             value={inputs.internal_demand_date}
//             onChange={(d) =>
//               setInputs((p) => ({ ...p, internal_demand_date: d }))
//             }
//           />

//           {/* Requisition */}
//           <Label className="mt-3">Requisition No</Label>
//           <Input
//             value={inputs.requisition_no}
//             onChange={(e) =>
//               setInputs((p) => ({ ...p, requisition_no: e.target.value }))
//             }
//           />
//           <FormattedDatePicker
//             label="Requisition Date"
//             value={inputs.requisition_date}
//             onChange={(d) => setInputs((p) => ({ ...p, requisition_date: d }))}
//           />

//           {/* MO Demand */}
//           <Label className="mt-3">MO Demand No</Label>
//           <Input
//             value={inputs.mo_demand_no}
//             onChange={(e) =>
//               setInputs((p) => ({ ...p, mo_demand_no: e.target.value }))
//             }
//           />
//           <FormattedDatePicker
//             label="MO Demand Date"
//             value={inputs.mo_demand_date}
//             onChange={(d) => setInputs((p) => ({ ...p, mo_demand_date: d }))}
//           />

//           <div className="flex justify-end gap-4 mt-6">
//             <Button
//               variant="outline"
//               onClick={() => setIsOpen({ amend: false })}
//             >
//               Cancel
//             </Button>
//             <SpinnerButton loading={isLoading} onClick={handleSubmit}>
//               Submit
//             </SpinnerButton>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// };

// export default PendingSpecial;
