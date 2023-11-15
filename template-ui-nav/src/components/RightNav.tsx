import React, { useContext, useMemo } from "react";
import Parcel from "single-spa-react/parcel";

import {
  MainPropsContext,
  useMountPoint,
  filterMountPoints,
  //  @ts-ignore
} from "@template-ui/main";

export const Component = ({ isAuthenticated, isAuthorized }: any) => {
  const mainProps = useContext(MainPropsContext);
  const { items } = useMountPoint("top-right-nav");

  const authorizedItems = useMemo(
    () =>
      filterMountPoints(items, [localStorage.getItem("themekey") || ""]).filter(
        (each: any) => {
          const roles = each.roles || [];
          return isAuthorized(roles);
        }
      ),
    [items]
  );

  return (
    <>
      {authorizedItems.map((item: any) => (
        <Parcel
          config={() =>
            System.import(item.app).then((module) => module[item.parcel])
          }
          /*  @ts-ignore */
          {...mainProps}
        />
      ))}
    </>
  );
};

export default Component;
