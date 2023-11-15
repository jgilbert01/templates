import { useMemo } from "react";

import {
  useMountPoint,
  filterMountPoints,
  // @ts-ignore
} from "@template-ui/main";
// @ts-ignore
import { useAuth } from "@template-ui/auth";

import { LeftNavMicroAppMetadata } from "../types/metadata";

const useAuthorizedActionMountPoints = () => {
  const { items = [], error } = useMountPoint("main-action");
  const { isAuthorized } = useAuth();

  const theme = localStorage.getItem("themekey") || "";

  const actionItems = useMemo(
    () =>
      filterMountPoints(items, [theme])
        .filter((each: LeftNavMicroAppMetadata) => {
          const roles = each.roles || [];
          const userExpression = each.rolesUserCustomExpression;
          return isAuthorized(roles, userExpression);
        })
        .sort(
          (a: LeftNavMicroAppMetadata, b: LeftNavMicroAppMetadata) =>
            a.order - b.order
        ),
    [items, isAuthorized]
  );

  return {
    actionItems,
    error,
  };
};

export default useAuthorizedActionMountPoints;
