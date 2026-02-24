import { useState, useEffect, useMemo, use, useContext } from "react";
import { FaMagnifyingGlass, FaPlus } from "react-icons/fa6";
import { MultiSelect } from "../components/ui/multi-select";
import InputWithPencil from "../components/ui/InputWithPencil";
import { IoMdRefresh } from "react-icons/io";
import ActionIcons from "../components/ActionIcons";

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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../components/ui/hover-card";

import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { formatDate, getISTTimestamp } from "../utils/helperFunctions";
import { FormattedDatePicker } from "@/components/FormattedDatePicker";

import PaginationTable from "../components/PaginationTableTwo";
import toaster from "../utils/toaster";
import apiService from "../utils/apiService";
import { Context } from "../utils/Context";
import { imageBaseURL } from "../utils/baseURL";
import ImagePreviewDialog from "../components/ImagePreviewDialog";
import { Table, TableBody, TableCell, TableRow } from "../components/ui/table";
import { cn } from "../lib/utils";
import BoxNoInputs from "../components/BoxNoInputs";
import BoxNoConfirmObs from "../components/BoxNoConfirmObs";
import DynamicInputList from "../components/DynamicInputList";
import MultiImageSelect from "../components/MultiImageSelect";
import BoxNoWithdrawl from "../components/BoxNoWithdrawl";
import OEMFirm from "../components/OEMFirm";
import SupplierFirm from "../components/Supplier";
import ComboBox from "../components/ComboBox";
import AsyncSelectBox, {
  DefaultRenderDetail,
} from "../components/AsyncSelectBox";
import ServicePersonnelSearch from "../components/ServicePersonnelSearch";
import ServicePersonnel from "../components/ServicePersonnel";

//search fields
const SEARCH_FIELDS = [
  { label: "Item Description", value: "description" },
  { label: "Equipment / System", value: "equipment_system" },
  { label: "Denos", value: "denos" },
  { label: "OBS Authorised", value: "obs_authorised" },
  { label: "OBS Maintained", value: "obs_maintained" },
  { label: "OBS Held", value: "obs_held" },
  { label: "Item Storage Distribution", value: "boxNo" },
  { label: "Location of Storage", value: "storage_location" },
  { label: "Item Distribution", value: "item_distribution" },
  { label: "IN Part No.", value: "indian_pattern" },
  { label: "Item Code", value: "item_code" },
  { label: "Price/Unit", value: "price_unit" },
  { label: "Sub Component", value: "sub_component" },
];

