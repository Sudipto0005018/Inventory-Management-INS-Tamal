import { useContext, useEffect, useState } from "react";
import { Outlet } from "react-router";
import { ScrollArea } from "@/components/ui/scroll-area";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { Toaster } from "react-hot-toast";
import PageTitle from "@/components/PageTitle";
import ContextProvider, { Context } from "../utils/Context";
import apiService from "../utils/apiService";

const HomeLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { fetchStorageLocation, fetchIssueTo, fetchConcurredBy } =
    useContext(Context);

  useEffect(() => {
    fetchStorageLocation();
    fetchIssueTo();
    fetchConcurredBy();
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Header */}
      <Header onSidebarOpen={() => setIsSidebarOpen(true)} />

      {/* Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 relative bg-[#bbe0ff] overflow-hidden">
        {/* Background Image */}
        {/* <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none z-0">
          <img src="/abc.svg" alt="Background" className="h-[90%] w-auto" />
        </div> */}
        <div className="absolute top-0 left-0 flex justify-center items-center h-full w-full opacity-20 py-20 z-20 pointer-events-none">
          <img className="h-[90%]" src="/abc.svg" />
        </div>

        {/* Page Content */}
        <ScrollArea className="relative z-10 h-full p-3">
          <PageTitle />
          {/* <ContextProvider /> */}
          <Outlet />
        </ScrollArea>
      </div>

      {/* Footer */}
      {/* <Footer /> */}

      <Toaster position="top-right" />
    </div>
  );
};

export default HomeLayout;

// import { useContext, useState, useEffect } from "react";
// import { Outlet, useNavigate } from "react-router";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import Header from "./Header";
// import Sidebar from "./Sidebar";
// import Footer from "./Footer";
// import { Toaster } from "react-hot-toast";
// import { setNavigate } from "../utils/navigate";
// import { cn } from "../lib/utils";
// import { Context } from "../utils/Context";

// const HomeLayout = () => {
//     const navigate = useNavigate();
//     const { isOpen, setIsOpen } = useContext(Context);
//     useEffect(() => {
//         setNavigate(navigate);
//     }, []);
//     const [isMobileOpen, setIsMobileOpen] = useState(false);

//     return (
//         <div className="h-screen flex flex-col w-screen ovaerflow-hidden">
//             <div className="w-full h-full flex flex-col">
//                 <Header onSidebarOpen={() => setIsMobileOpen(true)} />
//                 <div className="flex flex-1 w-full overflow-hidden">
//                     <Sidebar
//                         isMobileOpen={isMobileOpen}
//                         setIsMobileOpen={setIsMobileOpen}
//                         isOpen={isOpen}
//                         setIsOpen={setIsOpen}
//                     />
//                     <div className="flex-1 flex flex-col">
//                         <div className="flex-1 overflow-hidden p-2 bg-[#bbe0ff] relative">
//                             <div className="absolute top-0 left-0 flex justify-center items-center h-full w-full opacity-20 py-20 z-20 pointer-events-none">
//                                 <img className="h-[90%]" src="/abc.svg" />
//                             </div>
//                             <ScrollArea
//                                 className={cn(
//                                     "h-full relative",
//                                     !isOpen ? "w-content-sm" : "w-content"
//                                 )}
//                             >
//                                 <Outlet />
//                             </ScrollArea>
//                         </div>
//                         <div className="hidden lg:block w-full">
//                             <Footer />
//                         </div>
//                     </div>
//                 </div>
//             </div>
//             <Toaster position="top-right" />
//         </div>
//     );
// };

// export default HomeLayout;
