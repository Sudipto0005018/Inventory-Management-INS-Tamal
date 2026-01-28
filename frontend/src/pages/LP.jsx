import { useState, useEffect, useMemo, use, useContext } from "react";
import { MdModeEditOutline } from "react-icons/md";
import { FaMagnifyingGlass, FaPlus } from "react-icons/fa6";
import { HiTrash } from "react-icons/hi2";

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

import PaginationTable from "../components/PaginationTableTwo";
import toaster from "../utils/toaster";
import apiService from "../utils/apiService";
import { Context } from "../utils/Context";

const LP = () => {
    const { config } = useContext(Context);
    const columns = useMemo(() => [
        { key: "description", header: "Item Description" },
        { key: "equipment_system", header: "Equipment / System" },
        { key: "denos", header: "Denos" },
        { key: "obs_authorised", header: "OBS Authorised" },
        { key: "obs_held", header: "OBS Held" },
        { key: "box_no", header: "Box No" },
        { key: "storage_location", header: "Location of Storage" },
        { key: "remarks", header: "Remarks" },
        { key: "edit", header: "Edit" },
        { key: "delete", header: "Delete" },
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
        search: "",
    });
    const [isOpen, setIsOpen] = useState({
        addSpare: false,
        editSpare: false,
        deleteSpare: false,
    });
    const [selectedRow, setSelectedRow] = useState({});

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
            [name]: value,
        }));
    };
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setSelectedRow((prev) => ({
            ...prev,
            [name]: value,
        }));
    };
    const fetchdata = async () => {
        try {
            const response = await apiService.get("/lp", {
                params: {
                    page: currentPage,
                    search: inputs.search,
                    limit: config.row_per_page,
                },
            });
            setFetchedData(response.data);
        } catch (error) {}
    };
    const handleaddSpare = async () => {
        try {
            if (!inputs.description?.trim()) {
                toaster("error", "Description is required");
                return;
            } else if (!inputs.equipment_system?.trim()) {
                toaster("error", "Equipment / System is required");
                return;
            }
            const response = await apiService.post("/lp", {
                description: inputs.description,
                equipment_system: inputs.equipment_system,
                denos: inputs.denos,
                obs_authorised: inputs.obs_authorised,
                obs_held: inputs.obs_held,
                box_no: inputs.box_no,
                storage_location: inputs.storage_location,
                remarks: inputs.remarks,
            });
            if (response.success) {
                toaster("success", "Spare added successfully");
                setIsOpen({ ...isOpen, addSpare: false });
                fetchdata();
                setInputs({
                    description: "",
                    equipment_system: "",
                    denos: "",
                    obs_authorised: "",
                    obs_held: "",
                    box_no: "",
                    storage_location: "",
                    remarks: "",
                });
            } else {
                toaster("error", response.message);
            }
        } catch (error) {
            const errMsg = error.response?.data?.message || error.message || "Failed to add spare";
            toaster("error", errMsg);
        }
    };

    const handleEditSpare = async () => {
        try {
            if (!selectedRow.description?.trim()) {
                toaster("error", "Description is required");
                return;
            } else if (!selectedRow.equipment_system?.trim()) {
                toaster("error", "Equipment / System is required");
                return;
            }
            const response = await apiService.put("/lp/" + selectedRow.id, {
                description: selectedRow.description,
                equipment_system: selectedRow.equipment_system,
                denos: selectedRow.denos,
                obs_authorised: selectedRow.obs_authorised,
                obs_held: selectedRow.obs_held,
                box_no: selectedRow.box_no,
                storage_location: selectedRow.storage_location,
                remarks: selectedRow.remarks,
            });
            if (response.success) {
                toaster("success", "Spare updated successfully");
                setIsOpen({ ...isOpen, editSpare: false });
                fetchdata();
            } else {
                toaster("error", response.message);
            }
        } catch (error) {}
    };
    const handleDelete = async () => {
        try {
            const response = await apiService.delete("/lp/" + selectedRow.id);
            if (response.success) {
                toaster("success", "Spare deleted successfully");
                setIsOpen({ ...isOpen, deleteSpare: false });
                fetchdata();
            } else {
                toaster("error", response.message);
            }
        } catch (error) {
            const errMsg =
                error.response?.data?.message || error.message || "Failed to delete spare";
            toaster("error", errMsg);
        }
    };

    useEffect(() => {
        fetchdata();
    }, [currentPage]);
    useEffect(() => {
        const t = fetchedData.items.map((row) => ({
            ...row,
            edit: (
                <Button
                    variant="ghost"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                    onClick={() => {
                        setSelectedRow(row);
                        setIsOpen({ ...isOpen, editSpare: true });
                    }}
                >
                    <MdModeEditOutline />
                </Button>
            ),
            delete: (
                <Button
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-100"
                    onClick={() => {
                        setSelectedRow(row);
                        setIsOpen({ ...isOpen, deleteSpare: true });
                    }}
                >
                    <HiTrash />
                </Button>
            ),
        }));
        setTableData(t);
    }, [fetchedData]);

    return (
        <div className="px-2 w-full ">
            <div className="flex items-center mb-4 gap-4 w-[98%] mx-auto">
                <Input
                    type="text"
                    placeholder="Search description or equipment / system"
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
                        setIsOpen({ ...isOpen, addSpare: true });
                    }}
                    className="cursor-pointer hover:bg-primary/85"
                >
                    <FaPlus /> Add LP
                </Button>
            </div>
            <div className="min-w-0 max-table-width overflow-x-auto">
                <PaginationTable
                    data={tableData}
                    columns={columns}
                    currentPage={fetchedData.currentPage || 1}
                    pageSize={fetchedData.items?.length || 10}
                    totalPages={fetchedData.totalPages || 1}
                    onPageChange={setCurrentPage}
                    bodyClassName="buyer-table"
                />
            </div>
            <Dialog
                open={isOpen.addSpare}
                onOpenChange={(set) => setIsOpen((prev) => ({ ...prev, addSpare: set }))}
            >
                <DialogContent className="w-3xl" unbounded={true} onPointerDownOutside={() => {}}>
                    <DialogTitle className="">Add Local Procurement</DialogTitle>
                    <DialogDescription className="hidden" />
                    <div>
                        <div className="flex gap-4 items-center">
                            <div className="w-1/2">
                                <Label className="ms-2 mb-1" htmlFor="description">
                                    Item Description<span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="text"
                                    placeholder="Buyer nameItem Description"
                                    name="description"
                                    value={inputs.description}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="w-1/2">
                                <Label className="ms-2 mb-1" htmlFor="equipment_system">
                                    Equipment / System<span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="equipment_system"
                                    type="text"
                                    placeholder="Equipment / System"
                                    name="equipment_system"
                                    value={inputs.equipment_system}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 items-center mt-3">
                            <div className="w-1/2">
                                <Label className="ms-2 mb-1" htmlFor="denos">
                                    Denos<span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="denos"
                                    type="text"
                                    placeholder="Denos"
                                    name="denos"
                                    value={inputs.denos}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="w-1/2">
                                <Label className="ms-2 mb-1" htmlFor="obs_authorised">
                                    OBS Authorised
                                </Label>
                                <Input
                                    id="obs_authorised"
                                    type="text"
                                    placeholder="OBS Authorised"
                                    name="obs_authorised"
                                    value={inputs.obs_authorised}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 items-center mt-3">
                            <div className="w-1/2">
                                <Label className="ms-2 mb-1" htmlFor="obs_held">
                                    OBS Held<span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="obs_held"
                                    type="text"
                                    placeholder="OBS Held"
                                    name="obs_held"
                                    value={inputs.obs_held}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="w-1/2 mt-2">
                                <Label className="ms-2 mb-1" htmlFor="box_no">
                                    Box No<span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="box_no"
                                    type="text"
                                    placeholder="Box No"
                                    name="box_no"
                                    value={inputs.box_no}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 items-center mt-3">
                            <div className="w-1/2 pe-2">
                                <Label className="ms-2 mb-1" htmlFor="storage_location">
                                    Location of Storage
                                </Label>
                                <Input
                                    id="storage_location"
                                    type="text"
                                    placeholder="Location of Storage"
                                    name="storage_location"
                                    value={inputs.storage_location}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div className="w-full mt-4">
                            <Label className="ms-2 mb-1">Remarks</Label>
                            <Textarea
                                placeholder="Remarks"
                                name="remarks"
                                value={inputs.remarks}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => setIsOpen((prev) => ({ ...prev, addSpare: false }))}
                            variant="outline"
                            className="cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            className="text-white hover:bg-primary/85 cursor-pointer"
                            onClick={handleaddSpare}
                        >
                            Add Spare
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog
                open={isOpen.editSpare}
                onOpenChange={(set) => setIsOpen((prev) => ({ ...prev, editSpare: set }))}
            >
                <DialogContent className="w-3xl" unbounded={true} onPointerDownOutside={() => {}}>
                    <DialogTitle className="">Update Local Procurement</DialogTitle>
                    <DialogDescription className="hidden" />
                    <div>
                        <div className="flex gap-4 items-center">
                            <div className="w-1/2">
                                <Label className="ms-2 mb-1" htmlFor="description">
                                    Item Description<span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="text"
                                    placeholder="Buyer nameItem Description"
                                    name="description"
                                    value={selectedRow.description}
                                    onChange={handleEditChange}
                                />
                            </div>
                            <div className="w-1/2">
                                <Label className="ms-2 mb-1" htmlFor="equipment_system">
                                    Equipment / System<span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="equipment_system"
                                    type="text"
                                    placeholder="Equipment / System"
                                    name="equipment_system"
                                    value={selectedRow.equipment_system}
                                    onChange={handleEditChange}
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 items-center mt-3">
                            <div className="w-1/2">
                                <Label className="ms-2 mb-1" htmlFor="denos">
                                    Denos<span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="denos"
                                    type="text"
                                    placeholder="Denos"
                                    name="denos"
                                    value={selectedRow.denos}
                                    onChange={handleEditChange}
                                />
                            </div>
                            <div className="w-1/2">
                                <Label className="ms-2 mb-1" htmlFor="obs_authorised">
                                    OBS Authorised
                                </Label>
                                <Input
                                    id="obs_authorised"
                                    type="text"
                                    placeholder="OBS Authorised"
                                    name="obs_authorised"
                                    value={selectedRow.obs_authorised}
                                    onChange={handleEditChange}
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 items-center mt-3">
                            <div className="w-1/2">
                                <Label className="ms-2 mb-1" htmlFor="obs_held">
                                    OBS Held<span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="obs_held"
                                    type="text"
                                    placeholder="OBS Held"
                                    name="obs_held"
                                    value={selectedRow.obs_held}
                                    onChange={handleEditChange}
                                />
                            </div>
                            <div className="w-1/2 mt-2">
                                <Label className="ms-2 mb-1" htmlFor="box_no">
                                    Box No<span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="box_no"
                                    type="text"
                                    placeholder="Box No"
                                    name="box_no"
                                    value={selectedRow.box_no}
                                    onChange={handleEditChange}
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 items-center mt-3">
                            <div className="w-1/2 pe-2">
                                <Label className="ms-2 mb-1" htmlFor="storage_location">
                                    Location of Storage
                                </Label>
                                <Input
                                    id="storage_location"
                                    type="text"
                                    placeholder="Location of Storage"
                                    name="storage_location"
                                    value={selectedRow.storage_location}
                                    onChange={handleEditChange}
                                />
                            </div>
                        </div>
                        <div className="w-full mt-4">
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
                            onClick={() => setIsOpen((prev) => ({ ...prev, editSpare: false }))}
                            variant="outline"
                            className="cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            className="text-white hover:bg-primary/85 cursor-pointer"
                            onClick={handleEditSpare}
                        >
                            Update Spare
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog
                open={isOpen.deleteSpare}
                onOpenChange={(set) => setIsOpen((prev) => ({ ...prev, deleteSpare: set }))}
            >
                <DialogContent>
                    <DialogTitle>Are you sure you want to delete this LP?</DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. Please confirm if you want to proceed with the
                        deletion of the LP: <strong>{selectedRow.description}</strong>.
                    </DialogDescription>
                    <DialogFooter>
                        <Button
                            onClick={() => setIsOpen((prev) => ({ ...prev, deleteSpare: false }))}
                            variant="outline"
                            className="cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDelete}
                            className="text-white bg-red-500 hover:bg-red-600 cursor-pointer"
                        >
                            Delete LP
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LP;
