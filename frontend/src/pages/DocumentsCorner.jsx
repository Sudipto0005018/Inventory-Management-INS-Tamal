import { useState, useEffect, useMemo, useContext } from "react";
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

import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { getISTTimestamp } from "../utils/helperFunctions";
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
import BoxNoInputsSimple from "../components/BoxNoInputsSimple";
import MultiImageSelect from "../components/MultiImageSelect";
import BoxNoWithdrawl from "../components/BoxNoWithdrawl";
import OEMFirm from "../components/OEMFirm";
import SupplierFirm from "../components/Supplier";
import ComboBox from "../components/ComboBox";
import AsyncSelectBox from "../components/AsyncSelectBox";
import ServicePersonnelSearch from "../components/ServicePersonnelSearch";

//search fields
const SEARCH_FIELDS = [
  { label: "Document Description", value: "description" },
  { label: "Equipment / System", value: "equipment_system" },
  { label: "Book Authorised", value: "obs_authorised" },
  { label: "Book Held", value: "obs_held" },
  { label: "Book Maintained", value: "obs_maintained" },
  { label: "Item Storage Distribution", value: "boxNo" },
  { label: "Location of Storage", value: "storage_location" },
  { label: "Item Distribution", value: "item_distribution" },
];
const DocumentsCorner = ({ type = "" }) => {
  const { config, fetchIssueTo, fetchConcurredBy, issueTo, concurredBy } =
    useContext(Context);
  const columns = useMemo(
    () => [
      {
        key: "description",
        header: "Document Description",
        width: "w-[160px]",
      },
      { key: "folder_no", header: "Folder No.", width: "w-[120px]" },
      {
        key: "equipment_system",
        header: (
          <span>
            Equipment/
            <br /> System
          </span>
        ),
        width: "w-[140px]",
      },
      { key: "obs_authorised", header: "Book Authorised", width: "w-[120px]" },
      { key: "obs_held", header: "Book Held", width: "w-[120px]" },
      {
        key: "boxNo",
        header: <p>Box No./ Rack No.</p>,
        width: "w-[140px]",
      },
      { key: "location", header: "Location of Storage", width: "w-[150px]" },
      {
        key: "edit",
        header: <div className="text-center w-full">Actions</div>,
        width: "w-[100px]",
      },
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
    folder_no: "",
    equipment_system: "",
    denos: "",
    obs_authorised: "",
    obs_maintained: "",
    obs_held: "",
    b_d_authorised: "",
    category: "",
    box_no: "",
    item_distribution: "",
    substitute_name: [],
    local_terminology: [],
    item_code: "",
    price_unit: "",
    sub_component: "",
    indian_pattern: "",
    storage_location: "",
    storage_type: "",
    remarks: "",
    uidoem: "",
    supplier: "",
    nac_date: "",
  });

  const [isOpen, setIsOpen] = useState({
    addDocument: false,
    editDocument: false,
    deleteSpare: false,
    withdrawDialog: false,
  });
  const [selectedRow, setSelectedRow] = useState({});
  const [image, setImage] = useState({
    preview: null,
    file: null,
    previewEdit: null,
    fileEdit: null,
  });
  const [panelProduct, setPanelProduct] = useState({
    description: "",
    imgUrl: "",
  });
  const [boxNo, setBoxNo] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState("parmenent");

  const [selectedRowIndex, setSelectedRowIndex] = useState(null);

  const [oemList, setOemList] = useState([]);
  const [supplierList, setSupplierList] = useState([]);
  const [selectedOem, setSelectedOem] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedAddSupplier, setSelectedAddSupplier] = useState(null);

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

  const handleInputChange = (index, fieldName, fieldValue) => {
    const newRows = [...value];
    newRows[index] = {
      ...newRows[index],
      [fieldName]: fieldValue,
    };
    onChange(newRows);
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
          setInputs((prev) => ({ ...prev, uidoem: "" }));
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
        type == "low-stock" ? "/document/low-stock" : "/document",
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

  const handleAddDocument = async () => {
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

      // Validation
      if (!inputs.description?.trim()) {
        toaster("error", "Description is required");
        return;
      }

      if (!inputs.equipment_system?.trim()) {
        toaster("error", "Equipment / System is required");
        return;
      }

      const formData = new FormData();
      // append images same as spare
      Object.values(imagePayload?.newImageFiles || {}).forEach((file) => {
        formData.append("images", file);
      });
      // append rest of fields
      formData.append("description", inputs.description || "");
      formData.append("folder_no", inputs.folder_no || "");
      formData.append("equipment_system", inputs.equipment_system || "");
      formData.append("denos", inputs.denos || "");
      formData.append("obs_authorised", inputs.obs_authorised || "");
      formData.append("obs_authorised_new", inputs.obs_authorised || "");
      formData.append("obs_held", inputs.obs_held || "");
      formData.append("obs_maintained", inputs.obs_maintained || "");
      formData.append("b_d_authorised", inputs.b_d_authorised || "");
      formData.append("category", inputs.category || "");
      formData.append("box_no", JSON.stringify(boxNo || []));
      formData.append("item_distribution", inputs.item_distribution || "");
      formData.append("storage_location", inputs.storage_location || "");
      formData.append("item_code", inputs.item_code || "");
      formData.append("indian_pattern", inputs.indian_pattern || "");
      formData.append("remarks", inputs.remarks || "");
      formData.append("nac_date", inputs.nac_date || null);
      formData.append("uidoem", inputs.oem || "");
      formData.append("supplier", inputs.supplier || "");
      formData.append("substitute_name", inputs.substitute_name || "");
      formData.append("local_terminology", inputs.local_terminology || "");

      const res = await apiService.post("/document", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.success) {
        toaster("success", "Document added successfully");

        // Close dialog
        setIsOpen((prev) => ({ ...prev, addDocument: false }));

        // Refresh table
        fetchdata();

        // Reset form
        setInputs({
          description: "",
          folder_no: "",
          equipment_system: "",
          denos: "",
          obs_authorised: "",
          obs_held: "",
          obs_maintained: "",
          b_d_authorised: "",
          category: "",
          storage_location: "",
          item_code: "",
          indian_pattern: "",
          remarks: "",
          nac_date: "",
          uidoem: "",
          supplier: "",
          substitute_name: [],
          local_terminology: [],
        });

        setBoxNo([]);
      } else {
        toaster("error", res.message || "Failed to add document");
      }
    } catch (error) {
      console.error(error);
      toaster(
        "error",
        error.response?.data?.message || "Server error while adding document",
      );
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

  const handleEditDocument = async () => {
    try {
      let s = 0,
        s1 = 0,
        s2 = 0;

      let boxes = boxNo;

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
        toaster("error", "Authorised Qty not matched with Book Authorised");
        return;
      }

      if (s2 !== obsMaintained) {
        toaster("error", "Maintained Qty not matched with Book Maintained");
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
      let prevBoxes;
      if (typeof savedRow.box_no == "string") {
        prevBoxes = JSON.parse(savedRow.box_no);
      } else {
        prevBoxes = savedRow.box_no;
      }
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
        toaster("error", "Qty Held not matched with Book Held");
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
      // Status (delete / replace info)
      formData.append(
        "imageStatus",
        JSON.stringify(imagePayload?.imageStatus || []),
      );
      formData.append("description", selectedRow.description || "");
      formData.append("equipment_system", selectedRow.equipment_system || "");
      formData.append("folder_no", selectedRow.folder_no || "");
      formData.append("denos", selectedRow.denos || "");
      formData.append("obs_authorised", selectedRow.obs_authorised || "");
      formData.append("obs_held", selectedRow.obs_held || "");
      formData.append("obs_maintained", selectedRow.obs_maintained || "");
      formData.append("b_d_authorised", selectedRow.b_d_authorised || "");
      formData.append("category", selectedRow.category || "");
      formData.append("box_no", JSON.stringify(selectedRow.box_no) || "");
      formData.append("item_code", selectedRow.item_code || "");
      formData.append("price_unit", selectedRow.price_unit || "");
      formData.append("sub_component", selectedRow.sub_component || "");
      formData.append("storage_location", selectedRow.storage_location || "");
      formData.append("indian_pattern", selectedRow.indian_pattern || "");
      formData.append("remarks", selectedRow.remarks || "");
      formData.append("uidoem", selectedRow.uidoem || "");
      formData.append("substitute_name", selectedRow.substitute_name || "");
      formData.append("local_terminology", selectedRow.local_terminology || "");
      formData.append("supplier", selectedRow.supplier || "");

      const response = await apiService.post(
        "/document/update/" + selectedRow.id,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      if (response.success) {
        toaster("success", "Document updated successfully");
        setIsOpen({ ...isOpen, editDocument: false });
        resetImageState(); // clear image payload
        setSelectedRow({}); // clear edit data
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

    setPanelProduct("");

    setSelectedRowIndex(null);

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
    let selected = { ...selectedRow };
    if (selected.box_no) {
      if (typeof selected.box_no == "string") {
        selected.box_no = JSON.parse(selected.box_no);
      }
    } else {
      selected.box_no = [{ no: "", qn: "", qtyHeld: "", location: "" }];
    }
    setBoxNo(selected.box_no);
  }, [selectedRow.box_no]);

  const submitTemporaryIssue = async (payload) => {
    try {
      console.log("Payload =>", payload);
      console.log("Selected Row =>", selectedRow);
      const res = await apiService.post("/document/issue", payload);
      if (res.success) {
        toaster("success", "Temporary Issue created successfully");
        console.log(boxNo);

        setBoxNo([{ withdraw: "" }]);
        await fetchdata();
      }

      setIsOpen((prev) => ({ ...prev, withdrawSpare: false }));
    } catch (error) {
      console.error("API failed:", error);
      toaster("error", "Issue failed");
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
    const t = fetchedData.items.map((row) => {
      let boxNo;
      if (row.box_no) {
        if (typeof row.box_no == "string") boxNo = JSON.parse(row.box_no);
        else boxNo = row.box_no;
      } else {
        boxNo = [{ no: "", qn: "" }];
      }

      return {
        ...row,
        imgUrl: imageBaseURL + row.image,
        image: row.image ? (
          <ImagePreviewDialog image={imageBaseURL + row.image} />
        ) : null,
        boxNo: boxNo?.map((box) => box.no)?.join(", "),
        itemDistribution: boxNo?.map((box) => box.qtyHeld)?.join(", "),
        location: boxNo?.map((box) => box.location)?.join(", "),

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
              setIsOpen((prev) => ({ ...prev, editDocument: true }));
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
      };
    });

    console.log("Transformed table data:", t);
    setTableData(t);
    // ✅ Always select first row if available
    if (t.length > 0) {
      setSelectedRowIndex(0);
      setPanelProduct(t[0]); // also update right-side panel immediately
    } else {
      setSelectedRowIndex(null);
      setPanelProduct({
        description: "",
        indian_pattern: "",
        category: "",
        folder_no: "",
        box_no: "",
        equipment_system: "",
        imgUrl: "",
      });
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
            placeholder="Search spares..."
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
              setIsOpen({ ...isOpen, addDocument: true });
              setBoxNo([{}]);
            }}
            className="cursor-pointer hover:bg-primary/85"
          >
            <FaPlus /> Add Document
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
            bodyClassName="spares-table"
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
            <p className="text-sm text-gray-500">No documents is selected</p>
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
                  {panelProduct.obs_held && (
                    <TableRow>
                      <TableCell>OEM Details</TableCell>
                      <TableCell>{panelProduct.uidoem || "--"}</TableCell>
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
        open={isOpen.addDocument}
        onOpenChange={(set) =>
          setIsOpen((prev) => ({ ...prev, addDocument: set }))
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
            onClick={() =>
              setIsOpen((prev) => ({ ...prev, addDocument: false }))
            }
            className="sticky top-0  ml-auto block z-10 rounded-sm bg-background opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
          >
            ✕
          </button>
          <DialogTitle className="relative text-base -mt-10">
            Add Document
          </DialogTitle>
          <DialogDescription className="hidden" />
          <div className="-mt-4">
            <div className="space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="ms-2 mb-1">
                    Document Description<span className="text-red-500">*</span>
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
                    Folder No.<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="folder_no"
                    value={inputs.folder_no}
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
                    Book Authorised<span className="text-red-500">*</span>
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
                    Book Held<span className="text-red-500">*</span>
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
                    Book Maintained<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="obs_maintained"
                    value={inputs.obs_maintained}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col mt-5">
              <div className="mt-4">
                <Label className="ms-2 mb-1">Loose Document</Label>
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
            <div className="w-full mt-6 grid grid-cols-2 gap-4">
              <div>
                <Label className="ms-2 mb-1">OEM Details</Label>

                <AsyncSelectBox
                  label="OEM"
                  value={
                    selectedOem
                      ? { id: selectedOem, name: inputs.uidoem }
                      : null
                  }
                  onChange={(val) => {
                    setSelectedOem(val.id);
                    setInputs((prev) => ({ ...prev, uidoem: val.name }));
                  }}
                  fetchOptions={fetchOemOptions}
                  fetchDetails={async (id) => {
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
                setIsOpen((prev) => ({ ...prev, addDocument: false }))
              }
              variant="outline"
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              className="text-white hover:bg-primary/85 cursor-pointer"
              onClick={handleAddDocument}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isOpen.editDocument}
        onOpenChange={(set) =>
          setIsOpen((prev) => ({ ...prev, editDocument: set }))
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
            onClick={() =>
              setIsOpen((prev) => ({ ...prev, editDocument: false }))
            }
            className="sticky top-0  ml-auto block z-20 rounded-sm bg-background opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
          >
            ✕
          </button>
          <DialogTitle className="relative text-base -mt-10">
            Update Document
          </DialogTitle>
          <DialogDescription className="hidden" />
          <div className="-mt-6">
            <div className="grid grid-cols-4 gap-4 mt-3">
              <div>
                <Label>
                  Document Description<span className="text-red-500">*</span>
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
                  Folder No.<span className="text-red-500">*</span>
                </Label>
                <InputWithPencil
                  name="folder_no"
                  value={selectedRow.folder_no}
                  onChange={handleEditChange}
                  editable={editableFields.folder_no}
                  onEdit={() => enableEdit("folder_no")}
                  onBlur={() => disableEdit("folder_no")}
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
                  Book Authorised<span className="text-red-500">*</span>
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
                  Book Held<span className="text-red-500">*</span>
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
                  Book Maintained<span className="text-red-500">*</span>
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
            </div>

            <div className="flex flex-col mt-3">
              <div className="mt-4">
                <Label className="ms-2 mb-1">Loose Document</Label>
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

            <div className="w-full mt-6 grid grid-cols-2 gap-4">
              <div>
                <Label className="ms-2 mb-1">OEM Details</Label>
                <AsyncSelectBox
                  label="OEM"
                  value={
                    selectedRow.uidoem
                      ? {
                          id: oemList.find(
                            (item) => item.name === selectedRow.uidoem,
                          )?.id,
                          name: selectedRow.uidoem,
                        }
                      : null
                  }
                  onChange={(val) => {
                    setSelectedRow((prev) => ({
                      ...prev,
                      uidoem: val.name,
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
                setIsOpen((prev) => ({ ...prev, editDocument: false }));
                resetImageState(); // clear image payload
                setSelectedRow({});
              }}
              variant="outline"
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              className="text-white hover:bg-primary/85 cursor-pointer"
              onClick={handleEditDocument}
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
          <DialogTitle className="relative text-base -mt-8">
            Temporary Issue (Local)
          </DialogTitle>

          <div>
            {true && (
              <div className="space-y-6 mt-4">
                {/* Row 1 */}
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label className="mb-2">
                      Document Descriptionn
                      <span className="text-red-500">*</span>
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
                      Folder No. <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      readOnly
                      name="folder_no"
                      value={selectedRow.folder_no}
                      onChange={handleEditChange}
                      editable={editableFields.folder_no}
                      onEdit={() => enableEdit("folder_no")}
                      onBlur={() => disableEdit("folder_no")}
                    />
                  </div>

                  <div>
                    <Label className="mb-2">
                      Equipment/ System <span className="text-red-500">*</span>
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
                  <div className="flex flex-col gap-1 mt-[-2px]">
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
                    </RadioGroup>
                  </div>

                  {/* Withdrawal Qty */}
                  <div className="w-full">
                    <Label className="mb-2">Single Qty</Label>

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
                      label="Withrawal Date *"
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

                <ServicePersonnelSearch
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

                if (true) {
                  const payload = {
                    doc_id: selectedRow.id || null,
                    qty_withdrawn:
                      selectedRow.withdraw_type === "single"
                        ? 1
                        : Number(selectedRow.new_val),
                    service_no: selectedPerson.tempPerson.serviceNumber || "",
                    issue_to: selectedRow.issue_to_text || selectedRow.issue_to,

                    concurred_by: selectedRow.concurred_by,
                    issue_date: getISTTimestamp(date),
                    loan_duration: Number(selectedRow.loan_duration),

                    return_date: null,
                    qty_received: null,

                    box_no:
                      typeof boxNo === "string" ? boxNo : JSON.stringify(boxNo),
                  };
                  console.log("boxNo value →", boxNo);
                  console.log("typeof boxNo →", typeof boxNo);
                  console.log("isArray →", Array.isArray(boxNo));

                  submitTemporaryIssue(payload);
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
          onInteractOutside={(e) => {
            e.preventDefault(); // 🚫 Prevent outside click close
          }}
          className="!max-w-none w-[48vw] max-w-[950px]"
        >
          <div
            className="sticky top-0 z-10 bg-background 
                grid grid-cols-2 items-center 
                px-4 py-2 border-b"
          >
            <DialogTitle className="text-lg font-semibold">
              Confirm Book Authorised Change
            </DialogTitle>

            <button
              type="button"
              onClick={() => setObsDialog((prev) => ({ ...prev, open: false }))}
              className="justify-self-end rounded-md p-1 transition"
            >
              ✕
            </button>
          </div>
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
              <p className="font-medium text-sm mb-2">
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
              <BoxNoInputsSimple
                value={boxNo}
                onChange={(val) => {
                  setBoxNo(val);
                }}
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

                // Calculate final value
                const finalValue =
                  obsDialog.action === "increase"
                    ? Number(originalObsAuthorised) + Number(obsDialog.quantity)
                    : Number(originalObsAuthorised) -
                      Number(obsDialog.quantity);

                //payload
                const payload = {
                  spare_id: selectedRow.id,

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
                    ? getISTTimestamp(obsDialog.moDemandDate)
                    : null,
                };

                apiService.post("/specialDemand/special", payload);

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

export default DocumentsCorner;
