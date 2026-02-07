import { useState, useContext } from "react";
import { NavLink } from "react-router";
import { FiX, FiChevronDown, FiChevronRight } from "react-icons/fi";
import { FaRegClipboard, FaTools } from "react-icons/fa";
import { BsClockHistory } from "react-icons/bs";

import { FaGears, FaPeopleRoof, FaRegClock } from "react-icons/fa6";
import { BsCartPlus } from "react-icons/bs";
import { LuNotebookPen } from "react-icons/lu";
import { User } from "lucide-react";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { IoDocumentSharp } from "react-icons/io5";

import logo1 from "../assets/logo1.png";

import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Context } from "../utils/Context";

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: <FaRegClipboard /> },
  {
    name: "Spares",
    path: "/spares",
    icon: <FaGears />,
    submenu: [{ name: "Critical Spares", path: "/spares/critical" }],
  },
  {
    name: "Tools & Accessories",
    path: "/tools",
    icon: <FaTools />,
    submenu: [{ name: "Critical / Special Tools", path: "/tools/critical" }],
  },
  // { name: "Search", path: "/search", icon: <FaMagnifyingGlass /> },
  // { name: "Handheld Details", path: "/handheld", icon: <FaMobileAlt /> },
  {
    name: "Permanent Issue",
    path: "/permanent/pending-survey",
    icon: <FaRegClock />,
    submenu: [
      { name: "Pending for Survey", path: "/permanent/pending-survey" },
      { name: "Pending for Demand", path: "/permanent/pending-demand" },
      { name: "Pending for Issue", path: "/permanent/pending-issue" },
      { name: "Pending for Stock Update", path: "/permanent/stock-update" },
      { name: "Pending for Procurement", path: "/permanent/procurement" },
      { name: "Pending for Special Demand", path: "/permanent/special-demand" },
      { name: "Completed", path: "/permanent/complete" },
    ],
  },
  {
    name: "Temporary Issue",
    path: "/temporary/temporary-issue",
    icon: <FaRegClock />,
    submenu: [
      { name: "Temporary Issue Local", path: "/temporary/temporary-issue" },
    ],
  },
  {
    name: "Temporary Loan",
    path: "/temp-loan/pending",
    icon: <BsCartPlus />,
    submenu: [
      { name: "Pending", path: "/temp-loan/pending" },
      { name: "Complete", path: "/temp-loan/complete" },
    ],
  },
  {
    name: "Departments",
    path: "/departments",
    icon: <FaPeopleRoof />,
    superAdmin: true,
  },
  { name: "Users", path: "/users", icon: <User />, superAdmin: true },
  {
    name: "Approvals",
    path: "/approvals",
    icon: <IoMdCheckmarkCircleOutline size={20} />,
    superAdmin: true,
  },
  {
    name: "History",
    path: "/history",
    icon: <BsClockHistory size={20} />,
    superAdmin: true,
  },
  {
    name: "Successor Board",
    path: "/successor-board",
    icon: <LuNotebookPen />,
    submenu: [
      {
        name: "Officer Incharge",
        path: "/successor-board/officer-incharge",
      },
      {
        name: "Storekeeper Incharge",
        path: "/successor-board/storekeeper-incharge",
      },
    ],
  },
  {
    name: "Documents Corner",
    path: "/documents",
    icon: <IoDocumentSharp />,
    submenu: [
      {
        name: "Documents",
        path: "/documents",
      },
      {
        name: "Documents Issue",
        path: "/documents/issue",
      },
    ],
  },
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user } = useContext(Context);
  const [openMenu, setOpenMenu] = useState(null);

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-full w-64 bg-[#0a1025] text-white z-50",
        "transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
        {/* <img src="/logo.png" className="h-10" /> */}
        <img src={logo1} className="h-10" />
        <button onClick={() => setIsOpen(false)}>
          <FiX size={22} />
        </button>
      </div>

      {/* Menu */}
      <nav className="p-2 overflow-y-auto">
        {menuItems.map((item) => {
          if (
            (item.superAdmin && user?.role !== "superadmin") ||
            (!item.superAdmin && user?.role === "superadmin")
          )
            return null;

          if (item.submenu) {
            return (
              <Collapsible
                key={item.name}
                open={openMenu === item.name}
                onOpenChange={() =>
                  setOpenMenu(openMenu === item.name ? null : item.name)
                }
              >
                <div className="flex items-center justify-between p-3 rounded-md hover:bg-primary/40">
                  {/* Parent navigation */}
                  <NavLink
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex gap-3 items-center text-sm w-full",
                        isActive && "text-primary",
                      )
                    }
                  >
                    {item.icon}
                    {item.name}
                  </NavLink>

                  {/* Chevron toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenu(openMenu === item.name ? null : item.name);
                    }}
                    className="ml-2"
                  >
                    {openMenu === item.name ? (
                      <FiChevronDown />
                    ) : (
                      <FiChevronRight />
                    )}
                  </button>
                </div>

                <CollapsibleContent className="pl-8">
                  {item.submenu.map((sub) => (
                    <NavLink
                      key={sub.path}
                      to={sub.path}
                      className="block py-2 text-sm hover:text-primary"
                      onClick={() => setIsOpen(false)}
                    >
                      {sub.name}
                    </NavLink>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 p-3 rounded-md text-sm hover:bg-primary/40",
                  isActive && "bg-primary",
                )
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;

// import { useState, useEffect, useContext } from "react";
// import { NavLink } from "react-router";
// import { FiX, FiChevronDown, FiChevronRight } from "react-icons/fi";
// import { FaMobileAlt, FaRegClipboard, FaTools } from "react-icons/fa";
// import { FaGears, FaMagnifyingGlass, FaPeopleRoof, FaRegClock } from "react-icons/fa6";
// import { HiOutlineHome } from "react-icons/hi2";
// import { GoSidebarCollapse } from "react-icons/go";
// import { BsCartPlus } from "react-icons/bs";
// import { LuNotebookPen } from "react-icons/lu";

// import { cn } from "@/lib/utils";
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
// import { useBreakpoint } from "@/hooks/useBreakpoint";
// import { User } from "lucide-react";
// import { Context } from "../utils/Context";

// const menuItems = [
//     {
//         name: "Dashboard",
//         path: "/dashboard",
//         icon: <FaRegClipboard className="size-4" />,
//     },
//     {
//         name: "Spares",
//         path: "/spares",
//         icon: <FaGears className="size-4" />,
//     },
//     {
//         name: "Tools & Accessories",
//         path: "/tools",
//         icon: <FaTools className="size-4" />,
//         superAdmin: false,
//     },
//     {
//         name: "Search",
//         path: "/search",
//         icon: <FaMagnifyingGlass className="size-4" />,
//         superAdmin: false,
//     },
//     {
//         name: "Handheld Details",
//         path: "/handheld",
//         icon: <FaMobileAlt className="size-4" />,
//         superAdmin: false,
//     },
//     {
//         name: "Permanent Issue",
//         path: "/permanent",
//         icon: <FaRegClock className="size-4" />,
//         superAdmin: false,
//         submenu: [
//             { name: "Pending for Survey", path: "/permanent/pending-survey" },
//             { name: "Pending for Issue", path: "/permanent/pending-issue" },
//             { name: "Pending for Demand", path: "/permanent/pending-demand" },
//             { name: "Completed", path: "/permanent/complete" },
//         ],
//     },
//     {
//         name: "Temporary Loan",
//         path: "/temp-loan",
//         icon: <BsCartPlus className="size-4" />,
//         superAdmin: false,
//         submenu: [
//             { name: "Pending", path: "/temp-loan/pending" },
//             { name: "Complete", path: "/temp-loan/complete" },
//         ],
//     },
//     {
//         name: "TY Loan",
//         path: "/loan",
//         icon: <BsCartPlus className="size-4" />,
//         superAdmin: false,
//         submenu: [
//             { name: "Pending", path: "/loan/pending" },
//             { name: "Complete", path: "/loan/complete" },
//         ],
//     },
//     {
//         name: "Local Procurement",
//         path: "/lp",
//         icon: <HiOutlineHome className="size-4" />,
//         superAdmin: false,
//     },
//     {
//         name: "Survey & Demand",
//         path: "/lp1",
//         icon: <LuNotebookPen className="size-4" />,
//         superAdmin: false,
//     },
//     {
//         name: "Record Keeping",
//         path: "/lp2",
//         icon: <HiOutlineHome className="size-4" />,
//         superAdmin: false,
//     },
//     {
//         name: "NAC Record",
//         path: "/lp3",
//         icon: <HiOutlineHome className="size-4" />,
//         superAdmin: false,
//     },
//     {
//         name: "Departments",
//         path: "/departments",
//         icon: <FaPeopleRoof className="size-4" />,
//         superAdmin: true,
//     },
//     {
//         name: "Users",
//         path: "/users",
//         icon: <User className="size-4" />,
//         superAdmin: true,
//     },
// ];

// const Sidebar = ({ isMobileOpen, setIsMobileOpen, isOpen, setIsOpen }) => {
//     const { user } = useContext(Context);
//     const breakpoint = useBreakpoint();

//     const [openMenuName, setOpenMenuName] = useState(null);
//     const toggleMenu = (name) => {
//         setOpenMenuName(openMenuName === name ? null : name);
//     };

//     // React to screen size changes
//     useEffect(() => {
//         if (breakpoint === "lg" || breakpoint === "xl" || breakpoint === "2xl") {
//             setIsMobileOpen(false);
//         } else {
//             setIsMobileOpen(false);
//             setIsOpen(true);
//         }
//     }, [breakpoint, setIsMobileOpen]);

//     return (
//         <aside
//             className={cn(
//                 "fixed lg:static top-0 left-0 p-1 h-full bg-[#0a1025] text-white shadow-md z-50 flex flex-col transition-all duration-300 ease-in-out overflow-x-hidden",
//                 isOpen ? "lg:w-60" : "lg:w-16",
//                 isMobileOpen ? "w-60 translate-x-0" : "w-60 -translate-x-full lg:translate-x-0"
//             )}
//         >
//             {/* Header */}
//             <div
//                 className={cn(
//                     "flex items-center justify-between px-4 pt-2 relative",
//                     (isOpen || isMobileOpen) && "justify-end pb-0"
//                 )}
//             >
//                 <img src="/logo.png" alt="Logo" className="lg:hidden h-24 w-auto mt-2" />

//                 {/* Collapse/Expand button */}
//                 <button
//                     onClick={() => setIsOpen(!isOpen)}
//                     className="hidden lg:block p-1 rounded-md hover:bg-primary/40 cursor-pointer"
//                 >
//                     {isOpen ? <FiX size={20} /> : <GoSidebarCollapse size={20} />}
//                 </button>

//                 {/* Close in mobile */}
//                 <button
//                     onClick={() => setIsMobileOpen(false)}
//                     className="block lg:hidden p-1 rounded-md hover:bg-gray-200 cursor-pointer absolute top-2 right-2"
//                 >
//                     <FiX size={20} />
//                 </button>
//             </div>

//             {/* Menu */}
//             <nav className="mt-4 lg:mt-2 flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar">
//                 {menuItems.map((item) => {
//                     if (user?.role?.toLowerCase() != "superadmin" && item.superAdmin) {
//                         return;
//                     }
//                     if (user?.role?.toLowerCase() == "superadmin" && !item.superAdmin) {
//                         return;
//                     }
//                     const hasSubmenu = item.submenu && item.submenu.length > 0;
//                     const isActiveMenu =
//                         window.location.pathname.indexOf(item.path) >= 0 ||
//                         (item.path_match &&
//                             window.location.pathname.indexOf(item.path_match) === 0);

//                     // Collapsed sidebar with submenu
//                     if (!isOpen && !isMobileOpen && hasSubmenu) {
//                         return (
//                             <DropdownMenu key={item.path + "" + Math.random()}>
//                                 <DropdownMenuTrigger asChild>
//                                     <div
//                                         className={cn(
//                                             "flex items-center gap-4 p-3 m-1 rounded-md hover:bg-primary/40 transition-colors h-12 justify-center cursor-pointer",
//                                             isActiveMenu &&
//                                                 "bg-primary font-medium text-white hover:bg-primary"
//                                         )}
//                                     >
//                                         <div className="text-xl">{item.icon}</div>
//                                     </div>
//                                 </DropdownMenuTrigger>
//                                 <DropdownMenuContent
//                                     side="right"
//                                     align="start"
//                                     className="min-w-[150px]"
//                                 >
//                                     {item.submenu.map((sub) => (
//                                         <DropdownMenuItem
//                                             key={sub.path + "" + Math.random()}
//                                             asChild
//                                         >
//                                             <NavLink className="cursor-pointer" to={sub.path}>
//                                                 {sub.name}
//                                             </NavLink>
//                                         </DropdownMenuItem>
//                                     ))}
//                                 </DropdownMenuContent>
//                             </DropdownMenu>
//                         );
//                     }

//                     // Expanded sidebar with submenu
//                     if ((isOpen || isMobileOpen) && hasSubmenu) {
//                         return (
//                             <Collapsible
//                                 key={item.path + "" + Math.random()}
//                                 open={openMenuName === item.name}
//                                 onOpenChange={() => toggleMenu(item.name)}
//                             >
//                                 <CollapsibleTrigger
//                                     className={cn(
//                                         "flex w-[95%] items-center justify-between p-3 m-1 hover:bg-primary/40 transition-colors h-10 rounded-md cursor-pointer"
//                                     )}
//                                 >
//                                     <div className="flex items-center gap-4">
//                                         <div className="text-xl">{item.icon}</div>
//                                         <span className="text-xs">{item.name}</span>
//                                     </div>
//                                     {openMenuName === item.name ? (
//                                         <FiChevronDown />
//                                     ) : (
//                                         <FiChevronRight />
//                                     )}
//                                 </CollapsibleTrigger>
//                                 <CollapsibleContent
//                                     className={"overflow-hidden p-2 pt-0 CollapsibleContent"}
//                                 >
//                                     {item.submenu.map((sub) => (
//                                         <NavLink
//                                             key={sub.path + "" + Math.random()}
//                                             to={sub.path}
//                                             className={({ isActive }) =>
//                                                 cn(
//                                                     "block py-2 ps-10 text-md hover:bg-primary/40 rounded-md text-xs",
//                                                     isActive &&
//                                                         "bg-primary font-medium text-white hover:bg-primary/80"
//                                                 )
//                                             }
//                                         >
//                                             {sub.name}
//                                         </NavLink>
//                                     ))}
//                                 </CollapsibleContent>
//                             </Collapsible>
//                         );
//                     }

//                     // Single menu link

//                     return (
//                         <NavLink
//                             key={item.path}
//                             to={item.path}
//                             className={({ isActive }) =>
//                                 cn(
//                                     "flex items-center gap-4 px-3 m-1 rounded-md hover:bg-primary/40 transition-colors h-10 text-xs",
//                                     isActive &&
//                                         "bg-primary font-medium text-white hover:bg-primary/80",
//                                     !(isOpen || isMobileOpen) && "justify-center"
//                                 )
//                             }
//                         >
//                             <div className="text-xl">{item.icon}</div>
//                             {(isOpen || isMobileOpen) && <span>{item.name}</span>}
//                         </NavLink>
//                     );
//                 })}
//             </nav>
//         </aside>
//     );
// };

// export default Sidebar;
