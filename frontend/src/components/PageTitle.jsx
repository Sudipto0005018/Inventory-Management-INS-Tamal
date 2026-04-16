// // src/components/PageTitle.jsx
// import { useLocation } from "react-router";
// import { pageTitles } from "../../../backend/utils/pageTitles";

// const PageTitle = () => {
//   const { pathname } = useLocation();

//   const title = pageTitles[pathname] || "Dashboard";

//   return (
// <div className="py-2 flex items-center justify-center">
//   <h1 className="text-lg font-extrabold text-black tracking-wide">
//     {title}
//   </h1>
// </div>
//   );
// };

// export default PageTitle;




import { useLocation } from "react-router";
import { pageTitles } from "../../../backend/utils/pageTitles";
import { pageIcons } from "../../../frontend/src/utils/pageIcons";

const PageTitle = () => {
  const { pathname } = useLocation();

  let title = pageTitles[pathname];
  let Icon = pageIcons[pathname];

  if (pathname.startsWith("/spares") && pathname !== "/spares") {
    title = "Critical Spare";
    Icon = pageIcons["/spares"];
  }

  if (pathname.startsWith("/tools") && pathname !== "/tools") {
    title = "Critical / Special Tools";
    Icon = pageIcons["/tools"];
  }

  if (pathname.startsWith("/permanent")) {
    title = pageTitles[pathname] || "Permanent Issue";
    Icon = pageIcons["/permanent/pending-survey"];
  }

  return (
    <div className="py-2 mt-[-8px] flex items-center justify-center gap-2">
      <h1 className="text-lg font-extrabold text-black tracking-wide">
        {title}
      </h1>
      {Icon && <Icon className="text-xl" />}
    </div>
  );
};

export default PageTitle;




// import { useLocation } from "react-router";
// import { pageTitles } from "../../../backend/utils/pageTitles";

// const PageTitle = () => {
//   const { pathname } = useLocation();

//   let title = pageTitles[pathname];

//   // Spares submenu logic
//   if (pathname.startsWith("/spares") && pathname !== "/spares") {
//     title = "Critical Spare";
//   }

//   // Tools submenu logic
//   if (pathname.startsWith("/tools") && pathname !== "/tools") {
//     title = "Critical / Special Tool";
//   }

//   // Permanent Issue
//   if (pathname.startsWith("/permanent")) {
//     title = pageTitles[pathname] || "Permanent Issue";
//   }
//   if (pathname.startsWith("/spares/low-stock")) {
//     title = "Low Stock Spares";
//   }
//   if (pathname.startsWith("/tools/low-stock")) {
//     title = "Low Stock Tools";
//   }
//   // Fallback
//   // if (!title) {
//   //   title = "Worklist"
//   // }

//   return (
//     <div className="py-2 mt-[-8px] flex items-center justify-center">
//       <h1 className="text-lg font-extrabold text-black tracking-wide">
//         {title}
//       </h1>
//     </div>
//   );
// };

// export default PageTitle;
