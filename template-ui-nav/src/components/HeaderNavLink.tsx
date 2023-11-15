import React, { CSSProperties } from "react";
import { Button } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import styles from "./styles.scss";

interface NavIconProps {
  children: any;
  path: string;
  isDisabled?: boolean;
  small?: boolean;
  warning?: boolean;
  state?: any;
}

const HeaderNavLink = ({
  children,
  path,
  isDisabled = false,
  small,
  warning,
  state,
}: NavIconProps) => {
  const { pathname } = useLocation();

  const style: CSSProperties = {
    borderRadius: "20px",
    whiteSpace: "nowrap",
  };

  const classWarning = pathname.startsWith(path)
    ? warning
      ? `-active ${styles["gb-warning-selected"]}`
      : "-active"
    : warning
    ? ` ${styles["gb-warning"]}`
    : "";

  return (
    <Button
      className={`d-inline-block btn-header${classWarning}`}
      as={Link as any}
      to={path}
      style={style}
      disabled={isDisabled}
      size={small ? "sm" : undefined}
      state={state}
    >
      {children}
    </Button>
  );
};

export default HeaderNavLink;
