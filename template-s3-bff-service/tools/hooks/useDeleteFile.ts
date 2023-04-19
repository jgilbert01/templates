import { useMutation, useQueryClient } from "react-query";
import axios from "axios";

// @ts-ignore
import { useAuth } from "@template-ui/auth";

const useDeleteFile = (
  discriminator: string | undefined,
  entityId: string | undefined
) => {
  const { getJwtToken } = useAuth();
  const queryClient = useQueryClient();
  const mutation: any = useMutation(
    (id: any) => {
      return getJwtToken().then((jwt: string) => {
        return axios["delete"](
          `${process.env.FILES_SERVICE_URL}/files/${id}`,
          {
            headers: {
              Authorization: `Bearer ${jwt}`,
              "Content-Type": "application/json",
            },
            timeout: 5000,
          }
        );
      });
    },
    {
      onSuccess: () => {
        // https://react-query.tanstack.com/guides/invalidations-from-mutations
        queryClient.invalidateQueries(["files", discriminator, entityId]);
        // https://react-query.tanstack.com/guides/updates-from-mutation-responses
      },
    }
  );

  return { mutation };
};

export default useDeleteFile;
