import { useState, useEffect, useMemo, useContext } from "react";
import { MdModeEditOutline } from "react-icons/md";
import { FaMagnifyingGlass, FaPlus } from "react-icons/fa6";
import { IoMdRefresh } from "react-icons/io";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import SpinnerButton from "../components/ui/spinner-button";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";

import PaginationTable from "../components/PaginationTable";
import toaster from "../utils/toaster";
import apiService from "../utils/apiService";
import { Context } from "../utils/Context";

const Departments = () => {
  const { config } = useContext(Context);
  const columns = useMemo(() => [
    { key: "name", header: "Department Name" },
    { key: "edit", header: "Edit" },
  ]);

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
    name: "",
    search: "",
  });
  const [selectedRow, setSelectedRow] = useState({});
  const [isOpen, setIsOpen] = useState({
    addDepartment: false,
    editDepartment: false,
    deleteDepartment: false,
  });
  const handleSearch = async (e) => {
    const searchTerm = inputs.search.trim();
    if (searchTerm === actualSearch) {
      return;
    } else {
      setActualSearch(searchTerm);
    }

    setIsLoading((prev) => ({ ...prev, search: true }));
    fetchDepartments();
    setIsLoading((prev) => ({ ...prev, search: false }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRefresh = async () => {
    // Reset search states
    setActualSearch("");

    // Reset input
    setInputs((prev) => ({
      ...prev,
      search: "",
    }));

    // Reset page
    setCurrentPage(1);

    // Force fresh fetch with empty search
    try {
      const response = await apiService.get("/departments", {
        params: {
          page: 1,
          search: "",
          limit: config.row_per_page,
        },
      });

      setFetchedData(response.data);
    } catch (error) {
      toaster(
        "error",
        error.response?.data?.message ||
          error.message ||
          "Failed to refresh departments",
      );
    }
  };
  const handleaddDepartment = async () => {
    try {
      const response = await apiService.post("/departments", {
        name: inputs.name,
      });
      if (response.success) {
        toaster("success", "Department added successfully");
        setIsOpen({ ...isOpen, addDepartment: false });
        fetchDepartments();
        setInputs({ ...inputs, name: "" });
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to add department";
      toaster("error", errMsg);
    }
  };

  async function fetchDepartments() {
    try {
      const response = await apiService.get("/departments", {
        params: {
          page: currentPage,
          search: inputs.search,
          limit: config.row_per_page,
        },
      });
      setFetchedData(response.data);
    } catch (error) {}
  }
  const handleEdit = async () => {
    if (!selectedRow.name?.trim()) {
      toaster("error", "Name is required");
      return;
    }
    try {
      const response = await apiService.put("/departments/" + selectedRow.id, {
        name: selectedRow.name,
      });
      if (response.success) {
        toaster("success", "Department updated successfully");
        setIsOpen({ ...isOpen, editDepartment: false });
        fetchDepartments();
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to update department";
      toaster("error", errMsg);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [currentPage]);
  useEffect(() => {
    const t = fetchedData.items?.map((row) => ({
      ...row,
      edit: (
        <Button
          variant="ghost"
          className="text-blue-600 hover:text-blue-700"
          onClick={() => {
            setSelectedRow(row);
            setIsOpen({ ...isOpen, editDepartment: true });
          }}
        >
          <MdModeEditOutline />
        </Button>
      ),
    }));
    setTableData(t);
  }, [fetchedData]);

  return (
    <div className=" h-full">
      <div className="flex items-center mb-4 gap-4 mx-auto">
        <Input
          type="text"
          placeholder="Search department by name"
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
        <Button
          variant="outline"
          className="cursor-pointer flex items-center gap-1 
            hover:bg-gray-200 font-extrabold
            hover:scale-105 
            transition-all duration-200"
          onClick={handleRefresh}
          title="Reset Search"
        >
          <IoMdRefresh
            className="size-7
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
            setIsOpen({ ...isOpen, addDepartment: true });
          }}
          className="cursor-pointer hover:bg-primary/85"
        >
          <FaPlus /> Add Department
        </Button>
      </div>
      <PaginationTable
        data={tableData}
        columns={columns}
        currentPage={fetchedData.currentPage || 1}
        pageSize={fetchedData.items?.length || 10}
        totalPages={fetchedData.totalPages || 1}
        onPageChange={setCurrentPage}
        bodyClassName="department-table"
      />
      <Dialog
        open={isOpen.addDepartment}
        onOpenChange={(set) =>
          setIsOpen((prev) => ({ ...prev, addDepartment: set }))
        }
      >
        <DialogContent onPointerDownOutside={() => {}}>
          <DialogTitle className="">Add Department</DialogTitle>
          <DialogDescription className="hidden" />
          <div>
            <Label className="ms-2 mb-2" htmlFor="department_name">
              Department Name<span className="text-red-500">*</span>
            </Label>
            <Input
              id="department_name"
              type="text"
              placeholder="Department Name"
              name="name"
              autoComplete="false"
              value={inputs.name}
              onChange={handleChange}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() =>
                setIsOpen((prev) => ({ ...prev, addDepartment: false }))
              }
              variant="outline"
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              className="text-white hover:bg-primary/85 cursor-pointer"
              onClick={handleaddDepartment}
            >
              Add Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isOpen.editDepartment}
        onOpenChange={(set) =>
          setIsOpen((prev) => ({ ...prev, editDepartment: set }))
        }
      >
        <DialogContent onPointerDownOutside={() => {}}>
          <DialogTitle className="">Update Department</DialogTitle>
          <DialogDescription className="hidden" />
          <div>
            <Label className="ms-2 mb-2" htmlFor="department_name">
              Department Name<span className="text-red-500">*</span>
            </Label>
            <Input
              id="department_name"
              type="text"
              placeholder="Department Name"
              name="name"
              autoComplete="false"
              value={selectedRow.name}
              onChange={(e) =>
                setSelectedRow((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() =>
                setIsOpen((prev) => ({ ...prev, editDepartment: false }))
              }
              variant="outline"
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              className="text-white hover:bg-primary/85 cursor-pointer"
              onClick={handleEdit}
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Departments;
