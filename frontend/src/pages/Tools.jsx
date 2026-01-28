import { useState, useEffect, useMemo, use, useContext } from "react";
import { FaMagnifyingGlass, FaPlus } from "react-icons/fa6";
import { MultiSelect } from "../components/ui/multi-select";
import * as XLSX from "xlsx";
import InputWithPencil from "../components/ui/InputWithPencil";
import MultiImageSelect from "../components/MultiImageSelect";
import DynamicInputList from "../components/DynamicInputList";
import { IoMdRefresh } from "react-icons/io";
import ActionIcons from "../components/ActionIcons";
import { FormattedDatePicker } from "@/components/FormattedDatePicker";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import SpinnerButton from "../components/ui/spinner-button";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";

import PaginationTable from "../components/PaginationTableTwo";
import toaster from "../utils/toaster";
import apiService from "../utils/apiService";
import { Context } from "../utils/Context";
import { imageBaseURL } from "../utils/baseURL";
import ImagePreviewDialog from "../components/ImagePreviewDialog";
import { cn } from "../lib/utils";
import { Table, TableBody, TableCell, TableRow } from "../components/ui/table";
import BoxNoInputs from "../components/BoxNoInputs";
import BoxNoInputsSimple from "../components/BoxNoInputsSimple";
import { getFormatedDate } from "../utils/helperFunctions";
import TestDialog from "../components/TestDialog";
import OEMFirm from "../components/OEMFirm";
import SupplierFirm from "../components/Supplier";

const SEARCH_FIELDS = [
  { label: "Item Description", value: "description" },
  { label: "Equipment / System", value: "equipment_system" },
  { label: "Denos", value: "denos" },
  { label: "OBS Authorised", value: "obs_authorised" },
  { label: "OBS Held", value: "obs_held" },
  { label: "Item Storage Distribution", value: "boxNo" },
  { label: "Location of Storage", value: "storage_location" },
  { label: "Item Distribution", value: "item_distribution" },
  { label: "IN Part No.", value: "indian_pattern" },
  { label: "Item Code", value: "item_code" },
  { label: "Price/Unit Cost", value: "price_unit" },
  { label: "Sub Component", value: "sub_component" },
];

