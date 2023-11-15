/* istanbul ignore file */
import React from "react";
import ReactDOM from "react-dom";
import singleSpaReact from "single-spa-react";

const lifecycles = singleSpaReact({
  React,
  ReactDOM,
  errorBoundary: (err, info, props) => <div>Error</div>,
  loadRootComponent: () =>
    import("./root.component").then((mod) => mod.default),
  domElementGetter: () => document.getElementById("nav") as HTMLElement,
});

export const bootstrap = [lifecycles.bootstrap];
export const mount = [lifecycles.mount];
export const unmount = [lifecycles.unmount];

export { calculateCrumbs } from "./components/Breadcrumbs";
