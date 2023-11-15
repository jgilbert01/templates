import React from "react";
import {
  ProSidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  Menu,
  MenuItem,
} from "react-pro-sidebar";

import { AiOutlineArrowLeft, AiOutlineArrowRight } from "react-icons/ai";

import DynamicMenu from "./DynamicMenu";
import AppSelector from "./AppSelector";

{
  /* <DynamicMenu onMenuClicked={closeSidebar} /> don't close, unless pref, or mobile */
}

const DynamicSidebar = (props: any) => {
  const { closeSidebar, collapsed, setCollapsed, style } = props;
  return (
    <ProSidebar
      breakPoint="md"
      width={style.width}
      collapsed={style.width === "80px"}
      style={style}
    >
      <SidebarHeader>
        <Toggle collapsed={collapsed} setCollapsed={setCollapsed} />
      </SidebarHeader>
      <SidebarContent>
        <DynamicMenu collapsed={collapsed} onMenuClicked={closeSidebar} />
        {/* <Toggle collapsed={collapsed} setCollapsed={setCollapsed} /> */}
      </SidebarContent>
      <SidebarFooter>
        <AppSelector />
      </SidebarFooter>
    </ProSidebar>
  );
};

export default DynamicSidebar;

const Toggle = (props: any) => (
  <Menu iconShape="circle">
    {props.collapsed ? (
      <MenuItem
        icon={<AiOutlineArrowRight />}
        onClick={() => props.setCollapsed(false)}
      />
    ) : (
      <MenuItem
        icon={<AiOutlineArrowLeft />}
        onClick={() => props.setCollapsed(true)}
      />
    )}
  </Menu>
);
