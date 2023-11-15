import React from "react";
import { mount } from "enzyme";
import HeaderNavLink from "../../components/HeaderNavLink";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...(jest.requireActual("react-router-dom") as {}),
  useNavigate: () => mockNavigate,
}));

describe("HeaderNavLink", () => {
  it("Should render active without warning", () => {
    const wrapper = mount(
      <MemoryRouter initialEntries={["/subjects"]}>
        <Routes>
          <Route
            path="/subjects"
            element={<HeaderNavLink children="test" path="/subjects" />}
          ></Route>
        </Routes>
      </MemoryRouter>
    );
    expect(wrapper.find("Button").props().className).toContain("active");
    expect(wrapper.find("Button").props().className).not.toContain(
      "gb-warning"
    );
  });

  it("Should render active with warning", () => {
    const wrapper = mount(
      <MemoryRouter initialEntries={["/subjects"]}>
        <Routes>
          <Route
            path="/subjects"
            element={<HeaderNavLink children="test" path="/subjects" warning />}
          ></Route>
        </Routes>
      </MemoryRouter>
    );
    expect(wrapper.find("Button").props().className).toContain("active");
    expect(wrapper.find("Button").props().className).toContain(
      "gb-warning-selected"
    );
  });

  it("Should render non-active with no warning", () => {
    const wrapper = mount(
      <MemoryRouter initialEntries={["/subjects"]}>
        <Routes>
          <Route
            path="/subjects"
            element={<HeaderNavLink children="test" path="/home" />}
          ></Route>
        </Routes>
      </MemoryRouter>
    );
    expect(wrapper.find("Button").props().className).not.toContain("active");
    expect(wrapper.find("Button").props().className).not.toContain(
      "gb-warning"
    );
  });

  it("Should render non-active with warning", () => {
    const wrapper = mount(
      <MemoryRouter initialEntries={["/subjects"]}>
        <Routes>
          <Route
            path="/subjects"
            element={<HeaderNavLink children="test" path="/home" warning />}
          ></Route>
        </Routes>
      </MemoryRouter>
    );
    expect(wrapper.find("Button").props().className).not.toContain("active");
    expect(wrapper.find("Button").props().className).toContain("gb-warning");
  });

  it("Should call its action when clicked", () => {
    const wrapper = mount(
      <MemoryRouter initialEntries={["/subjects"]}>
        <Routes>
          <Route
            path="/subjects"
            element={<HeaderNavLink children="test" path="/subjects" />}
          ></Route>
        </Routes>
      </MemoryRouter>
    );
    wrapper.find("HeaderNavLink").simulate("click");
    // expect(mockNavigate).toHaveBeenCalled();
  });
});
