import { FaGears, FaRegClock, FaCartPlus, FaPeopleRoof } from "react-icons/fa6";
import { PiClockCountdownBold } from "react-icons/pi";
import { FaTools } from "react-icons/fa";
import { FaRegClipboard, FaUserTie } from "react-icons/fa";
import { BsClockHistory } from "react-icons/bs";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { IoDocumentSharp } from "react-icons/io5";
import { SiPhpmyadmin } from "react-icons/si";
import { GiTiedScroll } from "react-icons/gi";
import { GoLog } from "react-icons/go";
import { User } from "lucide-react";

export const pageIcons = {
  "/spares": FaGears,
  "/spares/critical": FaGears,
  "/spares/low-stock": FaGears,
  "/spares/routine": FaGears,

  "/tools": FaTools,
  "/tools/critical": FaTools,
  "/tools/routine": FaTools,

  "/documents": IoDocumentSharp,
  "/documents/issue": IoDocumentSharp,
  "/documents/completed": IoDocumentSharp,

  "/nominal-roll": GiTiedScroll,

  "/temporary/temporary-issue": FaCartPlus,
  "/temporary/completed": FaCartPlus,

  "/temp-loan/pending": FaCartPlus,
  "/temp-loan/complete": FaCartPlus,

  "/permanent/pending-survey": FaRegClock,
  "/permanent/pending-demand": FaRegClock,
  "/permanent/pending-issue": FaRegClock,
  "/permanent/procurement": FaRegClock,
  "/permanent/stock-update": FaRegClock,
  "/special/special-demand": PiClockCountdownBold,
  "/special/pts": PiClockCountdownBold,
  "/special/stordem": PiClockCountdownBold,

  "/logs/pending-survey": GoLog,
  "/logs/pending-demand": GoLog,
  "/logs/pending-issue": GoLog,
  "/logs/nac": GoLog,
  "/logs/procurement": GoLog,
  "/logs/stock-update": GoLog,
  "/logs/special-demand": GoLog,

  "/d787/original": SiPhpmyadmin,
  "/d787/amendment": SiPhpmyadmin,

  "/users": User,
  "/approvals": IoMdCheckmarkCircleOutline,
  "/history": BsClockHistory,
  "/departments": FaPeopleRoof,
};
