import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaEye } from "react-icons/fa";
import baseURL from "../utils/baseURL";

const Approvals = () => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("spares");

  const [selectedApproval, setSelectedApproval] = useState(null);

  const limit = 10;

  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseURL}/approval/history`, {
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
      <div className="py-2 mt-[-8px] flex items-center justify-center"></div>

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
              <th style={thStyle}>Approved On</th>
              <th style={thStyle}>Requested By</th>
              <th style={thStyle}>Approved By</th>
              <th style={thStyle}>Status</th>
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
                <td style={tdStyle}>{formatToIST(item.action_at || "---")}</td>
                <td style={tdStyle}>{item.requested_by}</td>
                <td style={tdStyle}>{item.action_by_name || "---"}</td>
                <td style={tdStyle}>{item.status}</td>
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
              <b>Requested On:</b>{" "}
              {formatToIST(selectedApproval.item.created_at)}
            </p>

            <p>
              <b>Approved On:</b> {formatToIST(selectedApproval.item.action_at || "---")}
            </p>

            <p>
              <b>Requested By:</b> {selectedApproval.item.requested_by}
            </p>

            <p>
              <b>Approved By:</b> {selectedApproval.item.action_by_name || "---"}
            </p>

            <p>
              <b>Status:</b> {selectedApproval.item.status}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/* ================= STYLES ================= */

const thStyle = { padding: "12px", fontWeight: "600" };
const tdStyle = { padding: "10px" };

export default Approvals;
