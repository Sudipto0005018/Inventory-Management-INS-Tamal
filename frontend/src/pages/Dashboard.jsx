import {
  FaTools,
  FaExclamationCircle,
  FaBoxOpen,
  FaClock,
} from "react-icons/fa";
import { IoDocument } from "react-icons/io5";
import { FaGears } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { navigateTo } from "../utils/navigate";
import { useEffect, useState } from "react";
import apiService from "../utils/apiService";

export default function Dashboard() {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await apiService.get("/users/dashboard");
        console.log("DASHBOARD RESPONSE =>", res.data);
        setDashboardData(res.data);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const spares = dashboardData?.spares || {};
  const tools = dashboardData?.tools || {};
  const doc = dashboardData?.doc || {};
  const permanent = dashboardData?.permanent || {};
  const temporary = dashboardData?.temporary || {};
  const tyLoan = dashboardData?.tyLoan || {};
  const documents = dashboardData?.documents || {};

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* ================= HEADER ================= */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          Dashboard Overview
        </h1>
        <p className="text-sm text-gray-500">
          Complete Inventory Management Summary
        </p>
      </div>

      {/* ================= INVENTORY SUMMARY ================= */}
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        Inventory Summary
      </h2>

      {/* ===== BIG CARDS ROW ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* ================= TOTAL SPARES ================= */}
        <BigCard
          title="Spares"
          icon={<FaGears size={22} className="text-gray-700" />}
        >
          <div className="grid grid-cols-1 text-[5px] md:grid-cols-3 gap-4">
            <Card
              title="Total Spares"
              value={dashboardData?.spares?.total || 0}
              subtitle="total spares"
              icon={<FaGears size={22} className="text-blue-700" />}
              onClick={() => navigateTo("/spares")}
            />

            <Card
              title="Critical Spares"
              value={spares.criticalSpare || 0}
              subtitle="critical spares"
              icon={<FaExclamationCircle className="text-red-500" />}
              valueColor="text-blue-700"
              onClick={() => navigateTo("/spares/critical")}
            />

            <Card
              title="Low Stock Spares"
              value={spares.lowStock || 0}
              subtitle="below minimum"
              icon={<FaBoxOpen className="text-red-500" />}
              valueColor="text-red-500"
              onClick={() => navigate("/spares/low-stock")}
            />
          </div>
        </BigCard>

        {/* ================= TOTAL TOOLS ================= */}
        <BigCard
          title="Tools & Accessories"
          icon={<FaTools size={22} className="text-gray-700" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card
              title="Total Tools available"
              value={tools.total || 0}
              subtitle="available tools"
              icon={<FaTools className="text-blue-700" />}
              onClick={() => navigateTo("/tools")}
            />

            <Card
              title="Critical / Special Tools"
              value={tools.criticalTool || 0}
              subtitle="critical tools"
              icon={<FaExclamationCircle className="text-red-500" />}
              valueColor="text-blue-700"
              onClick={() => navigateTo("/tools/critical")}
            />

            <Card
              title="Low Stock Tools"
              value={tools.lowStock || 0}
              subtitle="below minimum"
              icon={<FaBoxOpen className="text-red-500" />}
              valueColor="text-red-500"
              onClick={() => navigate("/tools/low-stock")}
            />
          </div>
        </BigCard>

        {/* <BigCard
          title="Documents Corner"
          icon={<IoDocument size={22} className="text-gray-700" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              title="Total Documents"
              value={doc.total || 0}
              subtitle="available documents"
              icon={<IoDocument className="text-blue-700" />}
              onClick={() => navigateTo("/documents")}
            />

            <Card
              title="Low Stock Documents"
              value={doc.lowStock || 0}
              subtitle="below minimum"
              icon={<FaBoxOpen className="text-red-500" />}
              valueColor="text-red-500"
              onClick={() => navigate("/documents/low-stock")}
            />
          </div>
        </BigCard> */}
      </div>
      {/* ================= PERMANENT ISSUE WORKFLOW ================= */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-3">
        Permanent Issue Workflow
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {/* <Card
          title="Total Pending"
          value="8"
          subtitle="items in workflow"
          icon={<FaClock className="text-gray-600" />}
        /> */}

        <Card
          title="Pending Survey"
          value={permanent.pendingSurvey || 0}
          subtitle="awaiting survey"
          icon={<FaClock className="text-gray-600" />}
          valueColor="text-red-900"
          onClick={() => navigateTo("/permanent/pending-survey")}
        />

        <Card
          title="Pending Demand"
          value={permanent.pendingDemand || 0}
          subtitle="items pending"
          icon={<FaClock className="text-gray-600" />}
          valueColor="text-purple-500"
          onClick={() => navigateTo("/permanent/pending-demand")}
        />

        <Card
          title="Pending Issue"
          value={permanent.pendingIssue || 0}
          subtitle="items pending"
          icon={<FaClock className="text-gray-600" />}
          valueColor="text-blue-600"
          onClick={() => navigateTo("/permanent/pending-issue")}
        />

        <Card
          title="Pending Stock In"
          value={permanent.pendingStockIn || 0}
          subtitle="to be stocked in"
          icon={<FaClock className="text-gray-600" />}
          valueColor="text-red-500"
          onClick={() => navigateTo("/permanent/stock-update")}
        />

        <Card
          title="Pending Procurement"
          value={permanent.pendingProcurement || 0}
          subtitle="to be procured"
          icon={<FaClock className="text-gray-600" />}
          valueColor="text-blue-500"
          onClick={() => navigateTo("/permanent/procurement")}
        />

        <Card
          title="Pending NAC"
          value={permanent.pendingProcurement || 0}
          subtitle="items pending"
          icon={<FaClock className="text-gray-800" />}
          valueColor="text-blue-900"
          onClick={() => navigateTo("/permanent/procurement")}
        />
      </div>

      {/* ================= TEMPORARY & LOAN ================= */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ===== TEMPORARY ISSUE LOCAL ===== */}
        <BigCard title="Temporary Issue (Local)" icon={<FaClock />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              title="Active Temporary Issue"
              value={temporary.active || 0}
              subtitle="currently issued"
              icon={<FaClock className="text-gray-700" />}
              onClick={() => navigateTo("/temporary/temporary-issue")}
            />

            <Card
              title="Overdue Temporary Issue"
              value={temporary.overdue || 0}
              subtitle="overdue returns"
              icon={<FaExclamationCircle className="text-red-500" />}
              valueColor="text-red-500"
              onClick={() => navigate("/temporary-issue/overdue")}
            />
          </div>
        </BigCard>

        {/* ===== TY LOAN ===== */}
        <BigCard title="TY Loan (Other Units)" icon={<FaClock />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              title="Active TY Loan"
              value={tyLoan.active || 0}
              subtitle="currently on loan"
              icon={<FaClock className="text-gray-700" />}
              onClick={() => navigateTo("/temp-loan/pending")}
            />

            <Card
              title="Overdue TY Loan"
              value={tyLoan.overdue || 0}
              subtitle="overdue returns"
              icon={<FaExclamationCircle className="text-red-500" />}
              valueColor="text-red-500"
              onClick={() => navigateTo("/temp-loan/overdue")}
            />
          </div>
        </BigCard>

        {/* ===== DOCUMENTS ISSUE ===== */}
        <BigCard title="Documents Issue" icon={<IoDocument size={20} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              title="Active Documents"
              value={documents.active || 0}
              subtitle="currently issued"
              icon={<FaClock className="text-gray-700" />}
              onClick={() => navigateTo("/documents/issue")}
            />

            <Card
              title="Overdue Documents"
              value={documents.overdue || 0}
              subtitle="overdue returns"
              icon={<FaExclamationCircle className="text-red-500" />}
              valueColor="text-red-500"
              onClick={() => navigateTo("/documents/overdue")}
            />
          </div>
        </BigCard>
      </div>
    </div>
  );
}

/* ================= SMALL CARD ================= */
function Card({
  title,
  value,
  subtitle,
  icon,
  valueColor = "text-gray-900",
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white border rounded-2xl shadow-sm p-5 transition
        ${onClick ? "cursor-pointer hover:shadow-md hover:scale-[1.02]" : ""}
      `}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-gray-600">{title}</h3>
        <div className="text-gray-400 text-lg flex items-center">{icon}</div>
      </div>

      <div className="mt-4">
        <p className={`text-lg font-semibold ${valueColor}`}>{value}</p>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

/* ================= BIG GROUP CARD ================= */
function BigCard({ title, icon, children }) {
  return (
    <div className="bg-white border rounded-2xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="text-gray-500">{icon}</div>
        <h3 className="text-md font-semibold text-gray-800">{title}</h3>
      </div>

      {/* Inner Cards */}
      {children}
    </div>
  );
}

//dropdown issue P, temp issue local 0, 0 asign default value in dialog
//utilised qty, after partial return, utilised qty ta minus hoye hobe
//in ty loan asign withdrawal qty 0 default value
//add column utilised qty in temp issue local frontend
//obs authorised not modified in tools
