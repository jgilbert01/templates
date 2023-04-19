import { useMutation, useQueryClient } from "react-query";
import axios from "axios";

// @ts-ignore
import { useAuth } from "@template-ui/auth";

const useSaveFile = (
  discriminator?: string | undefined,
  entityId?: string | undefined,
  fileName?: string | undefined
) => {
  const { getJwtToken } = useAuth();
  const queryClient = useQueryClient();
  const mutation = useMutation(
    (file: any) => {
      return getJwtToken().then((jwt: string) => {
        return axios["put"](
          `${process.env.FILES_SERVICE_URL}/files/${
            discriminator || file.m_discriminator
          }/${entityId || file.m_entityid}/${
            fileName || file.m_filename || file.name
          }`,
          "",
          {
            headers: {
              Authorization: `Bearer ${jwt}`,
              "Content-Type": file.file?.type || file.type,
            },
            timeout: 5000,
          }
        ).then((response: any) => {
          // console.log('response: ', response);

          return axios["put"](
            response.data.signedUrl,
            file.file || file,
            {
              headers: response.data.headers,
              timeout: 15000,
            }
          );
        });
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

export default useSaveFile;
