// @ts-ignore
import { useMountPoint } from "@template-ui/main";
// @ts-ignore
import { useAuth } from "@template-ui/auth";

import { renderHook } from "@testing-library/react-hooks";

import useAuthorizedNavMountPoints from "../../hooks/useAuthorizedNavMountPoints";

jest.mock("@template-ui/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@template-ui/main", () => ({
  useMountPoint: jest.fn(),
  filterMountPoints: (items: []) => items,
}));

describe("useAuthorizedNavMountPoints", () => {
  let originalEnv: string | undefined;
  beforeEach(() => {
    originalEnv = process.env.ENV;
  });
  afterEach(() => {
    process.env.ENV = originalEnv;
  });
  it("should return proper authorizedCategories and authorizedItems", () => {
    process.env.ENV = "np";
    const isAuthorizedMock = jest.fn().mockReturnValue(true);
    (useAuth as jest.Mock).mockReturnValue({
      isAuthorized: isAuthorizedMock,
    });
    (useMountPoint as jest.Mock).mockImplementation((mountPoint) => {
      if (mountPoint === "left-nav-categories") {
        return {
          items: [
            {
              key: "sub-sys-1",
              order: 100,
              content: "Subsystem 1",
              icon: "FaList",
              roles: ["role1", "role2"],
              env: [],
            },
            {
              key: "other",
              order: 110,
              content: "Other",
              icon: "FaStar",
              genericSecondRowNav: true,
              roles: ["role1", "role3"],
              env: ["np"],
            },
            {
              key: "another",
              order: 100,
              content: "Mock",
              icon: "FaList",
              roles: [],
              env: [],
            },
          ],
        };
      }
      if (mountPoint === "left-nav") {
        return {
          items: [
            {
              key: "app1",
              order: 150,
              category: "sub-sys-1",
              content: "App 1",
              to: "/app1",
              roles: ["role1"],
              env: [],
            },
            {
              key: "app2",
              order: 250,
              category: "sub-sys-1",
              content: "App 2",
              to: "/app2",
              roles: ["role2"],
              env: ["np"],
            },
            {
              key: "template",
              category: "other",
              order: 100,
              content: "Template",
              to: "/template",
              roles: ["role3"],
              rolesUserCustomExpression: 'user.name.includes("mock")',
              env: ["np"],
            },
          ],
        };
      }
    });

    const { result } = renderHook(() => useAuthorizedNavMountPoints());
    expect(useMountPoint).toHaveBeenCalledTimes(2);
    expect(isAuthorizedMock).toHaveBeenCalledTimes(6);
    expect(isAuthorizedMock).toHaveBeenCalledWith([]);
    expect(isAuthorizedMock).toHaveBeenCalledWith(["role1", "role2"]);
    expect(isAuthorizedMock).toHaveBeenCalledWith(["role1", "role3"]);
    expect(isAuthorizedMock).toHaveBeenCalledWith(["role1"], undefined);
    expect(isAuthorizedMock).toHaveBeenCalledWith(["role2"], undefined);
    expect(isAuthorizedMock).toHaveBeenCalledWith(
      ["role3"],
      'user.name.includes("mock")'
    );

    expect(result.current.authorizedCategories).toEqual([
      {
        content: "Subsystem 1",
        env: [],
        icon: "FaList",
        key: "sub-sys-1",
        order: 100,
        roles: ["role1", "role2"],
      },
      {
        content: "Other",
        env: ["np"],
        genericSecondRowNav: true,
        icon: "FaStar",
        key: "other",
        order: 110,
        roles: ["role1", "role3"],
      },
      {
        key: "another",
        order: 100,
        content: "Mock",
        icon: "FaList",
        roles: [],
        env: [],
      },
    ]);

    expect(result.current.authorizedItems).toEqual([
      {
        category: "sub-sys-1",
        content: "App 1",
        env: [],
        key: "app1",
        order: 150,
        roles: ["role1"],
        to: "/app1",
      },
      {
        category: "sub-sys-1",
        content: "App 2",
        env: ["np"],
        key: "app2",
        order: 250,
        roles: ["role2"],
        to: "/app2",
      },
      {
        category: "other",
        content: "Template",
        env: ["np"],
        key: "template",
        order: 100,
        roles: ["role3"],
        rolesUserCustomExpression: 'user.name.includes("mock")',
        to: "/template",
      },
    ]);
  });
});
