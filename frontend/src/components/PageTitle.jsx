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

const PageTitle = () => {
  const { pathname } = useLocation();

  let title = pageTitles[pathname];

  // Spares submenu logic
  if (pathname.startsWith("/spares") && pathname !== "/spares") {
    title = "Spares (Critical)";
  }

  // Tools submenu logic
  if (pathname.startsWith("/tools") && pathname !== "/tools") {
    title = "Tools & Accessories (Critical / Special)";
  }

  // Permanent Issue
  if (pathname.startsWith("/permanent")) {
    title = pageTitles[pathname] || "Permanent Issue";
  }

  // Fallback
  // if (!title) {
  //   title = "Worklist"
  // }

  return (
    <div className="py-2 mt-[-8px] flex items-center justify-center">
      <h1 className="text-lg font-extrabold text-black tracking-wide">
        {title}
      </h1>
    </div>
  );
};

export default PageTitle;
