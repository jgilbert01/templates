import React from "react";
import { QueryClientProvider } from "react-query";
import { BrowserRouter } from "react-router-dom";
import pick from "lodash/pick";

/*  @ts-ignore */
import { MainPropsContext } from "@template-ui/main";

import Header from "./components/Header";
import ActionButtonComponent from "./components/ActionButton";

const Root = (props: any) => (
  <BrowserRouter>
    <MainPropsContext.Provider
      value={pick(props, [
        "publish",
        "subscribe",
        "unsubscribe",
        "toast",
        "queryClient",
      ])}
    >
      <QueryClientProvider client={props.queryClient} contextSharing>
        <Header />
        {/* <ActionButtonComponent /> */}
      </QueryClientProvider>
    </MainPropsContext.Provider>
  </BrowserRouter>
);

export default Root;
