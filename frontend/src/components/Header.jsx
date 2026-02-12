import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useContext, useState, useEffect } from "react";
import { FiMenu } from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router";
import { FaFileExcel, FaBook } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";

import { Context } from "../utils/Context";
import apiService from "../utils/apiService";
import { navigateTo, navigateToLogin, setNavigate } from "../utils/navigate";
import { makeAvatarName } from "../utils/helperFunctions";
import logo1 from "../assets/logo1.png";
import { useMemo } from "react";

const Header = ({ onSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const map = useMemo(
    () => ({
      "/spares": "spares",
      "/tools": "tools",
      "/permanent/procurement": "procurement",
    }),
    [],
  );

  const { user, setUser, setLoading, setConfig } = useContext(Context);
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await apiService.get("/users/signout");
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigateTo("/");
      setIsOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // const handleExportExcel = () => {
  //   setIsOpen(false);
  // };

  // const handleExportExcel = async () => {
  //   try {
  //     setIsOpen(false);

  //     console.log("xyz");
  //     const response = await apiService.get("/spares/excel", {
  //       responseType: "blob",
  //     });

  //     const url = window.URL.createObjectURL(new Blob([response.data]));

  //     const link = document.createElement("a");
  //     link.href = url;
  //     link.setAttribute("download", `Items_${Date.now()}.xlsx`);

  //     document.body.appendChild(link);
  //     link.click();
  //     link.remove();
  //   } catch (error) {
  //     console.error("Excel export failed:", error);
  //   }
  // };

  const handleExportExcel = async () => {
    try {
      setIsOpen(false);

      const module = map[location.pathname];

      await apiService.downloadExcel(`/spares/excel?module=${module}`);
    } catch (error) {
      console.error("Excel export failed:", error);
    }
  };

  const handleUserManual = () => {
    window.open("/user-manual.pdf", "_blank");
    setIsOpen(false);
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
        <Popover open={isOpen} onOpenChange={setIsOpen}>
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
                onClick={handleExportExcel}
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
    </header>
  );
};

export default Header;
