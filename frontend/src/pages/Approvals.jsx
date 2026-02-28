import React, { useEffect, useState } from "react";
import { FaEye } from "react-icons/fa";
import PaginationTable from "../components/PaginationTable";
import apiService from "../utils/apiService";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
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
      const res = await apiService.get(`/approval/obs-pendings`, {
        params: { page, limit },
      });

      const data = res.data;
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
      await apiService.get(`/approval/approve/${id}`);
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
      await apiService.get(`approval/reject/${id}`);
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
      <Dialog
        open={!!selectedApproval}
        onOpenChange={(open) => {
          if (!open) setSelectedApproval(null);
        }}
      >
        <DialogContent
          showCloseButton
          onPointerDownOutside={(e) => e.preventDefault()}
          className="max-w-md"
        >
          <DialogTitle>
            Approval Details ({selectedApproval?.item?.source?.toUpperCase()})
          </DialogTitle>

          {selectedApproval && (
            <div className="space-y-3 text-sm mt-3">
              <div>
                <b>Item Name:</b>{" "}
                {selectedApproval.item.spares_description ||
                  selectedApproval.item.tools_description ||
                  selectedApproval.item.description}
              </div>

              <div>
                <b>Initial Quantity:</b> {selectedApproval.item.old_value}
              </div>

              <div>
                <b>Requested Quantity:</b> {selectedApproval.item.new_value}
              </div>

              <div>
                <b>Qty Changed:</b>{" "}
                {Math.abs(
                  selectedApproval.item.new_value -
                    parseInt(selectedApproval.item.old_value || 0),
                )}
              </div>

              <div>
                <b>Requested On:</b>{" "}
                {formatToIST(selectedApproval.item.created_at)}
              </div>

              <div>
                <b>Requested By:</b> {selectedApproval.item.requested_by}
              </div>

              <DialogFooter className="pt-4">
                {/* <Button
                  variant="outline"
                  onClick={() => setSelectedApproval(null)}
                >
                  Cancel
                </Button> */}

                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(selectedApproval.item.id)}
                >
                  Approve
                </Button>

                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => handleReject(selectedApproval.item.id)}
                >
                  Reject
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
