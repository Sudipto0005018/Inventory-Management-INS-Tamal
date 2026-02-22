import React, { useContext } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Context } from "../utils/Context";

const TableRows = ({ rowCount, cellCount }) =>
  Array.from({ length: rowCount }).map((_, idx) => (
    <TableRow key={idx} classboxName="whitespace-nowrap">
      {Array.from({ length: cellCount }).map((_, idx2) => (
        <TableCell
          key={idx + "" + idx2}
          className="py-4 text-center"
        ></TableCell>
      ))}
    </TableRow>
  ));

const Dashboard = () => {
  return (
    <div className="h-[calc(100vh-130px)] overflow-hidden">
      <div className="w-full h-full grid grid-rows-2 gap-2">
        <div className="grid grid-cols-3 w-full h-full gap-2 min-h-0">
          <div className="min-w-0 h-full bg-white rounded-md shadow-md p-2 flex flex-col overflow-hidden">
            <h4 className="w-full text-center font-bold text-black mb-2">
              TY Loan
            </h4>
            <div className="flex-1 w-full min-h-0 relative">
              <ScrollArea className="h-full w-full rounded-md border">
                <Table>
                  <TableHeader className="sticky top-0 z-10 left-0 right-0">
                    <TableRow className="whitespace-nowrap bg-gray-100">
                      <TableHead>UNIT Name</TableHead>
                      <TableHead>Name of Individual, Rank</TableHead>
                      <TableHead>Service Number</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Loan Duration</TableHead>
                      <TableHead>Concurred by</TableHead>
                      <TableHead>Qty. Withdrawl</TableHead>
                      <TableHead>Item Storage Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRows rowCount={20} cellCount={8} />
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
                <ScrollBar orientation="vertical" />
              </ScrollArea>
            </div>
          </div>

          <div className="min-w-0 h-full bg-white rounded-md shadow-md p-2 flex flex-col overflow-hidden">
            <h4 className="w-full text-center font-bold text-black mb-2">
              Temporary Loan
            </h4>
            <div className="flex-1 w-full min-h-0">
              <ScrollArea className="h-full w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="whitespace-nowrap bg-gray-100">
                      <TableHead>Issue to</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Probable Duration</TableHead>
                      <TableHead>Return Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRows rowCount={10} cellCount={5} />
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
                <ScrollBar orientation="vertical" />
              </ScrollArea>
            </div>
          </div>

          <div className="min-w-0 h-full bg-white rounded-md shadow-md p-2 flex flex-col overflow-hidden">
            <h4 className="w-full text-center font-bold text-black mb-2">
              NAC
            </h4>
            <div className="flex-1 w-full min-h-0">
              <ScrollArea className="h-full w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="whitespace-nowrap bg-gray-100">
                      <TableHead>Issue to</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Probable Duration</TableHead>
                      <TableHead>Return Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRows rowCount={10} cellCount={5} />
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
                <ScrollBar orientation="vertical" />
              </ScrollArea>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 w-full h-full gap-2 min-h-0">
          <div className="min-w-0 h-full bg-white rounded-md shadow-md p-2 flex flex-col overflow-hidden">
            <h4 className="w-full text-center font-bold text-black mb-2">
              LOG Records
            </h4>
            <div className="flex-1 w-full min-h-0">
              <ScrollArea className="h-full w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="whitespace-nowrap bg-gray-100">
                      <TableHead>Transaction Type</TableHead>
                      <TableHead>Transaction Details</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRows rowCount={10} cellCount={3} />
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
                <ScrollBar orientation="vertical" />
              </ScrollArea>
            </div>
          </div>

          <div className="min-w-0 h-full bg-white rounded-md shadow-md p-2 flex flex-col overflow-hidden">
            <h4 className="w-full text-center font-bold text-black mb-1">
              D787
            </h4>
            <div className="flex-1 w-full min-h-0">
              <ScrollArea className="h-full w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="whitespace-nowrap bg-gray-100">
                      <TableHead>Item Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Current OBS Authorised</TableHead>
                      <TableHead>Future OBS Authorised</TableHead>
                      <TableHead>Request Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRows rowCount={10} cellCount={6} />
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
                <ScrollBar orientation="vertical" />
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

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
