import React, { useState, useMemo } from "react";
import { Menu, MenuItem, SubMenu } from "react-pro-sidebar";

import { IoAppsSharp } from "react-icons/io5";
import { BsDot } from "react-icons/bs";

import {
  useMountPoint,
  // @ts-ignore
} from "@template-ui/main";

const THEME_KEY = "themekey";

const usePersistentState = (key: string, defaultValue: any) => {
  const [state, set] = useState(getValue(key, defaultValue));

  const setState = (v: any) => {
    set(v);
    localStorage.setItem(key, v);
  };

  return [state, setState];
};

const getValue = (key: string, defaultValue: any) => {
  let v = localStorage.getItem(key);
  if (v) {
    return v;
  } else {
    return defaultValue;
  }
};

const AppSelector = (props: any) => {
  const [theme, setTheme] = usePersistentState(THEME_KEY, "");
  const { items } = useMountPoint("themes");

  const menus = useMemo(
    () => (
      <>
        {items.map((item: any) => (
          <MenuItem
            icon={<BsDot />}
            key={item.key}
            onClick={() => {
              setTheme(item.projectName);
              window.location.reload();
            }}
          >
            {item.description}
          </MenuItem>
        ))}
      </>
    ),
    [items]
  );

  return (
    <Menu key="apps" iconShape="circle">
      <SubMenu title="Applications" icon={<IoAppsSharp />}>
        {menus}
      </SubMenu>
    </Menu>
  );
};

export default AppSelector;
