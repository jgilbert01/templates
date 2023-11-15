import React from "react";
import { Navbar } from "react-bootstrap";
import { NavLink } from "react-router-dom";

export const Component = () => (
  <Navbar.Brand className="py-0">
    <div className="d-flex">
      <NavLink to="/" className="logo-full d-inline-block my-auto mr-1" />
      <div className="text-white d-flex flex-column justify-content-center">
        <span className="brand-title m-0 h3" />
        <span className="brand-subtitle d-none d-md-block" />
      </div>
    </div>
  </Navbar.Brand>
);

export default Component;
