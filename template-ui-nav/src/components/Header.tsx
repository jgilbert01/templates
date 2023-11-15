import React, { useMemo, useState, useCallback } from "react";
import { Navbar, Container } from "react-bootstrap";
import { useLocation } from "react-router-dom";

// @ts-ignore
import { useAuth } from "@template-ui/auth";
import useAuthorizedNavMountPoints from "../hooks/useAuthorizedNavMountPoints";

import { Category, LeftNavMicroAppMetadata } from "../types/metadata";

import HamburgerButton from "./HamburgerButton";
import Brand from "./Brand";
import RightNav from "./RightNav";
import DynamicSidebar from "./DynamicSidebar";
import SecondRowHeader from "./SecondRowHeader";
import usePersistentState from "../hooks/usePersistentState";

import Breadcrumbs from "./Breadcrumbs";

import styles from "./styles.scss";

export const Header = () => {
  const [sidebarOpen, setSidebarOpen] = usePersistentState("nav-open", false);
  const [collapsed, setCollapsed] = usePersistentState("nav-collapsed", false);

  // TODO pref open/closed, if closed then never collapsed
  const adjustment = calcContainerAdjustment(sidebarOpen, collapsed);

  const { authorizedCategories, authorizedItems, error } =
    useAuthorizedNavMountPoints();
  const { isAuthenticated, isAuthorized } = useAuth();

  const onSidebarToggle = useCallback(() => {
    setSidebarOpen(!sidebarOpen); // toggle: open, collapsed, closed
  }, [sidebarOpen, setSidebarOpen]);

  const closeSidebar = () => {
    if (!collapsed) {
      setSidebarOpen(false); // true
    }
  };

  const { pathname } = useLocation();

  const currentActiveCategory = useMemo(() => {
    const activeItem = authorizedItems.find(
      (item: LeftNavMicroAppMetadata) =>
        item.to !== "/" && pathname.startsWith(item.to)
    );
    return authorizedCategories.find(
      (each: Category) => each.key === activeItem?.category
    );
  }, [authorizedItems, authorizedCategories, pathname]);

  const currentActiveCategoryItems = useMemo(
    () =>
      currentActiveCategory
        ? authorizedItems.filter(
            (each: LeftNavMicroAppMetadata) =>
              each.category === currentActiveCategory.key
          )
        : [],
    [currentActiveCategory, authorizedItems]
  );

  const shouldDisplaySecondRowNav = useMemo(
    () =>
      authorizedCategories &&
      Boolean(
        authorizedCategories.find(
          (each: Category) =>
            each.key === currentActiveCategory?.key && each.genericSecondRowNav
        )
      ),
    [authorizedCategories, currentActiveCategory]
  );

  return error ? (
    <p>{error}</p>
  ) : (
    <div id="app-header">
      <Navbar
        id="upper-nav"
        bg="yourapps-navbar"
        variant="dark"
        expand="lg"
        // fixed="top"
      >
        <Container fluid>
          <HamburgerButton onSidebarToggle={onSidebarToggle} />
          <Brand />
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse className="justify-content-end">
            <RightNav
              isAuthenticated={isAuthenticated}
              isAuthorized={isAuthorized}
            />
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <div className={styles.wrapper}>
        <DynamicSidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          closeSidebar={closeSidebar}
          style={{
            transition: "250ms",
            width: adjustment.sidebarWidth,
          }}
        />
      </div>
      {shouldDisplaySecondRowNav && (
        <SecondRowHeader
          items={currentActiveCategoryItems}
          style={{
            transition: "250ms",
            marginLeft: adjustment.sidebarWidth,
          }}
        />
      )}
      <Breadcrumbs
        style={{
          transition: "250ms",
          marginLeft: adjustment.sidebarWidth,
        }}
      />
    </div>
  );
};

export default Header;

const calcContainerAdjustment = (sidebarOpen: any, collapsed: any) => {
  const sidebarWidth = sidebarOpen ? (collapsed ? "80px" : "350px") : "0";
  const containerWidth = !sidebarOpen
    ? "100%"
    : `calc(100% + ${sidebarOpen ? "-" : ""}${sidebarWidth})`;

  adjustContainer(sidebarWidth, containerWidth);

  return {
    sidebarWidth,
    containerWidth,
  };
};

const adjustContainer = (sidebarWidth: any, containerWidth: any) => {
  // https://www.w3schools.com/howto/howto_js_off-canvas.asp
  // @ts-ignore
  document.getElementById("main-content-container").style.transition = "250ms";
  // @ts-ignore
  document.getElementById("main-content-container").style.marginLeft =
    sidebarWidth;
  // @ts-ignore
  document.getElementById("main-content-container").style.width =
    containerWidth;
};
