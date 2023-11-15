import React from "react";
import { shallow } from "enzyme";
import { Navbar } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import Header from "../../components/Header";
import SecondRowHeader from "../../components/SecondRowHeader";
import DynamicSidebar from "../../components/DynamicSidebar";
// import Search from "../../../components/Search/search";

// prettier-ignore
// @ts-ignore
import { useMountPoint } from "@template-ui/main";

// @ts-ignore
import { useAuth } from "@template-ui/auth";

jest.mock("@template-ui/main", () => ({
  useMountPoint: jest.fn(),
}));

jest.mock("@template-ui/auth", () => ({
  useAuth: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...(jest.requireActual("react-router-dom") as {}),
  useNavigate: () => mockNavigate,
  useLocation: jest.fn(),
}));

const testItems = [
  {
    key: "home",
    order: 10,
    content: "Home",
    category: "app1",
    to: "/home",
  },
  {
    key: "profile",
    order: 90,
    content: "Profile",
    to: "/profile",
    category: "generic",
  },
  {
    key: "other",
    order: 999,
    content: "Other",
    category: "other",
    to: "/other",
  },
  {
    key: "ntaSubjects",
    order: 100,
    content: "Subjects List",
    category: "nta",
    to: "/nta/subjects",
  },
];

describe("Header component", () => {
  let createSubjectMock: jest.Mock<any, any>;
  let isAuthorizedMock: jest.Mock<any>;

  beforeEach(() => {
    jest.resetAllMocks();
    (useLocation as jest.Mock).mockImplementation(() => ({
      pathname: "/",
    }));
    createSubjectMock = jest.fn();
    (useMountPoint as jest.Mock).mockImplementation((mountPoint: string) => {
      if (mountPoint === "left-nav") {
        return { loading: false, items: testItems };
      } else if (mountPoint === "left-nav-categories") {
        return [];
      }
    });
    isAuthorizedMock = jest.fn().mockImplementation(() => true);

    (useAuth as jest.Mock).mockImplementation(() => {
      return {
        isAuthenticated: true,
        isAuthorized: isAuthorizedMock,
        isError: false,
      };
    });
  });
  it.skip("should have top navbar with global search but no second row nav when no categories defined", () => {
    const wrapper = shallow(<Header />);
    // console.log(wrapper.debug());
    expect(wrapper.find(Navbar)).toBeDefined();
    expect(wrapper.find(Navbar.Brand)).toBeDefined();
    expect(wrapper.find("LoadableNavHeaderMock").exists()).toBeFalsy();
    expect(wrapper.find(SecondRowHeader).exists()).toBeFalsy();
    // expect(wrapper.find(Search).exists()).toBeTruthy();
    // expect(isAuthorizedMock).toHaveBeenCalledWith([]);
  });

  it.skip("should have top navbar without global search if isAuthorized returns false", () => {
    isAuthorizedMock = jest.fn().mockImplementation(() => false);
    const wrapper = shallow(<Header />);
    // console.log(wrapper.debug());
    expect(wrapper.find(Navbar)).toBeDefined();
    expect(wrapper.find(Navbar.Brand)).toBeDefined();
    expect(wrapper.find("LoadableNavHeaderMock").exists()).toBeFalsy();
    expect(wrapper.find(SecondRowHeader).exists()).toBeFalsy();
    // expect(wrapper.find(Search).exists()).toBeFalsy();
    // expect(isAuthorizedMock).toHaveBeenCalledWith([]);
  });

  it.skip("should render generic second nav when curent category has genericSecondRowNav set to true", () => {
    (useLocation as jest.Mock).mockImplementation(() => ({
      pathname: "/profile",
    }));
    (useMountPoint as jest.Mock).mockImplementation((mountPoint: string) => {
      if (mountPoint === "left-nav") {
        return { loading: false, items: testItems };
      } else if (mountPoint === "left-nav-categories") {
        return {
          items: [
            {
              key: "generic",
              order: 100,
              content: "Some MFE",
              icon: "FaFingerprint",
              roles: [],
              env: ["dev", "fqt"],
              genericSecondRowNav: true,
            },
          ],
        };
      }
    });
    process.env.ENV = "dev";

    const wrapper = shallow(<Header />);
    expect(wrapper.find(SecondRowHeader).exists()).toBeTruthy();
    expect(wrapper.find(SecondRowHeader).props().items).toEqual([
      {
        key: "profile",
        order: 90,
        content: "Profile",
        to: "/profile",
        category: "generic",
      },
    ]);
  });
  it.skip("should open sidebar if left-nav-toggle button is clicked", () => {
    const wrapper = shallow(<Header />);
    expect(wrapper.find(DynamicSidebar).exists()).toBeFalsy();
    wrapper.find(".left-nav-toggle").simulate("click");
    wrapper.update();
    expect(wrapper.find(DynamicSidebar).exists()).toBeTruthy();
  });
});
