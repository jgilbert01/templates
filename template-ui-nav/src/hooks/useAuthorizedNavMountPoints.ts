import { useMemo } from "react";
// @ts-ignore
import { useMountPoint, filterMountPoints } from "@template-ui/main";
// @ts-ignore
import { useAuth } from "@template-ui/auth";

import { Category, LeftNavMicroAppMetadata } from "../types/metadata";

const useAuthorizedNavMountPoints = () => {
  const { items = [], error: errorLoadingMountPointNav } =
    useMountPoint("left-nav");
  const { items: categories = [], error: errorLoadingMountPointCategory } =
    useMountPoint("left-nav-categories");
  const { isAuthorized } = useAuth();

  const theme = localStorage.getItem("themekey") || "";

  const authorizedCategories = useMemo(
    () =>
      filterMountPoints(categories, [theme]).filter((each: Category) => {
        const roles = each.roles || [];
        return isAuthorized(roles);
      }),
    [categories, isAuthorized]
  );

  const authorizedItems = useMemo(
    () =>
      filterMountPoints(items, [theme]).filter(
        (each: LeftNavMicroAppMetadata) => {
          const roles = each.roles || [];
          const userExpression = each.rolesUserCustomExpression;
          return isAuthorized(roles, userExpression);
        }
      ),
    [items, isAuthorized]
  );

  return {
    authorizedCategories,
    authorizedItems,
    error: errorLoadingMountPointNav || errorLoadingMountPointCategory,
  };
};

export default useAuthorizedNavMountPoints;
