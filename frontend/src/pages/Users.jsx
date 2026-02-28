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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

import PaginationTable from "../components/PaginationTable";
import Spinner from "../components/Spinner";
import toaster from "../utils/toaster";
import apiService from "../utils/apiService";
import { Context } from "../utils/Context";

const Users = () => {
  const { config } = useContext(Context);

  const columns = useMemo(
    () => [
      { key: "name", header: "Name" },
      { key: "username", header: "Username" },
      { key: "department", header: "Department" },
      { key: "role", header: "Role" },
      { key: "status", header: "Status" },
      { key: "edit", header: "Edit" },
    ],
    [],
  );

  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [fetchedData, setFetchedData] = useState({
    items: [],
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
  });
  const [inputs, setInputs] = useState({
    name: "",
    username: "",
    password: "",
    department: "",
    role: "",
    search: "",
  });
  const [selectedRow, setSelectedRow] = useState({});
  const [isOpen, setIsOpen] = useState({ add: false, edit: false });
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState({ table: false, search: false });

  // ---------- Handlers ----------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    setSelectedRow({ ...selectedRow, [e.target.id]: e.target.value });
  };

  const handleSearch = async () => {
    setIsLoading((prev) => ({ ...prev, search: true }));
    try {
      const response = await apiService.get("/users", {
        params: { page: 1, search: inputs.search, limit: config.row_per_page },
      });
      setFetchedData(response.data);
      setCurrentPage(1);
    } catch (error) {
      toaster(
        "error",
        error.response?.data?.message || error.message || "Search failed",
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, search: false }));
    }
  };

  const handleRefresh = async () => {
    setInputs((prev) => ({
      ...prev,
      search: "",
    }));

    setCurrentPage(1);

    // If already on page 1, manually fetch
    if (currentPage === 1) {
      await fetchUsers();
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await apiService.get("/departments", {
        params: { extra: "all" },
      });
      console.log(response);

      setDepartments(response.data.items);
    } catch {}
  };

  const fetchUsers = async () => {
    setIsLoading((prev) => ({ ...prev, table: true }));
    try {
      const response = await apiService.get("/users", {
        params: { page: currentPage, limit: config.row_per_page },
      });
      setFetchedData(response.data);
    } catch (error) {
      toaster(
        "error",
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch users",
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, table: false }));
    }
  };

  const handleAdd = async () => {
    if (
      !inputs.name?.trim() ||
      !inputs.username?.trim() ||
      !inputs.password?.trim() ||
      !inputs.department ||
      !inputs.role?.trim()
    ) {
      toaster("error", "All fields are required");
      return;
    }
    try {
      const response = await apiService.post("/users/signup", { ...inputs });
      if (response.success) {
        toaster("success", "User added successfully");
        setIsOpen({ ...isOpen, add: false });
        setInputs({
          ...inputs,
          name: "",
          username: "",
          password: "",
          department: "",
          role: "",
        });
        fetchUsers();
      } else {
        toaster("error", response.message);
      }
    } catch (error) {
      toaster(
        "error",
        error.response?.data?.message || error.message || "Failed to add user",
      );
    }
  };

  const handleEdit = (row) => {
    console.log(row, fetchedData);

    const originalRow = fetchedData.items.find((item) => item.id === row.id);
    if (!originalRow) return;

    setSelectedRow({
      id: originalRow.id,
      name: originalRow.name,
      username: originalRow.username,
      role: originalRow.role,
      status: originalRow.status === 1 ? "active" : "inactive",
      password: "",
      department: originalRow.department,
    });

    setIsOpen((prev) => ({ ...prev, edit: true }));
  };

  const handleUpdate = async () => {
    const id = selectedRow?.id;

    if (
      !selectedRow.name?.trim() ||
      !selectedRow.department ||
      !selectedRow.role?.trim() ||
      !selectedRow.status
    ) {
      toaster("error", "Please fill all required fields");
      return;
    }

    try {
      const payload = {
        name: selectedRow.name,
        username: selectedRow.username,
        department: selectedRow.department,
        role: selectedRow.role,
        status: selectedRow.status,
      };

      // ✅ Only send password if entered
      if (selectedRow.password?.trim()) {
        payload.password = selectedRow.password;
      }

      const response = await apiService.post(`/users/update/${id}`, payload);

      if (response.success) {
        toaster("success", "User updated successfully");
        setIsOpen({ ...isOpen, edit: false });
        fetchUsers();
      }
    } catch (error) {
      toaster(
        "error",
        error.response?.data?.message ||
          error.message ||
          "Failed to update user",
      );
    }
  };

  // Effects
  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, [currentPage]);

  useEffect(() => {
    const t = fetchedData.items.map((row) => ({
      ...row,
      status: (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            row.status === 1
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {row.status === 1 ? "Active" : "Inactive"}
        </span>
      ),
      edit: (
        <Button
          variant="ghost"
          className="text-blue-600 hover:text-blue-700"
          onClick={() => handleEdit(row)}
        >
          <MdModeEditOutline />
        </Button>
      ),
    }));

    setTableData(t);
  }, [fetchedData]);

  // ---------- JSX ----------
  return (
    <div className="h-full px-2">
      <div className="flex items-center mb-4 gap-4 mx-auto">
        <Input
          type="text"
          placeholder="Search user by name or username"
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
          onClick={() => setIsOpen({ ...isOpen, add: true })}
          className="cursor-pointer hover:bg-primary/85"
        >
          <FaPlus /> Add User
        </Button>
      </div>

      {isLoading.table ? (
        <Spinner />
      ) : (
        <PaginationTable
          data={tableData}
          columns={columns}
          currentPage={fetchedData.currentPage || 1}
          pageSize={fetchedData.items?.length || 10}
          totalPages={fetchedData.totalPages || 1}
          onPageChange={setCurrentPage}
          bodyClassName="users-table"
        />
      )}

      {/* Add User Dialog */}
      <Dialog
        open={isOpen.add}
        onOpenChange={(set) => setIsOpen((prev) => ({ ...prev, add: set }))}
      >
        <DialogContent
          showCloseButton
          onPointerDownOutside={(e) => {
            e.preventDefault();
          }}
        >
          <DialogTitle>Add User</DialogTitle>

          <div className="space-y-3">
            <div>
              <Label htmlFor="name">
                Name<span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={inputs.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="username">
                Username<span className="text-red-500">*</span>
              </Label>
              <Input
                id="username"
                name="username"
                value={inputs.username}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="password">
                Password<span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                name="password"
                value={inputs.password}
                type="password"
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="department">
                Department<span className="text-red-500">*</span>
              </Label>
              <Select
                value={inputs.department}
                onValueChange={(value) =>
                  setInputs((prev) => ({ ...prev, department: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dep) => (
                    <SelectItem key={dep.id} value={dep.name}>
                      {dep.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="role">
                Role<span className="text-red-500">*</span>
              </Label>
              <Select
                value={inputs.role}
                onValueChange={(value) =>
                  setInputs((prev) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsOpen({ ...isOpen, add: false })}
              >
                Cancel
              </Button>
              <Button onClick={handleAdd}>Add User</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/*  Edit User Dialog  */}
      <Dialog
        open={isOpen.edit}
        onOpenChange={(set) => setIsOpen((prev) => ({ ...prev, edit: set }))}
      >
        <DialogContent
          showCloseButton
          onPointerDownOutside={(e) => {
            e.preventDefault();
          }}
        >
          <DialogTitle>Edit User</DialogTitle>

          <div className="space-y-3">
            <div>
              <Label>
                Name<span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={selectedRow.name || ""}
                onChange={handleEditChange}
              />
            </div>

            <div>
              <Label>
                Username<span className="text-red-500">*</span>
              </Label>
              <Input
                id="username"
                value={selectedRow.username || ""}
                disabled
              />
            </div>

            <div>
              <Label>Password</Label>
              <Input
                id="password"
                type="password"
                value={selectedRow.password || ""}
                onChange={handleEditChange}
              />
            </div>

            <div>
              <Label>
                Department<span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedRow.department || ""}
                onValueChange={(value) =>
                  setSelectedRow((prev) => ({ ...prev, department: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dep) => {
                    return (
                      <SelectItem key={dep.id} value={dep.name}>
                        {dep.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                Role<span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedRow.role || ""}
                onValueChange={(value) =>
                  setSelectedRow((prev) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                Status<span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedRow.status || ""}
                onValueChange={(value) =>
                  setSelectedRow((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsOpen({ ...isOpen, edit: false })}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate}>Update</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
