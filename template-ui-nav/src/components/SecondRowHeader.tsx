import React, { useState, useContext, useEffect } from "react";
import { Navbar, Nav, Row, Col, Container } from "react-bootstrap";
import { useMediaQuery } from "react-responsive";

/*  @ts-ignore */
import { MainPropsContext } from "@template-ui/main";

import HeaderNavLink from "./HeaderNavLink";
import {
  LeftNavMicroAppMetadata,
  CountUpdatedEventProps,
} from "../types/metadata";

const NAV_COUNT_UPDATED_TOPIC = "NAV.COUNT_UPDATED";

interface SecondRowHeaderProps {
  style?: any;
  items: Array<LeftNavMicroAppMetadata>;
}

interface LinkCountMapProps {
  count: number;
  warning?: boolean;
}

const SecondRowHeader = (props: SecondRowHeaderProps) => {
  const [linkCountMap, setLinkCountMap] = useState(
    {} as Record<string, LinkCountMapProps>
  );
  /*  @ts-ignore */
  const { subscribe, unsubscribe } = useContext(MainPropsContext);
  const { items } = props;
  const shouldShrinkHeader = useMediaQuery({
    query: "(max-width: 1375px)",
  });

  useEffect(() => {
    const countUpdatedHandler = (msg: string, data: CountUpdatedEventProps) => {
      setLinkCountMap((prevValue) => ({
        ...prevValue,
        [data.key]: { count: data.count, warning: data.warning },
      }));
    };

    const token = subscribe(NAV_COUNT_UPDATED_TOPIC, countUpdatedHandler);
    return () => {
      unsubscribe(token);
    };
  }, []);

  return (
    <Navbar
      id="lower-nav"
      variant="dark"
      bg="yourapps-second-navbar"
      className="d-none d-lg-flex"
      style={props.style}
    >
      <Container fluid>
        <Nav>
          <Row
            style={{
              alignItems: "center",
              alignContent: "center",
            }}
          >
            {items
              .filter((i: LeftNavMicroAppMetadata) => !i.hideInSecondRowNav)
              .sort(
                (a: LeftNavMicroAppMetadata, b: LeftNavMicroAppMetadata) =>
                  a.order - b.order
              )
              .map((item: LeftNavMicroAppMetadata) => (
                <Col key={item.key}>
                  <HeaderNavLink
                    path={item.to}
                    small={shouldShrinkHeader}
                    isDisabled={false}
                    warning={Boolean(
                      linkCountMap[item.key]?.warning &&
                        linkCountMap[item.key]?.count > 0
                    )}
                    state={{
                      crumbs: [
                        {
                          recent: true,
                          favorite: true,
                          active: false,
                          content: item.content,
                          to: item.to,
                          icon: item.icon,
                        },
                      ],
                    }}
                  >
                    {item.content}
                    {linkCountMap[item.key]?.count > 0 && (
                      <span>
                        <span className="ml-2">
                          ({linkCountMap[item.key].count})
                        </span>
                      </span>
                    )}
                  </HeaderNavLink>
                </Col>
              ))}
          </Row>
        </Nav>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse className="justify-content-end" />
      </Container>
    </Navbar>
  );
};

export default SecondRowHeader;
