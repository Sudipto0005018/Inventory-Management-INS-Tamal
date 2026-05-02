import {
  FaTools,
  FaExclamationCircle,
  FaClock,
  FaChartPie,
} from "react-icons/fa";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MdDashboard } from "react-icons/md";

import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Usb } from "lucide-react";
import Sync from "../pages/Sync";
import { GoStarFill } from "react-icons/go";
import { IoDocument } from "react-icons/io5";
import { FaGears, FaTriangleExclamation, FaCartPlus } from "react-icons/fa6";
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

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const spares = dashboardData?.spares || {};
  const tools = dashboardData?.tools || {};
  const permanent = dashboardData?.permanent || {};
  const temporary = dashboardData?.temporary || {};
  const tyLoan = dashboardData?.tyLoan || {};
  const documents = dashboardData?.documents || {};

  // h-screen
  return (
    <div className="h-[calc(125vh-230px)] w-[calc(100vw-35px)] overflow-hidden bg-[#e4e8fc] from-gray-50 to-gray-100 p-3 mt-[-20px] md:p-5">
      <div className="mb-3 flex items-center justify-between">
        {/* CENTER TITLE */}
        <div className="flex-1 flex justify-center ml-[135px]">
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center gap-3"
          >
            {/* <motion.div
              initial={{ rotate: -30, scale: 0.7 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="p-2 mt-[-12px]"
            >
              <MdDashboard size={40} className="text-blue-600" />
            </motion.div> */}

            <motion.div
              initial={{ rotate: -180, scale: 0.7 }}
              animate={{ rotate: 360, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="p-2 mt-[-12px]"
            >
              <MdDashboard size={40} className="text-blue-600" />
            </motion.div>

            <div className="flex flex-col items-center">
              <motion.h1
                initial={{ opacity: 0, letterSpacing: "-2px" }}
                animate={{ opacity: 1, letterSpacing: "2px" }}
                transition={{ delay: 0.2 }}
                className="text-lg md:text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 bg-clip-text text-transparent tracking-wider"
              >
                DASHBOARD
              </motion.h1>

              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "60%" }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="h-[3px] bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mt-1"
              />

              {/* <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ delay: 0.5 }}
                className="text-[11px] md:text-xs text-gray-500 font-medium mt-1"
              >
                Inventory Management Overview
              </motion.p> */}
            </div>
          </motion.div>
        </div>

        {/* RIGHT SIDE BUTTON */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 h-9 px-3 rounded-lg shadow-sm"
            >
              <Usb size={16} />
              USB Connection
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-[340px] sm:w-[380px] p-0">
            <SheetHeader className="px-4 py-3 border-b">
              <SheetTitle>USB Connection</SheetTitle>
            </SheetHeader>

            <div className="p-3 h-full overflow-hidden">
              <Sync />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      {/* INVENTORY SUMMARY SECTION */}
      <div className="mb-3">
        <SectionHeader
          title="Inventory Summary"
          icon={<FaChartPie size={15} className="text-blue-400" />}
        />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {/* TOTAL SPARES */}
          <BigCard
            title="Spares"
            icon={<FaGears size={20} className="text-blue-600" />}
            accentColor="blue"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Total Spares"
                value={spares.total || 0}
                subtitle="Available Items"
                icon={<FaGears size={20} className="text-blue-600" />}
                trend="stable"
                onClick={() => navigateTo("/spares")}
              />

              <StatCard
                title="Critical Spare"
                value={spares.criticalSpare || 0}
                subtitle="Critical Items"
                icon={
                  <div className="flex gap-1">
                    <GoStarFill size={18} className="text-yellow-500" />
                    <GoStarFill size={18} className="text-yellow-500" />
                    <GoStarFill size={18} className="text-yellow-500" />
                  </div>
                }
                badge={spares.criticalSpare > 0 ? "urgent" : null}
                onClick={() => navigateTo("/spares/critical")}
              />

              <StatCard
                title="Low Stock"
                value={spares.lowStock || 0}
                subtitle="Below Minimum"
                icon={
                  <FaTriangleExclamation size={18} className="text-red-500" />
                }
                alert={spares.lowStock > 0}
                onClick={() => navigate("/spares/low-stock")}
              />
            </div>

            {/* Mini progress bar for stock health */}
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Stock Health</span>
                <span className="font-medium">
                  {Math.round(
                    ((spares.total - (spares.lowStock || 0)) /
                      (spares.total || 1)) *
                      100,
                  )}
                  %
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
                  style={{
                    width: `${Math.round(((spares.total - (spares.lowStock || 0)) / (spares.total || 1)) * 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </BigCard>

          {/* TOTAL TOOLS */}
          <BigCard
            title="Tools & Accessories"
            icon={<FaTools size={20} className="text-rose-600" />}
            accentColor="emerald"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard
                title="Available Tools"
                value={tools.total || 0}
                subtitle="Available Items"
                icon={<FaTools size={18} className="text-rose-800" />}
                onClick={() => navigateTo("/tools")}
              />

              <StatCard
                title="Critical/Special Tools"
                value={tools.criticalTool || 0}
                subtitle="Critical Items"
                icon={
                  <div className="flex gap-1">
                    <GoStarFill size={18} className="text-yellow-500" />
                    <GoStarFill size={18} className="text-yellow-500" />
                    <GoStarFill size={18} className="text-yellow-500" />
                  </div>
                }
                badge={tools.criticalTool > 0 ? "special" : null}
                onClick={() => navigateTo("/tools/critical")}
              />
            </div>
          </BigCard>
        </div>
      </div>
      {/* PERMANENT ISSUE WORKFLOW */}
      <div className="mb-3">
        <SectionHeader
          title="Permanent Issue Workflow"
          icon={<FaClock size={15} className="text-indigo-600" />}
        />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <WorkflowCard
            title="Pending Survey"
            value={permanent.pendingSurvey || 0}
            subtitle="Awaiting Survey"
            icon="survey"
            color="purple"
            onClick={() => navigateTo("/permanent/pending-survey")}
          />

          <WorkflowCard
            title="Pending Demand"
            value={permanent.pendingDemand || 0}
            subtitle="Items Pending"
            icon="demand"
            color="blue"
            onClick={() => navigateTo("/permanent/pending-demand")}
          />

          <WorkflowCard
            title="Pending MO Issue"
            value={permanent.pendingIssue || 0}
            subtitle="To be Issued"
            icon="issue"
            color="cyan"
            onClick={() => navigateTo("/permanent/pending-issue")}
          />

          <WorkflowCard
            title="Pending Stock In"
            value={permanent.pendingStockIn || 0}
            subtitle="To be Stocked"
            icon="stock"
            color="green"
            onClick={() => navigateTo("/permanent/stock-update")}
          />

          <WorkflowCard
            title="Pending Procurement"
            value={permanent.pendingProcurement || 0}
            subtitle="To be Procured"
            icon="procure"
            color="amber"
            onClick={() => navigateTo("/permanent/procurement")}
          />

          <WorkflowCard
            title="NAC Logs"
            value={permanent.pendingProcurement || 0}
            subtitle="Items Pending"
            icon="nac"
            color="rose"
            onClick={() => navigateTo("/logs/nac")}
          />
        </div>
      </div>
      {/* TEMPORARY & LOAN SECTION */}
      <div>
        <SectionHeader
          title="Temporary Issues & Loans"
          icon={<FaCartPlus size={15} className="text-cyan-500" />}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          {/* TEMPORARY ISSUE LOCAL */}
          <BigCard
            title="Temporary Issue (Local)"
            icon={<FaCartPlus size={18} className="text-cyan-600" />}
            accentColor="cyan"
          >
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              <IssueCard
                title="Active Issues"
                value={temporary.active || 0}
                // subtitle="Currently Issued"
                // status="active"
                icon={<FaClock className="text-cyan-600" />}
                onClick={() => navigateTo("/temporary/temporary-issue")}
              />

              <IssueCard
                title="Overdue Returns"
                value={temporary.overdue || 0}
                // subtitle="Past Due Date"
                // status="overdue"
                icon={<FaExclamationCircle className="text-red-500" />}
                onClick={() => navigate("/temporary-issue/overdue")}
              />
              {/* <DueIndicator days={3} items={2} /> */}
            </div>
          </BigCard>

          {/* TY LOAN */}
          <BigCard
            title="TY Loan (Other Units)"
            icon={<FaCartPlus size={18} className="text-purple-600" />}
            accentColor="purple"
          >
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              <IssueCard
                title="Active Loans"
                value={tyLoan.active || 0}
                // subtitle="Currently on Loan"
                // status="active"
                icon={<FaClock className="text-purple-600" />}
                onClick={() => navigateTo("/temp-loan/pending")}
              />

              <IssueCard
                title="Overdue Loans"
                value={tyLoan.overdue || 0}
                // subtitle="Overdue Returns"
                // status="overdue"
                icon={<FaExclamationCircle className="text-red-500" />}
                onClick={() => navigateTo("/temp-loan/overdue")}
              />

              {/* <DueIndicator days={5} items={3} unit="loans" /> */}
            </div>
          </BigCard>

          {/* DOCUMENTS ISSUE */}
          <BigCard
            title="Documents Issue"
            icon={<IoDocument size={18} className="text-emerald-600" />}
            accentColor="emerald"
          >
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              <IssueCardDoc
                title="Active Documents"
                value={documents.active || 0}
                // subtitle="Currently Issued"
                // status="active"
                icon={<FaClock className="text-cyan-800" />}
                onClick={() => navigateTo("/documents/issue")}
              />

              <IssueCardDoc
                title="Overdue Documents"
                value={documents.overdue || 0}
                // subtitle="Overdue Returns"
                // status="overdue"
                icon={<FaExclamationCircle className="text-red-500" />}
                onClick={() => navigateTo("/documents/overdue")}
              />

              {/* <DueIndicator days={2} items={1} unit="docs" /> */}
            </div>
          </BigCard>
        </div>
      </div>
    </div>
  );
}

// Section Header Component
function SectionHeader({ title, icon, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="p-1 bg-white rounded-lg shadow-sm border border-gray-200">
          {icon}
        </div>
        <h4 className="text-[14px] font-semibold text-gray-800">{title}</h4>
      </div>
      {action && (
        <button
          onClick={onAction}
          className="text-[10px] text-blue-600 hover:text-blue-700 font-medium hover:underline transition-all"
        ></button>
      )}
    </div>
  );
}

// Enhanced Stat Card
function StatCard({ title, value, subtitle, icon, alert, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        relative bg-white rounded-lg border border-gray-300 p-1.5

        transition-all duration-200
        ${onClick ? "cursor-pointer hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-200" : ""}
        ${alert ? "ring-2 ring-red-300 ring-offset-2" : ""}
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-semibold text-gray-700 mb-1">
            {title}
          </p>
          <p
            className={`text-[15px] font-bold ${alert ? "text-red-600" : "text-gray-900"}`}
          >
            {value}
          </p>
          <p className="text-[12px] font-semibold text-gray-500 mt-1">
            {subtitle}
          </p>
        </div>
        <div className="p-1.5 bg-gray-50 rounded-lg">{icon}</div>
      </div>
    </div>
  );
}

// Workflow Card
function WorkflowCard({ title, value, subtitle, icon, color, onClick }) {
  const colorClasses = {
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    cyan: "bg-cyan-50 text-cyan-600 border-cyan-200",
    green: "bg-green-50 text-green-600 border-green-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    rose: "bg-rose-50 text-rose-600 border-rose-200",
  };

  const iconMap = {
    survey: "📋",
    demand: "📝",
    issue: "📤",
    stock: "📦",
    procure: "🛒",
    nac: "📄",
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-lg border border-gray-300 p-2.5
        transition-all duration-200 cursor-pointer
        hover:shadow-md hover:-translate-y-0.5 hover:border-gray-200
        group
      `}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-lg ${colorClasses[color]} flex items-center justify-center text-md group-hover:scale-110 transition-transform`}
        >
          {iconMap[icon]}
        </div>
        <div>
          <p className="text-[13px] font-semibold text-gray-700">{title}</p>
          <p className="text-[15px] font-bold text-gray-900">{value}</p>
          <p className="text-[12px] font-semibold text-gray-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

// Issue Card
function IssueCard({ title, value, subtitle, status, icon, onClick }) {
  const statusColors = {
    active: "bg-blue-50 text-blue-700 border-blue-200",
    overdue: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative bg-white rounded-lg border border-gray-300 p-2
        transition-all duration-200 cursor-pointer
        hover:shadow-md hover:-translate-y-0.5
        group
      `}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[12px] font-semibold text-gray-700">{title}</p>
            {/* <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusColors[status]}`}
            >
              {status}
            </span> */}
          </div>
          <p className="text-[15px] font-bold text-gray-900">{value}</p>
          <p className="text-[12px] font-semibold text-gray-500 mt-1">
            {subtitle}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors">
          {icon}
        </div>
      </div>
    </div>
  );
}

//issue Card Documents
function IssueCardDoc({ title, value, subtitle, status, icon, onClick }) {
  const statusColors = {
    active: "bg-blue-50 text-blue-700 border-blue-200",
    overdue: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative bg-white rounded-lg border border-gray-300 p-2
        transition-all duration-200 cursor-pointer
        hover:shadow-md hover:-translate-y-0.5
        group
      `}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[10.98px] font-semibold text-gray-700">
              {title}
            </p>
            {/* <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusColors[status]}`}
            >
              {status}
            </span> */}
          </div>
          <p className="text-[15px] font-bold text-gray-900">{value}</p>
          <p className="text-[11px] font-semibold text-gray-500 mt-1">
            {subtitle}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors">
          {icon}
        </div>
      </div>
    </div>
  );
}

// Big Group Card
function BigCard({ title, icon, children, accentColor = "blue" }) {
  const accentColors = {
    blue: "border-blue-200 hover:border-blue-300",
    emerald: "border-emerald-200 hover:border-emerald-300",
    cyan: "border-cyan-200 hover:border-cyan-300",
    purple: "border-purple-200 hover:border-purple-300",
  };

  return (
    <div
      className={`bg-white/90 backdrop-blur-sm rounded-xl border ${accentColors[accentColor]} shadow-sm p-1.5 hover:shadow-md transition-all duration-300`}
    >
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-300">
        <div className="p-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
          {icon}
        </div>
        <span className="text-[15px] font-semibold text-gray-800">{title}</span>
      </div>
      {children}
    </div>
  );
}