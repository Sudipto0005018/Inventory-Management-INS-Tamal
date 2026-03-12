// import React, { useContext } from "react";
// import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Context } from "../utils/Context";

// const TableRows = ({ rowCount, cellCount }) =>
//   Array.from({ length: rowCount }).map((_, idx) => (
//     <TableRow key={idx} classboxName="whitespace-nowrap">
//       {Array.from({ length: cellCount }).map((_, idx2) => (
//         <TableCell
//           key={idx + "" + idx2}
//           className="py-4 text-center"
//         ></TableCell>
//       ))}
//     </TableRow>
//   ));

// const Dashboard = () => {
//   return (
//     <div className="h-[calc(100vh-130px)] overflow-hidden">
//       <div className="w-full h-full grid grid-rows-2 gap-2">
//         <div className="grid grid-cols-3 w-full h-full gap-2 min-h-0">
//           <div className="min-w-0 h-full bg-white rounded-md shadow-md p-2 flex flex-col overflow-hidden">
//             <h4 className="w-full text-center font-bold text-black mb-2">
//               TY Loan
//             </h4>
//             <div className="flex-1 w-full min-h-0 relative">
//               <ScrollArea className="h-full w-full rounded-md border">
//                 <Table>
//                   <TableHeader className="sticky top-0 z-10 left-0 right-0">
//                     <TableRow className="whitespace-nowrap bg-gray-100">
//                       <TableHead>UNIT Name</TableHead>
//                       <TableHead>Name of Individual, Rank</TableHead>
//                       <TableHead>Service Number</TableHead>
//                       <TableHead>Phone Number</TableHead>
//                       <TableHead>Loan Duration</TableHead>
//                       <TableHead>Concurred by</TableHead>
//                       <TableHead>Qty. Withdrawl</TableHead>
//                       <TableHead>Item Storage Duration</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     <TableRows rowCount={20} cellCount={8} />
//                   </TableBody>
//                 </Table>
//                 <ScrollBar orientation="horizontal" />
//                 <ScrollBar orientation="vertical" />
//               </ScrollArea>
//             </div>
//           </div>

//           <div className="min-w-0 h-full bg-white rounded-md shadow-md p-2 flex flex-col overflow-hidden">
//             <h4 className="w-full text-center font-bold text-black mb-2">
//               Temporary Loan
//             </h4>
//             <div className="flex-1 w-full min-h-0">
//               <ScrollArea className="h-full w-full rounded-md border">
//                 <Table>
//                   <TableHeader>
//                     <TableRow className="whitespace-nowrap bg-gray-100">
//                       <TableHead>Issue to</TableHead>
//                       <TableHead>Date</TableHead>
//                       <TableHead>Qty</TableHead>
//                       <TableHead>Probable Duration</TableHead>
//                       <TableHead>Return Qty</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     <TableRows rowCount={10} cellCount={5} />
//                   </TableBody>
//                 </Table>
//                 <ScrollBar orientation="horizontal" />
//                 <ScrollBar orientation="vertical" />
//               </ScrollArea>
//             </div>
//           </div>

//           <div className="min-w-0 h-full bg-white rounded-md shadow-md p-2 flex flex-col overflow-hidden">
//             <h4 className="w-full text-center font-bold text-black mb-2">
//               NAC
//             </h4>
//             <div className="flex-1 w-full min-h-0">
//               <ScrollArea className="h-full w-full rounded-md border">
//                 <Table>
//                   <TableHeader>
//                     <TableRow className="whitespace-nowrap bg-gray-100">
//                       <TableHead>Issue to</TableHead>
//                       <TableHead>Date</TableHead>
//                       <TableHead>Qty</TableHead>
//                       <TableHead>Probable Duration</TableHead>
//                       <TableHead>Return Qty</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     <TableRows rowCount={10} cellCount={5} />
//                   </TableBody>
//                 </Table>
//                 <ScrollBar orientation="horizontal" />
//                 <ScrollBar orientation="vertical" />
//               </ScrollArea>
//             </div>
//           </div>
//         </div>

