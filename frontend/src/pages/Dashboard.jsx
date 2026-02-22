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

export default function Dashboard() {
  const navigate = useNavigate();

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card
              title="Total Spares"
              value="5"
              subtitle="total spares"
              icon={<FaGears size={22} className="text-blue-700" />}
              onClick={() => navigateTo("/spares")}
            />

            <Card
              title="Critical Spares"
              value="2"
              subtitle="critical items"
              icon={<FaExclamationCircle className="text-red-500" />}
              valueColor="text-blue-700"
              onClick={() => navigateTo("/spares/critical")}
            />

            <Card
              title="Low Stock Spares"
              value="1"
              subtitle="below minimum"
              icon={<FaBoxOpen className="text-red-500" />}
              valueColor="text-red-500"
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
              title="Total Tools"
              value="5"
              subtitle="available tools"
              icon={<FaTools className="text-blue-700" />}
              onClick={() => navigateTo("/tools")}
            />

            <Card
              title="Critical / Special Tools"
              value="2"
              subtitle="critical tools"
              icon={<FaExclamationCircle className="text-red-500" />}
              valueColor="text-blue-700"
              onClick={() => navigateTo("/tools/critical")}
            />

            <Card
              title="Low Stock Tools"
              value="1"
              subtitle="below minimum"
              icon={<FaBoxOpen className="text-red-500" />}
              valueColor="text-red-500"
            />
          </div>
        </BigCard>
      </div>

      {/* ================= PERMANENT ISSUE WORKFLOW ================= */}
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
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
          value="2"
          subtitle="awaiting survey"
          icon={<FaClock className="text-gray-600" />}
          valueColor="text-red-900"
          onClick={() => navigateTo("/permanent/pending-survey")}
        />

        <Card
          title="Pending Demand"
          value="1"
          subtitle="items pending"
          icon={<FaClock className="text-gray-600" />}
          valueColor="text-purple-500"
          onClick={() => navigateTo("/permanent/pending-demand")}
        />

        <Card
          title="Pending Issue"
          value="1"
          subtitle="items pending"
          icon={<FaClock className="text-gray-600" />}
          valueColor="text-blue-600"
          onClick={() => navigateTo("/permanent/pending-issue")}
        />

        <Card
          title="Pending Stock In"
          value="2"
          subtitle="to be stocked in"
          icon={<FaClock className="text-gray-600" />}
          valueColor="text-red-500"
          onClick={() => navigateTo("/permanent/stock-update")}
        />

        <Card
          title="Pending Procurement"
          value="2"
          subtitle="to be procured"
          icon={<FaClock className="text-gray-600" />}
          valueColor="text-blue-500"
          onClick={() => navigateTo("/permanent/procurement")}
        />

        <Card
          title="Pending NAC"
          value="2"
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
              value="5"
              subtitle="currently issued"
              icon={<FaClock className="text-gray-700" />}
              onClick={() => navigateTo("/temporary/temporary-issue")}
            />

            <Card
              title="Overdue Temporary Issue"
              value="5"
              subtitle="overdue returns"
              icon={<FaExclamationCircle className="text-red-500" />}
              valueColor="text-red-500"
              onClick={() => navigateTo("/temporary/temporary-issue")}
            />
          </div>
        </BigCard>

        {/* ===== TY LOAN ===== */}
        <BigCard title="TY Loan (Other Units)" icon={<FaClock />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              title="Active TY Loan"
              value="4"
              subtitle="currently on loan"
              icon={<FaClock className="text-gray-700" />}
              onClick={() => navigateTo("/temp-loan/pending")}
            />

            <Card
              title="Overdue TY Loan"
              value="1"
              subtitle="overdue returns"
              icon={<FaExclamationCircle className="text-red-500" />}
              valueColor="text-red-500"
              onClick={() => navigateTo("/temp-loan/pending")}
            />
          </div>
        </BigCard>

        {/* ===== DOCUMENTS ISSUE ===== */}
        <BigCard title="Documents Issue" icon={<IoDocument size={20} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              title="Active Documents"
              value="3"
              subtitle="currently issued"
              icon={<FaClock className="text-gray-700" />}
              onClick={() => navigateTo("/documents")}
            />

            <Card
              title="Overdue Documents"
              value="1"
              subtitle="overdue returns"
              icon={<FaExclamationCircle className="text-red-500" />}
              valueColor="text-red-500"
              onClick={() => navigateTo("/documents/issue")}
            />
          </div>
        </BigCard>
      </div>

      <div
        onClick={() => navigateTo("/permanent/special-demand")}
        className="bg-white border rounded-2xl shadow-sm p-6 overflow-x-auto"
      ></div>
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
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className="text-gray-400 text-lg flex items-center">{icon}</div>
      </div>

      <div className="mt-4">
        <p className={`text-2xl font-semibold ${valueColor}`}>{value}</p>
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
