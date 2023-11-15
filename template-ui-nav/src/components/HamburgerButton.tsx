import React from "react";
import { Button } from "react-bootstrap";
import styles from "./styles.scss";

export const Component = (props: any) => (
  <Button
    aria-label="Toggle Left Nav"
    className={styles["left-nav-toggle"]}
    onClick={props.onSidebarToggle}
  >
    <span className="navbar-toggler-icon"></span>
  </Button>
);

export default Component;
