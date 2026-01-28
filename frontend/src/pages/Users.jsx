import { useState, useEffect, useMemo, useContext } from "react";
import { MdModeEditOutline } from "react-icons/md";
import { FaMagnifyingGlass, FaPlus } from "react-icons/fa6";

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
import toaster from "../utils/toaster";
import apiService from "../utils/apiService";
import { Context } from "../utils/Context";

const Users = () => {
    const { config } = useContext(Context);
    const columns = useMemo(() => [
        { key: "name", header: "Name" },
        { key: "username", header: "Username" },
        { key: "department", header: "Department" },
        { key: "role", header: "Role" },
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
        username: "",
        password: "",
        department: "",
        role: "",
        search: "",
    });
    const [selectedRow, setSelectedRow] = useState({});
    const [isOpen, setIsOpen] = useState({
        add: false,
        edit: false,
    });
    const [departments, setDepartments] = useState([]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInputs((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSearch = async (e) => {};

    const fetchDepartments = async () => {
        try {
            const response = await apiService.get("/departments", {
                params: {
                    extra: "all",
                },
            });
            setDepartments(response.data.items);
        } catch (error) {}
    };
    const fetchUsers = async () => {
        try {
            const response = await apiService.get("/users", {
                params: {
                    page: currentPage,
                    search: inputs.search,
                    limit: config.row_per_page,
                },
            });
            setFetchedData(response.data);
        } catch (error) {
            const errMsg =
                error.response?.data?.message || error.message || "Failed to fetch users";
            toaster("error", errMsg);
        }
    };
    const handleAdd = async () => {
        if (!inputs.name?.trim()) {
            toaster("error", "Name is required");
            return;
        } else if (!inputs.username?.trim()) {
            toaster("error", "Username is required");
            return;
        } else if (!inputs.password?.trim()) {
            toaster("error", "Password is required");
            return;
        } else if (inputs.department === "") {
            toaster("error", "Department is required");
            return;
        } else if (!inputs.role?.trim()) {
            toaster("error", "Role is required");
            return;
        }
        try {
            const response = await apiService.post("/users/signup", {
                name: inputs.name,
                username: inputs.username,
                password: inputs.password,
                department: inputs.department,
                role: inputs.role,
            });
            if (response.success) {
                toaster("success", "User added successfully");
                setIsOpen({ ...isOpen, add: false });
                fetchUsers();
            } else {
                toaster("error", response.message);
            }
        } catch (error) {
            const errMsg = error.response?.data?.message || error.message || "Failed to add user";
            toaster("error", errMsg);
        }
    };

    useEffect(() => {
        fetchDepartments();
        fetchUsers();
    }, [currentPage]);
    useEffect(() => {
        const t = fetchedData.items.map((row) => ({
            ...row,
            edit: (
                <Button
                    variant="ghost"
                    className="text-blue-600 hover:text-blue-700"
                    onClick={() => {
                        setSelectedRow(row);
                        setIsOpen({ ...isOpen, edit: true });
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
            <div className="flex items-center mb-4 gap-4 w-[98%] mx-auto">
                <Input
                    type="text"
                    placeholder="Search user by name or username"
                    className="bg-white"
                    value={inputs.search}
                    onChange={(e) => setInputs((prev) => ({ ...prev, search: e.target.value }))}
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
                    onClick={() => {
                        setIsOpen({ ...isOpen, add: true });
                    }}
                    className="cursor-pointer hover:bg-primary/85"
                >
                    <FaPlus /> Add User
                </Button>
            </div>
            <PaginationTable
                data={tableData}
                columns={columns}
                currentPage={fetchedData.currentPage || 1}
                pageSize={fetchedData.items?.length || 10}
                totalPages={fetchedData.totalPages || 1}
                onPageChange={setCurrentPage}
                bodyClassName="users-table"
            />
            <Dialog
                open={isOpen.add}
                onOpenChange={(set) => setIsOpen((prev) => ({ ...prev, add: set }))}
            >
                <DialogContent onPointerDownOutside={() => {}}>
                    <DialogTitle className="">Add User</DialogTitle>
                    <DialogDescription className="hidden" />
                    <div>
                        <Label className="ms-2 mb-2" htmlFor="name">
                            Name<span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Name"
                            name="name"
                            autoComplete="false"
                            value={inputs.name}
                            onChange={handleChange}
                        />
                        <Label className="ms-2 mb-2 mt-4" htmlFor="username">
                            Username<span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="username"
                            type="text"
                            placeholder="Username"
                            name="username"
                            autoComplete="false"
                            value={inputs.username}
                            onChange={handleChange}
                        />
                        <Label className="ms-2 mb-2 mt-4" htmlFor="pasword">
                            Password<span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Password"
                            name="password"
                            autoComplete="false"
                            value={inputs.password}
                            onChange={handleChange}
                        />
                        <Label className="ms-2 mb-2 mt-4" htmlFor="department">
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
                                {departments.map((department) => (
                                    <SelectItem key={department.id} value={department.id}>
                                        {department.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Label className="ms-2 mb-2 mt-4" htmlFor="role">
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
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => setIsOpen((prev) => ({ ...prev, add: false }))}
                            variant="outline"
                            className="cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleAdd}>Add User</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Users;
