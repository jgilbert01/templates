import React from "react";
import { Breadcrumb } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
// import startCase from "lodash/startCase";
import { MdOutlineHome } from "react-icons/md";

// favorites star
// add to recent if flagged
// check recent and favorites if no state info

const Component = ({ style }: any) => {
  const location = useLocation();
  // console.log("location: ", location);

  if (location.pathname === "/") return null;

  // @ts-ignore
  if (!location.state?.crumbs) return null;

  // const pathParts = location.pathname.split('/').filter((part) => part?.trim() !== '');
  // console.log("pathParts: ", pathParts);

  const items: any =
    // @ts-ignore
    location.state?.crumbs;
  //  ||
  // pathParts?.map((part, partIndex) => {
  //   const previousParts = pathParts.slice(0, partIndex);
  //   return {
  //     content: startCase(part),
  //     to: previousParts?.length > 0 ? `/${previousParts?.join('/')}/${part}` : `/${part}`,
  //     active: true,
  //   };
  // }) || [];

  // console.log("crumbs: ", items);

  return (
    <Breadcrumb
      style={{
        paddingLeft: "20px",
        marginTop: "12px",
        // fontSize: "26px",
        ...style,
      }}
    >
      <Breadcrumb.Item as={Link as any} active={true} to="/">
        <MdOutlineHome />
      </Breadcrumb.Item>
      {items.map((c: any, i: any) => (
        <>
          {c.active ? (
            <Breadcrumb.Item
              as={Link as any}
              active={true}
              to={c.to}
              state={{
                // @ts-ignore
                crumbs: (location.state?.crumbs || []).slice(0, i + 1),
              }}
            >
              {c.content}
            </Breadcrumb.Item>
          ) : (
            <Breadcrumb.Item>
              {/* <MdOutlineHome style={{ marginRight: ".3em"}}/> */}
              {c.content}
            </Breadcrumb.Item>
          )}
        </>
      ))}
    </Breadcrumb>
  );
};

export default Component;

export const calculateCrumbs = (location: any, crumb: any) => {
  const currentCrumbs = (location.state?.crumbs || []).map((c: any) => ({
    ...c,
    active: true,
  }));

  // console.log("currentCrumbs: ", currentCrumbs);

  return {
    crumbs: [
      ...currentCrumbs,
      {
        ...crumb,
        active: false,
      },
    ],
  };
};