//         <div className="grid grid-cols-2 w-full h-full gap-2 min-h-0">
//           <div className="min-w-0 h-full bg-white rounded-md shadow-md p-2 flex flex-col overflow-hidden">
//             <h4 className="w-full text-center font-bold text-black mb-2">
//               LOG Records
//             </h4>
//             <div className="flex-1 w-full min-h-0">
//               <ScrollArea className="h-full w-full rounded-md border">
//                 <Table>
//                   <TableHeader>
//                     <TableRow className="whitespace-nowrap bg-gray-100">
//                       <TableHead>Transaction Type</TableHead>
//                       <TableHead>Transaction Details</TableHead>
//                       <TableHead>Date</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     <TableRows rowCount={10} cellCount={3} />
//                   </TableBody>
//                 </Table>
//                 <ScrollBar orientation="horizontal" />
//                 <ScrollBar orientation="vertical" />
//               </ScrollArea>
//             </div>
//           </div>

//           <div className="min-w-0 h-full bg-white rounded-md shadow-md p-2 flex flex-col overflow-hidden">
//             <h4 className="w-full text-center font-bold text-black mb-1">
//               D787
//             </h4>
//             <div className="flex-1 w-full min-h-0">
//               <ScrollArea className="h-full w-full rounded-md border">
//                 <Table>
//                   <TableHeader>
//                     <TableRow className="whitespace-nowrap bg-gray-100">
//                       <TableHead>Item Description</TableHead>
//                       <TableHead>Category</TableHead>
//                       <TableHead>Current OBS Authorised</TableHead>
//                       <TableHead>Future OBS Authorised</TableHead>
//                       <TableHead>Request Status</TableHead>
//                       <TableHead>Date</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     <TableRows rowCount={10} cellCount={6} />
//                   </TableBody>
//                 </Table>
//                 <ScrollBar orientation="horizontal" />
//                 <ScrollBar orientation="vertical" />
//               </ScrollArea>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;

// dashboard changes
// completed, pending, remainder issued, over-due, total -> ty loan
// completed, pending, remainder issued, over-due, total -> temp loan
// nac -> (fields) (nac no, date, validity, rate/unit, status) (pending, completed, total)
// d787 -> (pending, completed, total)

// all the field will be in caps
// export to excel option in spares
// only view opt, beside every view a edit option
// no edit option for gest user
// user manual download button on pages
// sub category for critical spares
// obs auth change remarks field(existing auth quantity - prefilled, addition/diduction quantion, final quantity expected in inventory, validation for addition/subtraction)
// obs auth edit window -> Letter/Fah/Signal, Quote Authority, details*
// Obs auth window -> confirm demand genarated(yes/no), if yes(mo demand no./ demand date, then go for approval. if approved it will go for pending for demand), if no (it will go for approval, if approved it will go to panding for demand)
// all obs changed log will be in D787
// IN will be italic
// item description -> box no, auth quantity, held qty, location of storage
// validation for changing held quantity (same process )
// all row should have trash option in item storage
// trash option will not work untill we move the objects
// all popup should have cancel & submit (not other)
// manual withdrawl for store keeper and oic id in every row of spares and tools
// price of tools and spartes in add, view, edit(should be visible in sidebar)
// Sub-Components (non compalsary)(visible in side screen)
// highlight for selected rowin spares and tools.
// keybord shortcut for change selected row (down and up arrow)
// print qr code beside edit in tools and spares
// in tools. option to add confirm spacial tools, confirm critical tools
// box no should be numaric(validation)
// option for (is loose item)
// if loose then ask rack no ( it can be text)

// vendor/Third party
// oem details
// add new option for adding vendor(vendor, address, contact, contact person with designation(multiple))

//support details click korle gbt tech asbe
//image dynamic

//MENU SIDEBAR CHANGE SOUGATA(SIDEBAR, HOMELAYOUT, HEADER(onsidebaropen button, lg: hidden))

