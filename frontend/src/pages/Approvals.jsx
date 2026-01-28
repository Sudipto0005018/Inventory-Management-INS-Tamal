import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaEye } from "react-icons/fa";

const Approvals = () => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("spares");

  const [selectedApproval, setSelectedApproval] = useState(null);

  const limit = 10;
  const BASE_URL = "http://localhost:7777/api/v1";

  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/approval/obs-pendings`, {
        params: { page, limit },
        withCredentials: true,
      });

      const data = res.data.data;
      console.log("data_items==>", data.items);

      setItems(data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching approvals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, [page, type]);

  // Clear dialog when switching type
  useEffect(() => {
    setSelectedApproval(null);
  }, [type]);

  const handleApprove = async (id, source) => {
    try {
      await axios.get(`${BASE_URL}/approval/approve/${id}`, {
        withCredentials: true,
      });
      setSelectedApproval(null);
      fetchPendingApprovals();
    } catch (error) {
      console.error("Approve failed:", error);
    }
  };

  const handleReject = async (id, source) => {
    const confirmReject = window.confirm(
      "Are you sure you want to reject this request?"
    );
    if (!confirmReject) return;

    try {
      await axios.get(`${BASE_URL}/approval/reject/${id}`, {
        withCredentials: true,
      });
      setSelectedApproval(null);
      fetchPendingApprovals();
    } catch (error) {
      console.error("Reject failed:", error);
    }
  };

  
const formatToIST = (utcDate) => {
  if (!utcDate || utcDate === "---") return "---";

  const date = new Date(utcDate);

  if (isNaN(date.getTime())) return "---";

  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  };
  
  return (
    <div style={{ padding: "20px" }}>
      <div className="py-2 mt-[-8px] flex items-center justify-center">
        {/* <h1 className="text-md font-extrabold text-slate-800 tracking-wide pb-[15px]">
          (Authorization/ Approval Worklist)
        </h1> */}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p>No pending approvals</p>
      ) : (
        <table
          width="100%"
          cellPadding="12"
          style={{
            borderCollapse: "collapse",
            backgroundColor: "#ffffff",
            textAlign: "center",
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: "#172554",
                color: "#ffffff",
                borderRadius: "25px",
              }}
            >
              <th style={thStyle}>Item Name</th>
              <th style={thStyle}>Requested Qty</th>
              <th style={thStyle}>Qty Changed</th>
              <th style={thStyle}>Requested On</th>
              <th style={thStyle}>Requested By</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={tdStyle}>
                  {item.description ||
                    item.tools_description ||
                    item.spares_description}
                </td>
                <td style={tdStyle}>{item.new_value}</td>
                <td style={tdStyle}>
                  {Math.abs(item.new_value - parseInt(item.old_value))}
                </td>
                <td style={tdStyle}>{formatToIST(item.created_at)}</td>
                <td style={tdStyle}>{item.requested_by}</td>
                <td style={tdStyle}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                    }}
                  >
                    <FaEye
                      style={{ cursor: "pointer", color: "#172554" }}
                      title="View Details"
                      onClick={() => {
                        console.log(item);

                        setSelectedApproval({
                          item,
                          type,
                        });
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      {items.length > 5 && (
        <div style={{ marginTop: "15px", textAlign: "center" }}>
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Prev
          </button>
          <span style={{ margin: "0 10px" }}>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* ================= DIALOG ================= */}
      {selectedApproval && selectedApproval.type === type && (
        <div
          className="approval-backdrop"
          onClick={() => setSelectedApproval(null)}
        >
          <div className="approval-dialog" onClick={(e) => e.stopPropagation()}>
            <span
              className="approval-close"
              onClick={() => setSelectedApproval(null)}
            >
              ×
            </span>

            <h3>
              Approval Details ({selectedApproval.item?.source?.toUpperCase()})
            </h3>

            <p>
              <b>Item Name:</b>{" "}
              {selectedApproval.item.spares_description ||
                selectedApproval.item.tools_description}
            </p>

            <p>
              <b>Initial Quantity:</b> {selectedApproval.item.old_value}
            </p>

            <p>
              <b>Requested Quantity:</b> {selectedApproval.item.new_value}
            </p>

            <p>
              <b>
                Quantity{" "}
                {selectedApproval.item.new_value >
                parseInt(selectedApproval.item.old_value)
                  ? "Increased"
                  : "Decreased"}
                :
              </b>{" "}
              {Math.abs(
                selectedApproval.item.new_value -
                  parseInt(selectedApproval.item.old_value)
              )}
            </p>

            <p>
              <b>Requested On:</b> {formatToIST(selectedApproval.item.created_at)}
            </p>

            <p>
              <b>Requested By:</b> {selectedApproval.item.requested_by}
            </p>

            <div style={{ marginTop: "16px" }}>
              <button
                onClick={() =>
                  handleApprove(
                    selectedApproval.item.id,
                    selectedApproval.item?.source
                  )
                }
                style={approveBtn}
              >
                Approve
              </button>

              <button
                onClick={() => handleReject(selectedApproval.item.id)}
                style={rejectBtn}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ================= STYLES ================= */

const thStyle = { padding: "12px", fontWeight: "600" };
const tdStyle = { padding: "10px" };

const approveBtn = {
  background: "green",
  color: "white",
  marginRight: "10px",
  padding: "6px 14px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

const rejectBtn = {
  background: "red",
  color: "white",
  padding: "6px 14px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

export default Approvals;

// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { FaEye } from "react-icons/fa";

// const Approvals = () => {
//   const [items, setItems] = useState([]);
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const [type, setType] = useState("spares");

//   // store both item + type
//   const [selectedApproval, setSelectedApproval] = useState(null);

//   const limit = 10;
//   const BASE_URL = "http://localhost:7777/api/v1";

//   const fetchPendingApprovals = async () => {
//     setLoading(true);
//     try {
//       const res = await axios.get(`${BASE_URL}/${type}/approval-pending`, {
//         params: { page, limit },
//       });

//       const data = res.data.data;

//       setItems(data.items || []);
//       setTotalPages(data.totalPages || 1);
//     } catch (error) {
//       console.error("Error fetching approvals:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchPendingApprovals();
//   }, [page, type]);

//   // clear selected card when switching type
//   useEffect(() => {
//     setSelectedApproval(null);
//   }, [type]);

//   const handleApprove = async (id) => {
//     try {
//       await axios.get(`${BASE_URL}/${type}/approve/${id}`, {
//         withCredentials: true,
//       });
//       setSelectedApproval(null);
//       fetchPendingApprovals();
//     } catch (error) {
//       console.error("Approve failed:", error);
//     }
//   };

//   const handleReject = async (id) => {
//     const confirmReject = window.confirm(
//       "Are you sure you want to reject this request?"
//     );
//     if (!confirmReject) return;

//     try {
//       await axios.get(`${BASE_URL}/${type}/reject/${id}`, {
//         withCredentials: true,
//       });
//       setSelectedApproval(null);
//       fetchPendingApprovals();
//     } catch (error) {
//       console.error("Reject failed:", error);
//     }
//   };

//   return (
//     <div style={{ padding: "20px" }}>
//   <div className="py-2 mt-[-8px] flex items-center justify-center">
//       <h1 className="text-md font-extrabold text-slate-800 tracking-wide">
//         Authorization/Approval Dashboard
//         </h1>
//   </div>

//       {/* Type Selector */}
//       <div style={{ marginBottom: "15px", display: "flex", gap: "20px" }}>
//         <label>
//           <input
//             type="radio"
//             checked={type === "tools"}
//             onChange={() => setType("tools")}
//           />{" "}
//           Tools
//         </label>

//         <label>
//           <input
//             type="radio"
//             checked={type === "spares"}
//             onChange={() => setType("spares")}
//           />{" "}
//           Spares
//         </label>
//       </div>

//       {loading ? (
//         <p>Loading...</p>
//       ) : items.length === 0 ? (
//         <p>No pending approvals</p>
//       ) : (
//         <table
//           width="100%"
//           cellPadding="12"
//           style={{
//             borderCollapse: "collapse",
//             backgroundColor: "#ffffff",
//             textAlign: "center",
//           }}
//         >
//           <thead>
//             <tr style={{ backgroundColor: "#172554", color: "#ffffff" }}>
//               <th style={thStyle}>Item Name</th>
//               <th style={thStyle}>Item ID</th>
//               <th style={thStyle}>Requested Qty</th>
//               <th style={thStyle}>Qty Changed</th>
//               <th style={thStyle}>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {items.map((item) => (
//               <tr key={item.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
//                 <td style={tdStyle}>
//                   {item.description || item.tool_name || "N/A"}
//                 </td>
//                 <td style={tdStyle}>{item.id}</td>
//                 <td style={tdStyle}>{item.obs_authorised_new}</td>
//                 <td style={tdStyle}>
//                   {" "}
//                   {Math.abs(
//                     item.obs_authorised_new -
//                       parseInt(item.obs_authorised)
//                   )}
//                 </td>
//                 <td style={tdStyle}>
//                   <div
//                     style={{
//                       display: "flex",
//                       justifyContent: "center",
//                       alignItems: "center",
//                     }}
//                   >
//                     <FaEye
//                       style={{ cursor: "pointer", color: "#172554" }}
//                       title="View Details"
//                       onClick={() =>
//                         setSelectedApproval({
//                           item,
//                           type,
//                         })
//                       }
//                     />
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}

//       {/* Pagination */}
//       {items.length > 5 && (
//         <div style={{ marginTop: "15px", textAlign: "center" }}>
//           <button disabled={page === 1} onClick={() => setPage(page - 1)}>
//             Prev
//           </button>
//           <span style={{ margin: "0 10px" }}>
//             Page {page} of {totalPages}
//           </span>
//           <button
//             disabled={page === totalPages}
//             onClick={() => setPage(page + 1)}
//           >
//             Next
//           </button>
//         </div>
//       )}

//       {/* View Details Panel */}
//       {selectedApproval &&
//         selectedApproval.type === type &&
//         (() => {
//           const selectedItem = selectedApproval.item;
//           console.log(selectedItem);

//           return (
//             <div
//               style={{
//                 marginTop: "20px",
//                 padding: "15px",
//                 border: "1px solid #e5e7eb",
//                 borderRadius: "6px",
//                 background: "#f9fafb",
//               }}
//             >
//               <h3>Approval Details ({type.toUpperCase()})</h3>

//               <p>
//                 <b>Item Name:</b>{" "}
//                 {selectedItem.description || selectedItem.tool_name}
//               </p>
//               <p>
//                 <b>Item ID:</b> {selectedItem.id}
//               </p>
//               <p>
//                 <b>Initial Quantity:</b> {selectedItem.obs_authorised}
//               </p>
//               <p>
//                 <b>Requested Quantity:</b> {selectedItem.obs_authorised_new}
//               </p>
//               <p>
//                 <b>
//                   Quantity{" "}
//                   {selectedItem.obs_authorised_new >
//                   parseInt(selectedItem.obs_authorised)
//                     ? "Increased"
//                     : "Decreased"}
//                   :
//                 </b>{" "}
//                 {Math.abs(
//                   selectedItem.obs_authorised_new -
//                     parseInt(selectedItem.obs_authorised)
//                 )}
//               </p>
//               <p>
//                 <b>Quantity Changed:</b>{" "}
//                 {Math.abs(
//                   selectedItem.obs_authorised_new -
//                     parseInt(selectedItem.obs_authorised)
//                 )}
//               </p>

//               <div style={{ marginTop: "15px" }}>
//                 <button
//                   onClick={() => handleApprove(selectedItem.id)}
//                   style={approveBtn}
//                 >
//                   Approve
//                 </button>

//                 <button
//                   onClick={() => handleReject(selectedItem.id)}
//                   style={rejectBtn}
//                 >
//                   Reject
//                 </button>
//               </div>
//             </div>
//           );
//         })()}
//     </div>
//   );
// };

// /* Styles */
// const thStyle = { padding: "12px", fontWeight: "600" };
// const tdStyle = { padding: "10px" };

// const approveBtn = {
//   background: "green",
//   color: "white",
//   marginRight: "10px",
//   padding: "6px 14px",
//   border: "none",
//   borderRadius: "4px",
//   cursor: "pointer",
// };

// const rejectBtn = {
//   background: "red",
//   color: "white",
//   padding: "6px 14px",
//   border: "none",
//   borderRadius: "4px",
//   cursor: "pointer",
// };

// export default Approvals;
