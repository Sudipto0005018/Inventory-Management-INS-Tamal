import { FaGears, FaRegClock, FaCartPlus, FaPeopleRoof } from "react-icons/fa6";
import { FaTools } from "react-icons/fa";
import { FaRegClipboard, FaUserTie } from "react-icons/fa";
import { BsClockHistory } from "react-icons/bs";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { IoDocumentSharp } from "react-icons/io5";
import { SiPhpmyadmin } from "react-icons/si";
import { GoLog } from "react-icons/go";
import { User } from "lucide-react";

export const pageIcons = {
  "/spares": FaGears,
  "/spares/critical": FaGears,
  "/spares/low-stock": FaGears,

  "/tools": FaTools,
  "/tools/critical": FaTools,

  "/documents": IoDocumentSharp,
  "/documents/issue": IoDocumentSharp,
  "/documents/completed": IoDocumentSharp,

  "/temporary/temporary-issue": FaCartPlus,
  "/temporary/completed": FaCartPlus,

  "/temp-loan/pending": FaCartPlus,
  "/temp-loan/complete": FaCartPlus,

  "/permanent/pending-survey": FaRegClock,
  "/permanent/pending-demand": FaRegClock,
  "/permanent/pending-issue": FaRegClock,
  "/permanent/procurement": FaRegClock,
  "/permanent/stock-update": FaRegClock,
  "/permanent/special-demand": FaRegClock,

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
