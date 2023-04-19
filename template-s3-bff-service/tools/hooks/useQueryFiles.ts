import { useMemo } from "react";
import axios from "axios";
import { useInfiniteQuery } from "react-query";

// @ts-ignore
import { useAuth } from "@template-ui/auth";

const useQueryFiles = (
  discriminator: string | undefined,
  entityId: string | undefined
) => {
  const { getJwtToken } = useAuth();

  let path: any = "/";
  if (discriminator && !entityId) path = `/${discriminator}`;
  if (discriminator && entityId) path = `/${discriminator}/${entityId}`;

  const queryInfo = useInfiniteQuery(
    ["files", discriminator, entityId],
    async ({ pageParam }) => {
      const last = pageParam ? `&last=${pageParam}` : "";

      return axios
        .get(
          `${process.env.FILES_SERVICE_URL}/files${path}?limit=25${last}`,
          {
            headers: {
              Authorization: `Bearer ${await getJwtToken()}`,
              "Content-Type": "application/json",
            },
            timeout: 5000,
          }
        )
        .then((data) => {
          // console.log('data: ', JSON.stringify(data, null, 2));
          return data.data;
        });
    },
    {
      // refetchInterval: 5000,
      getNextPageParam: (lastPage) => lastPage.last,
    }
  );

  // console.log('data: ', data);

  return {
    ...queryInfo,
    data: useMemo(
      () => queryInfo.data?.pages?.reduce((a: any, p) => [...a, ...p.data], []),
      [queryInfo.data]
    ),
  };
};

// possible options
// https://react-query.tanstack.com/guides/prefetching

export default useQueryFiles;
