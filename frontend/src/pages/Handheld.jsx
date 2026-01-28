import { useContext, useEffect, useMemo, useState } from "react";
import { Context } from "../utils/Context";
import { Button } from "../components/ui/button";
import { FaChevronRight } from "react-icons/fa6";
import PaginationTable from "../components/PaginationTableTwo";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { ChevronDownIcon } from "lucide-react";
import { formatDate, formatSimpleDate } from "../utils/helperFunctions";
import { Calendar } from "../components/ui/calendar";
import SpinnerButton from "../components/ui/spinner-button";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import apiService from "../utils/apiService";
import BoxNoInputs from "../components/BoxNoInputsTwo";
import toaster from "../utils/toaster";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

// return

const Handheld = () => {
    const { config } = useContext(Context);
    const columns = useMemo(() => [
        { key: "description", header: "Item Description" },
        { key: "equipment_system", header: "Equipment / System" },
        { key: "denos", header: "Denos" },
        { key: "category", header: "Category" },
        // { key: "quantity", header: "Quantity" },
        { key: "status", header: "Status" },
        { key: "processed", header: "Processed" },
    ]);
    const [tableData, setTableData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [fetchedData, setFetchedData] = useState({
        items: [],
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
    });
    const [isLoading, setIsLoading] = useState({ table: false, search: false, issue: false });
    const [inputs, setInputs] = useState({
        issued_to: "",
        issued_type: "single",
        issue_category: "permanent",
        issue_calender: new Date(),
        return_calender: new Date(),
        box: "",
        unit_name: "",
        person_name: "",
        service_name: "",
        phone_no: "",
        loan_duration: "",
        conquered_by: "",
        quantuiy: "",
        box_details: "",
        qr_result: "",
    });
    const [isOpen, setIsOpen] = useState({
        issueTemporary: false,
        issueLoan: false,
        issuePermanent: false,
        issue_category: false,
        issue_calender: false,
        return_calender: false,
        qr_scan_popup: false,
    });
    const [boxNo, setBoxNo] = useState([{ no: "", qn: "" }]);
    const [selectedRow, setSelectedRow] = useState({});

    const fetchdata = async () => {
        try {
            const response = await apiService.get("/pending", {
                params: {
                    page: currentPage,
                    search: inputs.search,
                    limit: config.row_per_page,
                },
            });
            setFetchedData(response.data);
        } catch (error) {
            console.log(error);
        }
    };
    const handleIssueCategory = async () => {
        setIsLoading((prev) => ({ ...prev, issue_category: true }));
        try {
            const response = await apiService.post("/pending/issue-category", {
                id: selectedRow.id,
                issue_category: inputs.issue_category,
            });
            if (response.success) {
                setIsOpen((prev) => ({ ...prev, issue_category: false }));
                setInputs((prev) => ({
                    ...prev,
                    issue_category: "permanent",
                }));
                fetchdata();
                if (inputs.issue_category == "loan")
                    setIsOpen((prev) => ({ ...prev, issueLoan: true }));
                else if (inputs.issue_category == "temporary")
                    setIsOpen((prev) => ({ ...prev, issueTemporary: true }));
                else if (inputs.issue_category == "permanent")
                    setIsOpen((prev) => ({ ...prev, issuePermanent: true }));
            } else {
                toaster("error", response.message);
            }
        } catch (error) {
            console.log(error);
            const errMsg = error.response?.data?.message || error.message || "Failed to issue item";
            toaster("error", errMsg);
        } finally {
            setIsLoading((prev) => ({ ...prev, issue_category: false }));
        }
    };
    const handleIssueTempProduct = async () => {
        if (
            !inputs.issued_to ||
            !inputs.issued_type ||
            !inputs.issue_calender ||
            !inputs.loan_duration
        ) {
            toaster("error", "Please fill all the required fields");
            return;
        }
        if (inputs.issued_type == "single" && !inputs.box) {
            toaster("error", "Box no is required");
            return;
        } else if (inputs.issued_type == "bulk") {
            let totalWithdrawl = 0;
            boxNo.forEach((box) => {
                totalWithdrawl += parseInt(box.wd || 0);
            });
            if (totalWithdrawl == 0) {
                toaster("error", "Quantity is required");
                return;
            }
        }
        setIsLoading((prev) => ({ ...prev, issue: true }));
        try {
            const response = await apiService.post("/pending/issue", {
                id: selectedRow.id,
                issued_to: inputs.issued_to,
                issued_type: inputs.issued_type,
                issue_date: formatSimpleDate(inputs.issue_calender),
                loan_duration: inputs.loan_duration,
                box_no: inputs.box
                    ? JSON.stringify([{ no: inputs.box, qn: 1 }])
                    : JSON.stringify(boxNo.map((b) => ({ no: b.no, qn: b.wd || 0 }))),
            });
            if (response.success) {
                toaster("success", "Item issued successfully");
                setIsOpen((prev) => ({ ...prev, issueTemporary: false }));
                setInputs((prev) => ({
                    ...prev,
                    issued_to: "",
                    issue_type: "single",
                }));
                fetchdata();
            } else {
                toaster("error", response.message);
            }
        } catch (error) {
            const errMsg = error.response?.data?.message || error.message || "Failed to issue item";
            toaster("error", errMsg);
        } finally {
            setIsLoading((prev) => ({ ...prev, issue: false }));
        }
    };
    const handleIssueLoan = async () => {
        if (
            !inputs.unit_name ||
            !inputs.person_name ||
            !inputs.service_name ||
            !inputs.phone_no ||
            !inputs.loan_duration ||
            !inputs.conquered_by
        ) {
            toaster("error", "Please fill all the required fields");
            return;
        }
        if (inputs.issued_type == "single" && !inputs.box) {
            toaster("error", "Box no is required");
            return;
        } else if (inputs.issued_type == "bulk") {
            let totalWithdrawl = 0;
            boxNo.forEach((box) => {
                totalWithdrawl += parseInt(box.wd || 0);
            });
            if (totalWithdrawl == 0) {
                toaster("error", "Quantity is required");
                return;
            }
        }
        setIsLoading((prev) => ({ ...prev, issueLoan: true }));
        try {
            const response = await apiService.post("/pending/issue-loan", {
                id: selectedRow.id,
                unit_name: inputs.unit_name,
                person_name: inputs.person_name,
                service_name: inputs.service_name,
                phone_no: inputs.phone_no,
                loan_duration: inputs.loan_duration,
                conquered_by: inputs.conquered_by,
                box_no: inputs.box
                    ? JSON.stringify([{ no: inputs.box, qn: 1 }])
                    : JSON.stringify(boxNo.map((b) => ({ no: b.no, qn: b.wd || 0 }))),
                issue_date: formatSimpleDate(),
            });
            if (response.success) {
                toaster("success", "Item issued successfully");
                setIsOpen((prev) => ({ ...prev, issueLoan: false }));

                fetchdata();
            } else {
                toaster("error", response.message);
            }
        } catch (error) {
            const errMsg = error.response?.data?.message || error.message || "Failed to issue loan";
            toaster("error", errMsg);
        } finally {
            setIsLoading((prev) => ({ ...prev, issueLoan: false }));
        }
    };
    const handleQRUpload = async () => {
        try {
            setIsLoading((prev) => ({ ...prev, qr_scan: true }));
            const uids = inputs.qr_result
                ?.split("\n")
                ?.map((line) => {
                    const match = line.match(/Item id: (\d+)/);
                    return match ? match[1] : null;
                })
                .filter((uid) => uid !== null);

            // let result = { success: true };
            const result = await apiService.post("/pending/add-qrs", { qrs: uids });
            if (result.success) {
                toaster("success", "QR uploaded successfully");
                setIsOpen((prev) => ({ ...prev, qr_scan_popup: false }));
                setInputs((prev) => ({
                    ...prev,
                    qr_result: "",
                }));
                fetchdata();
            } else {
                toaster("error", result.message);
            }
        } catch (error) {
            const errMsg = error.response?.data?.message || error.message || "Failed to upload QR";
            toaster("error", errMsg);
        } finally {
            setIsLoading((prev) => ({ ...prev, qr_scan: false }));
        }
    };
    const handlePermanentIssue = async () => {
        if (!inputs.issued_to || !inputs.issued_type || !inputs.issue_calender) {
            toaster("error", "Please fill all the required fields");
            return;
        }
        if (inputs.issued_type == "single" && !inputs.box) {
            toaster("error", "Box no is required");
            return;
        } else if (inputs.issued_type == "bulk") {
            let totalWithdrawl = 0;
            boxNo.forEach((box) => {
                totalWithdrawl += parseInt(box.wd || 0);
            });
            if (totalWithdrawl == 0) {
                toaster("error", "Quantity is required");
                return;
            }
        }
        setIsLoading((prev) => ({ ...prev, issue: true }));
        try {
            const response = await apiService.post("/pending/issue-permanent", {
                id: selectedRow.id,
                issued_to: inputs.issued_to,
                issued_type: inputs.issued_type,
                issue_date: formatSimpleDate(inputs.issue_calender),
                box_no: inputs.box
                    ? JSON.stringify([{ no: inputs.box, qn: 1 }])
                    : JSON.stringify(boxNo.map((b) => ({ no: b.no, qn: b.wd || 0 }))),
                source: selectedRow.source,
                uid: selectedRow.uid,
                current_box: selectedRow.box_no,
            });
            if (response.success) {
                toaster("success", "Item issued successfully");
                setIsOpen((prev) => ({ ...prev, issuePermanent: false }));
                setInputs((prev) => ({
                    ...prev,
                    issued_to: "",
                    issue_type: "single",
                }));
                fetchdata();
            } else {
                toaster("error", response.message);
            }
        } catch (error) {
            const errMsg = error.response?.data?.message || error.message || "Failed to issue item";
            toaster("error", errMsg);
        } finally {
            setIsLoading((prev) => ({ ...prev, issue: false }));
        }
    };

    useEffect(() => {
        fetchdata();
    }, [currentPage]);
    useEffect(() => {
        setIsOpen((prev) => ({ ...prev, qr_scan_popup: true }));
    }, []);
    useEffect(() => {
        const t = fetchedData.items.map((row) => ({
            ...row,
            status: row.status == "pending" ? "Pending" : row.status,
            processed: (
                <Button
                    size="icon"
                    className="bg-white text-black shadow-md border hover:bg-gray-100"
                    onClick={() => {
                        setSelectedRow(row);
                        setBoxNo(JSON.parse(row.box_no));
                        if (
                            (row.category?.toLowerCase() == "p" ||
                                row.category?.toLowerCase() == "r") &&
                            row.status?.toLowerCase() == "pending"
                        ) {
                            if (row.issue_category == "temporary") {
                                setIsOpen((prev) => ({ ...prev, issueTemporary: true }));
                            } else if (row.issue_category == "loan") {
                                setIsOpen((prev) => ({ ...prev, issueLoan: true }));
                            } else if (row.issue_category == "permanent") {
                                setIsOpen((prev) => ({ ...prev, issuePermanent: true }));
                            } else {
                                setIsOpen((prev) => ({ ...prev, issue_category: true }));
                            }
                        }
                    }}
                >
                    <FaChevronRight />
                </Button>
            ),
        }));
        setTableData(t);
    }, [fetchedData]);
    return (
        <div className="flex w-full gap-2 items-center justify-center h-full">
            <div className="w-table h-full rounded-md bg-white">
                <PaginationTable
                    data={tableData}
                    columns={columns}
                    currentPage={fetchedData.currentPage || 1}
                    pageSize={fetchedData.items?.length || 10}
                    totalPages={fetchedData.totalPages || 1}
                    onPageChange={setCurrentPage}
                />
            </div>
            <div className="w-[200px] h-full rounded-md bg-white p-2">
                <img className="w-full rounded pointer-events-none" src="/QR1.jpg" />
                <p className="text-sm text-center mt-4">San this QR to sync the handheld data</p>
            </div>
            <Dialog
                open={isOpen.issueTemporary}
                onOpenChange={(set) => setIsOpen((prev) => ({ ...prev, issueTemporary: set }))}
            >
                <DialogContent
                    onPointerDownOutside={(e) => {
                        // e.preventDefault();
                    }}
                    className="max-h-[95%] overflow-y-auto"
                    onCloseAutoFocus={() => {
                        setBoxNo([{ no: "", qn: "" }]);
                        setInputs((prev) => ({
                            ...prev,
                            issued_to: "",
                            issued_type: "single",
                            issue_calender: new Date(),
                        }));
                    }}
                >
                    <DialogTitle className="">
                        Issue Item for Temporary Loan within Ship
                    </DialogTitle>
                    <DialogDescription className="hidden" />
                    <div>
                        <p className="text-sm">
                            Selected item is{" "}
                            <span className="font-semibold">{selectedRow.description}</span>
                        </p>
                        <div className="flex items-center mt-4 gap-4">
                            <p className="w-[120px] text-sm">
                                Issue to: <span className="text-red-500">*</span>
                            </p>
                            <Select
                                value={inputs.issued_to}
                                onValueChange={(value) =>
                                    setInputs((prev) => ({ ...prev, issued_to: value }))
                                }
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue className="" placeholder="Issue to" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fer">FER</SelectItem>
                                    <SelectItem value="aer">AER</SelectItem>
                                    <SelectItem value="oms">OMS</SelectItem>
                                    <SelectItem value="control">Control</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center mt-3">
                            <p className="text-sm w-[120px] me-4">
                                Duration of Loan <span className="text-red-500">*</span>
                            </p>
                            <Input
                                type="number"
                                placeholder="Duration of Loan"
                                className="flex-1 border-r-0 rounded-r-none peer"
                                onChange={(e) =>
                                    setInputs((prev) => ({
                                        ...prev,
                                        loan_duration: e.target.value,
                                    }))
                                }
                            />
                            <p className="border border-l-0 py-[7px] px-3 text-sm bg-gray-50 rounded-r-md peer-focus-visible:border-primary">
                                days
                            </p>
                        </div>
                        <div className="flex items-center mt-4 gap-4">
                            <p className="w-[120px] text-sm">
                                Issue date: <span className="text-red-500">*</span>
                            </p>
                            <Popover
                                open={isOpen.issue_calender}
                                onOpenChange={(set) => {
                                    setIsOpen((prev) => ({ ...prev, issue_calender: set }));
                                }}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        id="date"
                                        className="flex-1 justify-between font-normal"
                                    >
                                        {inputs.issue_calender
                                            ? formatDate(inputs.issue_calender)
                                            : "Select date"}
                                        <ChevronDownIcon />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto overflow-hidden p-0"
                                    align="start"
                                >
                                    <Calendar
                                        mode="single"
                                        selected={inputs.issue_calender}
                                        captionLayout="dropdown"
                                        onSelect={(date) => {
                                            setInputs((prev) => ({
                                                ...prev,
                                                issue_calender: date,
                                            }));
                                            setIsOpen((prev) => ({
                                                ...prev,
                                                issue_calender: false,
                                            }));
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex items-center mt-4 gap-4">
                            <p className="w-[120px] text-sm">
                                Quantity: <span className="text-red-500">*</span>
                            </p>
                            <Select
                                value={inputs.issued_type}
                                onValueChange={(value) => {
                                    setInputs((prev) => ({ ...prev, issued_type: value }));
                                    if (value == "bulk") {
                                        setInputs((prev) => ({
                                            ...prev,
                                            box: "",
                                        }));
                                    }
                                }}
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue className="" placeholder="Issue type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="single">Single</SelectItem>
                                    <SelectItem value="bulk">Bulk</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {inputs.issued_type == "bulk" ? (
                            <div className="flex flex-col justify-center mt-4 gap-1">
                                <p className="w-[200px] text-sm">Item Breakdown</p>
                                <BoxNoInputs
                                    isBoxnumberDisable={true}
                                    value={boxNo}
                                    onChange={setBoxNo}
                                    isAddRow={false}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center mt-4 gap-4">
                                <p className="w-[120px] text-sm">
                                    Box no: <span className="text-red-500">*</span>
                                </p>
                                <Select
                                    valuealue={inputs.box}
                                    onValueChange={(val) =>
                                        setInputs((prev) => ({ ...prev, box: val }))
                                    }
                                >
                                    <SelectTrigger className="flex-1">
                                        <SelectValue className="" placeholder="Select box no" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {boxNo.map((box, idx) => (
                                            <SelectItem key={idx} value={box.no}>
                                                {box.no}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="flex items-center mt-4 gap-4 justify-end">
                            <Button
                                onClick={() =>
                                    setIsOpen((prev) => ({ ...prev, issueTemporary: false }))
                                }
                                variant="outline"
                                className="cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <SpinnerButton
                                loading={isLoading.issue}
                                disabled={isLoading.issue}
                                loadingText="Issueing..."
                                className="text-white hover:bg-primary/85 cursor-pointer"
                                onClick={handleIssueTempProduct}
                            >
                                Submit
                            </SpinnerButton>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isOpen.issue_category}
                onOpenChange={(set) =>
                    setIsOpen((prev) => {
                        return { ...prev, issue_category: set };
                    })
                }
            >
                <DialogContent
                    onPointerDownOutside={(e) => {
                        // e.preventDefault();
                    }}
                    className="max-h-[90%] overflow-y-auto"
                    onCloseAutoFocus={() => {
                        setInputs((prev) => ({
                            ...prev,
                            issue_category: "permanent",
                        }));
                    }}
                >
                    <DialogTitle>Select Issue Category</DialogTitle>
                    <DialogDescription className="hidden" />
                    <RadioGroup
                        defaultValue="permanent"
                        value={inputs.issue_category}
                        onValueChange={(value) =>
                            setInputs((prev) => ({ ...prev, issue_category: value }))
                        }
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="permanent" id="permanent" />
                            <Label htmlFor="permanent">Permanent Issue</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="temporary" id="temporary" />
                            <Label htmlFor="temporary">Temporary Loan within Ship</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="loan" id="loan" />
                            <Label htmlFor="loan">TY Loan</Label>
                        </div>
                    </RadioGroup>
                    <div className="flex items-center mt-4 gap-4 justify-end">
                        <Button
                            onClick={() =>
                                setIsOpen((prev) => ({ ...prev, issue_category: false }))
                            }
                            variant="outline"
                        >
                            Cancel
                        </Button>
                        <SpinnerButton
                            loading={isLoading.issue_category}
                            disabled={isLoading.issue_category}
                            loadingText="Issueing..."
                            onClick={handleIssueCategory}
                            className="text-white hover:bg-primary/85 cursor-pointer"
                        >
                            Submit
                        </SpinnerButton>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isOpen.issueLoan}
                onOpenChange={(set) => setIsOpen((prev) => ({ ...prev, issueLoan: set }))}
            >
                <DialogContent
                    onPointerDownOutside={(e) => {
                        // e.preventDefault();
                    }}
                    className="max-h-[90%] overflow-y-auto"
                    onCloseAutoFocus={() => {
                        setInputs((prev) => ({
                            ...prev,
                            unit_name: "",
                            person_name: "",
                            service_name: "",
                            phone_no: "",
                            loan_duration: "",
                            conquered_by: "",
                            box: "",
                        }));
                        setBoxNo([{ no: "", qn: "" }]);
                    }}
                >
                    <DialogTitle className="">Issue Item for TY Loan</DialogTitle>
                    <DialogDescription className="hidden" />
                    <div>
                        <div className="flex gap-4 items-center">
                            <p className="text-sm w-[120px]">
                                Unit name <span className="text-red-500">*</span>
                            </p>
                            <Input
                                type="text"
                                placeholder="Unit name"
                                className="flex-1"
                                onChange={(e) =>
                                    setInputs((prev) => ({
                                        ...prev,
                                        unit_name: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="flex gap-4 items-center mt-3">
                            <p className="text-sm w-[120px]">
                                Person name <span className="text-red-500">*</span>
                            </p>
                            <Input
                                type="text"
                                placeholder="Person name"
                                className="flex-1"
                                onChange={(e) =>
                                    setInputs((prev) => ({
                                        ...prev,
                                        person_name: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="flex gap-4 items-center mt-3">
                            <p className="text-sm w-[120px]">
                                Service name <span className="text-red-500">*</span>
                            </p>
                            <Input
                                type="text"
                                placeholder="Service name"
                                className="flex-1"
                                onChange={(e) =>
                                    setInputs((prev) => ({
                                        ...prev,
                                        service_name: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="flex gap-4 items-center mt-3">
                            <p className="text-sm w-[120px]">
                                Phone No <span className="text-red-500">*</span>
                            </p>
                            <Input
                                type="number"
                                placeholder="Phone No"
                                className="flex-1"
                                onChange={(e) =>
                                    setInputs((prev) => ({
                                        ...prev,
                                        phone_no: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="flex items-center mt-3">
                            <p className="text-sm w-[120px] me-4">
                                Duration of Loan <span className="text-red-500">*</span>
                            </p>
                            <Input
                                type="number"
                                placeholder="Duration of Loan"
                                className="flex-1 border-r-0 rounded-r-none peer"
                                onChange={(e) =>
                                    setInputs((prev) => ({
                                        ...prev,
                                        loan_duration: e.target.value,
                                    }))
                                }
                            />
                            <p className="border border-l-0 py-[7px] px-3 text-sm bg-gray-50 rounded-r-md peer-focus-visible:border-primary">
                                days
                            </p>
                        </div>
                        <div className="flex gap-4 items-center mt-3">
                            <p className="text-sm w-[120px]">
                                Conquered By <span className="text-red-500">*</span>
                            </p>
                            <Input
                                type="text"
                                placeholder="Conquered By"
                                className="flex-1"
                                onChange={(e) =>
                                    setInputs((prev) => ({
                                        ...prev,
                                        conquered_by: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        {/* <div className="flex gap-4 items-center mt-3">
                            <p className="text-sm w-[120px]">
                                Quantity <span className="text-red-500">*</span>
                            </p>
                            <Input
                                type="number"
                                placeholder="Quantity"
                                className="flex-1"
                                onChange={(e) =>
                                    setInputs((prev) => ({
                                        ...prev,
                                        quantuiy: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="flex gap-4 items-center mt-3">
                            <p className="text-sm w-[120px]">
                                Box details <span className="text-red-500">*</span>
                            </p>
                            <Input
                                type="text"
                                placeholder="Box details"
                                className="flex-1"
                                onChange={(e) =>
                                    setInputs((prev) => ({
                                        ...prev,
                                        box_details: e.target.value,
                                    }))
                                }
                            />
                        </div> */}
                        <div className="flex items-center mt-4 gap-4">
                            <p className="w-[120px] text-sm">
                                Quantity: <span className="text-red-500">*</span>
                            </p>
                            <Select
                                value={inputs.issued_type}
                                onValueChange={(value) => {
                                    setInputs((prev) => ({ ...prev, issued_type: value }));
                                    if (value == "bulk") {
                                        setInputs((prev) => ({
                                            ...prev,
                                            box: "",
                                        }));
                                    }
                                }}
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue className="" placeholder="Issue type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="single">Single</SelectItem>
                                    <SelectItem value="bulk">Bulk</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {inputs.issued_type == "bulk" ? (
                            <div className="flex flex-col justify-center mt-4 gap-1">
                                <p className="w-[200px] text-sm">Item Breakdown</p>
                                <BoxNoInputs
                                    isBoxnumberDisable={true}
                                    value={boxNo}
                                    onChange={setBoxNo}
                                    isAddRow={false}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center mt-4 gap-4">
                                <p className="w-[120px] text-sm">
                                    Box no: <span className="text-red-500">*</span>
                                </p>
                                <Select
                                    valuealue={inputs.box}
                                    onValueChange={(val) =>
                                        setInputs((prev) => ({ ...prev, box: val }))
                                    }
                                >
                                    <SelectTrigger className="flex-1">
                                        <SelectValue className="" placeholder="Select box no" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {boxNo.map((box, idx) => (
                                            <SelectItem key={idx} value={box.no}>
                                                {box.no}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="flex items-center justify-end gap-4 mt-4">
                            <Button
                                onClick={() => setIsOpen((prev) => ({ ...prev, issueLoan: false }))}
                                variant="outline"
                            >
                                Cancel
                            </Button>
                            <SpinnerButton
                                onClick={handleIssueLoan}
                                className="text-white hover:bg-primary/85 cursor-pointer"
                                disabled={isLoading.issueLoan}
                                loading={isLoading.issueLoan}
                                loadingText="Submitting..."
                            >
                                Submit
                            </SpinnerButton>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isOpen.qr_scan_popup}
                onOpenChange={(set) =>
                    setIsOpen((prev) => {
                        return { ...prev, qr_scan_popup: set };
                    })
                }
            >
                <DialogContent
                    onPointerDownOutside={(e) => {
                        // e.preventDefault();
                    }}
                    unbounded
                    className="max-h-[90%] overflow-y-auto w-2xl"
                    onCloseAutoFocus={() => {
                        setInputs((prev) => ({
                            ...prev,
                            qr_result: "",
                        }));
                    }}
                >
                    <DialogTitle>Select Issue Category</DialogTitle>
                    <DialogDescription className="hidden" />
                    <Textarea
                        className="h-48"
                        placeholder="Scanned QR result"
                        value={inputs.qr_result}
                        onChange={(e) =>
                            setInputs((prev) => ({ ...prev, qr_result: e.target.value }))
                        }
                    />
                    <div className="flex items-center mt-4 gap-4 justify-end">
                        <Button
                            onClick={() => setIsOpen((prev) => ({ ...prev, qr_scan_popup: false }))}
                            variant="outline"
                        >
                            Cancel
                        </Button>
                        <SpinnerButton
                            onClick={handleQRUpload}
                            loading={isLoading.qr_scan}
                            disabled={isLoading.qr_scan}
                            loadingText="Uploading..."
                        >
                            Upload
                        </SpinnerButton>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isOpen.issuePermanent}
                onOpenChange={(set) =>
                    setIsOpen((prev) => {
                        return { ...prev, issuePermanent: set };
                    })
                }
            >
                <DialogContent
                    onPointerDownOutside={(e) => {
                        // e.preventDefault();
                    }}
                    className="max-h-[90%] overflow-y-auto w-2xl"
                    onCloseAutoFocus={() => {
                        setInputs((prev) => ({
                            ...prev,
                        }));
                    }}
                >
                    <DialogTitle>Issue Permanent Item</DialogTitle>
                    <DialogDescription className="hidden" />
                    <div>
                        <div className="flex items-center mt-4 gap-4">
                            <p className="w-[120px] text-sm">
                                Issue to: <span className="text-red-500">*</span>
                            </p>
                            <Select
                                value={inputs.issued_to}
                                onValueChange={(value) =>
                                    setInputs((prev) => ({ ...prev, issued_to: value }))
                                }
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue className="" placeholder="Issue to" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fer">FER</SelectItem>
                                    <SelectItem value="aer">AER</SelectItem>
                                    <SelectItem value="oms">OMS</SelectItem>
                                    <SelectItem value="control">Control</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center mt-4 gap-4">
                            <p className="w-[120px] text-sm">
                                Issue date: <span className="text-red-500">*</span>
                            </p>
                            <Popover
                                open={isOpen.issue_calender}
                                onOpenChange={(set) => {
                                    setIsOpen((prev) => ({ ...prev, issue_calender: set }));
                                }}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        id="date"
                                        className="flex-1 justify-between font-normal"
                                    >
                                        {inputs.issue_calender
                                            ? formatDate(inputs.issue_calender)
                                            : "Select date"}
                                        <ChevronDownIcon />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto overflow-hidden p-0"
                                    align="start"
                                >
                                    <Calendar
                                        mode="single"
                                        selected={inputs.issue_calender}
                                        captionLayout="dropdown"
                                        onSelect={(date) => {
                                            setInputs((prev) => ({
                                                ...prev,
                                                issue_calender: date,
                                            }));
                                            setIsOpen((prev) => ({
                                                ...prev,
                                                issue_calender: false,
                                            }));
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex items-center mt-4 gap-4">
                            <p className="w-[120px] text-sm">
                                Quantity: <span className="text-red-500">*</span>
                            </p>
                            <Select
                                value={inputs.issued_type}
                                onValueChange={(value) => {
                                    setInputs((prev) => ({ ...prev, issued_type: value }));
                                    if (value == "bulk") {
                                        setInputs((prev) => ({
                                            ...prev,
                                            box: "",
                                        }));
                                    }
                                }}
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue className="" placeholder="Issue type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="single">Single</SelectItem>
                                    <SelectItem value="bulk">Bulk</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {inputs.issued_type == "bulk" ? (
                            <div className="flex flex-col justify-center mt-4 gap-1">
                                <p className="w-[200px] text-sm">Item Breakdown</p>
                                <BoxNoInputs
                                    isBoxnumberDisable={true}
                                    value={boxNo}
                                    onChange={setBoxNo}
                                    isAddRow={false}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center mt-4 gap-4">
                                <p className="w-[120px] text-sm">
                                    Box no: <span className="text-red-500">*</span>
                                </p>
                                <Select
                                    valuealue={inputs.box}
                                    onValueChange={(val) =>
                                        setInputs((prev) => ({ ...prev, box: val }))
                                    }
                                >
                                    <SelectTrigger className="flex-1">
                                        <SelectValue className="" placeholder="Select box no" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {boxNo.length > 0 &&
                                            boxNo.map((box, idx) =>
                                                box.no ? (
                                                    <SelectItem key={idx} value={box.no}>
                                                        {box.no}
                                                    </SelectItem>
                                                ) : null
                                            )}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="flex items-center mt-4 gap-4 justify-end">
                            <Button
                                onClick={() =>
                                    setIsOpen((prev) => ({ ...prev, issuePermanent: false }))
                                }
                                variant="outline"
                            >
                                Cancel
                            </Button>
                            <SpinnerButton
                                onClick={handlePermanentIssue}
                                loading={isLoading.permanentIssue}
                                disabled={isLoading.permanentIssue}
                                loadingText="Submitting..."
                            >
                                Submit
                            </SpinnerButton>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Handheld;
