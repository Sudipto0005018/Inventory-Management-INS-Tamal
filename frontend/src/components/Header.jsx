import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Dialog, DialogContent } from "../components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useContext, useState, useEffect } from "react";
import { FiMenu } from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router";
import { FaFileExcel, FaBook } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import { getISTTimestamp } from "../utils/helperFunctions";
import { FormattedDatePicker } from "@/components/FormattedDatePicker";

import { Context } from "../utils/Context";
import apiService from "../utils/apiService";
import { navigateTo, navigateToLogin, setNavigate } from "../utils/navigate";
import { makeAvatarName } from "../utils/helperFunctions";
import logo1 from "../assets/logo1.png";
import { useMemo } from "react";
import toaster from "../utils/toaster";

const Header = ({ onSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const map = useMemo(
    () => ({
      "/spares": "spares",
      "/tools": "tools",
      "/permanent/pending-survey": "survey",
      "/permanent/pending-demand": "demand",
      "/permanent/pending-issue": "issue",
      "/permanent/procurement": "procurement",
      "/permanent/stock-update": "stock_update",
      "/permanent/special-demand": "special_demand",
      "/temp-loan/pending": "ty",
      "/temporary/temporary-issue": "temp",
      "/documents/issue": "docIssue",

      "/logs/pending-survey": "survey",
      "/logs/pending-demand": "demand",
      "/logs/pending-issue": "issue",
      "/logs/procurement": "procurement",
      "/logs/stock-update": "stock_update",
      "/logs/special-demand": "special_demand",
      "/temp-loan/complete": "ty",
      "/temporary/completed": "temp",
      "/documents/completed": "docIssue",
    }),
    [],
  );
  const completedPaths = useMemo(() => [
    "/temp-loan/complete",
    "/temporary/completed",
    "/documents/completed",

    "/logs/pending-survey",
    "/logs/pending-demand",
    "/logs/pending-issue",
    "/logs/procurement",
    "/logs/stock-update",
    "/logs/special-demand",
  ]);

  const { user, setUser, setLoading, setConfig } = useContext(Context);
  const [isOpen, setIsOpen] = useState({ popOver: false, dateRange: false });
  const [inputs, setInputs] = useState({ startDate: null, endDate: null });

  const handleLogout = async () => {
    try {
      await apiService.get("/users/signout");
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigateTo("/");
      setIsOpen((prev) => ({ ...prev, popOver: false }));
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // const handleExportExcel = () => {
  //   setIsOpen(false);
  // };

  const exportExcel = async () => {
    if (completedPaths.includes(location.pathname)) {
      setIsOpen((prev) => ({ ...prev, dateRange: true }));
    } else {
      handleExportExcel();
    }
  };

  // const handleExportExcel = async () => {
  //   try {
  //     const module = map[location.pathname];
  //     const config = { module };

  //     // ✅ Only validate for completed paths
  //     if (completedPaths.includes(location.pathname)) {
  //       if (!inputs.startDate || !inputs.endDate) {
  //         toaster("error", "Please fill start date and end date");
  //         return;
  //       }

  //       config.completed = true;
  //       config.startDate = getISTTimestamp(inputs.startDate);
  //       config.endDate = getISTTimestamp(inputs.endDate);
  //     }

  //     setIsOpen((prev) => ({ ...prev, popOver: false }));

  //     await apiService.downloadExcel(`/spares/excel`, config);

  //     setIsOpen((prev) => ({ ...prev, dateRange: false }));
  //   } catch (error) {
  //     console.error("Excel export failed:", error);
  //   }
  // };

  // ✅ Convert date to start of day (IST)
  const getStartOfDay = (date) => {
    if (!date) return null;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return getISTTimestamp(d);
  };

  // ✅ Convert date to end of day (IST)
  const getEndOfDay = (date) => {
    if (!date) return null;
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return getISTTimestamp(d);
  };

  const handleExportExcel = async () => {
    try {
      const module = map[location.pathname];
      const config = { module };

      // ✅ Only validate for completed paths
      if (completedPaths.includes(location.pathname)) {
        if (!inputs.startDate || !inputs.endDate) {
          toaster("error", "Please fill start date and end date");
          return;
        }

        // ✅ FIX: send full-day range
        config.completed = true;
        config.startDate = getStartOfDay(inputs.startDate);
        config.endDate = getEndOfDay(inputs.endDate);
      }

      setIsOpen((prev) => ({ ...prev, popOver: false }));

      await apiService.downloadExcel(`/spares/excel`, config);

      setIsOpen((prev) => ({ ...prev, dateRange: false }));
    } catch (error) {
      console.error("Excel export failed:", error);
    }
  };

  const handleUserManual = () => {
    window.open("/user-manual.pdf", "_blank");
    setIsOpen((prev) => ({ ...prev, popOver: false }));
  };

  async function fetchConfig() {
    try {
      const row_per_page = localStorage.getItem("row_per_page") || 5;
      const response = await apiService.get("/configs");
      if (response.success) {
        setConfig({ ...response.data, row_per_page: parseInt(row_per_page) });
      }
    } catch (error) {
      setUser(null);
      navigateToLogin();
    }
  }

  async function verifySession() {
    try {
      const response = await apiService.get("/users/verify");
      if (response.success) {
        // await fetchConfig();
        const { user } = response.data;
        const token = user.token;
        delete user.token;
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);
        setUser(user);
      } else {
        navigateToLogin();
        setUser(null);
      }
    } catch (error) {
      setUser(null);
      navigateToLogin();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setNavigate(navigate);
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) {
      verifySession();
    } else {
      navigateToLogin();
      setUser(null);
      setLoading(false);
    }
  }, []);

  return (
    <header className="w-full px-4 py-3 shadow-sm flex items-center justify-between bg-[#0a1025] text-white h-16">
      <div className="flex items-center gap-3">
        <button
          onClick={onSidebarOpen}
          className=" p-2 rounded-md shadow-sm"
          style={{ marginRight: "0px" }}
          // className=" p-2 rounded-md hover:bg-gray-200 border border-gray-300 shadow-sm"
        >
          {/* <button
          onClick={onSidebarOpen}
          className="lg:hidden p-2 rounded-md hover:bg-gray-200 border border-gray-300 shadow-sm"
        > */}
          <FiMenu size={15} />
        </button>
        <Link to="/" className="flex items-center gap-4">
          {/* <img src="/logo.png" alt="Logo" className="h-12 w-10" /> */}
          <img src={logo1} alt="Logo" className="h-12 w-10" />
          <h1 className="text-2xl font-semibold text-pointer ms-2 title">
            Inventory Management
          </h1>
        </Link>
      </div>

      {user && (
        <Popover
          open={isOpen.popOver}
          onOpenChange={(val) =>
            setIsOpen((prev) => ({ ...prev, popOver: val }))
          }
        >
          <PopoverTrigger>
            <div className="flex items-center justify-center bg-primary/60 text-white rounded-full h-9 w-9 cursor-pointer">
              <p className="pointer-events-none">{makeAvatarName(user.name)}</p>
            </div>
          </PopoverTrigger>

          <PopoverContent className="w-60 p-2">
            <div className="flex flex-col gap-1">
              {/* Export to Excel */}
              <Button
                variant="ghost"
                className="w-full justify-start text-black hover:bg-primary/10"
                onClick={exportExcel}
              >
                <FaFileExcel className="size-[15px]" /> Export to Excel
              </Button>

              {/* User Manual */}
              <Button
                variant="ghost"
                className="w-full justify-start text-black hover:bg-primary/10"
                onClick={handleUserManual}
              >
                <FaBook className="size-[15px]" /> User Manual
              </Button>

              <div className="border-t my-1" />

              {/* Logout */}
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleLogout}
              >
                <FiLogOut /> Logout
              </Button>
            </div>
          </PopoverContent>

          {/* <PopoverContent className="w-80">
            <Button
              variant="ghost"
              className="w-full text-left cursor-pointer hover:bg-primary/10 hover:text-black text-black"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </PopoverContent> */}
        </Popover>
      )}
      <Dialog
        open={isOpen.dateRange}
        onOpenChange={(set) =>
          setIsOpen((prev) => ({ ...prev, dateRange: set }))
        }
      >
        <DialogContent
          onInteractOutside={(e) => {
            e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            e.preventDefault();
          }}
          onCloseAutoFocus={() => {
            setInputs((prev) => ({ ...prev, startDate: null, endDate: null }));
          }}
        >
          <table>
            <tr>
              <td className="py-2">Start Date:</td>
              <td className="py-2">
                <FormattedDatePicker
                  value={inputs.startDate}
                  onChange={(val) =>
                    setInputs((prev) => ({
                      ...prev,
                      startDate: val,
                    }))
                  }
                />
              </td>
            </tr>

            <tr>
              <td className="py-2">End Date:</td>
              <td className="py-2">
                <FormattedDatePicker
                  value={inputs.endDate}
                  onChange={(val) =>
                    setInputs((prev) => ({
                      ...prev,
                      endDate: val,
                    }))
                  }
                />
              </td>
            </tr>
          </table>
          <div className="flex w-full items-center justify-end gap-3">
            <Button
              onClick={() =>
                setIsOpen((prev) => ({ ...prev, dateRange: false }))
              }
            >
              Cancel
            </Button>
            <Button onClick={handleExportExcel}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;
