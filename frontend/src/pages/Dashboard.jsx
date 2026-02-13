import {
  FaTools,
  FaExclamationCircle,
  FaBoxOpen,
  FaClipboardList,
  FaClock,
} from "react-icons/fa";
import { FaGears } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { navigateTo } from "../utils/navigate";

export default function Dashboard() {
  const navigate = useNavigate();
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* ================= HEADER ================= */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Dashboard Overview
        </h1>
        <p className="text-sm text-gray-500">
          Complete inventory management summary
        </p>
      </div>

      {/* ================= INVENTORY SUMMARY ================= */}
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        Inventory Summary
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {/* Total Items */}
        <Card
          title="Total Items"
          value="14"
          subtitle="in inventory"
          icon={<FaBoxOpen />}
        />

        {/* Low Stock */}
        <Card
          title="Low Stock Items"
          value="4"
          subtitle="below minimum"
          icon={<FaExclamationCircle />}
          valueColor="text-red-500"
        />

        {/* Spares */}
        <Card
          title="Spares"
          value="5"
          subtitle="spare parts"
          icon={<FaGears size={25} />}
          onClick={() => navigateTo("/spares")}
        />

        {/* Tools */}
        <Card
          title="Tools"
          value="5"
          subtitle="tools available"
          icon={<FaTools />}
          onClick={() => navigateTo("/tools")}
        />
      </div>

      {/* ================= PERMANENT ISSUE WORKFLOW ================= */}
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        Permanent Issue Workflow
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        <Card
          title="Total Pending"
          value="8"
          subtitle="items in workflow"
          icon={<FaClipboardList />}
        />

        <Card
          title="Pending Survey"
          value="2"
          subtitle="awaiting survey"
          icon={<FaClipboardList />}
          valueColor="text-orange-500"
          onClick={() => navigateTo("/permanent/pending-survey")}
        />

        <Card
          title="Pending Demand"
          value="1"
          subtitle="items pending"
          icon={<FaClipboardList />}
          valueColor="text-purple-500"
          onClick={() => navigateTo("/permanent/pending-demand")}
        />

        <Card
          title="Pending Issue"
          value="1"
          subtitle="items pending"
          icon={<FaClipboardList />}
          valueColor="text-blue-600"
          onClick={() => navigateTo("/permanent/pending-issue")}
        />

        <Card
          title="Pending Stock In"
          value="2"
          subtitle="items pending"
          icon={<FaClipboardList />}
          valueColor="text-red-500"
          onClick={() => navigateTo("/permanent/stock-update")}
        />

        <Card
          title="Pending Procurement"
          value="2"
          subtitle="to be procured"
          icon={<FaClipboardList />}
          valueColor="text-blue-500"
          onClick={() => navigateTo("/permanent/procurement")}
        />
      </div>

      {/* ================= TEMPORARY & LOAN ================= */}
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        Temporary & Loan Issues
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card
          title="Active Temporary"
          value="5"
          subtitle="currently issued"
          icon={<FaClock />}
          onClick={() => navigateTo("/temporary/temporary-issue")}
        />

        <Card
          title="Overdue Temporary"
          value="5"
          subtitle="overdue returns"
          icon={<FaExclamationCircle />}
          valueColor="text-red-500"
          onClick={() => navigateTo("/temporary/temporary-issue")}
        />

        <Card
          title="Active Loans"
          value="4"
          subtitle="currently on loan"
          icon={<FaClock />}
          onClick={() => navigateTo("/temp-loan/pending")}
        />

        <Card
          title="Overdue Loans"
          value="1"
          subtitle="overdue returns"
          icon={<FaExclamationCircle />}
          valueColor="text-red-500"
          onClick={() => navigateTo("/temp-loan/pending")}
        />
      </div>
    </div>
  );
}

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>

        <div className="text-gray-400 text-lg flex items-center">{icon}</div>
      </div>

      {/* Value */}
      <div className="mt-4">
        <p className={`text-2xl font-semibold ${valueColor}`}>{value}</p>

        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}
