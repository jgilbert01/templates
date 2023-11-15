import React, { useCallback } from "react";
import { Fab, Action } from "react-tiny-fab";
import "react-tiny-fab/dist/styles.css";
import { MdAdd } from "react-icons/md";
import { useNavigate } from "react-router-dom";

import useAuthorizedActionMountPoints from "../hooks/useAuthorizedActionMountPoints";
import { LeftNavMicroAppMetadata } from "../types/metadata";
import { getIcon } from "../utils/iconRetriever";

export const ActionButtonComponent = () => {
  const { actionItems } = useAuthorizedActionMountPoints();
  const navigate = useNavigate();

  if (actionItems && actionItems.length > 0) {
    return (
      <Fab
        icon={<MdAdd />}
        style={{ bottom: 24, left: 24 }}
        event="click"
        alwaysShowTitle={true}
      >
        {actionItems.map((microAppMetadata: LeftNavMicroAppMetadata) => (
          <Action
            key={microAppMetadata.key}
            text={microAppMetadata.content}
            onClick={() => navigate(microAppMetadata.to)}
          >
            {React.createElement(getIcon(microAppMetadata.icon))}
          </Action>
        ))}
      </Fab>
    );
  }
  return <></>;
};

export default ActionButtonComponent;