// excel popup will come, which will ask for which fields to be there
// sub components before price (done)
// officer approval, equipment, obs authorised, in pattern no, substitute in pattern no cattegory easily changed by store keeper officer approval before reflecting in IMS database
// authorised/ maintained qty
// if lp item then not ask for authorization
// authorised, window will pop up for c,p,r authorization
// ims will ask konse box me danle wale ho, accordingly i will mention the specific box no in the qr code box tally konsa stoerd hai
// photo, sub component || empty or dash, substitute pattern no, local terminology, price, oem detail, vendor/3rd party supplier, remarks
// full database in caps
// select multiple things option before search
// critical spares only, citical/special tools, store keeper ,successor board->officer incharge, storekeeper incharge (done)

// item description, IN pattern no., equipment/ system, category, denominations(DEnos), Obs Authorised/ Maintained, OBS Held, Box No., Item Distribution, Location of storage, Actions (done)
// Increase/ Decrease Quantity
// Confirm special demand placed
// internal requistion no, requisition date, requistion no, requistion date, demand no, demand date
//pending for special demand
//item description, In pattern no, category, Qty, internal demand no, date, requistion no and  date, status and procced, 1st step fill nahi huwa pending for requistion no, internal requistion no date dal diya fill kar diya procced, step 2, step 3(display) for p r category
//pending for requistion no after 2nd, pending for mo demand generation, mo dalne k bad, demand no and demand date, pending for issue last step, authority details ims me , pending for mo demand generated,
//no korle pending for special demand
//for increase, who has increased, and also demand no and mo
//for decreasing
//Authorised/ Maintained
//box no, authorised/ maintained qty, held qty, item quantity withdrawl

//pending for demand-c
//pending for survey-p,r, once it gets done proccedd survey voucher no, wil be shifted to pending for demand, issued by ims mo, demand no, demand pending for issue, mo gate pass no and date, pending for stock update same box or other box, held qty updated according to that, held qty kam ho jayga
//pending for stock update, pending for special demand
//pending for survey> item description, in pattern no, category, date of issue, issued qty, surveyed qty, proceed -> actions
//pending for issue will be renamed to demand
//demand pending>item desc, in patter no, category, survey no, surveyed qty, proceed, actions-> pending for demand
//pending for issue, item desc, in pattern no, category, qty, demand no, demand date, proceed, actions
//pending for stock update> item desc, in pattern no, category, demand no, qty, status, proceed, actions
//permananet issue
//sl.1->withdrawl-> type of issue, dropdown P,l,R,LP, TY p(default),
//type of issue, dropdown-> permanent issue, temporary issue(local), temporary loan(other unit)
//sl. 2->. item desc(automatic prefiled item desc), in pattern no, cattegory(prefilled)
//sl-3-> issue to-> dropdown menu for sectionsFER, AER, OMS section, controls section, others(keyboard chaihe hoga)
//sl-4 service no-> add new user(typing), user is new + icon
//sl-5> name(automatically prefilled as per service no, existing user will reflect,), submit
//sl-6> withdrawl date(today date default), dd-mmm-yy(08-JAN-26), go back to date
//sl-7>quantity withdrawl->single issue, bulk issue, hand held shoulder level
//sl-8>box no, konse dabbe me se konsa dabba uthaya hai, (prefilled data), boxes me kya kya item pari huye hai, how many box it is distributed (prefilled)
//sl-9> qty held, konse box mai kitni qty avikalble hai(prefilled)
//sl-10>sob box a 2 to kore, withdrawl qty-> total qty, total box no, unless serial no matches it wont accept the withdrawl req(needs to entered by storekeeper)
//sl-11>quantity withdrawl= prev qty filled data(bulk) restriction qty
//sl-12>qty withrawl 3rd column, no of items taken from box should not be greater than held qty
//p,r,c,lp dropdown rahe ga
//category k age dropdown menu bana k rakhiye, will tell later

// Description: Throttle Cock Unit|IN Pattern No :EM-867-67564MJOK|Item id: 1761367336982
// Description: Torque Wrench|IN Pattern No :FP-123-45678ABC|Item id: 1761368066432
// Description: Telephone|IN Pattern No :AF-987-ZYXWVUT|Item id: 1761367371154

