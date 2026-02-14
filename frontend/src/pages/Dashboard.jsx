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
  const d787Data = [
    {
      item_description: "Hydraulic Pump Assembly",
      part_no: "HP-4587",
      category: "P",
      type: "Spare",
      prev_obs: 2,
      inc_qty: 1,
      current_obs: 3,
      quote_authority: "CWE",
      internal_demand: "IDN-1023",
      internal_demand_date: "12-02-2026",
      requisition_no: "REQ-7781",
      requisition_date: "12-02-2026",
      mo_demand_no: "MO-5562",
      mo_demand_date: "12-02-2026",
      created_by: "Sudipto Dutta",
      created_on: "12-02-2026",
    },
    {
      item_description: "Torque Wrench Set",
      part_no: "TW-2231",
      category: "C",
      type: "Tool",
      prev_obs: 5,
      inc_qty: 3,
      current_obs: 8,
      quote_authority: "SSE",
      internal_demand: "IDN-1045",
      internal_demand_date: "12-02-2026",
      requisition_no: "REQ-7810",
      requisition_date: "12-02-2026",
      mo_demand_no: "MO-5599",
      mo_demand_date: "12-02-2026",
      created_by: "Sudipto Dutta",
      created_on: "10-02-2026",
    },
    {
      item_description: "Bearing Kit",
      part_no: "BK-9087",
      category: "R",
      type: "Spare",
      prev_obs: 10,
      inc_qty: 2,
      current_obs: 12,
      quote_authority: "DEE",
      internal_demand: "IDN-1102",
      internal_demand_date: "12-02-2026",
      requisition_no: "REQ-7921",
      requisition_date: "12-02-2026",
      mo_demand_no: "MO-5633",
      mo_demand_date: "12-02-2026",
      created_by: "Xyz",
      created_on: "08-02-2026",
    },
    {
      item_description: "Insulation Tester",
      part_no: "IT-3320",
      category: "LP",
      type: "Tool",
      prev_obs: 1,
      inc_qty: 1,
      current_obs: 2,
      quote_authority: "AEN",
      internal_demand: "IDN-1188",
      internal_demand_date: "12-02-2026",
      requisition_no: "REQ-8014",
      requisition_date: "12-02-2026",
      mo_demand_no: "MO-5701",
      mo_demand_date: "12-02-2026",
      created_by: "Xyz",
      created_on: "05-02-2026",
    },
  ];

  /* ================= ATTENTION MOCK DATA ================= */
  const attentionMock = {
    lowStockItems: [
      { id: 1, name: "Hydraulic Pump Assembly", min: 5, current: 3 },
      { id: 3, name: "Torque Wrench Set", min: 4, current: 1 },
    ],

    temporaryOverdue: [
      { id: 1, issue_no: "TMP-101" },
      { id: 2, issue_no: "TMP-102" },
      { id: 3, issue_no: "TMP-103" },
      { id: 4, issue_no: "TMP-104" },
      { id: 5, issue_no: "TMP-105" },
    ],

    loanOverdue: [{ id: 1, loan_no: "LN-778" }],

    docOverdue: [{ id: 1, loan_no: "LN-855" }],
  };

  const lowStockCount = attentionMock.lowStockItems.length;
  const tempOverdueCount = attentionMock.temporaryOverdue.length;
  const loanOverdueCount = attentionMock.loanOverdue.length;
  const docOverdueCount = attentionMock.docOverdue.length;

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
      {/* ================= ATTENTION REQUIRED ================= */}
      <div className="mb-6 mt-6">
        <div className="bg-red-100 border border-red-200 rounded-2xl p-5">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <FaExclamationCircle className="text-red-600" size={18} />
            <h3 className="text-red-700 font-semibold text-sm">
              Attention Required
            </h3>
          </div>

          <p className="text-sm text-gray-600 mb-3">
            The following items require immediate attention
          </p>

          {/* Alerts */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <FaBoxOpen className="text-red-500" />
              <span>
                <strong>{lowStockCount}</strong> items are below minimum stock
                level
              </span>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <FaClock className="text-red-500" />
              <span>
                <strong>{tempOverdueCount}</strong> temporary issues are overdue
                for return
              </span>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <FaClock className="text-red-500" />
              <span>
                <strong>{loanOverdueCount}</strong> loan issues are overdue for
                return
              </span>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <FaClock className="text-red-500" />
              <span>
                <strong>{docOverdueCount}</strong> document issues are overdue
                for return
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= D787 TABLE ================= */}
      <h2 className="text-lg font-semibold text-gray-800 mt-10 mb-3">
        D787 Amendment
      </h2>

      <div
        onClick={() => navigateTo("/permanent/special-demand")}
        className="bg-white border rounded-2xl shadow-sm p-6 overflow-x-auto"
      >
        <table className="min-w-full text-sm text-left border">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-3 border">Item Description</th>
              <th className="p-3 border">
                <i>IN</i> Part No.
              </th>
              <th className="p-3 border">Category</th>
              <th className="p-3 border">Type</th>
              <th className="p-3 border">
                <span>
                  Previous OBS <br />
                  Authorised
                </span>
              </th>
              <th className="p-3 border">Incraese Qty</th>
              <th className="p-3 border">
                Current OBS <br />
                Authorised
              </th>
              <th className="p-3 border">Quote Authority</th>
              <th className="p-3 border">Internal Demand No.</th>
              {/* <th className="p-3 border">Internal Demand Date</th> */}
              <th className="p-3 border">Requisition No.</th>
              {/* <th className="p-3 border">Requisition Date</th> */}
              <th className="p-3 border">MO Demand No.</th>
              {/* <th className="p-3 border">MO Demand Date</th> */}
              <th className="p-3 border">Created By Name</th>
              <th className="p-3 border">Created On</th>
            </tr>
          </thead>

          <tbody>
            {d787Data.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="p-3 border">{item.item_description}</td>
                <td className="p-3 border">{item.part_no}</td>
                <td className="p-3 border">{item.category}</td>
                <td className="p-3 border">{item.type}</td>
                <td className="p-3 border">{item.prev_obs}</td>
                <td className="p-3 border">{item.inc_qty}</td>
                <td className="p-3 border">{item.current_obs}</td>
                <td className="p-3 border">{item.quote_authority}</td>
                <td className="p-3 border">{item.internal_demand}</td>
                {/* <td className="p-3 border">{item.internal_demand_date}</td> */}
                <td className="p-3 border">{item.requisition_no}</td>
                {/* <td className="p-3 border">{item.requisition_date}</td> */}
                <td className="p-3 border">{item.mo_demand_no}</td>
                {/* <td className="p-3 border">{item.mo_demand_date}</td> */}
                <td className="p-3 border">{item.created_by}</td>
                <td className="p-3 border">{item.created_on}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
