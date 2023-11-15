import React from "react";
import { mount } from "enzyme";
import { act } from "react-dom/test-utils";

/*  @ts-ignore */
import { MainPropsContext } from "@template-ui/main";

import SecondRowHeader from "../../components/SecondRowHeader";

jest.mock("../../components/HeaderNavLink", () => {
  return function MockHeaderNavLink({ children }: any) {
    return <div>{children}</div>;
  };
});

const mockMicroAppMetadata = [
  {
    key: "home",
    order: 10,
    content: "Home",
    category: "app1",
    to: "/home",
    env: [],
    roles: [],
  },
  {
    key: "profile",
    order: 90,
    content: "Profile",
    to: "/profile",
    category: "generic",
    env: [],
    roles: [],
  },
  {
    key: "other",
    order: 999,
    content: "Other",
    category: "other",
    to: "/other",
    env: [],
    roles: [],
  },
];

describe("SecondRowHeader", () => {
  let pubSubContext: any;
  let countCallbackFunction: any;
  beforeEach(() => {
    pubSubContext = {
      subscribe: (topic: string, callbackFn: any) => {
        countCallbackFunction = callbackFn;
      },
      unsubscribe: jest.fn(),
    };
  });

  it("Should render component with proper headerNavLinks and no count badge and no warning", () => {
    const wrapper = mount(
      <MainPropsContext.Provider value={pubSubContext}>
        <SecondRowHeader items={mockMicroAppMetadata} />
      </MainPropsContext.Provider>
    );
    const headerNavLinks = wrapper.find("MockHeaderNavLink");
    expect(headerNavLinks).toHaveLength(mockMicroAppMetadata.length);
    expect(headerNavLinks.at(0).props()).toHaveProperty("path", "/home");
    expect(headerNavLinks.at(0).props()).toHaveProperty("warning", false);
    expect(headerNavLinks.at(0).text()).toEqual("Home");
  });

  it("Should render component with proper headerNavLinks and count badge when event is recieved for one of the app keys", () => {
    const wrapper = mount(
      <MainPropsContext.Provider value={pubSubContext}>
        <SecondRowHeader items={mockMicroAppMetadata} />
      </MainPropsContext.Provider>
    );
    act(() => {
      countCallbackFunction("movkTopic", {
        key: "home",
        count: 5,
        warning: true,
      });
    });
    wrapper.update();
    const headerNavLinks = wrapper.find("MockHeaderNavLink");
    expect(headerNavLinks).toHaveLength(mockMicroAppMetadata.length);
    expect(headerNavLinks.at(0).props()).toHaveProperty("path", "/home");
    expect(headerNavLinks.at(0).props()).toHaveProperty("warning", true);
    expect(headerNavLinks.at(0).text()).toEqual("Home(5)");
  });
});
