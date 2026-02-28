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

const History = () => {
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
      const res = await apiService.get(`/approval/history`, {
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

  /* ================= TABLE COLUMNS ================= */

  const columns = [
    {
      key: "item_name",
      header: "Item Name",
      width: "min-w-[200px]",
    },
    {
      key: "new_value",
      header: "Requested Qty",
    },
    {
      key: "qty_changed",
      header: "Qty Changed",
    },
    {
      key: "requested_on",
      header: "Requested On",
    },
    {
      key: "approved_on",
      header: "Approved On",
    },
    {
      key: "requested_by",
      header: "Requested By",
    },
    {
      key: "approved_by",
      header: "Approved By",
    },
    {
      key: "status",
      header: "Status",
    },
    {
      key: "actions",
      header: "Actions",
    },
  ];

  /* ================= TABLE DATA MAPPING ================= */

  const tableData = items.map((item) => ({
    item_name:
      item.description || item.tools_description || item.spares_description,
    new_value: item.new_value,
    qty_changed: Math.abs(item.new_value - parseInt(item.old_value)),
    requested_on: formatToIST(item.created_at),
    approved_on: formatToIST(item.action_at || "---"),
    requested_by: item.requested_by,
    approved_by: item.action_by_name || "---",
    status: item.status,
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
            Approval History ({selectedApproval?.item?.source?.toUpperCase()})
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
                <b>
                  Quantity{" "}
                  {selectedApproval.item.new_value >
                  parseInt(selectedApproval.item.old_value || 0)
                    ? "Increased"
                    : "Decreased"}
                  :
                </b>{" "}
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
                <b>Approved On:</b>{" "}
                {formatToIST(selectedApproval.item.action_at || "---")}
              </div>

              <div>
                <b>Requested By:</b> {selectedApproval.item.requested_by}
              </div>

              <div>
                <b>Approved By:</b>{" "}
                {selectedApproval.item.action_by_name || "---"}
              </div>

              <div>
                <b>Status:</b>{" "}
                <span
                // className={`px-2 py-1 rounded text-xs font-medium ${
                //   selectedApproval.item.status === "approved"
                //     ? "bg-green-100 text-green-700"
                //     : "bg-red-100 text-red-700"
                // }`}
                >
                  {selectedApproval.item.status}
                </span>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  variant="destructive"
                  onClick={() => setSelectedApproval(null)}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default History;