const Tools = () => {
  const { config } = useContext(Context);

  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [originalObsAuthorised, setOriginalObsAuthorised] = useState(null);

  const [obsDialog, setObsDialog] = useState({
    open: false,
    action: "increase", // or "decrease"
    quantity: "",

    demandGenerated: "",
    internalDemandNo: "",
    internalDemandDate: new Date(),

    requisitionNo: "",
    requisitionDate: new Date(),

    moDemandNo: "",
    moDemandDate: new Date(),
  });

  const toUpper = (value) => value?.toUpperCase?.() || value;

  const handleUpperChange = (e, setter) => {
    const { name, value } = e.target;
    setter((prev) => ({
      ...prev,
      [name]: toUpper(value),
    }));
  };

  const [savedRow, setSavedRow] = useState(null);
  const [savedHeld, setSavedHeld] = useState(null);

  //OEM Firm Dialog
  const [isOpenOem, setIsOpenOem] = useState(false);

  const [newVendor, setNewVendor] = useState({
    vendor: "",
    address: "",
    contacts: [""],
    persons: [{ prefix: "Mr", name: "", designation: "", phone: "" }],
  });

  //Supplier Firm Dialog
  const [isOpenSupplier, setIsOpenSupplier] = useState(false);

  const [newSupplier, setNewSupplier] = useState({
    supplier: "",
    address: "",
    contacts: [""],
    persons: [{ name: "", designation: "", phone: "" }],
  });

  //Demand no and Date
  const isInternalFilled =
    obsDialog.internalDemandNo && obsDialog.internalDemandDate;
  const isRequisitionFilled =
    obsDialog.requisitionNo && obsDialog.requisitionDate;
  const isMoFilled = obsDialog.moDemandNo && obsDialog.moDemandDate;

  //Dynamic Input
  const normalizeToArray = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string" && value.trim() !== "")
      return value.split(",").map((v) => v.trim());
    return [""];
  };

  const [editableFields, setEditableFields] = useState({
    substitute_name: false,
    local_terminology: false,
  });

  const [isLooseSpare, setIsLooseSpare] = useState(false);

  const [imagePayload, setImagePayload] = useState({
    imageStatus: [],
    newImageFiles: {},
  });
  const [selectedSearchFields, setSelectedSearchFields] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [fetchedData, setFetchedData] = useState({
    items: [],
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
  });
  const [isLoading, setIsLoading] = useState({ table: false });
  const [actualSearch, setActualSearch] = useState("");
  const [inputs, setInputs] = useState({
    search: "",
    critical_tool: "no",
  });
  const [isOpen, setIsOpen] = useState({
    addSpare: false,
    editSpare: false,
    deleteSpare: false,
  });
  const [selectedRow, setSelectedRow] = useState({});

  const [oemList, setOemList] = useState([]);
  const [supplierList, setSupplierList] = useState([]);
  const [selectedOem, setSelectedOem] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const [image, setImage] = useState({
    preview: null,
    file: null,
    previewEdit: null,
    fileEdit: null,
  });
  const [panelProduct, setPanelProduct] = useState({
    critical_tool: "no",
  });
  const [boxNo, setBoxNo] = useState([
    { no: "", qn: "", qtyHeld: "", location: "" },
  ]);

  const result = useMemo(() => {
    try {
      const boxes = JSON.parse(selectedRow.box_no);
      return boxes.map((item) => item.no).join(", ");
    } catch (e) {
      return "";
    }
  }, [selectedRow]);

  const columns = useMemo(() => [
    { key: "description", header: "Item Description", width: "max-w-[50px]" },
    {
      key: "indian_pattern",
      header: (
        <span>
          <i>IN</i> Part No.
        </span>
      ),
      width: "min-w-[150px]",
    },
    {
      key: "equipment_system",
      header: (
        <span>
          Equipment/
          <br />
          System
        </span>
      ),
      width: "max-w-[30px]",
    },
    { key: "category", header: "Category", width: "max-w-[60px]" },
    { key: "denos", header: "Denos", width: "max-w-[60px]" },
    {
      key: "obs_authorised",
      header: (
        <span>
          OBS Authorised/
          <br />
          Maintained
        </span>
      ),
      width: "max-w-[20px]",
      // header: "OBS Authorised ",
    },
    {
      key: "obs_held",
      header: (
        <span>
          OBS
          <br />
          Held
        </span>
      ),
      width: "max-w-[50px] px-0",
    },
    {
      key: "boxNo",
      header: "Box No.",
      width: "max-w-[90px]",
    },
    {
      key: "item_dist",
      header: "Item Distribution",
      width: "max-w-[80px]",
    },
    {
      key: "location",
      header: "Location of Storage",
      width: "max-w-[40px]",
    },
    { key: "edit", header: "Actions", width: "max-w-[40px]" },
  ]);

  //fetch suppliers from list
    const BASE_URL = "http://localhost:7777/api/v1";
    const fetchSuppliers = async () => {
      try {
        const res = await fetch(`${BASE_URL}/supplier/list`);
        const data = await res.json();

        console.log("SUPPLIER API RESPONSE 👉", data);

        setSupplierList(Array.isArray(data?.data) ? data.data : []);
      } catch (error) {
        console.error("Failed to fetch suppliers", error);
        setSupplierList([]);
      }
  };
  
    const fetchOems = async () => {
      try {
        const res = await fetch(`${BASE_URL}/oem/list`);
        const data = await res.json();

        console.log("OEM API RESPONSE 👉", data);

        setOemList(Array.isArray(data?.data) ? data.data : []);
      } catch (error) {
        console.error("Failed to fetch oems", error);
        setOemList([]);
      }
    };

    useEffect(() => {
      fetchSuppliers();
      fetchOems();
    }, []);
  
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

  const enableEdit = (field) => {
    setEditableFields((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const disableEdit = (field) => {
    setEditableFields((prev) => ({
      ...prev,
      [field]: false,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({
      ...prev,
      [name]: value.toUpperCase(),
    }));
  };
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setSelectedRow((prev) => ({
      ...prev,
      [name]: value.toUpperCase(),
    }));
  };
  const fetchdata = async (searchValue = inputs.search, page = currentPage) => {
    try {
      const response = await apiService.get("/tools", {
        params: {
          page,
          search: searchValue,
          limit: config.row_per_page,
        },
      });
      setFetchedData(response.data);
    } catch (error) {}
  };

  const handleaddSpare = async () => {
    try {
      let s = 0,
        s1 = 0;
      let boxes = Array.isArray(boxNo) ? boxNo : [];

      // let boxes = JSON.parse(inputs.box_no);

      for (let i = 0; i < boxes.length; i++) {
        s += parseInt(boxes[i].qn || 0);
        s1 += parseInt(boxes[i].qtyHeld || 0);
      }

      if (s != parseInt(selectedRow.obs_authorised)) {
        toaster("error", "OBS Authorised not matched");
        return;
      }

      if (!selectedRow.description?.trim()) {
        toaster("error", "Description is required");
        return;
      } else if (!selectedRow.equipment_system?.trim()) {
        toaster("error", "Equipment / System is required");
        return;
      }
      const formData = new FormData();
      if (image.file) {
        formData.append("image", image.file);
      }
      formData.append("description", selectedRow.description || "");
      formData.append("equipment_system", selectedRow.equipment_system || "");
      formData.append("denos", selectedRow.denos || "");
      formData.append("obs_authorised", selectedRow.obs_authorised || "");
      formData.append("obs_held", selectedRow.obs_held || "");
      formData.append("b_d_authorised", selectedRow.b_d_authorised || "");
      formData.append("category", selectedRow.category || "");
      formData.append("box_no", JSON.stringify(boxNo));
      formData.append("storage_location", selectedRow.storage_location || "");
      formData.append("item_code", selectedRow.item_code || "");
      formData.append("price_unit", selectedRow.price_unit || "");
      formData.append("sub_component", selectedRow.sub_component || "");
      formData.append("indian_pattern", selectedRow.indian_pattern || "");
      formData.append("remarks", selectedRow.remarks || "");
      formData.append("oem", selectedRow.oem || "");
      formData.append("substitute_name", selectedRow.substitute_name || "");
      formData.append("local_terminology", selectedRow.local_terminology || "");
      formData.append(
        "critical_tool",
        inputs.critical_tool == "yes" ? 1 : 0 || 0,
      );
      const response = await apiService.post("/tools", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.success) {
        toaster("success", "Tools added successfully");
        setIsOpen({ ...isOpen, addSpare: false });
        fetchdata();
        setInputs({
          description: "",
          equipment_system: "",
          denos: "",
          obs_authorised: "",
          obs_held: "",
          b_d_authorised: "",
          category: "",
          box_no: "",
          storage_location: "",
          item_code: "",
          price_unit: "",
          sub_component: "",
          indian_pattern: "",
          remarks: "",
        });
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message || error.message || "Failed to add tools";
      toaster("error", errMsg);
    }
  };

  const handleUpdateClick = () => {
    if (Number(selectedRow.obs_authorised) !== Number(originalObsAuthorised)) {
      setObsDialog({
        open: true,
        action: "increase",
        quantity: "",
      });
    } else {
      handleEditSpare(); // no dialog
    }
  };

  const handleEditSpare = async () => {
    try {
      let s = 0,
        s1 = 0;

      //testing
      // const boxes1 = JSON.parse(selectedRow.box_no);
      // var result = boxes1.map((item) => item.no).join(", ");
      // console.log("result==>", result);

      const boxes = JSON.parse(selectedRow.box_no || "[]");
      console.log("selected row==>", selectedRow);

       // 🔴 At least one distribution row required
            if (!boxes.length) {
              toaster("error", "Item Storage Distribution is required");
              return;
            }
      
            // 🔴 Mandatory field validation per row
            for (let i = 0; i < boxes.length; i++) {
              const { no, location, qtyHeld, qn } = boxes[i];
      
              if (!no?.trim()) {
                toaster("error", `Box No is required in row ${i + 1}`);
                return;
              }
      
               if (qn === "" || qn === null || isNaN(qn)) {
                 toaster("error", `Authorised Qty is required in row ${i + 1}`);
                 return;
              }
              
              if (qtyHeld === "" || qtyHeld === null || isNaN(qtyHeld)) {
                toaster("error", `Qty Held is required in row ${i + 1}`);
                return;
              }
              
              if (!location?.trim()) {
                toaster("error", `Location is required in row ${i + 1}`);
                return;
              }
              // if (Number(qtyHeld) <= 0) {
              //   toaster("error", `Qty Held must be greater than 0 (row ${i + 1})`);
              //   return;
              // }
      
             
      
              // if (Number(qn) <= 0) {
              //   toaster(
              //     "error",
              //     `Authorised Qty must be greater than 0 (row ${i + 1})`,
              //   );
              //   return;
              // }
      }
      
      for (let i = 0; i < boxes.length; i++) {
        const qty1 = boxes[i].qn;
        if (isNaN(parseInt(qty1)) || parseInt(qty1) < 0) {
          toaster("error", "Invalid Authorised Qty");
          return;
        }
        const qty = boxes[i].qtyHeld;
        if (isNaN(parseInt(qty)) || parseInt(qty) < 0) {
          toaster("error", "Invalid Qty Held");
          return;
        }
        s += Number(boxes[i].qn || 0);
        s1 += Number(boxes[i].qtyHeld || 0);
      }

      // Current edited data (from UI state)
      let prevTotal = 0;
      let currentTotal = 0;
      const prevBoxes = JSON.parse(savedRow.box_no);

      for (let i = 0; i < prevBoxes.length; i++) {
        prevTotal += parseInt(prevBoxes[i]?.qtyHeld || 0);
        currentTotal += parseInt(boxes[i]?.qtyHeld || 0);
      }

      if (currentTotal < prevTotal) {
        toaster("error", "Follow manual withdrawl procedure");
        return;
      }

      const obsAuthorised = Number(selectedRow.obs_authorised);
      const obsHeld = Number(selectedRow.obs_held);

      //corrected OBS Held
      const prevHeld = Number(savedHeld || 0);
      const currentHeld = Number(obsHeld || 0);

      if (currentHeld < prevHeld) {
        toaster("error", "Follow manual withdrawal procedure");
        return;
      }

      // QN must match authorised
      if (s !== obsAuthorised) {
        toaster("error", "Authorised Qty not matched with OBS Authorised");
        return;
      }

      // Held must match OBS held
      if (s1 !== obsHeld) {
        toaster("error", "Qty Held not matched with OBS Held");
        return;
      }

      // let s = 0;
      // let s1 = 0;

      // boxes.forEach((b) => {
      //   s += Number(b.qn || 0);
      //   s1 += Number(b.qtyHeld || 0);
      // });

      // if (s !== Number(selectedRow.obs_authorised)) {
      //   toaster("error", "OBS Authorised not matched");
      //   return;
      // }

      // if (s1 > Number(selectedRow.obs_authorised)) {
      //   toaster("error", "OBS Held cannot exceed OBS Authorised");
      //   return;
      // }

      if (!selectedRow.description?.trim()) {
        toaster("error", "Description is required");
        return;
      } else if (!selectedRow.equipment_system?.trim()) {
        toaster("error", "Equipment / System is required");
        return;
      }
      let img = null;
      if (image.fileEdit) {
        img = image.fileEdit;
      } else if (selectedRow.image) {
        img = selectedRow.image;
      }
      const formData = new FormData();
      formData.append("image", img);
      formData.append("description", selectedRow.description || "");
      formData.append("equipment_system", selectedRow.equipment_system || "");
      formData.append("denos", selectedRow.denos || "");
      formData.append("obs_authorised", selectedRow.obs_authorised || "");
      formData.append("obs_held", selectedRow.obs_held || "");
      formData.append("b_d_authorised", selectedRow.b_d_authorised || "");
      formData.append("category", selectedRow.category || "");
      // formData.append("box_no", selectedRow.box_no || "");
      formData.append("box_no", selectedRow.box_no);
      formData.append("storage_location", selectedRow.storage_location || "");
      formData.append("item_code", selectedRow.item_code || "");
      formData.append("price_unit", selectedRow.price_unit || "");
      formData.append("sub_component", selectedRow.sub_component || "");
      formData.append("indian_pattern", selectedRow.indian_pattern || "");
      formData.append("remarks", selectedRow.remarks || "");
      formData.append("oem", selectedRow.oem || "");
      formData.append("substitute_name", selectedRow.substitute_name || "");
      formData.append("local_terminology", selectedRow.local_terminology || "");

      const response = await apiService.post(
        "/tools/update/" + selectedRow.id,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      if (response.success) {
        toaster("success", "Tools updated successfully");
        setIsOpen({ ...isOpen, editSpare: false });
        fetchdata();
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      console.log(error);

      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong";
      toaster("error", errMsg);
    }
  };

  useEffect(() => {
    setBoxNo(
      selectedRow.box_no
        ? JSON.parse(selectedRow.box_no)
        : [{ no: "", qn: "", qtyHeld: "", location: "" }],
    );
  }, [selectedRow.box_no]);

  const handleRefresh = () => {
    // reset search input
    setInputs((prev) => ({
      ...prev,
      search: "",
    }));

    // reset search fields dropdown
    setSelectedSearchFields([]);

    // reset pagination
    setCurrentPage(1);

    // reset comparison state
    setActualSearch("");

    setSelectedRowIndex(null);

    setPanelProduct({});
    fetchdata("", 1);
  };
  useEffect(() => {
    const fetchOems = async () => {
      try {
        const res = await apiService.get("/oems");
        setOemList(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchOems();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!tableData?.length) return;

      if (e.key === "ArrowDown") {
        setSelectedRowIndex((prev) => {
          if (prev === null) return 0;
          return Math.min(prev + 1, tableData.length - 1);
        });
      }

      if (e.key === "ArrowUp") {
        setSelectedRowIndex((prev) => {
          if (prev === null) return 0;
          return Math.max(prev - 1, 0);
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tableData]);

  useEffect(() => {
    if (selectedRowIndex !== null && tableData[selectedRowIndex]) {
      setPanelProduct(tableData[selectedRowIndex]);
    }
  }, [selectedRowIndex, tableData]);

  useEffect(() => {
    fetchdata();
  }, [currentPage]);

  useEffect(() => {
    return () => {
      if (image.preview) {
        URL.revokeObjectURL(image.preview);
      }
    };
  }, [image.preview]);

  [
    {
      prefix: "",
      name: "",
      contact: "",
      des: "",
    },
    {
      prefix: "",
      name: "",
      contact: "",
      des: "",
    },
  ];

  useEffect(() => {
    const t = fetchedData.items.map((row) => ({
      ...row,
      imgUrl: imageBaseURL + row.image,
      image: row.image ? (
        <ImagePreviewDialog image={imageBaseURL + row.image} />
      ) : null,
      boxNo: (row.box_no ? JSON.parse(row.box_no) : [{ no: "", qn: "" }])
        ?.map((box) => box.no)
        ?.join(", "),
      item_dist: (row.box_no ? JSON.parse(row.box_no) : [{ no: "", qn: "" }])
        ?.map((box) => box.qtyHeld)
        ?.join(", "),
      location: (row.box_no ? JSON.parse(row.box_no) : [{ no: "", qn: "", location: "" }])
        ?.map((box) => box.location)
        ?.join(", "),

      // edit: (
      //   <Button
      //     variant="ghost"
      //     className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
      //     onClick={() => {
      //       if (row.image) {
      //         setImage((prev) => ({
      //           ...prev,
      //           previewEdit: imageBaseURL + row.image,
      //         }));
      //       }

      //       setOriginalObsAuthorised(row.obs_authorised); // ⭐ STEP 2
      //       setSelectedRow(row);
      //       setIsOpen({ ...isOpen, editSpare: true });
      //     }}
      //   >
      //     <MdModeEditOutline />
      //   </Button>
      // ),

      edit: (
        <ActionIcons
          row={row}
          onEdit={(row) => {
            if (row.image) {
              setImage((prev) => ({
                ...prev,
                previewEdit: imageBaseURL + row.image,
              }));
            }
            // setOriginalObsAuthorised(row.obs_authorised);
            setSelectedRow(row);
            console.log("row==>", row);
            setSavedRow(JSON.parse(JSON.stringify(row)));
            setSavedHeld(Number(row.obs_held || 0));
            setIsOpen((prev) => ({ ...prev, editSpare: true }));
          }}
          onWithdraw={(row) => {
            setSelectedRow(row);
            setIsOpen((prev) => ({ ...prev, withdrawSpare: true }));
          }}
          onShowQR={(row) => {
            setSelectedRow(row);
            setIsOpen((prev) => ({ ...prev, qrView: true }));
          }}
          onScanQR={() => {
            setIsOpen((prev) => ({ ...prev, qrScan: true }));
          }}
        />
      ),
    }));
    setTableData(t);
  }, [fetchedData]);
  console.log("fetchedData==>", fetchedData);

  const [testDialog, setTestDialog] = useState(false);

  return (
    // <div className="px-2 w-full h-[calc(100vh-135px)] flex">
    <div className="w-full h-full flex gap-2">
      {/* <div className="h-full"> */}
      <div className="flex-1 min-w-0 h-full">
        {/* <TestDialog
          title="ABC"
          open={testDialog}
          setOpen={setTestDialog}
          value={fetchedData}
        /> */}
        <div className="mb-2">
          <MultiSelect
            className="bg-white hover:bg-blue-50"
            options={SEARCH_FIELDS}
            value={selectedSearchFields}
            onChange={setSelectedSearchFields}
            placeholder="Search Fields"
          />
        </div>
        <div className="flex items-center mb-4 gap-2 w-full mx-auto">
          <Input
            type="text"
            placeholder="Search description or equipment / system"
            className="bg-white"
            value={inputs.search}
            onChange={(e) =>
              setInputs((prev) => ({
                ...prev,
                search: e.target.value.toUpperCase(),
              }))
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
            className="cursor-pointer flex items-center gap-1 bg-blue-100
             hover:bg-blue-200 
             hover:scale-105 
             transition-all duration-200"
            onClick={handleRefresh}
            title="Reset Search"
          >
            <IoMdRefresh
              className="size-6 hover:rotate-180 
              transition-transform duration-300"
              style={{
                color: "#109240",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            />{" "}
            <span className="text-md font-bold text-green-700">Reset</span>
          </Button>

          <Button
            onClick={() => {
              setIsOpen({ ...isOpen, addSpare: true });
            }}
            className="cursor-pointer hover:bg-primary/85"
          >
            <FaPlus /> Add Tools
          </Button>
        </div>
        {/* <div className="min-w-0 max-table-width overflow-x-auto"> */}
        <div className="flex-1 bg-white ">
          <div className="min-w-0 w-full overflow-x-auto">
            <PaginationTable
              data={tableData}
              columns={columns}
              currentPage={fetchedData.currentPage || 1}
              pageSize={fetchedData.items?.length || 10}
              totalPages={fetchedData.totalPages || 1}
              onPageChange={setCurrentPage}
              bodyClassName="spares-table"
              selectedRowIndex={selectedRowIndex}
              onClickRow={(row, index) => {
                setSelectedRowIndex(index);
                setPanelProduct(row);
              }}
            />
          </div>
        </div>
      </div>
      <div
        className={cn(
          "w-[308px] shrink-0 border border-black bg-white p-2 rounded-md ms-2 h-[calc(115vh-185px)]",
          !panelProduct.description && "flex justify-center items-center",
        )}
      >
        {!panelProduct.description && (
          <div className="h-150 flex items-center justify-center">
            <p className="text-sm text-gray-500 text-center">
              No tools is selected
            </p>
          </div>
        )}
        {panelProduct.description && (
          <div className="h-full">
            <div className="w-full justify-center flex">
              {/* <img className="w-72 rounded-md border"
                    src={panelProduct.imgUrl}
                    alt={panelProduct.description}
                  /> */}
              <ImagePreviewDialog
                className="w-72 h-72 object-contain rounded-md border"
                image={panelProduct.imgUrl}
              />
            </div>
            <div className="max-h-[calc(100%-288px)] overflow-y-auto description-table">
              <Table className="mt-2">
                <TableBody className="">
                  <TableRow>
                    <TableCell>Sub Component</TableCell>
                    <TableCell>{panelProduct.sub_component || "--"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Substitute Part No.</TableCell>
                    <TableCell>
                      {panelProduct.substitute_name || "--"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Critical / Special Tools</TableCell>
                    <TableCell>
                      {panelProduct.critical_tool ? "Yes" : "No"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Local Terminology</TableCell>
                    <TableCell>
                      {panelProduct.local_terminology || "--"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Price</TableCell>
                    <TableCell>{panelProduct.price_unit || "--"}</TableCell>
                  </TableRow>
                  {panelProduct.obs_held && (
                    <TableRow>
                      <TableCell>OEM Details</TableCell>
                      <TableCell>{panelProduct.oem || "--"}</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell>Vendor/ Third Party Supplier</TableCell>
                    <TableCell>{panelProduct.supplier || "--"}</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>Remarks</TableCell>
                    <TableCell>{panelProduct.remarks || "--"}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
      <Dialog
        open={isOpen.addSpare}
        onOpenChange={(set) =>
          setIsOpen((prev) => ({ ...prev, addSpare: set }))
        }
      >
        <DialogContent
          className="w-[95%] h-[95%] overflow-y-auto"
          unbounded={true}
          onPointerDownOutside={() => {}}
        >
          <DialogTitle className="">Add Tools & Accessories</DialogTitle>
          <DialogDescription className="hidden" />
          <div>
            <div className="grid grid-cols-4 gap-4">
              {/* Row 1 */}
              <div>
                <Label>Item Description *</Label>
                <Input
                  name="description"
                  value={selectedRow.description}
                  onChange={handleEditChange}
                  editable={editableFields.description}
                  onEdit={() => enableEdit("description")}
                  onBlur={() => disableEdit("description")}
                />
              </div>

              <div>
                <Label>Equipment / System *</Label>
                <Input
                  name="equipment_system"
                  value={selectedRow.equipment_system}
                  onChange={handleEditChange}
                  editable={editableFields.equipment_system}
                  onEdit={() => enableEdit("equipment_system")}
                  onBlur={() => disableEdit("equipment_system")}
                />
              </div>

              <div>
                <Label>Denos *</Label>
                <Input
                  name="denos"
                  value={selectedRow.denos}
                  onChange={handleEditChange}
                  editable={editableFields.denos}
                  onEdit={() => enableEdit("denos")}
                  onBlur={() => disableEdit("denos")}
                />
              </div>

              <div>
                <Label>OBS Authorised *</Label>
                <Input
                  name="obs_authorised"
                  value={selectedRow.obs_authorised}
                  onChange={handleEditChange}
                  editable={editableFields.obs_authorised}
                  onEdit={() => enableEdit("obs_authorised")}
                  onBlur={() => disableEdit("obs_authorised")}
                />
              </div>

              {/* Row 2 */}
              <div>
                <Label>OBS Held *</Label>
                <Input
                  name="obs_held"
                  value={selectedRow.obs_held}
                  onChange={handleEditChange}
                  editable={editableFields.obs_held}
                  onEdit={() => enableEdit("obs_held")}
                  onBlur={() => disableEdit("obs_held")}
                />
              </div>

              <div>
                <Label>B & D Authorised</Label>
                <Input
                  name="b_d_authorised"
                  value={selectedRow.b_d_authorised}
                  onChange={handleEditChange}
                  editable={editableFields.b_d_authorised}
                  onEdit={() => enableEdit("b_d_authorised")}
                  onBlur={() => disableEdit("b_d_authorised")}
                />
              </div>

              <div>
                <Label>Category</Label>
                <Input
                  name="category"
                  value={selectedRow.category}
                  onChange={handleEditChange}
                  editable={editableFields.category}
                  onEdit={() => enableEdit("category")}
                  onBlur={() => disableEdit("category")}
                />
              </div>

              <div>
                <Label>Location of Storage</Label>
                <Input
                  name="storage_location"
                  value={selectedRow.storage_location}
                  onChange={handleEditChange}
                />
              </div>

              {/* <div>
                <Label>Location of Storage</Label>
                <Input
                  type="text"
                  name="storage_location"
                  list="storageLocations"
                  value={inputs.storage_location}
                  onChange={handleChange}
                  placeholder="Select or type location"
                />

                <datalist id="storageLocations">
                  <option value="FWD SPTA" />
                  <option value="AER workshop" />
                  <option value="Reserved Room1" />
                </datalist>
              </div> */}

              {/* Row 3 */}
              <div>
                <Label>Item Code</Label>
                <Input
                  name="item_code"
                  value={selectedRow.item_code}
                  onChange={handleEditChange}
                />
              </div>

              <div>
                <Label>
                  <i>IN</i> Part No.
                </Label>
                <Input
                  name="indian_pattern"
                  value={selectedRow.indian_pattern}
                  onChange={handleEditChange}
                  editable={editableFields.indian_pattern}
                  onEdit={() => enableEdit("indian_pattern")}
                  onBlur={() => disableEdit("indian_pattern")}
                />
              </div>

              {/* Substitute IN Part Name */}

              <div>
                <Label className="ms-2 mb-1">
                  Substitute <i>IN</i> Part No.
                </Label>
                <DynamicInputList
                  id="substitute_name"
                  data={inputs.substitute_name}
                  placeholder="Substitute name"
                  onChange={(values) =>
                    updateDynamicInputs(values, "substitute_name")
                  }
                />
              </div>

              {/* Local Terminology */}
              <div>
                <Label className="ms-2 mb-1">Local Terminology</Label>
                <DynamicInputList
                  id="local_terminology"
                  data={inputs.local_terminology}
                  placeholder="Local Terminology"
                  onChange={(values) => {
                    updateDynamicInputs(values, "local_terminology");
                  }}
                  editable={editableFields.local_terminology}
                  onEdit={() => enableEdit("local_terminology")}
                  onBlur={() => disableEdit("local_terminology")}
                />
              </div>

              {/* Critical Spare */}
              {/* <div>
                <Label className="ms-2 mb-1">Critical / Special Tool</Label>
                <RadioGroup defaultValue="no">
                  <div className="flex gap-6 mt-2">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="yes" id="yes" />
                      <Label htmlFor="yes" className="cursor-pointer">
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="no" id="no" />
                      <Label htmlFor="no" className="cursor-pointer">
                        No
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div> */}

              <div>
                <Label className="ms-2 mb-1">Critical Tool</Label>

                <RadioGroup
                  value={inputs.critical_tool}
                  onValueChange={(value) =>
                    setInputs((prev) => ({
                      ...prev,
                      critical_tool: value,
                    }))
                  }
                  className="mt-2"
                >
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="yes" id="critical_yes" />
                      <Label htmlFor="critical_yes" className="cursor-pointer">
                        Yes
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="no" id="critical_no" />
                      <Label htmlFor="critical_no" className="cursor-pointer">
                        No
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="ms-2 mb-1">Sub Component</Label>
                <Input
                  type="text"
                  name="sub_component"
                  value={inputs.sub_component}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label className="ms-2 mb-1">Price/Unit Cost</Label>
                <Input
                  type="text"
                  name="price_unit"
                  value={inputs.price_unit}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex flex-col mt-3">
              <div className="mt-4">
                <Label className="ms-2 mb-1">Loose Tool Accessories</Label>
                <RadioGroup
                  value={isLooseSpare ? "yes" : "no"}
                  onValueChange={(val) => setIsLooseSpare(val === "yes")}
                >
                  <div className="flex gap-6 mt-2">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="yes" id="loose-yes" />
                      <Label htmlFor="loose-yes" className="cursor-pointer">
                        Yes
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="no" id="loose-no" />
                      <Label htmlFor="loose-no" className="cursor-pointer">
                        No
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <Label className="ms-2 mb-1 mt-7" htmlFor="box_no">
                Item Storage Distribution
              </Label>

              <BoxNoInputs
                value={boxNo}
                onChange={setBoxNo}
                isLooseSpare={isLooseSpare}
              />
            </div>

            {/* Image + Remarks + OEM in same row */}
            <div className="w-full my- mt-6">
              <Label className="ms-2 mb-2 mt-3" htmlFor="image">
                Image
              </Label>
              <div className="relative">
                <MultiImageSelect
                  initialImages={[]}
                  onImagesUpdate={setImagePayload}
                />
              </div>
              <Input
                type="file"
                id="image"
                accept="image/jpeg, image/png, image/webp"
                name="image"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setImage((prev) => ({
                        ...prev,
                        file: file,
                        preview: reader.result,
                      }));
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>

            <div className="w-full mt-6">
              <Label className="ms-2 mb-1">OEM Details</Label>

              <select
                className="w-full border rounded-md p-2"
                value={selectedOem || ""}
                onChange={(e) => {
                  const oemId = e.target.value;
                  if (oemId === "ADD_NEW") {
                    setIsOpenOem(true);
                    return;
                  }
                  const oem = oemList.find((o) => o._id === Number(oemId));
                  setSelectedOem(oemId);

                  if (!oem) return;
                  setInputs((prev) => ({
                    ...prev,
                    oem: oem.name,
                  }));
                }}
              >
                <option value="">Select OEM</option>

                {oemList.map((oem) => (
                  <option key={oem._id} value={oem._id}>
                    {oem.name}, {oem.id}
                  </option>
                ))}

                <option value="ADD_NEW">➕ Add New OEM</option>
              </select>
            </div>
            <div className="w-full mt-6">
              <Label className="ms-2 mb-1">Vendor / Third Party Supplier</Label>

              <select
                className="w-full border rounded-md p-2"
                value={selectedSupplier}
                onChange={(e) => {
                  const supplierId = e.target.value;

                  if (supplierId === "ADD_NEW") {
                    setIsOpenSupplier(true);
                    return;
                  }

                  setSelectedSupplier(supplierId);

                  const supplier = supplierList.find(
                    (s) => s.id === Number(supplierId),
                  );
                  if (!supplier) return;

                  setInputs((prev) => ({
                    ...prev,
                    supplier: supplier.name,
                  }));
                }}
              >
                <option value="">Select Supplier</option>

                {supplierList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}, {s.id}
                  </option>
                ))}

                <option value="ADD_NEW">➕ Add New Supplier</option>
              </select>
            </div>

            <div className="w-full mt-6">
              <Label className="ms-1 mb-1" htmlFor="remarks">
                Remarks
              </Label>
              <Textarea
                id="remarks"
                className="h-14 resize-none"
                type="text"
                placeholder="Remarks"
                name="remarks"
                value={inputs.remarks}
                // onChange={handleChange}
                onChange={(e) => handleUpperChange(e, setInputs)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() =>
                setIsOpen((prev) => ({ ...prev, addSpare: false }))
              }
              variant="outline"
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              className="text-white hover:bg-primary/85 cursor-pointer"
              onClick={handleaddSpare}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isOpen.editSpare}
        onOpenChange={(set) =>
          setIsOpen((prev) => ({ ...prev, editSpare: set }))
        }
      >
        <DialogContent
          className="w-[90%] h-screen max-w-none mt-2 overflow-y-auto"
          unbounded={true}
          onPointerDownOutside={() => {}}
        >
          <DialogTitle className="">Update Tools & Accessories</DialogTitle>
          <DialogDescription className="hidden" />
          <div>
            <div className="grid grid-cols-4 gap-4">
              {/* Row 1 */}
              <div>
                <Label>Item Description *</Label>
                <InputWithPencil
                  name="description"
                  value={selectedRow.description}
                  onChange={handleEditChange}
                  editable={editableFields.description}
                  onEdit={() => enableEdit("description")}
                  onBlur={() => disableEdit("description")}
                />
              </div>

              <div>
                <Label>Equipment / System *</Label>
                <InputWithPencil
                  name="equipment_system"
                  value={selectedRow.equipment_system}
                  onChange={handleEditChange}
                  editable={editableFields.equipment_system}
                  onEdit={() => enableEdit("equipment_system")}
                  onBlur={() => disableEdit("equipment_system")}
                />
              </div>

              <div>
                <Label>Denos *</Label>
                <InputWithPencil
                  name="denos"
                  value={selectedRow.denos}
                  onChange={handleEditChange}
                  editable={editableFields.denos}
                  onEdit={() => enableEdit("denos")}
                  onBlur={() => disableEdit("denos")}
                />
              </div>
              <div>
                <Label>OBS Authorised *</Label>

                <InputWithPencil
                  name="obs_authorised"
                  value={selectedRow.obs_authorised}
                  readOnly 
                  editable={false} 
                  onEdit={() => {
                    // ⭐ OPEN DIALOG HERE
                    setObsDialog({
                      open: true,
                      action: "increase",
                      quantity: "",
                    });

                    // store original value (safety)
                    setOriginalObsAuthorised(selectedRow.obs_authorised);
                  }}
                />
              </div>

              {/* Row 2 */}
              <div>
                <Label>OBS Held *</Label>
                <InputWithPencil
                  name="obs_held"
                  value={selectedRow.obs_held}
                  onChange={handleEditChange}
                  editable={editableFields.obs_held}
                  onEdit={() => enableEdit("obs_held")}
                  onBlur={() => disableEdit("obs_held")}
                />
              </div>

              <div>
                <Label>B & D Authorised</Label>
                <InputWithPencil
                  name="b_d_authorised"
                  value={selectedRow.b_d_authorised}
                  onChange={handleEditChange}
                  editable={editableFields.b_d_authorised}
                  onEdit={() => enableEdit("b_d_authorised")}
                  onBlur={() => disableEdit("b_d_authorised")}
                />
              </div>

              <div>
                <Label>Category</Label>
                <InputWithPencil
                  name="category"
                  value={selectedRow.category}
                  onChange={handleEditChange}
                  editable={editableFields.category}
                  onEdit={() => enableEdit("category")}
                  onBlur={() => disableEdit("category")}
                />
              </div>

              <div>
                <Label>Location of Storage</Label>
                <InputWithPencil
                  name="storage_location"
                  value={selectedRow.storage_location}
                  onChange={handleEditChange}
                  editable={editableFields.storage_location}
                  onEdit={() => enableEdit("storage_location")}
                  onBlur={() => disableEdit("storage_location")}
                />
              </div>

              {/* Row 3 */}
              <div>
                <Label>Item Code</Label>
                <InputWithPencil
                  name="item_code"
                  value={selectedRow.item_code}
                  onChange={handleEditChange}
                  editable={editableFields.item_code}
                  onEdit={() => enableEdit("item_code")}
                  onBlur={() => disableEdit("item_code")}
                />
              </div>

              <div>
                <Label>
                  <i>IN</i> Part No.
                </Label>
                <InputWithPencil
                  name="indian_pattern"
                  value={selectedRow.indian_pattern}
                  onChange={handleEditChange}
                  editable={editableFields.indian_pattern}
                  onEdit={() => enableEdit("indian_pattern")}
                  onBlur={() => disableEdit("indian_pattern")}
                />
              </div>

              <div>
                <Label>
                  Substitute <i>IN</i> Part No.
                </Label>

                {/* VIEW MODE */}
                {!editableFields.substitute_name ? (
                  <InputWithPencil
                    name="substitute_name"
                    value={normalizeToArray(selectedRow.substitute_name).join(
                      ", ",
                    )}
                    editable={false}
                    onEdit={() => enableEdit("substitute_name")}
                  />
                ) : (
                  /* EDIT MODE */
                  <div
                    onBlur={() => disableEdit("substitute_name")}
                    tabIndex={0} // IMPORTANT for onBlur to work
                    className="outline-none"
                  >
                    <DynamicInputList
                      data={normalizeToArray(selectedRow.substitute_name)}
                      placeholder="Substitute name"
                      onChange={(values) =>
                        setSelectedRow((prev) => ({
                          ...prev,
                          substitute_name: values,
                        }))
                      }
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>Local Terminology</Label>

                {/* VIEW MODE */}
                {!editableFields.local_terminology ? (
                  <InputWithPencil
                    name="local_terminology"
                    value={normalizeToArray(selectedRow.local_terminology).join(
                      ", ",
                    )}
                    editable={false}
                    onEdit={() => enableEdit("local_terminology")}
                  />
                ) : (
                  /* EDIT MODE */
                  <div
                    onBlur={() => disableEdit("local_terminology")}
                    tabIndex={0}
                    className="outline-none"
                  >
                    <DynamicInputList
                      data={normalizeToArray(selectedRow.local_terminology)}
                      placeholder="Local terminology"
                      onChange={(values) =>
                        setSelectedRow((prev) => ({
                          ...prev,
                          local_terminology: values,
                        }))
                      }
                    />
                  </div>
                )}
              </div>

              {/* Critical Spare */}
              <div>
                <Label className="ms-2 mb-1">Critical / Special Tool</Label>
                <RadioGroup defaultValue="no">
                  <div className="flex gap-6 mt-2">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="yes" id="yes" />
                      <Label htmlFor="yes" className="cursor-pointer">
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="no" id="no" />
                      <Label htmlFor="no" className="cursor-pointer">
                        No
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="ms-2 mb-1">Sub Component</Label>
                <InputWithPencil
                  type="text"
                  name="sub_component"
                  value={selectedRow.sub_component}
                  onChange={handleEditChange}
                  editable={editableFields.sub_component}
                  onEdit={() => enableEdit("sub_component")}
                  onBlur={() => disableEdit("sub_component")}
                />
              </div>

              <div>
                <Label className="ms-2 mb-1">Price/Unit Cost</Label>
                <InputWithPencil
                  type="text"
                  name="price_unit"
                  value={selectedRow.price_unit}
                  onChange={handleEditChange}
                  editable={editableFields.price_unit}
                  onEdit={() => enableEdit("price_unit")}
                  onBlur={() => disableEdit("price_unit")}
                />
              </div>
            </div>
            <div className="flex flex-col mt-3">
              <div className="mt-4">
                <Label className="ms-2 mb-1">Loose Tool Accessories</Label>
                <RadioGroup
                  value={isLooseSpare ? "yes" : "no"}
                  onValueChange={(val) => setIsLooseSpare(val === "yes")}
                >
                  <div className="flex gap-6 mt-2">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="yes" id="loose-yes" />
                      <Label htmlFor="loose-yes" className="cursor-pointer">
                        Yes
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="no" id="loose-no" />
                      <Label htmlFor="loose-no" className="cursor-pointer">
                        No
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
              {/* <BoxNoInputs
                value={
                  selectedRow.box_no
                    ? JSON.parse(selectedRow.box_no)
                    : [{ no: "", qn: "" }]
                }
                onChange={(value) => {
                  setSelectedRow((prev) => ({
                    ...prev,
                    box_no: JSON.stringify(value),
                  }));
                }}
              /> */}
              <Label className="ms-2 mb-1 mt-7" htmlFor="box_no">
                Item Storage Distribution
              </Label>

              <BoxNoInputs
                value={
                  selectedRow.box_no
                    ? JSON.parse(selectedRow.box_no)
                    : [{ no: "", qn: "" }]
                }
                onChange={(value) => {
                  setSelectedRow((prev) => ({
                    ...prev,
                    box_no: JSON.stringify(value),
                  }));
                }}
                isLooseSpare={isLooseSpare}
                isBoxnumberDisable={false}
              />
            </div>
            <div className="w-full my-2 mt-6">
              <Label className="ms-2 mb-2 mt-3" htmlFor="image">
                Image
              </Label>
              <div className="relative">
                <MultiImageSelect
                  initialImages={[]}
                  onImagesUpdate={setImagePayload}
                />
              </div>
              <Input
                type="file"
                id="image"
                accept="image/jpeg, image/png, image/webp"
                name="image"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setImage((prev) => ({
                        ...prev,
                        file: file,
                        preview: reader.result,
                      }));
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>

            <div className="w-full mt-6">
              <Label className="ms-2 mb-1">OEM Details</Label>

              <select
                className="w-full border rounded-md p-2"
                value={selectedOem || ""}
                onChange={(e) => {
                  const oemId = e.target.value;
                  if (oemId === "ADD_NEW") {
                    setIsOpenOem(true);
                  } else {
                    const oem = oemList.find((o) => o._id === Number(oemId));
                    setSelectedOem(oemId);

                    if (!oem) return;
                    setInputs((prev) => ({
                      ...prev,
                      oem: oem.name,
                    }));
                  }
                }}
              >
                <option value="">Select OEM</option>

                {oemList.map((oem) => (
                  <option key={oem._id} value={oem._id}>
                    {oem.name}, {oem.id}
                  </option>
                ))}

                <option value="ADD_NEW">➕ Add New OEM</option>
              </select>
            </div>
            <div className="w-full mt-6">
              <Label className="ms-2 mb-1">Vendor / Third Party Supplier</Label>

              <select
                className="w-full border rounded-md p-2"
                value={selectedSupplier}
                onChange={(e) => {
                  const supplierId = e.target.value;

                  if (supplierId === "ADD_NEW") {
                    setIsOpenSupplier(true);
                    return;
                  }

                  setSelectedSupplier(supplierId);

                  const supplier = supplierList.find(
                    (s) => s.id === Number(supplierId),
                  );
                  if (!supplier) return;

                  setInputs((prev) => ({
                    ...prev,
                    supplier: supplier.name,
                  }));
                }}
              >
                <option value="">Select Supplier</option>

                {supplierList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}

                <option value="ADD_NEW">➕ Add New Supplier</option>
              </select>
            </div>

            <div className="w-full mt-6">
              <Label className="ms-2 mb-1">Remarks</Label>
              <Textarea
                placeholder="Remarks"
                name="remarks"
                value={selectedRow.remarks}
                onChange={handleEditChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() =>
                setIsOpen((prev) => ({ ...prev, editSpare: false }))
              }
              variant="outline"
              className="cursor-pointer"
            >
              Cancel
            </Button>

            <Button
              className="text-white hover:bg-primary/85 cursor-pointer"
              // onClick={handleUpdateClick}
              onClick={handleEditSpare}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={obsDialog.open}
        onOpenChange={(open) => setObsDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="!max-w-none w-[48vw] max-w-[950px]">
          <DialogTitle>Confirm OBS Authorised Change</DialogTitle>
          <div className="grid grid-cols-4 gap-4 items-end text-sm">
            <div>
              <Label className="pb-2">
                Existing Authorised Qty<span className="text-red-500">*</span>
              </Label>
              <Input value={originalObsAuthorised} disabled />
            </div>

            {/* Action */}
            <div>
              <Label className="pb-2">Action<span className="text-red-500">*</span></Label>
              <select
                className="w-full border rounded h-9 px-2"
                value={obsDialog.action}
                onChange={(e) =>
                  setObsDialog((prev) => ({
                    ...prev,
                    action: e.target.value,
                  }))
                }
              >
                <option value="increase">Increase</option>
                <option value="decrease">Decrease</option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <Label className="pb-2">Qty (Inc/Dec)<span className="text-red-500">*</span></Label>
              <Input
                required
                type="number"
                value={obsDialog.quantity}
                onChange={(e) =>
                  setObsDialog((prev) => ({
                    ...prev,
                    quantity: e.target.value,
                  }))
                }
              />
            </div>

            {/* Final Expected Quantity */}
            <div>
              <Label className="pb-2">Final Expected Qty<span className="text-red-500">*</span></Label>
              <Input
                disabled
                value={
                  obsDialog.quantity
                    ? obsDialog.action === "increase"
                      ? Number(originalObsAuthorised) +
                        Number(obsDialog.quantity)
                      : Number(originalObsAuthorised) -
                        Number(obsDialog.quantity)
                    : originalObsAuthorised
                }
              />
            </div>
          </div>
          {obsDialog.action === "increase" && (
            <div className="pt-3 border-t">
              <p className="font-medium text-sm mb-2">Quote Authority<span className="text-red-500"> *</span></p>

              <div>
                <Label className="pb-2">Letter / Fax / Signal Details </Label>
                <Input
                  required
                  placeholder="Enter reference details"
                  value={obsDialog.quoteAuthority}
                  onChange={(e) =>
                    setObsDialog((prev) => ({
                      ...prev,
                      quoteAuthority: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="mt-3">
                <Label>Confirm Demand Generated<span className="text-red-500">*</span></Label>
                <div className="flex gap-6 mt-1">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="demandGenerated"
                      value="yes"
                      checked={obsDialog.demandGenerated === "yes"}
                      onChange={() =>
                        setObsDialog((prev) => ({
                          ...prev,
                          demandGenerated: "yes",
                        }))
                      }
                    />
                    Yes
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="demandGenerated"
                      value="no"
                      checked={obsDialog.demandGenerated === "no"}
                      onChange={() =>
                        setObsDialog((prev) => ({
                          ...prev,
                          demandGenerated: "no",
                          internalDemandNo: "",
                          internalDemandDate: "",
                          requisitionNo: "",
                          requisitionDate: "",
                          moDemandNo: "",
                          moDemandDate: "",
                        }))
                      }
                    />
                    No
                  </label>
                </div>
              </div>

              {obsDialog.demandGenerated === "yes" && (
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div>
                    <Label className="pb-3">Internal Demand No.<span className="text-red-500">*</span></Label>
                    <Input
                      required
                      placeholder="Enter Demand No."
                      value={obsDialog.internalDemandNo}
                      onChange={(e) =>
                        setObsDialog((prev) => ({
                          ...prev,
                          internalDemandNo: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <FormattedDatePicker
                    label="Date *"
                    value={obsDialog.internalDemandDate}
                    onChange={(val) =>
                      setObsDialog((prev) => ({
                        ...prev,
                        internalDemandDate: val,
                      }))
                    }
                  />
                </div>
              )}

              {isInternalFilled && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <Label className="pb-3">Requisition No.</Label>
                    <Input
                      value={obsDialog.requisitionNo}
                      onChange={(e) =>
                        setObsDialog((prev) => ({
                          ...prev,
                          requisitionNo: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <FormattedDatePicker
                    label="Date"
                    value={obsDialog.requisitionDate}
                    onChange={(val) =>
                      setObsDialog((prev) => ({
                        ...prev,
                        requisitionDate: val,
                      }))
                    }
                  />
                </div>
              )}

              {isRequisitionFilled && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <Label className="pb-3">MO Demand No.</Label>
                    <Input
                      value={obsDialog.moDemandNo}
                      onChange={(e) =>
                        setObsDialog((prev) => ({
                          ...prev,
                          moDemandNo: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <FormattedDatePicker
                    label="Date"
                    value={obsDialog.moDemandDate}
                    onChange={(val) =>
                      setObsDialog((prev) => ({
                        ...prev,
                        moDemandDate: val,
                      }))
                    }
                  />
                </div>
              )}
            </div>
          )}

          {obsDialog.action === "decrease" && (
            <div className="pt-3 border-t space-y-4">
              <BoxNoInputsSimple
                value={boxNo}
                onChange={setBoxNo}
                isLooseSpare={isLooseSpare}
                isBoxnumberDisable={false}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setObsDialog((prev) => ({ ...prev, open: false }))}
            >
              Cancel
            </Button>

            <Button
              onClick={() => {
                // Qty validation (required)
                // if (!obsDialog.quantity || Number(obsDialog.quantity) <= 0) {
                //   toaster("error", "Qty (Increase / Decrease) is required");
                //   return;
                // }

                if (!obsDialog.quantity || Number(obsDialog.quantity) == 0) {
                  toaster("error", "Qty (Increase / Decrease) is required");
                  return;
                }

                if (!obsDialog.quantity || Number(obsDialog.quantity) <= 0) {
                  toaster("error", "Invalid Qty");
                  return;
                }

                // Increase-specific validations
                if (obsDialog.action === "increase") {
                  if (!obsDialog.quoteAuthority?.trim()) {
                    toaster("error", "Quote Authority is required");
                    return;
                  }

                  // Yes / No mandatory check
                  if (!obsDialog.demandGenerated) {
                    toaster(
                      "error",
                      "Please confirm whether Demand is generated (Yes / No)",
                    );
                    return;
                  }

                  if (obsDialog.demandGenerated === "yes") {
                    if (!obsDialog.internalDemandNo?.trim()) {
                      toaster("error", "Internal Demand No is required");
                      return;
                    }

                    if (!obsDialog.internalDemandDate) {
                      toaster("error", "Internal Demand Date is required");
                      return;
                    }
                  }
                }

                // Calculate final value
                const finalValue =
                  obsDialog.action === "increase"
                    ? Number(originalObsAuthorised) + Number(obsDialog.quantity)
                    : Number(originalObsAuthorised) -
                      Number(obsDialog.quantity);

                setSelectedRow((prev) => ({
                  ...prev,
                  obs_authorised: finalValue.toString(),
                }));

                setObsDialog((prev) => ({ ...prev, open: false }));

                toaster("success", "Quantity updated successfully");
              }}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <OEMFirm
        open={isOpenOem}
        onOpenChange={setIsOpenOem}
        value={newVendor}
        setValue={setNewVendor}
        onSubmit={async () => {
          const res = await apiService.post("/oems", newVendor);
          setOemList((prev) => [...prev, res.data]);
          setSelectedOem(res.data._id);
          setInputs((prev) => ({ ...prev, oem: res.data.vendor }));
          setIsOpenOem(false);
        }}
      />
      <SupplierFirm
        open={isOpenSupplier}
        onOpenChange={setIsOpenSupplier}
        value={newSupplier}
        setValue={setNewSupplier}
        onSubmit={async () => {
          const res = await apiService.post("/suppliers", newSupplier);
          setSupplierList((prev) => [...prev, res.data]);
          setSelectedSupplier(res.data._id);
          setInputs((prev) => ({ ...prev, supplier: res.data.supplier }));
          setIsOpenSupplier(false);
        }}
      />
    </div>
  );
};

export default Tools;
