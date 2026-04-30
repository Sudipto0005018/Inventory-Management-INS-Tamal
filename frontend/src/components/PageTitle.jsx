// import { useLocation } from "react-router";
// import { pageTitles } from "../../../backend/utils/pageTitles";
// import { pageIcons } from "../../../frontend/src/utils/pageIcons";

// const PageTitle = () => {
//   const { pathname } = useLocation();

//   let title = pageTitles[pathname];
//   let Icon = pageIcons[pathname];

//   // if (pathname.startsWith("/spares") && pathname !== "/spares") {
//   //   title = "Critical Spare";
//   //   Icon = pageIcons["/spares"];
//   // }

//   if (
//     pathname.startsWith("/spares") &&
//     pathname !== "/spares" &&
//     pathname !== "/spares/low-stock"
//   ) {
//     title = "Critical Spare";
//     Icon = pageIcons["/spares"];
//   }

//   if (pathname.startsWith("/tools") && pathname !== "/tools") {
//     title = "Critical / Special Tools";
//     Icon = pageIcons["/tools"];
//   }

//   if (pathname.startsWith("/permanent")) {
//     title = pageTitles[pathname] || "Permanent Issue";
//     Icon = pageIcons["/permanent/pending-survey"];
//   }

//   return (
//     <div className="py-2 mt-[-8px] flex items-center justify-center gap-2">
//       <h1 className="text-lg font-extrabold text-black tracking-wide">
//         {title}
//       </h1>
//       {Icon && <Icon className="text-xl" />}
//     </div>
//   );
// };

// export default PageTitle;

import { useLocation } from "react-router";
import { motion } from "framer-motion";
import { pageTitles } from "../../../backend/utils/pageTitles";
import { pageIcons } from "../../../frontend/src/utils/pageIcons";

const PageTitle = () => {
  const { pathname } = useLocation();

  let title = pageTitles[pathname];
  let Icon = pageIcons[pathname];

  if (
    pathname.startsWith("/spares") &&
    pathname !== "/spares" &&
    pathname !== "/spares/low-stock" &&
    pathname !== "/spares/routine"
  ) {
    title = "Critical Spare";
    Icon = pageIcons["/spares"];
  }

  if (
    pathname.startsWith("/tools") &&
    pathname !== "/tools" &&
    pathname !== "/tools/routine"
  ) {
    title = "Critical / Special Tools";
    Icon = pageIcons["/tools"];
  }

  if (pathname.startsWith("/permanent")) {
    title = pageTitles[pathname] || "Permanent Issue";
    Icon = pageIcons["/permanent/pending-survey"];
  }

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="py-3 flex items-center justify-center gap-3"
    >
      {/* Icon */}
      {Icon && (
        <motion.div
          initial={{ rotate: -20, scale: 0.8 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md"
        >
          <Icon className="text-white text-lg" />
        </motion.div>
      )}

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, letterSpacing: "-2px" }}
        animate={{ opacity: 1, letterSpacing: "1px" }}
        transition={{ delay: 0.1 }}
        className="
          text-xl md:text-2xl font-extrabold 
          bg-gradient-to-r from-gray-800 via-blue-600 to-indigo-600 
          bg-clip-text text-transparent
          tracking-wide
        "
      >
        {title}
        {pathname !== "/dashboard" && pathname !=="/succession-board" && (
          <div className="h-[2px] w-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mt-1 mx-auto" />
        )}
      </motion.h1>
    </motion.div>
  );
};

export default PageTitle;