const Tools = ({ type = "" }) => {
  const { config, fetchIssueTo, fetchConcurredBy, issueTo, concurredBy } =
    useContext(Context);
  const COMMON_WIDTH = "max-w-[200px]";
  const columns = useMemo(
    () => [
      { key: "description", header: "Item Description", width: COMMON_WIDTH },
      {
        key: "indian_pattern",
        header: (
          <span>
            <i>IN</i> Part No.
          </span>
        ),
        width: COMMON_WIDTH,
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
        width: COMMON_WIDTH,
      },
      { key: "category", header: "Category", width: COMMON_WIDTH },
      { key: "denos", header: "Denos", width: COMMON_WIDTH },
      {
        key: "obs_authorised",
        header: (
          <span>
            OBS Authorised/
            <br />
            Maintained
          </span>
        ),
        width: COMMON_WIDTH,
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
        width: COMMON_WIDTH,
      },
      { key: "boxNo", header: "Box No.", width: COMMON_WIDTH },
      {
        key: "itemDistribution",
        header: "Item Distribution",
        width: COMMON_WIDTH,
      },
      { key: "location", header: "Location of Storage", width: COMMON_WIDTH },
      { key: "edit", header: "Actions", width: COMMON_WIDTH },
    ],
    [],
  );

  const [open, setOpen] = useState(false);
  const [originalObsAuthorised, setOriginalObsAuthorised] = useState(null);

  const [obsDialog, setObsDialog] = useState({
    open: false,
    action: "increase",
    quantity: "",

    demandGenerated: "",
    internalDemandNo: "",
    // internalDemandDate: new Date(),
    internalDemandDate: null,

    requisitionNo: "",
    // requisitionDate: new Date(),
    requisitionDate: null,

    moDemandNo: "",
    // moDemandDate: new Date(),
    moDemandDate: null,
    quoteAuthority: "",
  });

  const [isLooseSpare, setIsLooseSpare] = useState(false);
  const [users, setUsers] = useState([
    { service_no: "", name: "", isNewUser: false },
  ]);
  const [user, setUser] = useState();

  const [date, setDate] = useState(new Date());
  const [editableFields, setEditableFields] = useState({
    substitute_name: false,
    local_terminology: false,
  });
  const [loading, setLoading] = useState(false);
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
    description: "",
    equipment_system: "",
    denos: "",
    obs_authorised: "",
    obs_maintained: "",
    obs_held: "",
    b_d_authorised: "",
    category: "",
    box_no: "",
    substitute_name: [],
    local_terminology: [],
    item_code: "",
    price_unit: "",
    sub_component: "",
    indian_pattern: "",
    storage_location: "",
    storage_type: "",
    remarks: "",
    oem: "",
    supplier: "",
    critical_tool: "no",
  });

  const [isOpen, setIsOpen] = useState({
    addSpare: false,
    editSpare: false,
    deleteSpare: false,
    withdrawDialog: false,
  });
  const [selectedRow, setSelectedRow] = useState({
    critical_tool: "no",
  });
  const [image, setImage] = useState({
    preview: null,
    file: null,
    previewEdit: null,
    fileEdit: null,
  });
  const [panelProduct, setPanelProduct] = useState({
    description: "",
    imgUrl: "",
    critical_tool: "no",
  });
  const [boxNo, setBoxNo] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState("parmenent");

  const [selectedRowIndex, setSelectedRowIndex] = useState(null);

  const [oemList, setOemList] = useState([]);
  const [supplierList, setSupplierList] = useState([]);
  const [selectedOem, setSelectedOem] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedAddSupplier, setSelectedAddSupplier] = useState(null);

  const [isOpenOem, setIsOpenOem] = useState({ add: false, edit: false });
  const [selectedOEM, setSelectedOEM] = useState(null);
  const [isOpenSupplier, setIsOpenSupplier] = useState(false);
  const [newValue, setNewValue] = useState(null);
  const [dropdownType, setDropdownType] = useState(null); // "issue" | "concurred_by"

  const [newSupplier, setNewSupplier] = useState({
    supplier: "",
    address: "",
    contacts: [""],
    persons: [{ prefix: "Mr", name: "", designation: "", phone: "" }],
  });

  const [savedRow, setSavedRow] = useState(null);
  const [savedHeld, setSavedHeld] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState({
    person: null,
    tempPerson: null,
    loanPerson: null,
    options: [],
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

  const fetchSigleOem = async (id) => {
    try {
      const res = await apiService.get(`/oem/${id}`);
      return res.data;
    } catch (error) {
      console.error("Failed to fetch OEM details", error);
      return null;
    }
  };

  const addToDropdown = async (type, value) => {
    try {
      const data = {
        type: [type],
        attr: [value],
      };

      const response = await apiService.post("/config/add", data);

      if (response.success) {
        toaster("success", "Data Added");

        if (type === "issue") {
          await fetchIssueTo();
        }

        if (type === "concurred_by") {
          await fetchConcurredBy();
        }
      }
    } catch (error) {
      console.error(error);
      toaster("error", "Failed to add");
    }
  };

  const handleOptionWithdrawl = (e) => {
    const { name, value } = e.target;

    if (name === "issue_to" && value === "OTHER") {
      setSelectedRow((prev) => ({
        ...prev,
        issue_to: "OTHER",
        issue_to_text: "",
      }));
      return;
    }

    setSelectedRow((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const [newVendor, setNewVendor] = useState({
    vendor: "",
    address: "",
    contacts: [""],
    persons: [{ prefix: "Mr", name: "", designation: "", phone: "" }],
  });

  const [imagePayload, setImagePayload] = useState({
    imageStatus: [],
    newImageFiles: {},
  });

  const addNewUserField = () => {
    setUsers((prev) => [
      ...prev,
      { service_no: "", name: "", isNewUser: false },
    ]);
  };
  const removeUserField = (index) => {
    setUsers((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index),
    );
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

  const updateDynamicInputs = (newValues, fieldName) => {
    setInputs((prev) => ({
      ...prev,
      [fieldName]: newValues,
    }));
  };

  //Service NO.
  const fetchSuppliers = async () => {
    try {
      const res = await apiService.get(`/supplier/list`);
      setSupplierList(Array.isArray(res?.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch suppliers", error);
      setSupplierList([]);
    }
  };
  const fetchOems = async () => {
    try {
      const res = await apiService.get(`/oem/list`);
      setOemList(Array.isArray(res?.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch oems", error);
      setOemList([]);
    }
  };

  const fetchOemOptions = async (query = "") => {
    try {
      const res = await apiService.get(`/oem/all`);
      const items =
        res.data?.items?.map((item) => ({ id: item.id, name: item.name })) ||
        [];
      if (!query) return items;
      return items.filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase()),
      );
    } catch (error) {
      console.error("Failed to fetch OEM options", error);
      return [];
    }
  };
  const onDeleteOem = async (id) => {
    try {
      const res = await apiService.delete(`/oem/${id}`);
      if (res.success) {
        toaster("success", "OEM deleted successfully");
        fetchOems();
        if (selectedOem === id) {
          setSelectedOem(null);
          setInputs((prev) => ({ ...prev, oem: "" }));
        }
      } else {
        toaster("error", res.message || "Failed to delete OEM");
      }
    } catch (error) {
      console.error(error);
      toaster("error", "Failed to delete OEM");
    }
  };
  const fetchSupplierOptions = async (query = "") => {
    try {
      const res = await apiService.get(`/supplier/all`);
      const items =
        res.data?.items?.map((item) => ({ id: item.id, name: item.name })) ||
        [];
      if (!query) return items;
      return items.filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase()),
      );
    } catch (error) {
      console.error("Failed to fetch Supplier options", error);
      return [];
    }
  };

  const onDeleteSupplier = async (id) => {
    try {
      const res = await apiService.delete(`/supplier/${id}`);
      if (res.success) {
        toaster("success", "Supplier deleted successfully");
        fetchSuppliers();
        if (selectedSupplier?.id === id) {
          setSelectedSupplier(null);
          setInputs((prev) => ({ ...prev, supplier: "" }));
        }
      } else {
        toaster("error", res.message || "Failed to delete Supplier");
      }
    } catch (error) {
      console.error(error);
      toaster("error", "Failed to delete Supplier");
    }
  };
  const fetchSupplierDetails = async (id) => {
    try {
      const res = await apiService.get(`/supplier/${id}`);
      return res.data;
    } catch (error) {
      console.error("Failed to fetch Supplier details", error);
      return null;
    }
  };
  const fetchPersonnelOptions = async () => {
    try {
      const res = await apiService.get(`/config/personnel`);
      if (res.success) {
        setSelectedPerson((prev) => ({ ...prev, options: res.data }));
      }
    } catch (error) {
      console.error("Failed to fetch Personnel options", error);
    }
  };

  const handleAddPersonnel = async (person) => {
    try {
      const res = await apiService.post(`/config/add`, {
        attr: [person.serviceNumber, person.name, person.rank, person.phone_no],
        type: "service_no",
      });
      if (res.success) {
        toaster("success", "Personnel added successfully");
        fetchPersonnelOptions();
      } else {
        toaster("error", res.message || "Failed to add personnel");
      }
    } catch (error) {
      console.error("Failed to add personnel", error);
      toaster("error", "Failed to add personnel");
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchOems();
    fetchPersonnelOptions();
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({
      ...prev,
      [name]: value.toUpperCase(),
    }));
  };
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (value.indexOf("-") >= 0) return;
    setSelectedRow((prev) => ({
      ...prev,
      [name]: value.toUpperCase(),
    }));
  };
  const fetchdata = async (searchValue = inputs.search, page = currentPage) => {
    try {
      const response = await apiService.get(
        type == "critical"
          ? "/tools/critical"
          : type == "low-stock"
            ? "/tools/low-stock"
            : "/tools",
        {
          params: {
            page,
            search: searchValue,
            limit: config.row_per_page,
          },
        },
      );
      setFetchedData(response.data);
    } catch (error) {}
  };

  const handleaddSpare = async () => {
    try {
      let s = 0,
        s1 = 0,
        s2 = 0;

      // Validate boxNo exists and parseable
      const boxes = Array.isArray(boxNo) ? boxNo : JSON.parse(boxNo || "[]");
      if (!boxes.length) {
        toaster("error", "Item Storage Distribution is required");
        return;
      }

      for (let i = 0; i < boxes.length; i++) {
        const { no, location, qtyHeld, qn, qnMain } = boxes[i];

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

        if (qnMain === "" || qnMain === null || isNaN(qnMain)) {
          toaster("error", `Qty Maintained is required in row ${i + 1}`);
          return;
        }

        if (!location?.trim()) {
          toaster("error", `Location is required in row ${i + 1}`);
          return;
        }
      }

      for (let i = 0; i < boxes.length; i++) {
        const qty = boxes[i].qn;
        if (isNaN(parseInt(qty)) || parseInt(qty) < 0) {
          toaster("error", "Invalid Authorised Qty");
          return;
        }
        const qty1 = boxes[i].qtyHeld;
        if (isNaN(parseInt(qty1)) || parseInt(qty1) < 0) {
          toaster("error", "Invalid Held Qty");
          return;
        }

        const qty2 = boxes[i].qnMain;
        if (isNaN(parseInt(qty2)) || parseInt(qty2) < 0) {
          toaster("error", "Invalid Maintained Qty");
          return;
        }
        s += Number(boxes[i].qn || 0);
        s1 += Number(qty1 || 0);
        s2 += Number(qty2 || 0);
      }

      const obsAuthorised = Number(inputs.obs_authorised);
      const obsMaintained = Number(inputs.obs_maintained);
      const obsHeld = Number(inputs.obs_held);
      const prevHeld = Number(savedHeld || 0);
      const currentHeld = Number(obsHeld || 0);

      if (s !== obsAuthorised) {
        toaster("error", "Authorised Qty not matched with OBS Authorised");
        return;
      }

      if (s2 !== obsMaintained) {
        toaster("error", "Maintained Qty not matched with OBS Maintained");
        return;
      }

      if (currentHeld < prevHeld) {
        toaster("error", "Follow manual withdrawal procedure");
        return;
      }

      // Qty-Held totals comparison against any existing saved boxes (if present)
      let prevTotal = 0;
      let currentTotal = 0;
      if (savedRow?.box_no) {
        const prevBoxes = JSON.parse(savedRow.box_no);
        for (let i = 0; i < prevBoxes.length; i++) {
          prevTotal += parseInt(prevBoxes[i]?.qtyHeld || 0);
        }
        for (let i = 0; i < boxes.length; i++) {
          currentTotal += parseInt(boxes[i]?.qtyHeld || 0);
        }
        if (currentTotal < prevTotal) {
          toaster("error", "Follow manual withdrawal procedure");
          return;
        }
      }

      if (s1 !== obsHeld) {
        toaster("error", "Qty Held not matched with OBS Held");
        return;
      }

      if (!inputs.description?.trim()) {
        toaster("error", "Description is required");
        return;
      } else if (!inputs.equipment_system?.trim()) {
        toaster("error", "Equipment / System is required");
        return;
      }
      const formData = new FormData();
      // ✅ Append multi images
      Object.values(imagePayload?.newImageFiles || {}).forEach((file) => {
        formData.append("images", file);
      });
      formData.append("is_loose_tool", isLooseSpare);
      formData.append("description", inputs.description || "");
      formData.append("equipment_system", inputs.equipment_system || "");
      formData.append("denos", inputs.denos || "");
      formData.append("obs_authorised", inputs.obs_authorised || "");
      formData.append("obs_maintained", inputs.obs_maintained || "");
      formData.append("obs_held", inputs.obs_held || "");
      formData.append("b_d_authorised", inputs.b_d_authorised || "");
      formData.append("category", selectedRow.category || "");
      formData.append("box_no", JSON.stringify(boxNo));
      formData.append("storage_location", inputs.storage_location || "");
      formData.append("item_code", inputs.item_code || "");
      formData.append("price_unit", inputs.price_unit || "");
      formData.append("sub_component", inputs.sub_component || "");
      formData.append("indian_pattern", inputs.indian_pattern || "");
      formData.append("remarks", inputs.remarks || "");
      formData.append("oem", inputs.oem || "");
      formData.append("substitute_name", inputs.substitute_name || "");
      formData.append("local_terminology", inputs.local_terminology || "");
      formData.append(
        "critical_tool",
        inputs.critical_tool == "yes" ? 1 : 0 || 0,
      );
      formData.append("supplier", inputs.supplier || "");
      const response = await apiService.post("/tools", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const createdToolId =
        response?.data?.insertId ||
        response?.data?.data?.insertId ||
        response?.insertId;

      // if (!createdSpareId) {
      //   toaster("error", "Spare ID not returned from server");
      //   return;
      // }

      // ✅ Call Special Demand API
      const specialPayload = {
        tool_id: createdToolId,
        obs_authorised: Number(inputs.obs_authorised) || 0,
        obs_increase_qty: Number(inputs.obs_authorised) || 0,
        obs_maintained: Number(inputs.obs_maintained) || 0,
        obs_held: Number(inputs.obs_held) || 0,
        maintained_qty: Number(inputs.obs_maintained) || 0,
        qty_held: Number(inputs.obs_held) || 0,
        box_no: boxNo,
      };

      console.log("specialPayload==>", specialPayload);
      await apiService.post("/specialDemand/d787", specialPayload);
      if (response.success) {
        toaster("success", "Tool added successfully");
        setIsOpen({ ...isOpen, addSpare: false });
        fetchdata();
        setInputs({
          description: "",
          equipment_system: "",
          denos: "",
          obs_authorised: "",
          obs_maintained: "",
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
          critical_tool: "",
          oem: "",
          supplier: "",
        });
        setSelectedOem(null);
        setSelectedAddSupplier(null);
        setBoxNo([]);
        setImage({ file: null, preview: null });
        setIsLooseSpare(false);
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message || error.message || "Failed to add tool";
      toaster("error", errMsg);
    }
  };

  const resetImageState = () => {
    setImagePayload({
      newImageFiles: {},
      imageStatus: [],
    });

    setImage({
      fileEdit: null,
      preview: null,
    });
  };

  const handleEditSpare = async () => {
    try {
      let s = 0,
        s1 = 0,
        s2 = 0;

      const boxes = JSON.parse(selectedRow.box_no || "[]");

      if (!boxes.length) {
        toaster("error", "Item Storage Distribution is required");
        return;
      }

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
      }
      // console.log("selected row==>", selectedRow);
      for (let i = 0; i < boxes.length; i++) {
        const qty = boxes[i].qn;
        if (isNaN(parseInt(qty)) || parseInt(qty) < 0) {
          toaster("error", "Invalid Authorised Qty");
          return;
        }
        const qty1 = boxes[i].qtyHeld;
        if (isNaN(parseInt(qty1)) || parseInt(qty1) < 0) {
          toaster("error", "Invalid Held Qty");
          return;
        }

        const qty2 = boxes[i].qnMain;
        if (isNaN(parseInt(qty2)) || parseInt(qty2) < 0) {
          toaster("error", "Invalid Maintained Qty");
          return;
        }

        s += Number(boxes[i].qn || 0);
        s1 += Number(qty1 || 0);
        s2 += Number(qty2 || 0);
      }

      const obsAuthorised = Number(selectedRow.obs_authorised);
      const obsMaintained = Number(selectedRow.obs_maintained);
      const obsHeld = Number(selectedRow.obs_held);

      // QN must match authorised
      if (s !== obsAuthorised) {
        toaster("error", "Authorised Qty not matched with OBS Authorised");
        return;
      }

      if (s2 !== obsMaintained) {
        toaster("error", "Maintained Qty not matched with OBS Maintained");
        return;
      }

      //OBS-Held wrong logic
      // let prevHeld = 0;
      // let currentHeld = 0;

      // for (let i = 0; i < obsHeld.length; i++) {
      //   prevHeld += parseInt(savedHeld || 0);
      //   currentHeld += parseInt(obsHeld || 0);
      // }

      //corrected OBS Held
      const prevHeld = Number(savedHeld || 0);
      const currentHeld = Number(obsHeld || 0);

      if (currentHeld < prevHeld) {
        toaster("error", "Follow manual withdrawal procedure");
        return;
      }

      //Qty-Held
      let prevTotal = 0;
      let currentTotal = 0;
      const prevBoxes = JSON.parse(savedRow.box_no);

      for (let i = 0; i < prevBoxes.length; i++) {
        prevTotal += parseInt(prevBoxes[i]?.qtyHeld || 0);
        currentTotal += parseInt(boxes[i]?.qtyHeld || 0);
      }

      if (currentTotal < prevTotal) {
        toaster("error", "Follow manual withdrawal procedure");
        return;
      }
      // Held must match OBS held
      if (s1 !== obsHeld) {
        toaster("error", "Qty Held not matched with OBS Held");
        return;
      }

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
      Object.entries(imagePayload?.newImageFiles || {}).forEach(
        ([index, file]) => {
          formData.append(`images_${index}`, file);
        },
      );
      formData.append(
        "imageStatus",
        JSON.stringify(imagePayload?.imageStatus || []),
      );
      formData.append("description", selectedRow.description || "");
      formData.append("equipment_system", selectedRow.equipment_system || "");
      formData.append("denos", selectedRow.denos || "");
      formData.append("obs_authorised", selectedRow.obs_authorised || "");
      formData.append("obs_maintained", selectedRow.obs_maintained || "");
      formData.append("obs_held", selectedRow.obs_held || "");
      formData.append("b_d_authorised", selectedRow.b_d_authorised || "");
      formData.append("category", selectedRow.category || "");
      formData.append("box_no", selectedRow.box_no || "");
      formData.append("item_code", selectedRow.item_code || "");
      formData.append("price_unit", selectedRow.price_unit || "");
      formData.append("sub_component", selectedRow.sub_component || "");
      formData.append("storage_location", selectedRow.storage_location || "");
      formData.append("indian_pattern", selectedRow.indian_pattern || "");
      formData.append("remarks", selectedRow.remarks || "");
      formData.append("oem", selectedRow.oem || "");
      formData.append("substitute_name", selectedRow.substitute_name || "");
      formData.append("local_terminology", selectedRow.local_terminology || "");
      formData.append("critical_tool", selectedRow.critical_tool);
      formData.append("supplier", selectedRow.supplier || "");
      const response = await apiService.post(
        "/tools/update/" + selectedRow.id,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      if (response.success) {
        toaster("success", "Tool updated successfully");
        resetImageState(); // clear image payload
        setSelectedRow({}); // clear edit data

        setIsOpen({ ...isOpen, editSpare: false });
        fetchdata();
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong";
      toaster("error", errMsg);
    }
  };

  const handleRefresh = () => {
    setInputs((prev) => ({
      ...prev,
      search: "",
    }));

    setSelectedSearchFields([]);

    setCurrentPage(1);

    setActualSearch("");

    setSelectedRowIndex(null);

    setPanelProduct({ critical_tool: "no" });

    fetchdata("", 1);
  };

  useEffect(() => {
    const fetchOems = async () => {
      try {
        const res = await apiService.get("/oem/list");
        setOemList(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchOems();
  }, []);

  useEffect(() => {
    setBoxNo(
      selectedRow.box_no
        ? JSON.parse(selectedRow.box_no)
        : [{ no: "", qn: "", qtyHeld: "", location: "" }],
    );
  }, [selectedRow.box_no]);

  const submitTemporaryIssue = async (payload) => {
    try {
      const res = await apiService.post("/temporaryIssue/temporary", payload);
      if (res.success) {
        toaster("success", "Temporary Issue created successfully");
        console.log(boxNo);

        setBoxNo([{ withdraw: "" }]);
        await fetchdata();
      }

      setIsOpen((prev) => ({ ...prev, withdrawSpare: false }));
    } catch (err) {
      console.error(err);
      toaster("error", "Server error");
    }
  };

  const submitTyLoan = async (payload) => {
    try {
      const res = await apiService.post("/tyLoan/ty", payload);
      if (res.success) {
        toaster("success", "Ty Loan created successfully");
        console.log(boxNo);

        setBoxNo([{ withdraw: "" }]);
        await fetchdata();
      }

      setIsOpen((prev) => ({ ...prev, withdrawSpare: false }));
    } catch (err) {
      console.error(err);
      toaster("error", "Server error");
    }
  };

  const submitPermanentIssue = async () => {
    if (!selectedPerson?.person?.serviceNumber) {
      toaster("error", "Service No is required");
      return;
    }
    try {
      const res = await apiService.post("/survey/create", {
        box_no: boxNo,
        tool_id: selectedRow.id,
        withdrawl_qty: selectedRow.new_val,
        withdrawl_date: formatDate(),
        service_no: selectedPerson.person?.serviceNumber,
        name: selectedPerson.person?.name,
        issue_to: selectedRow.issue_to_text,
      });
      if (res.success) {
        toaster("success", "Survey created successfully");
        setBoxNo([{ withdraw: "" }]);
        await fetchdata();
        setIsOpen((prev) => ({ ...prev, withdrawSpare: false }));
      }
    } catch (error) {
      console.error(error);
      toaster("error", "Server error");
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!tableData?.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedRowIndex((prev) =>
          prev === null ? 0 : Math.min(prev + 1, tableData.length - 1),
        );
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedRowIndex((prev) =>
          prev === null ? 0 : Math.max(prev - 1, 0),
        );
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
      itemDistribution: (row.box_no
        ? JSON.parse(row.box_no)
        : [{ no: "", qn: "" }]
      )
        ?.map((box) => box.qtyHeld)
        ?.join(", "),
      location: (row.box_no ? JSON.parse(row.box_no) : [{ no: "", qn: "" }])
        ?.map((box) => box.location)
        ?.join(", "),

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
            setSelectedRow(row);
            setSavedRow(JSON.parse(JSON.stringify(row)));
            setSavedHeld(Number(row.obs_held || 0));
            setIsOpen((prev) => ({ ...prev, editSpare: true }));
          }}
          onWithdraw={(row) => {
            if (row.image) {
              setImage((prev) => ({
                ...prev,
                previewEdit: imageBaseURL + row.image,
              }));
            }
            setSelectedRow(row);
            setIsOpen((prev) => ({ ...prev, withdrawSpare: true }));
          }}
          onShowQR={(row) => {
            setSelectedRow(row);
            setIsOpen((prev) => ({ ...prev, qrDialog: true }));
          }}
        />
      ),

      // delete: (
      //     <Button
      //         variant="ghost"
      //         className="text-red-600 hover:text-red-700 hover:bg-red-100"
      //         onClick={() => {
      //             setSelectedRow(row);
      //             setIsOpen({ ...isOpen, deleteSpare: true });
      //         }}
      //     >
      //         <HiTrash />
      //     </Button>
      // ),
    }));

    console.log("Transformed table data:", t);
    setTableData(t);
    // ✅ Always select first row if available
    if (t.length > 0) {
      setSelectedRowIndex(0);
      setPanelProduct(t[0]); // also update right-side panel immediately
    } else {
      setSelectedRowIndex(null);
      setPanelProduct({ critical_tool: "no" });
    }
  }, [fetchedData]);

  return (
    <div className="px-2 w-full h-[calc(100vh-135px)] flex">
      <div className="h-full  w-[calc(100%-308px)]">
        <div className="mb-2">
          <MultiSelect
            className="bg-white hover:bg-blue-50"
            options={SEARCH_FIELDS}
            value={selectedSearchFields}
            onValueChange={setSelectedSearchFields}
            placeholder="Search Fields"
          />
        </div>

        <div className="flex items-center mb-4 gap-2 w-full">
          <Input
            type="text"
            placeholder="Search tools..."
            className="bg-white"
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

          {/* 🔄 Refresh Button */}
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
              className="size-6 
               hover:rotate-180 
               transition-transform duration-300"
              style={{
                color: "#109240",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            />
            <span className="text-md font-bold text-green-700">Reset</span>
          </Button>

          <Button
            onClick={() => {
              setIsOpen({ ...isOpen, addSpare: true });
              setBoxNo([{}]);
            }}
            className="cursor-pointer hover:bg-primary/85"
          >
            <FaPlus /> Add Tools
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
            bodyClassName="tools-table"
            selectedRowIndex={selectedRowIndex}
            onClickRow={(row, index) => {
              setSelectedRowIndex(index);
              setPanelProduct(row);
            }}
          />
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
            <p className="text-sm text-gray-500">No tools is selected</p>
          </div>
        )}
        {panelProduct.description && (
          <div className="h-full">
            <div className="w-full justify-center flex">
              <ImagePreviewDialog
                className="w-72 h-72 object-contain rounded-md border"
                image={panelProduct.images}
              />
            </div>
            <div className="max-h-[calc(100%-288px)] overflow-y-auto description-table">
              <Table className="mt-2">
                <TableBody className="">
                  <TableRow>
                    <TableCell>
                      Sub Component<span className="text-red-500">*</span>
                    </TableCell>
                    <TableCell>{panelProduct.sub_component || "--"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Substitute Part No.</TableCell>
                    <TableCell>
                      {panelProduct.substitute_name || "--"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Critical Tools</TableCell>
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
          className="w-[95%] max-h-[90%] overflow-y-auto"
          unbounded={true}
          // onPointerDownOutside={() => {}}
          onPointerDownOutside={(e) => e.preventDefault()}
          onCloseAutoFocus={() => {
            setInputs({ search: inputs.search });
            setBoxNo([
              {
                boxNumber: "",
                quantity: "",
              },
            ]);
            setSelectedOem(null);
            setSelectedAddSupplier(null);
            setImage({ file: null, preview: null });
            setIsLooseSpare(false);
          }}
        >
          <button
            type="button"
            onClick={() => setIsOpen((prev) => ({ ...prev, addSpare: false }))}
            className="sticky top-0 ml-auto block z-20 rounded-sm bg-background opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
          >
            ✕
          </button>
          <DialogTitle className="relative text-base -mt-10">
            Add Tools
          </DialogTitle>
          <DialogDescription className="hidden" />
          <div className="-mt-4">
            <div className="space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="ms-2 mb-1">
                    Item Description<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="description"
                    value={inputs.description}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label className="ms-2 mb-1">
                    Equipment / System<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="equipment_system"
                    value={inputs.equipment_system}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label className="ms-2 mb-1">
                    Denos<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="denos"
                    value={inputs.denos}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label className="ms-2 mb-1">
                    OBS Authorised<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="obs_authorised"
                    value={inputs.obs_authorised}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="ms-2 mb-1">
                    OBS Maintained<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="obs_maintained"
                    value={inputs.obs_maintained}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label className="ms-2 mb-1">
                    OBS Held<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="obs_held"
                    value={inputs.obs_held}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label className="ms-2 mb-1">
                    B & D Authorised<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="b_d_authorised"
                    value={inputs.b_d_authorised}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label className="mb-2">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <select
                    name="category"
                    value={selectedRow.category || ""}
                    onChange={handleEditChange}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="P">P</option>
                    <option value="R">R</option>
                    <option value="C">C</option>
                    <option value="LP">LP</option>
                    <option value="NA">NA</option>
                  </select>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="ms-2 mb-1">
                    Item Code<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="item_code"
                    value={inputs.item_code}
                    onChange={handleChange}
                  />
                </div>
                {/* IN Part No */}
                <div>
                  <Label className="ms-2 mb-1">
                    <i>IN</i> Part No.<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="indian_pattern"
                    value={inputs.indian_pattern}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label className="ms-2 mb-1">
                    Substitute <i>IN</i> Part No.
                    <span className="text-red-500">*</span>
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
                  <Label className="ms-2 mb-1">
                    Local Terminology<span className="text-red-500">*</span>
                  </Label>
                  <DynamicInputList
                    id="local_terminology"
                    data={inputs.local_terminology}
                    placeholder="Local Terminology"
                    onChange={(values) => {
                      updateDynamicInputs(values, "local_terminology");
                      // console.log(JSON.stringify(values), values.join(","));
                      // const joined = values.join(",");
                      // const arr = joined.split(",");
                      // console.log(joined, arr);
                    }}
                    editable={editableFields.local_terminology}
                    onEdit={() => enableEdit("local_terminology")}
                    onBlur={() => disableEdit("local_terminology")}
                  />
                </div>

                <div>
                  <div>
                    <Label className="ms-2 mb-1">
                      Critical Tool<span className="text-red-500">*</span>
                    </Label>

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
                          <Label
                            htmlFor="critical_yes"
                            className="cursor-pointer"
                          >
                            Yes
                          </Label>
                        </div>

                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="no" id="critical_no" />
                          <Label
                            htmlFor="critical_no"
                            className="cursor-pointer"
                          >
                            No
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div>
                  <div>
                    <Label className="ms-2 mb-1">
                      Part of original D787
                      <span className="text-red-500">*</span>
                    </Label>

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
                          <Label
                            htmlFor="critical_yes"
                            className="cursor-pointer"
                          >
                            Yes
                          </Label>
                        </div>

                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="no" id="critical_no" />
                          <Label
                            htmlFor="critical_no"
                            className="cursor-pointer"
                          >
                            No
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div>
                  <Label className="ms-2 mb-1">
                    Sub Component<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="sub_component"
                    value={inputs.sub_component}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label className="ms-2 mb-1">
                    Price/Unit Cost<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    name="price_unit"
                    value={inputs.price_unit}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col mt-5">
              <div className="mt-4">
                <Label className="ms-2 mb-1">Loose Tool</Label>
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

              <Label className="ms-2 mb-1 mt-6" htmlFor="box_no">
                Item Storage Distribution
              </Label>

              <BoxNoInputs
                value={boxNo}
                onChange={setBoxNo}
                isLooseSpare={isLooseSpare}
                addToDropdown={addToDropdown}
              />
            </div>
            <div className="w-full my-2 mt-6">
              <Label className="ms-2 mb-2 mt-3" htmlFor="image">
                Image
              </Label>
              <div className="relative">
                {/* <MultiImageSelect
                  initialImages={selectedRow.images || []}
                  onImagesUpdate={setImagePayload}
                /> */}
                <MultiImageSelect
                  key={isOpen.addSpare ? "add-open" : "add-closed"}
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
            <div className="w-full mt-6 grid grid-cols-2 gap-4">
              <div>
                <Label className="ms-2 mb-1">OEM Details</Label>

                <AsyncSelectBox
                  label="OEM"
                  value={
                    selectedOem ? { id: selectedOem, name: inputs.oem } : null
                  }
                  onChange={(val) => {
                    setSelectedOem(val.id);
                    setInputs((prev) => ({ ...prev, oem: val.name }));
                  }}
                  fetchOptions={fetchOemOptions}
                  fetchDetails={fetchSigleOem}
                  // fetchDetails={async (id) => {
                  //   try {
                  //     const res = await apiService.get(`/oem/${id}`);
                  //     return res.data;
                  //   } catch (error) {
                  //     console.error("Failed to fetch OEM details", error);
                  //     return null;
                  //   }
                  // }}
                  AddNewModal={OEMFirm}
                  onDelete={onDeleteOem}
                />
              </div>

              <div>
                <Label className="ms-2 mb-1">
                  Vendor / Third Party Supplier
                </Label>
                <AsyncSelectBox
                  label="Vendor/ Third Party Supplier"
                  value={
                    selectedAddSupplier
                      ? { id: selectedAddSupplier, name: inputs.supplier }
                      : null
                  }
                  onChange={(val) => {
                    setSelectedAddSupplier(val.id);
                    setInputs((prev) => ({ ...prev, supplier: val.name }));
                  }}
                  fetchOptions={fetchSupplierOptions}
                  fetchDetails={fetchSupplierDetails}
                  AddNewModal={SupplierFirm}
                  onDelete={onDeleteSupplier}
                />
              </div>
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
                onChange={handleChange}
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
          className=" w-[95%] h-[90%] overflow-y-auto"
          unbounded={true}
          // onPointerDownOutside={() => {}}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <button
            type="button"
            onClick={() => setIsOpen((prev) => ({ ...prev, editSpare: false }))}
            className="sticky top-0  ml-auto block z-20 rounded-sm bg-background opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
          >
            ✕
          </button>
          <DialogTitle className="relative text-base -mt-10">
            Update Tools
          </DialogTitle>
          <DialogDescription className="hidden" />
          <div className="-mt-6">
            <div className="grid grid-cols-4 gap-4 mt-3">
              <div>
                <Label>
                  Item Description<span className="text-red-500">*</span>
                </Label>
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
                <Label>
                  Equipment / System<span className="text-red-500">*</span>
                </Label>
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
                <Label>
                  Denos<span className="text-red-500">*</span>
                </Label>
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
                <Label>
                  OBS Authorised<span className="text-red-500">*</span>
                </Label>

                <InputWithPencil
                  name="obs_authorised"
                  value={selectedRow.obs_authorised}
                  readOnly
                  editable={false}
                  onEdit={() => {
                    setObsDialog({
                      open: true,
                      action: "increase",
                      quantity: "",
                    });

                    setOriginalObsAuthorised(selectedRow.obs_authorised);
                  }}
                />
              </div>

              <div>
                <Label>
                  OBS Maintained<span className="text-red-500">*</span>
                </Label>
                <InputWithPencil
                  name="obs_maintained"
                  value={selectedRow.obs_maintained}
                  onChange={handleEditChange}
                  editable={editableFields.obs_maintained}
                  onEdit={() => enableEdit("obs_maintained")}
                  onBlur={() => disableEdit("obs_maintained")}
                />
              </div>

              <div>
                <Label>
                  OBS Held<span className="text-red-500">*</span>
                </Label>
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
                <Label>
                  B & D Authorised<span className="text-red-500">*</span>
                </Label>
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
                <Label className="mb-2">
                  Category <span className="text-red-500">*</span>
                </Label>
                <select
                  name="category"
                  value={selectedRow.category || ""}
                  onChange={handleEditChange}
                  editable={editableFields.category}
                  onEdit={() => enableEdit("category")}
                  onBlur={() => disableEdit("category")}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="P">P</option>
                  <option value="R">R</option>
                  <option value="C">C</option>
                  <option value="LP">LP</option>
                  <option value="NA">NA</option>
                </select>
              </div>

              <div>
                <Label>
                  Item Code<span className="text-red-500">*</span>
                </Label>
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
                  <i>IN</i> Part No.<span className="text-red-500">*</span>
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
                  <span className="text-red-500">*</span>
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
                <Label>
                  Local Terminology<span className="text-red-500">*</span>
                </Label>
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

              <div>
                <Label className="ms-2 mb-1">
                  Critical Tool<span className="text-red-500">*</span>
                </Label>

                <RadioGroup
                  value={selectedRow.critical_tool == 1 ? "yes" : "no"}
                  onValueChange={(value) =>
                    setSelectedRow((prev) => ({
                      ...prev,
                      critical_tool: value == "yes" ? 1 : 0,
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
                <Label className="ms-2 mb-1">
                  Sub Component<span className="text-red-500">*</span>
                </Label>
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
                <Label className="ms-2 mb-1">
                  Price/Unit Cost<span className="text-red-500">*</span>
                </Label>
                <InputWithPencil
                  type="number"
                  name="price_unit"
                  inputMode="numeric"
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
                <Label className="ms-2 mb-1">Loose Tool</Label>
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

              <Label className="ms-2 mb-1 mt-6" htmlFor="box_no">
                Item Storage Distribution
              </Label>

              <BoxNoInputs
                value={selectedRow.box_no ? JSON.parse(selectedRow.box_no) : []}
                onChange={(value) =>
                  setSelectedRow((prev) => ({
                    ...prev,
                    box_no: JSON.stringify(value),
                  }))
                }
                isLooseSpare={isLooseSpare}
              />
            </div>
            <div className="w-full my-2 mt-6">
              <Label className="ms-2 mb-2 mt-3" htmlFor="image">
                Image
              </Label>
              <div className="relative">
                <MultiImageSelect
                  initialImages={selectedRow.images || []}
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

            {selectedRow.old_supplier && (
              <div className=" mt-4 w-full">
                <p className="text-sm ms-2">Old Vendors</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedRow.old_supplier &&
                    selectedRow.old_supplier.map((data, _) => {
                      let supplier_id = supplierList.filter(
                        (s) => s.name == data,
                      );
                      if (supplier_id) {
                        supplier_id = supplier_id[0].id;
                      }

                      return (
                        <HoverCard
                          key={Math.random().toString()}
                          openDelay={10}
                          closeDelay={100}
                        >
                          <HoverCardTrigger asChild>
                            <div className="bg-white px-2 py-1 rounded-full shadow border">
                              {data}
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="flex w-64 flex-col gap-0.5">
                            <DefaultRenderDetail
                              details={{}}
                              isFromOldSuppliers={true}
                              fetchSupplier={async () => {
                                return fetchSupplierDetails(supplier_id);
                              }}
                              onEdit={() => {}}
                              onDelete={() => {}}
                            />
                          </HoverCardContent>
                        </HoverCard>
                      );
                    })}
                </div>
              </div>
            )}

            <div className="w-full mt-6 grid grid-cols-2 gap-4">
              <div>
                <Label className="ms-2 mb-1">OEM Details</Label>
                <AsyncSelectBox
                  label="OEM"
                  value={
                    selectedRow.oem
                      ? {
                          id: oemList.find(
                            (item) => item.name === selectedRow.oem,
                          )?.id,
                          name: selectedRow.oem,
                        }
                      : null
                  }
                  onChange={(val) => {
                    setSelectedRow((prev) => ({
                      ...prev,
                      oem: val.name,
                    }));
                  }}
                  fetchOptions={fetchOemOptions}
                  fetchDetails={async (id) => {
                    if (!id) return null;
                    try {
                      const res = await apiService.get(`/oem/${id}`);
                      return res.data;
                    } catch (error) {
                      console.error("Failed to fetch OEM details", error);
                      return null;
                    }
                  }}
                  AddNewModal={OEMFirm}
                  onDelete={onDeleteOem}
                />
              </div>
              <div>
                <Label className="ms-2 mb-1">
                  Vendor / Third Party Supplier
                </Label>
                <AsyncSelectBox
                  label="Vendor/ Third Party Supplier"
                  value={
                    selectedRow.supplier
                      ? {
                          id: supplierList.find(
                            (item) => item.name === selectedRow.supplier,
                          )?.id,
                          name: selectedRow.supplier,
                        }
                      : null
                  }
                  onChange={(val) => {
                    setSelectedRow((prev) => ({
                      ...prev,
                      supplier: val.name,
                    }));
                  }}
                  fetchOptions={fetchSupplierOptions}
                  fetchDetails={fetchSupplierDetails}
                  AddNewModal={SupplierFirm}
                  onDelete={onDeleteSupplier}
                />
              </div>
            </div>

            <div className="w-full mt-6">
              <Label className="ms-1 mb-1">Remarks</Label>
              <Textarea
                placeholder="Remarks"
                name="remarks"
                className="h-1 resize-none"
                value={selectedRow.remarks}
                onChange={handleEditChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setIsOpen((prev) => ({ ...prev, editSpare: false }));
                resetImageState();
                setSelectedRow({});
              }}
              variant="outline"
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              className="text-white hover:bg-primary/85 cursor-pointer"
              onClick={handleEditSpare}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isOpen.withdrawSpare}
        onOpenChange={(open) =>
          setIsOpen((prev) => ({ ...prev, withdrawSpare: open }))
        }
      >
        <DialogContent
          unbounded
          className="w-[65vw] max-w-[950px] max-h-[90vh] overflow-y-scroll"
          onInteractOutside={(e) => {
            e.preventDefault(); // 🚫 Prevent outside click close
          }}
          onCloseAutoFocus={() => {
            setSelectedPerson((prev) => ({
              ...prev,
              loanPerson: null,
              person: null,
              tempPerson: null,
            }));
          }}
        >
          <button
            type="button"
            onClick={() =>
              setIsOpen((prev) => ({ ...prev, withdrawSpare: false }))
            }
            className="sticky top-0 ml-auto block z-20 rounded-sm bg-background opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
          >
            ✕
          </button>
          <DialogTitle className="relative text-base -mt-10">
            Manual Withdrawal
          </DialogTitle>
          <div className="-mt-2">
            <RadioGroup
              value={selectedIssue}
              onValueChange={(e) => {
                setSelectedIssue(e);
                console.log(boxNo, "prev");

                const temp = JSON.parse(JSON.stringify(boxNo));
                for (let i = 0; i < temp.length; i++) {
                  delete temp[i].withdraw;
                }
                console.log(temp, "current");

                setBoxNo(temp);
              }}
              className="flex gap-4"
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="permanent" id="r1" />
                <Label htmlFor="r1">Permanent Issue</Label>
              </div>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="temporary" id="r2" />
                <Label htmlFor="r2">Temporary Issue (Local)</Label>
              </div>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="ty" id="r3" />
                <Label htmlFor="r3">TY Loan (other units)</Label>
              </div>
            </RadioGroup>
            {selectedIssue === "permanent" && (
              <div className="space-y-6 mt-4">
                {/* Row 1 */}
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label className="mb-2">
                      Item Description <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      readOnly
                      name="description"
                      value={selectedRow.description}
                      onChange={handleEditChange}
                      editable={editableFields.description}
                      onEdit={() => enableEdit("description")}
                      onBlur={() => disableEdit("description")}
                    />
                  </div>

                  <div>
                    <Label className="mb-2">
                      <i>IN</i> Part No.
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      readOnly
                      name="indian_pattern"
                      value={selectedRow.indian_pattern}
                      onChange={handleEditChange}
                      editable={editableFields.indian_pattern}
                      onEdit={() => enableEdit("indian_pattern")}
                      onBlur={() => disableEdit("indian_pattern")}
                    />
                  </div>

                  <div>
                    <Label className="mb-2">
                      Category<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      readOnly
                      name="category"
                      value={selectedRow.category}
                      onChange={handleEditChange}
                      editable={editableFields.category}
                      onEdit={() => enableEdit("category")}
                      onBlur={() => disableEdit("category")}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      Issue to <span className="text-red-500">*</span>
                    </label>
                    <ComboBox
                      options={issueTo}
                      onCustomAdd={async (value) => {
                        await addToDropdown("issue", value.name);
                      }}
                      placeholder="Select issue to..."
                      onSelect={(value) => {
                        setSelectedRow((prev) => ({
                          ...prev,
                          issue_to_text: value.name,
                        }));
                      }}
                      onDelete={async (value) => {
                        try {
                          await apiService.delete(`/config/${value.id}`);
                          await fetchIssueTo();
                          toaster("success", "Deleted Successfully");
                        } catch (error) {
                          toaster("error", "Failed to delete the item");
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-4 gap-4 items-start w-full">
                  {/* Quantity Withdrawal */}
                  <div className="w-full">
                    <Label className="mb-3">
                      Qty Withdrawal <span className="text-red-500">*</span>
                    </Label>
                    <RadioGroup
                      value={selectedRow.withdraw_type}
                      onValueChange={(value) => {
                        setSelectedRow((prev) => ({
                          ...prev,
                          withdraw_type: value,
                          obs_held: value === "single" ? 1 : prev.obs_held,
                        }));
                        if (value === "single" && boxNo.length === 1) {
                          const box = [...boxNo];
                          box[0].withdraw = 1;
                          setBoxNo(box);
                        }
                      }}
                      className="flex gap-2 mt-2 w-full"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="single" id="single" />
                        <Label htmlFor="single">Single Issue</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="bulk" id="bulk" />
                        <Label htmlFor="bulk">Bulk Issue</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Withdrawal Qty */}
                  <div className="w-full">
                    <Label className="mb-2">
                      {selectedRow.withdraw_type === "single"
                        ? "Single Qty"
                        : "Bulk Qty"}
                    </Label>

                    <Input
                      name="new_val"
                      type="number"
                      value={
                        selectedRow.withdraw_type === "single"
                          ? 1
                          : selectedRow.new_val || ""
                      }
                      onChange={(e) => {
                        if (selectedRow.withdraw_type === "bulk") {
                          handleEditChange(e);
                          if (boxNo.length == 1) {
                            const box = [...boxNo];
                            box[0].withdraw = e.target.value;
                            setBoxNo(box);
                          }
                        }
                      }}
                      disabled={selectedRow.withdraw_type === "single"}
                      className="w-full"
                    />
                  </div>

                  {/* Withdrawal Date */}
                  <div className="w-full">
                    <FormattedDatePicker
                      label="Withdrawal Date *"
                      value={date}
                      onChange={setDate}
                    />
                  </div>
                </div>

                {/* Row 3 */}
                <div className="flex flex-col mt-[-20px]">
                  <Label className="ms-2 mb-1 " htmlFor="box_no">
                    Item Storage Distribution{" "}
                    <span className="text-red-500">*</span>
                  </Label>

                  <BoxNoWithdrawl
                    value={boxNo}
                    onChange={(val) => {
                      setBoxNo(val);
                    }}
                    isLooseSpare={isLooseSpare}
                  />
                </div>
                <ServicePersonnel
                  options={selectedPerson.options}
                  value={selectedPerson.person}
                  onChange={(person) => {
                    setSelectedPerson((prev) => ({
                      ...prev,
                      person: person,
                    }));
                  }}
                  onAdd={(person) => {
                    setSelectedPerson((prev) => ({
                      ...prev,
                      person: person,
                    }));
                    handleAddPersonnel(person);
                  }}
                />
              </div>
            )}

            {selectedIssue === "temporary" && (
              <div className="space-y-6 mt-4">
                {/* Row 1 */}
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label className="mb-2">
                      Item Description<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      readOnly
                      name="description"
                      value={selectedRow.description}
                      onChange={handleEditChange}
                      editable={editableFields.description}
                      onEdit={() => enableEdit("description")}
                      onBlur={() => disableEdit("description")}
                    />
                  </div>

                  <div>
                    <Label className="mb-2">
                      <i>IN</i> Part No. <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      readOnly
                      name="indian_pattern"
                      value={selectedRow.indian_pattern}
                      onChange={handleEditChange}
                      editable={editableFields.indian_pattern}
                      onEdit={() => enableEdit("indian_pattern")}
                      onBlur={() => disableEdit("indian_pattern")}
                    />
                  </div>

                  <div>
                    <Label className="mb-2">
                      Equipment / System <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      readOnly
                      name="equipment_system"
                      value={selectedRow.equipment_system}
                      onChange={handleEditChange}
                      editable={editableFields.equipment_system}
                      onEdit={() => enableEdit("equipment_system")}
                      onBlur={() => disableEdit("equipment_system")}
                    />
                  </div>
                  <div>
                    <Label className="mb-2">
                      Category<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      readOnly
                      name="category"
                      value={selectedRow.category}
                      onChange={handleEditChange}
                      editable={editableFields.category}
                      onEdit={() => enableEdit("category")}
                      onBlur={() => disableEdit("category")}
                    />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-4 gap-4 items-start w-full">
                  <div className="flex flex-col gap-1 mt-[-10px]">
                    <label className="text-sm font-medium text-gray-700">
                      Issue to <span className="text-red-500">*</span>
                    </label>
                    <ComboBox
                      options={issueTo}
                      onCustomAdd={async (value) => {
                        await addToDropdown("issue", value.name);
                      }}
                      placeholder="Select issue to..."
                      onSelect={(value) => {
                        setSelectedRow((prev) => ({
                          ...prev,
                          issue_to_text: value.name,
                        }));
                      }}
                      onDelete={async (value) => {
                        try {
                          await apiService.delete(`/config/${value.id}`);
                          await fetchIssueTo();
                          toaster("success", "Deleted Successfully");
                        } catch (error) {
                          toaster("error", "Failed to delete the item");
                        }
                      }}
                    />
                  </div>
                  {/* Quantity Withdrawal */}
                  <div className="w-full">
                    <Label className="mb-3">
                      Qty Withdrawal <span className="text-red-500">*</span>
                    </Label>
                    <RadioGroup
                      value={selectedRow.withdraw_type}
                      onValueChange={(value) => {
                        setSelectedRow((prev) => ({
                          ...prev,
                          withdraw_type: value,
                          obs_held: value === "single" ? 1 : prev.obs_held,
                        }));
                        if (value === "single" && boxNo.length === 1) {
                          const box = [...boxNo];
                          box[0].withdraw = 1;
                          setBoxNo(box);
                        }
                      }}
                      className="flex gap-2 mt-2 w-full"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="single" id="single" />
                        <Label htmlFor="single">Single Issue</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="bulk" id="bulk" />
                        <Label htmlFor="bulk">Bulk Issue</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Withdrawal Qty */}
                  <div className="w-full">
                    <Label className="mb-2">
                      {selectedRow.withdraw_type === "single"
                        ? "Single Qty"
                        : "Bulk Qty"}
                    </Label>

                    <Input
                      name="new_val"
                      type="number"
                      value={
                        selectedRow.withdraw_type === "single"
                          ? 1
                          : selectedRow.new_val || ""
                      }
                      onChange={(e) => {
                        if (selectedRow.withdraw_type === "bulk") {
                          handleEditChange(e);
                          if (boxNo.length == 1) {
                            const box = [...boxNo];
                            box[0].withdraw = e.target.value;
                            setBoxNo(box);
                          }
                        }
                      }}
                      disabled={selectedRow.withdraw_type === "single"}
                      className="w-full"
                    />
                  </div>

                  {/* Withdrawal Date */}
                  <div className="w-full">
                    <FormattedDatePicker
                      label="Issue Date *"
                      value={date}
                      onChange={setDate}
                    />
                  </div>
                </div>

                {/* Row 3 */}
                <div className="flex flex-col mt-[-20px]">
                  <Label className="ms-2 mb-1 " htmlFor="box_no">
                    Item Storage Distribution{" "}
                    <span className="text-red-500">*</span>
                  </Label>

                  <BoxNoWithdrawl
                    value={boxNo}
                    onChange={(val) => {
                      setBoxNo(val);
                    }}
                    isLooseSpare={isLooseSpare}
                  />
                </div>

                <ServicePersonnel
                  options={selectedPerson.options}
                  value={selectedPerson.tempPerson}
                  onChange={(person) => {
                    setSelectedPerson((prev) => ({
                      ...prev,
                      tempPerson: person,
                    }));
                  }}
                  onAdd={(person) => {
                    setSelectedPerson((prev) => ({
                      ...prev,
                      tempPerson: person,
                    }));
                    handleAddPersonnel(person);
                  }}
                />

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>
                      Loan Duration (in days)
                      <span className="text-red-500">*</span>
                    </Label>
                    <input
                      type="number"
                      name="loan_duration"
                      value={selectedRow.loan_duration || ""}
                      onChange={handleEditChange}
                      placeholder="Enter days"
                      className="w-full border rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedIssue === "ty" && (
              <div className="space-y-6 mt-4">
                {/* Row 1 */}
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label className="mb-2">
                      Item Description <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      readOnly
                      name="description"
                      value={selectedRow.description}
                      onChange={handleEditChange}
                      editable={editableFields.description}
                      onEdit={() => enableEdit("description")}
                      onBlur={() => disableEdit("description")}
                    />
                  </div>

                  <div>
                    <Label className="mb-2">
                      <i>IN</i> Part No. <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      readOnly
                      name="indian_pattern"
                      value={selectedRow.indian_pattern}
                      onChange={handleEditChange}
                      editable={editableFields.indian_pattern}
                      onEdit={() => enableEdit("indian_pattern")}
                      onBlur={() => disableEdit("indian_pattern")}
                    />
                  </div>

                  <div>
                    <Label className="mb-2">
                      Category<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      readOnly
                      name="category"
                      value={selectedRow.category}
                      onChange={handleEditChange}
                      editable={editableFields.category}
                      onEdit={() => enableEdit("category")}
                      onBlur={() => disableEdit("category")}
                    />
                  </div>
                  <div>
                    <Label className="mb-2">
                      Unit Name (Mention INS){" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="Unit_name"
                      value={selectedRow.unit_name}
                      onChange={handleEditChange}
                      editable={editableFields.unit_name}
                    />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-4 gap-4 items-start w-full">
                  <div className="w-full">
                    <Label className="mb-3">
                      Qty Withdrawal <span className="text-red-500">*</span>
                    </Label>
                    <RadioGroup
                      value={selectedRow.withdraw_type}
                      onValueChange={(value) => {
                        setSelectedRow((prev) => ({
                          ...prev,
                          withdraw_type: value,
                          obs_held: value === "single" ? 1 : prev.obs_held,
                        }));
                        if (value === "single" && boxNo.length === 1) {
                          const box = [...boxNo];
                          box[0].withdraw = 1;
                          setBoxNo(box);
                        }
                      }}
                      className="flex gap-2 mt-2 w-full"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="single" id="single" />
                        <Label htmlFor="single">Single Issue</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="bulk" id="bulk" />
                        <Label htmlFor="bulk">Bulk Issue</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Withdrawal Qty */}
                  <div className="w-full">
                    <Label className="mb-2">
                      {selectedRow.withdraw_type === "single"
                        ? "Single Qty"
                        : "Bulk Qty"}
                    </Label>

                    <Input
                      name="new_val"
                      type="number"
                      value={
                        selectedRow.withdraw_type === "single"
                          ? 1
                          : selectedRow.new_val || ""
                      }
                      onChange={(e) => {
                        if (selectedRow.withdraw_type === "bulk") {
                          handleEditChange(e);
                          if (boxNo.length == 1) {
                            const box = [...boxNo];
                            box[0].withdraw = e.target.value;
                            setBoxNo(box);
                          }
                        }
                      }}
                      disabled={selectedRow.withdraw_type === "single"}
                      className="w-full"
                    />
                  </div>

                  {/* Withdrawal Date */}
                  <div className="w-full">
                    <FormattedDatePicker
                      label="Withdrawal Date *"
                      value={date}
                      onChange={setDate}
                    />
                  </div>
                </div>

                {/* Row 3 */}
                <div className="flex flex-col mt-[-20px]">
                  <Label className="ms-2 mb-1" htmlFor="box_no">
                    Item Storage Distribution{" "}
                    <span className="text-red-500">*</span>
                  </Label>

                  <BoxNoWithdrawl
                    value={boxNo}
                    onChange={setBoxNo}
                    isLooseSpare={isLooseSpare}
                  />
                </div>

                <ServicePersonnelSearch
                  options={selectedPerson.options}
                  value={selectedPerson.loanPerson}
                  onChange={(person) => {
                    setSelectedPerson((prev) => ({
                      ...prev,
                      loanPerson: person,
                    }));
                  }}
                  onAdd={(person) => {
                    setSelectedPerson((prev) => ({
                      ...prev,
                      loanPerson: person,
                    }));
                    handleAddPersonnel(person);
                  }}
                />

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>
                      Loan Duration (in days)
                      <span className="text-red-500">*</span>
                    </Label>
                    <input
                      type="number"
                      name="loan_duration"
                      value={selectedRow.loan_duration || ""}
                      onChange={handleEditChange}
                      placeholder="Enter days"
                      className="w-full border rounded-md px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1 mt-[-10px]">
                    <label className="text-sm font-medium text-gray-700">
                      Concurred By <span className="text-red-500">*</span>
                    </label>
                    <ComboBox
                      options={concurredBy}
                      onCustomAdd={async (value) => {
                        await addToDropdown("concurred_by", value.name);
                      }}
                      placeholder="Select concurred by ..."
                      onSelect={(value) => {
                        setSelectedRow((prev) => ({
                          ...prev,
                          concurred_by: value.name,
                        }));
                      }}
                      onDelete={async (value) => {
                        try {
                          await apiService.delete(`/config/${value.id}`);
                          await fetchConcurredBy();
                          toaster("success", "Deleted Successfully");
                        } catch (error) {
                          toaster("error", "Failed to delete the item");
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="mt-6">
            <Button
              onClick={() =>
                setIsOpen((prev) => ({ ...prev, withdrawSpare: false }))
              }
              variant="outline"
              className="cursor-pointer"
            >
              Cancel
            </Button>

            <Button
              className="text-white hover:bg-primary/85 cursor-pointer"
              onClick={() => {
                if (!selectedRow.description?.trim()) {
                  toaster("error", "Item Description is required");
                  return;
                }

                if (!selectedRow.indian_pattern?.trim()) {
                  toaster("error", "IN Part No. is required");
                  return;
                }

                if (!selectedRow.withdraw_type) {
                  toaster("error", "Withdrawal type is required");
                  return;
                }

                if (!date) {
                  toaster("error", "Withdrawal date is required");
                  return;
                }

                if (
                  selectedRow.withdraw_type === "bulk" &&
                  Number(selectedRow.new_val) <= 0
                ) {
                  toaster("error", "Bulk quantity must be greater than 0");
                  return;
                }

                const expectedQty =
                  selectedRow.withdraw_type === "single"
                    ? 1
                    : Number(selectedRow.new_val || 0);

                const totalWithdraw = boxNo.reduce((sum, row) => {
                  return sum + Number(row.withdraw || 0);
                }, 0);

                const hasNegativeWithdrawRow = boxNo.some(
                  (row) => Number(row.withdraw) < 0,
                );
                if (hasNegativeWithdrawRow) {
                  toaster(
                    "error",
                    "Withdrawal quantity in any box cannot be less than zero",
                  );
                  return;
                }
                if (totalWithdraw <= 0) {
                  toaster(
                    "error",
                    "Total Withdrawal Quantity must be greater than 0",
                  );
                  return;
                }
                if (expectedQty !== totalWithdraw) {
                  toaster("error", "Withdrawal Quantity Mismatch", {
                    description: `Total distributed withdrawal (${totalWithdraw}) must be equal to ${
                      selectedRow.withdraw_type === "single"
                        ? "Single Qty (1)"
                        : "Bulk Qty"
                    } (${expectedQty}).`,
                  });
                  return;
                }

                const invalidRow = boxNo.find((row) => {
                  const qtyHeld = Number(row.qtyHeld || 0);
                  const withdraw = Number(row.withdraw || 0);
                  return withdraw > qtyHeld;
                });

                if (invalidRow) {
                  toaster("error", "Withdrawal Quantity exceeded Qty Held", {
                    description:
                      "Withdrawal Qty cannot be greater than Qty Held.",
                  });
                  return;
                }

                if (selectedIssue === "permanent") {
                  submitPermanentIssue();
                } else if (selectedIssue === "temporary") {
                  const payload = {
                    a: selectedRow.id ? "tool" : "spare",
                    tool_id: selectedRow.id || null,
                    qty_withdrawn:
                      selectedRow.withdraw_type === "single"
                        ? 1
                        : Number(selectedRow.new_val),
                    service_no: selectedPerson.tempPerson.serviceNumber || "",
                    issue_to: selectedRow.issue_to_text || selectedRow.issue_to,

                    issue_date: getISTTimestamp(date),
                    loan_duration: Number(selectedRow.loan_duration),

                    return_date: null,
                    qty_received: null,

                    box_no: boxNo,
                  };
                  submitTemporaryIssue(payload);
                } else if (selectedIssue === "ty") {
                  const payload = {
                    a: selectedRow.id ? "tool" : "spare",
                    tool_id: selectedRow.id || null,
                    qty_withdrawn:
                      selectedRow.withdraw_type === "single"
                        ? 1
                        : Number(selectedRow.new_val),
                    service_no: selectedPerson.loanPerson.serviceNumber || "",
                    concurred_by:
                      selectedRow.concurred_by_text || selectedRow.concurred_by,

                    issue_date: getISTTimestamp(date),
                    loan_duration: Number(selectedRow.loan_duration),

                    return_date: null,
                    qty_received: null,

                    box_no: boxNo,
                  };
                  submitTyLoan(payload);
                }
              }}
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
        <DialogContent
          unbounded
          onInteractOutside={(e) => {
            e.preventDefault(); // 🚫 Prevent outside click close
          }}
          className="w-[55vw] max-w-[950px] max-h-[90vh] overflow-y-scroll"
        >
          <button
            type="button"
            onClick={() => setObsDialog((prev) => ({ ...prev, open: false }))}
            className="sticky top-0 ml-auto block z-20 rounded-sm bg-background opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
          >
            ✕
          </button>
          <DialogTitle className="relative text-base -mt-10">
            Confirm OBS Authorised Change
          </DialogTitle>
          <div className="grid grid-cols-4 gap-4 items-end text-sm">
            <div>
              <Label>
                Existing Authorised Qty<span className="text-red-500">*</span>
              </Label>
              <Input value={originalObsAuthorised} disabled />
            </div>

            <div>
              <Label>
                Action<span className="text-red-500">*</span>
              </Label>
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

            <div>
              <Label>
                Qty (Inc/ Dec)<span className="text-red-500">*</span>
              </Label>
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

            <div>
              <Label>
                Final Expected Qty<span className="text-red-500">*</span>
              </Label>
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
              <div className="space-y-4">
                <BoxNoConfirmObs
                  value={
                    selectedRow.box_no ? JSON.parse(selectedRow.box_no) : []
                  }
                  onChange={(value) =>
                    setSelectedRow((prev) => ({
                      ...prev,
                      box_no: JSON.stringify(value),
                    }))
                  }
                  isLooseSpare={isLooseSpare}
                  action={obsDialog.action}
                />
              </div>
              <p className="font-medium text-sm mb-2 mt-2">
                Quote Authority<span className="text-red-500"> *</span>
              </p>

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

              <div className="mt-4">
                <Label>
                  Confirm Demand Generated
                  <span className="text-red-500">*</span>
                </Label>
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
                          internalDemandDate: null,
                          requisitionNo: "",
                          requisitionDate: null,
                          moDemandNo: "",
                          moDemandDate: null,
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
                    <Label className="pb-3">
                      Internal Demand No.
                      <span className="text-red-500">*</span>
                    </Label>
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
              {/* <BoxNoInputs
                value={selectedRow.box_no ? JSON.parse(selectedRow.box_no) : []}
                onChange={(value) =>
                  setSelectedRow((prev) => ({
                    ...prev,
                    box_no: JSON.stringify(value),
                  }))
                }
                isLooseSpare={isLooseSpare}
              /> */}
              <BoxNoConfirmObs
                value={selectedRow.box_no ? JSON.parse(selectedRow.box_no) : []}
                onChange={(value) =>
                  setSelectedRow((prev) => ({
                    ...prev,
                    box_no: JSON.stringify(value),
                  }))
                }
                isLooseSpare={isLooseSpare}
                action={obsDialog.action}
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
              onClick={async () => {
                // Qty validation (required)
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

                  //demand no demand date check
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

                let parsedBox = [];

                try {
                  parsedBox =
                    typeof selectedRow.box_no === "string"
                      ? JSON.parse(selectedRow.box_no)
                      : selectedRow.box_no || [];
                } catch (err) {
                  toaster("error", "Invalid Box No data");
                  return;
                }

                // Calculate total box qty
                const totalBoxQty = parsedBox.reduce(
                  (sum, box) => sum + Number(box.qn || 0),
                  0,
                );
                // Calculate final value
                const finalValue =
                  obsDialog.action === "increase"
                    ? Number(originalObsAuthorised) + Number(obsDialog.quantity)
                    : Number(originalObsAuthorised) -
                      Number(obsDialog.quantity);

                if (totalBoxQty !== finalValue) {
                  toaster(
                    "error",
                    `Authorised Qty (${finalValue}) not matched with Box Qty (${totalBoxQty})`,
                  );
                  return;
                }
                //payload
                const payload = {
                  tool_id: selectedRow.id,

                  obs_authorised: finalValue,
                  obs_increase_qty: obsDialog.quantity,
                  internal_demand_no:
                    obsDialog.demandGenerated === "yes"
                      ? obsDialog.internalDemandNo?.trim()
                      : null,
                  internal_demand_date:
                    obsDialog.demandGenerated === "yes"
                      ? getISTTimestamp(obsDialog.internalDemandDate)
                      : null,
                  requisition_no: obsDialog.requisitionNo?.trim() || null,
                  requisition_date: obsDialog.requisitionDate
                    ? getISTTimestamp(obsDialog.requisitionDate)
                    : null,
                  mo_demand_no: obsDialog.moDemandNo?.trim() || null,
                  mo_demand_date: obsDialog.moDemandDate
                    ? getISTTimestamp(obsDialog.requisitionDate)
                    : null,
                  box_no: boxNo,
                  quoteAuthority: obsDialog.quoteAuthority,
                };

                await apiService.post("/specialDemand/special", payload);
                await fetchdata();
                payload.box_no =
                  typeof boxNo == "string" ? boxNo : JSON.stringify(boxNo);
                //new-logic
                setSelectedRow((prev) => ({
                  ...prev,
                  ...payload,
                  status: "demanded",
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
      <Dialog open={open} onOpenChange={(v) => setOpen(v)}>
        <DialogContent
          onPointerDownOutside={(e) => {
            e.preventDefault();
          }}
          showCloseButton={false}
        >
          <DialogTitle>Confirmation</DialogTitle>
          <DialogDescription>
            Do you want to save it for later?
          </DialogDescription>
          <div className="flex gap-3 justify-end items-center">
            <Button
              className="cursor-pointer"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <SpinnerButton
              className="cursor-pointer"
              disabled={loading}
              loading={loading}
              loadingText="Adding..."
              onClick={async () => {
                setLoading(true);
                await addToDropdown(dropdownType, newValue);
                setLoading(false);
                setOpen(false);
              }}
            >
              Add
            </SpinnerButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tools;
