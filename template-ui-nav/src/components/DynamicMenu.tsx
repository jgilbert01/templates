import React, { useCallback, useMemo } from "react";
import { Category, LeftNavMicroAppMetadata } from "../types/metadata";

import useAuthorizedNavMountPoints from "../hooks/useAuthorizedNavMountPoints";
import useAuthorizedActionMountPoints from "../hooks/useAuthorizedActionMountPoints";

import { Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import { NavLink } from "react-router-dom";
import { Tooltip, OverlayTrigger } from "react-bootstrap";

// @ts-ignore
import { getIcon } from "../utils/iconRetriever";

type MenuItemShape = "square" | "round" | "circle";

interface DynamicMenuProps {
  collapsed?: boolean;
  onMenuClicked: () => void;
  menuIconShape?: MenuItemShape;
}

const DynamicMenu = (props: DynamicMenuProps) => {
  const { authorizedCategories, authorizedItems } =
    useAuthorizedNavMountPoints();
  const { actionItems } = useAuthorizedActionMountPoints();
  const { collapsed, onMenuClicked, menuIconShape = "circle" } = props;

  const menusWithoutCategory = useMemo(
    () =>
      authorizedItems
        .filter(
          (microAppMetadata: LeftNavMicroAppMetadata) =>
            !microAppMetadata.category
        )
        .sort((a: any, b: any) => a.order - b.order),
    [authorizedItems]
  );

  const filteredCategories = useMemo(
    () =>
      authorizedCategories
        .filter((category: Category) =>
          authorizedItems.some(
            (microAppMetadata: LeftNavMicroAppMetadata) =>
              microAppMetadata.category === category.key
          )
        )
        .sort((a: any, b: any) => a.order - b.order),
    [authorizedCategories, authorizedItems]
  );

  const getMicroAppMetadataForCategory = useCallback(
    (category: Category) =>
      authorizedItems
        .filter(
          (microAppMetadata: LeftNavMicroAppMetadata) =>
            microAppMetadata.category === category.key
        )
        .sort(
          (a: LeftNavMicroAppMetadata, b: LeftNavMicroAppMetadata) =>
            a.order - b.order
        ),
    [authorizedItems]
  );

  const subCatMap = new Map();

  const getMicroAppMetadataForSubCategoriesForCategory = useCallback(
    (category: Category, subCategory: string) =>
      authorizedItems
        .filter(
          (microAppMetadata: LeftNavMicroAppMetadata) =>
            microAppMetadata.category === category.key &&
            microAppMetadata.subCategory === subCategory
        )
        .sort(
          (a: LeftNavMicroAppMetadata, b: LeftNavMicroAppMetadata) =>
            a.order - b.order
        ),
    [authorizedItems]
  );

  const generateMenuItem = (microAppMetadata: LeftNavMicroAppMetadata) => (
    <MenuItem
      key={microAppMetadata.key}
      icon={React.createElement(getIcon(microAppMetadata.icon))}
    >
      <NavLink
        aria-label={microAppMetadata.content}
        to={microAppMetadata.to}
        onClick={onMenuClicked}
        state={{
          crumbs: [
            {
              recent: true,
              favorite: true,
              active: false,
              content: microAppMetadata.content,
              to: microAppMetadata.to,
              icon: microAppMetadata.icon,
            },
          ],
        }}
      >
        {microAppMetadata.content}
      </NavLink>
    </MenuItem>
  );

  return (
    <>
      {menusWithoutCategory.map((microAppMetadata: LeftNavMicroAppMetadata) =>
        collapsed ? (
          <OverlayTrigger
            overlay={(props) => (
              <Tooltip {...props}>{microAppMetadata.content}</Tooltip>
            )}
            placement="right"
          >
            <Menu key={microAppMetadata.key} iconShape={menuIconShape}>
              {generateMenuItem(microAppMetadata)}
            </Menu>
          </OverlayTrigger>
        ) : (
          <Menu key={microAppMetadata.key} iconShape={menuIconShape}>
            {generateMenuItem(microAppMetadata)}
          </Menu>
        )
      )}

      {actionItems?.length ? (
        <Menu key="actions" iconShape={menuIconShape}>
          <SubMenu title="Create" icon={React.createElement(getIcon("FaPlus"))}>
            {actionItems.map(generateMenuItem)}
          </SubMenu>
        </Menu>
      ) : null}

      {filteredCategories.map((category: Category) => (
        <Menu key={category.key} iconShape={menuIconShape}>
          <SubMenu
            title={category.content}
            icon={React.createElement(getIcon(category.icon))}
          >
            {getMicroAppMetadataForCategory(category).map(
              (microAppMetadata: LeftNavMicroAppMetadata) => {
                if (microAppMetadata.subCategory) {
                  const subCatArray = subCatMap.get(category.key) || [];
                  if (!subCatArray.includes(microAppMetadata.subCategory)) {
                    subCatArray.push(microAppMetadata.subCategory);
                    subCatMap.set(category.key, subCatArray);
                    return (
                      <SubMenu
                        title={microAppMetadata.subCategory}
                        icon={React.createElement(
                          getIcon(microAppMetadata.subCategoryIcon)
                        )}
                      >
                        {getMicroAppMetadataForSubCategoriesForCategory(
                          category,
                          microAppMetadata.subCategory
                        ).map((subMicroAppMetadata: LeftNavMicroAppMetadata) =>
                          generateMenuItem(subMicroAppMetadata)
                        )}
                      </SubMenu>
                    );
                  }
                } else {
                  return generateMenuItem(microAppMetadata);
                }
              }
            )}
          </SubMenu>
        </Menu>
      ))}
    </>
  );
};

export default DynamicMenu;
