import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaEye } from "react-icons/fa";
import PaginationTable from "../components/PaginationTable";

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

  useEffect(() => {
    setSelectedApproval(null);
  }, [type]);

  const handleApprove = async (id) => {
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

  const handleReject = async (id) => {
    if (!window.confirm("Are you sure you want to reject this request?"))
      return;

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

  /* ================= COLUMNS ================= */

  const columns = [
    { key: "item_name", header: "Item Name", width: "min-w-[220px]" },
    { key: "requested_qty", header: "Requested Qty" },
    { key: "qty_changed", header: "Qty Changed" },
    { key: "requested_on", header: "Requested On" },
    { key: "requested_by", header: "Requested By" },
    { key: "actions", header: "Actions" },
  ];

  /* ================= TABLE DATA ================= */

  const tableData = items.map((item) => ({
    item_name:
      item.description || item.tools_description || item.spares_description,
    requested_qty: item.new_value,
    qty_changed: Math.abs(item.new_value - parseInt(item.old_value)),
    requested_on: formatToIST(item.created_at),
    requested_by: item.requested_by,
    actions: (
      <FaEye
        className="mx-auto cursor-pointer text-blue-950"
        title="View Details"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedApproval({ item, type });
        }}
      />
    ),
  }));

  return (
    <div className="p-4">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <PaginationTable
          data={tableData}
          columns={columns}
          currentPage={page}
          pageSize={limit}
          totalPages={totalPages}
          onPageChange={setPage}
          hasSearch={false}
        />
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
              <b>Requested On:</b>{" "}
              {formatToIST(selectedApproval.item.created_at)}
            </p>

            <p>
              <b>Requested By:</b> {selectedApproval.item.requested_by}
            </p>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => handleApprove(selectedApproval.item.id)}
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

/* ================= BUTTON STYLES ================= */

const approveBtn = {
  background: "green",
  color: "white",
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
