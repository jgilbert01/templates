import React from "react";
import { shallow } from "enzyme";
import Root from "../root.component";
import Header from "../components/Header";

describe("Root component", () => {
  it("should be in the document", () => {
    const wrapper = shallow(<Root />);
    expect(wrapper).toBeDefined();
    // console.log(wrapper.debug());
    expect(wrapper.find(Header)).toBeDefined();
  });
});