//Temporary Issue
// temporarry loan(other units)
// sl1, sl2, sl-3> unit name instead of issue to> (mention INS if applicable), sl-4> name of individual(rank, name)
// sl-5> service no,
// sl-6> phn no,
// sl-7> loan duration (blank field k age in days)
// sl-8> concured by(dropdown menu> EO, SEO, AEO(FWD), AEO(AFT), AEO(OMS)
// sl-9> Qty withdrawn, Item storage distribution
// sl-10> temporary issue(local),
// sl-11> temp issue duration (how many days)

//pending for demand
//survey No. rename survey voucher No., pattern will part no, survey Qty, status not required, heading konsa page khula hai, c and lp-> vocher no should come as NA
//issue spare will be demand details, Demand No. instead of nac no, demand date instead of nac date, nothing else, add new demand-> demand details
//demand details> 2 options>item existing in ims, new entry in ims, IN itallic
//item existing in ims>search field, search multiple same as issue spare dialog, it will ask demand no and demand date
//new entry in ims-> add new spare in ims, once i open new spare i am able to add demand no, demand date, req submit hone k bad firse aayega
//category-p,r-> add demand no, ims automatically open fields survey voucher and survey date req, demand no and demand date
//category c> demand no, demand date only
//add new survey> cannot survey directly demand it to mo, item has to be p.and r category then after that u can survey

//pending for issue: item issue details instead of issue spare, item demanded(prefilled kitna item fill up kiya hai), NAC/Item issued qty is balanced qty, fill in the blank type rahega
//this specific field cannot be greater than item demanded, select issue date(nac, item issue by mo) na select kar diya or item selsected by mo, nac issue, date of issue, ajka qty should not be greater than balance qty
//validity date(in days), price/ rate/ unit, submit
//for stocking> same as issue spare  rename stocking item issued by mo instead of stocking
//item demanded, current entry k sath difference jo hai wo dikhaye ga

//pending for issue table column, demand no ar date er por demanded qty, qty renamed as demanded qty, nac/ issued qty, balance qty, proceed se zada ja nahi sakte hai aap
//already nac/ issue qty(prefiiled data), 3rd one will be data filling can not be greater than balance
//stock -> item desc, in part no, catergy, demand no, nac/item, -> pending for precure, proceed> window pop up-> nac issued for, denominations(), nac item stock update, blank feild, no item canot be greater than prefilled qty, item supplier details->oem, vendor same like spre and tools, new oem, qty, nac/item issued qty, agent, mr and ms phn executive with designation, status->i, proceed, till it odesnot becomes  0, tab tak nahi hatega

//special demand> item desc, in part no, category, qty, modified obs authorised, internal demand no, internal demand Date, requistion no, requisition Date, mo no, mo Date, status, proceed,
//pending for stock update, status. pending for stock update only one row in the table, after proceed click. window pop up,
//prefilled> demand no, mo gate pass no, qty, item storage distribution, box no, auth qty, held qty, not prefilled-> qty being added> mo se issue hone k bad kitna item para huwa hai--> qty being added, print QR code-> kitna qty print karna hai, with slip beside submit btn, print hone k bad table se hat jayega
//after that qty held increase ho jayega hatne k bad as per jitna qty dala hai box mai

//id(primaryy key), tools id, spares id(foreign key), created by(forign key), created at(date,time), action by(foreign key), field name(varchar kon field name), new value(field name tar value store korbo), status(enum, pending approve rejected)

//21st feb
// in confirm obs authorised add maintained qty, if all the qty is filled are submitted do you want to update maintained qty or not yes or no? if yes then it will add the inc/dec qty with maintained qty
// d787 changes
// doc corner chnages , issue to not coming, manual withdrawal will be replaced with temporary issue, should come directly
// dashboard changes low stock spares whichever is less than 25% obs_authorised will show















