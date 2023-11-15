import React from "react";
import { shallow } from "enzyme";
import { useLocation } from "react-router-dom";
import { Fab, Action } from "react-tiny-fab";
import ActionButton from "../../components/ActionButton";

// prettier-ignore
// @ts-ignore
import { useMountPoint } from "@template-ui/main";

// @ts-ignore
import { useAuth } from "@template-ui/auth";

jest.mock("@template-ui/main", () => ({
  useMountPoint: jest.fn(),
  getIcon: () => () => "",
  filterMountPoints: (items: []) => items,
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
    key: "newtask",
    order: 10,
    content: "New Task",
    icon: "MdAddTask",
    to: "/task/new",
  },
  {
    key: "newcoordination",
    order: 50,
    content: "New Coordination",
    icon: "MdPeople",
    to: "/coordination/new",
  },
  {
    key: "newchars",
    order: 60,
    content: "New Chars",
    icon: "MdPeople",
    to: "/characteristics/new",
  },
];

describe("ActionButton component", () => {
  let isAuthorizedMock: jest.Mock<any>;

  beforeEach(() => {
    jest.resetAllMocks();
    (useLocation as jest.Mock).mockImplementation(() => ({
      pathname: "/",
    }));
    isAuthorizedMock = jest.fn().mockImplementation(() => true);

    (useAuth as jest.Mock).mockImplementation(() => {
      return {
        isAuthenticated: true,
        isAuthorized: isAuthorizedMock,
        isError: false,
        user: { firstName: "First", lastName: "Last" },
      };
    });
  });

  it("should have ActionButton with 3 actions", () => {
    (useMountPoint as jest.Mock).mockImplementation((mountPoint: string) => {
      return { loading: false, items: testItems };
    });
    const wrapper = shallow(<ActionButton />);
    // console.log(wrapper.debug());
    expect(wrapper.find(Fab)).toBeDefined();
    const actions: any = wrapper.find(Action);
    expect(actions.exists()).toBeTruthy();
    expect(actions.length).toEqual(3);
    expect(actions.at(0).prop("text")).toEqual("New Task");
    expect(actions.at(1).prop("text")).toEqual("New Coordination");
    expect(actions.at(2).prop("text")).toEqual("New Chars");
    expect(isAuthorizedMock).toHaveBeenCalledTimes(3);
    expect(isAuthorizedMock).toHaveBeenCalledWith([], undefined);
  });

  it("should have no ActionButton if no actions", () => {
    (useMountPoint as jest.Mock).mockImplementation((mountPoint: string) => {
      return { loading: false, items: [] };
    });
    const wrapper = shallow(<ActionButton />);
    // console.log(wrapper.debug());
    expect(wrapper.find(Fab).exists).toBeFalsy;
    const actions: any = wrapper.find(Action);
    expect(actions.exists()).toBeFalsy();
    expect(wrapper.find(<></>).exists).toBeTruthy;
    expect(isAuthorizedMock).toHaveBeenCalledTimes(0);
  });
});
