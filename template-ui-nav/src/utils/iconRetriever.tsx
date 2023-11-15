// only import icons that will be used by categories otherwise entire lib is 1.5 meg
import {
  AiFillContacts,
  AiFillProject,
  AiOutlineContacts,
  AiOutlineProject,
} from "react-icons/ai";

import { BiCalendar, BiCalendarPlus, BiExport, BiImport } from "react-icons/bi";

import { BsDot } from "react-icons/bs";

import {
  FaAward,
  FaCalendarDay,
  FaCheckDouble,
  FaChild,
  FaClipboardList,
  FaFlagUsa,
  FaList,
  FaPlus,
  FaStar,
  FaUser,
  FaUsers,
  FaUsersCog,
  FaUserPlus,
} from "react-icons/fa";

import {
  GiFlood,
  GiReceiveMoney,
  GiPayMoney,
  GiWaspSting,
} from "react-icons/gi";

import { GoArchive, GoProject } from "react-icons/go";

import { GrDocument, GrPlan } from "react-icons/gr";

import { IoDocument, IoDocumentsOutline, IoPeople } from "react-icons/io5";

import {
  MdAdd,
  MdAddTask,
  MdAttachFile,
  MdDashboard,
  MdEdit,
  MdHome,
  MdOutlineDashboard,
  MdOutlineHome,
  MdPeople,
  MdRemoveRedEye,
  MdSchool,
  MdSettings,
  MdTaskAlt,
} from "react-icons/md";

import {
  RiMoneyDollarCircleLine,
  RiOrganizationChart,
  RiParentFill,
} from "react-icons/ri";

import { TbBadge, TbBadges, TbBadgeFilled } from "react-icons/tb";

const ICONS: any = {
  AiFillContacts,
  AiFillProject,
  AiOutlineContacts,
  AiOutlineProject,
  BiCalendar,
  BiCalendarPlus,
  BiExport,
  BiImport,
  BsDot,
  FaAward,
  FaCalendarDay,
  FaCheckDouble,
  FaChild,
  FaClipboardList,
  FaFlagUsa,
  FaList,
  FaPlus,
  FaStar,
  FaUser,
  FaUsers,
  FaUsersCog,
  FaUserPlus,
  GiFlood,
  GiReceiveMoney,
  GiPayMoney,
  GoArchive,
  GoProject,
  GrDocument,
  GrPlan,
  IoDocument,
  IoDocumentsOutline,
  IoPeople,
  MdAdd,
  MdAddTask,
  MdAttachFile,
  MdDashboard,
  MdEdit,
  MdHome,
  MdOutlineDashboard,
  MdOutlineHome,
  MdPeople,
  MdRemoveRedEye,
  MdSchool,
  MdSettings,
  MdTaskAlt,
  RiMoneyDollarCircleLine,
  RiOrganizationChart,
  RiParentFill,
  TbBadge,
  TbBadges,
  TbBadgeFilled,
};

export const getIcon = (icon: any) => ICONS[icon] || BsDot;