import {
  FaTools,
  FaExclamationCircle,
  FaClock,
} from "react-icons/fa";
import { GoStarFill } from "react-icons/go";
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
      {/* HEADER */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          Dashboard Overview
        </h1>
        <p className="text-sm text-gray-500">
          Complete Inventory Management Summary
        </p>
      </div>

      {/* INVENTORY SUMMARY */}
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        Inventory Summary
      </h2>

      {/* ===== BIG CARDS ROW ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        {/* TOTAL SPARES*/}
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
              icon={<GoStarFill size={18} className="text-yellow-500" />}
              valueColor="text-blue-700"
              onClick={() => navigateTo("/spares/critical")}
            />

            <Card
              title="Low Stock Spares"
              value={spares.lowStock || 0}
              subtitle="below minimum"
              icon={<FaExclamationCircle size={18} className="text-red-500" />}
              valueColor="text-red-500"
              onClick={() => navigate("/spares/low-stock")}
            />
          </div>
        </BigCard>

        {/* TOTAL TOOLS */}
        <BigCard
          title="Tools & Accessories"
          icon={<FaTools size={22} className="text-gray-700" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              title="Total Tools available"
              value={tools.total || 0}
              subtitle="available tools"
              icon={<FaTools size={18} className="text-blue-700" />}
              onClick={() => navigateTo("/tools")}
            />

            <Card
              title="Critical / Special Tools"
              value={tools.criticalTool || 0}
              subtitle="critical tools"
              icon={<GoStarFill size={20} className="text-yellow-500" />}
              valueColor="text-blue-700"
              onClick={() => navigateTo("/tools/critical")}
            />
          </div>
        </BigCard>
{/*
        <BigCard
          title="Documents Corner"
          icon={<IoDocument size={22} className="text-gray-700" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              title="Total Documents"
              value={doc.total || 0}
              subtitle="available documents"
              icon={<IoDocument size={22} className="text-blue-700" />}
              onClick={() => navigateTo("/documents")}
            />{" "}
            <Card
              title="Low Stock Documents"
              value={doc.lowStock || 0}
              subtitle="below minimum"
              icon={<FaExclamationCircle size={22} className="text-red-500" />}
              valueColor="text-red-500"
              onClick={() => navigate("/documents/low-stock")}
            />
          </div>
        </BigCard> */}
      </div>
      {/* PERMANENT ISSUE WORKFLOW */}
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        Permanent Issue Workflow
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
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
          onClick={() => navigateTo("/permanent/nac")}
        />
      </div>

      {/* TEMPORARY & LOAN */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* TEMPORARY ISSUE LOCAL */}
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

        {/* TY LOAN */}
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

        {/* DOCUMENTS ISSUE */}
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

/* SMALL CARD */
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
        bg-white border border-gray-100 rounded-lg p-3
        transition-all duration-200
        ${onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : ""}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col leading-tight">
          <p className="text-[11px] font-semibold text-gray-700">{title}</p>

          <p className={`text-lg font-bold ${valueColor}`}>{value}</p>

          <p className="text-[10px] font-medium text-gray-500">{subtitle}</p>
        </div>

        <div className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-100 text-gray-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* BIG GROUP CARD */
function BigCard({ title, icon, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4 border-b pb-2">
        <div className="text-blue-600">{icon}</div>
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>

      {children}
    </div>
  );
}



// 1. add spare, mandatory field box validation (done)
// 2. cpaitalize for tools/spare (done)
// 3. created on(remove) (done)
// 4. search bar column position switch (done)
// 5. all fields not visible in search (done)
// 6. demand no., req no., mo no., service No., location and other fields in capital (done)
// 7. remove uid from qr and add location of storage as column last (done)
// 8. survey->remarks, reason for survey(BER,BLR,servicebale) REASON FOR SURVEY DROPDOWN: BER(BEYOND ECONOMIC REPAIR)> BLR(BEYOND LOCAL REPAIR)> REMARKS SERVICEABLE (done)
// 9. withdrawl qty, prev surveyed/stock in qty, repairable/serviceable-> yes/no, yes> serviceable qty will be shown in stock in qty in stock update page (done)
// 10. add survey() (done/correction required)
// 11. repair/serviceable-> yes -> repairable qty (done)
// 12. low stock held qty <= 30% (done)
// 13. dashboard remove low stock tools (done)
// 14. star symbol critical spares, critical tools (done)
// 15. special demand -> authority (done)
// 16. add demad() (done/correction required)
// 17. special demand add-> type of special demand(PTS, D787, OPDEM, STORDEM)
// 18. LOG BOOK according to xlsx file. (done)