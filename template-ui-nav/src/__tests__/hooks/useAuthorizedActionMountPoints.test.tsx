import { renderHook } from "@testing-library/react-hooks";

// @ts-ignore
import { useMountPoint } from "@template-ui/main";
// @ts-ignore
import { useAuth } from "@template-ui/auth";

import useAuthorizedActionMountPoints from "../../hooks/useAuthorizedActionMountPoints";

jest.mock("@template-ui/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@template-ui/main", () => ({
  useMountPoint: jest.fn(),
  filterMountPoints: (items: []) => items,
}));

describe("useAuthorizedActionMountPoints", () => {
  let originalEnv: string | undefined;
  beforeEach(() => {
    originalEnv = process.env.ENV;
  });
  afterEach(() => {
    process.env.ENV = originalEnv;
  });
  it("should return proper authorizedItems", () => {
    process.env.ENV = "np";
    const isAuthorizedMock = jest.fn().mockReturnValue(true);
    (useAuth as jest.Mock).mockReturnValue({
      isAuthorized: isAuthorizedMock,
    });
    (useMountPoint as jest.Mock).mockImplementation((mountPoint) => {
      if (mountPoint === "main-action") {
        return {
          items: [
            {
              key: "newtask",
              order: 10,
              content: "New Task",
              icon: "MdAddTask",
              to: "/task/new",
              roles: ["role1", "role2"],
              env: ["np"],
            },
            {
              key: "newcoordination",
              order: 50,
              content: "New Coordination",
              icon: "MdPeople",
              to: "/coordination/new",
              roles: [],
              env: [],
            },
            {
              key: "newcharacteristics",
              order: 60,
              content: "New Characteristics",
              icon: "MdPeople",
              to: "/characteristics/new",
              rolesUserCustomExpression: 'user.name.includes("mock")',
            },
          ],
        };
      }
    });

    const { result } = renderHook(() => useAuthorizedActionMountPoints());
    expect(useMountPoint).toHaveBeenCalledTimes(1);
    expect(isAuthorizedMock).toHaveBeenCalledTimes(3);
    expect(isAuthorizedMock).toHaveBeenCalledWith(
      ["role1", "role2"],
      undefined
    );
    expect(isAuthorizedMock).toHaveBeenCalledWith([], undefined);
    expect(isAuthorizedMock).toHaveBeenCalledWith(
      [],
      'user.name.includes("mock")'
    );

    expect(result.current.actionItems).toEqual([
      {
        key: "newtask",
        order: 10,
        content: "New Task",
        icon: "MdAddTask",
        to: "/task/new",
        roles: ["role1", "role2"],
        env: ["np"],
      },
      {
        key: "newcoordination",
        order: 50,
        content: "New Coordination",
        icon: "MdPeople",
        to: "/coordination/new",
        roles: [],
        env: [],
      },
      {
        key: "newcharacteristics",
        order: 60,
        content: "New Characteristics",
        icon: "MdPeople",
        to: "/characteristics/new",
        rolesUserCustomExpression: 'user.name.includes("mock")',
      },
    ]);
  });
});
