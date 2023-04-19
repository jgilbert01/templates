import axios from "axios";
import { useInfiniteQuery } from "react-query";

// @ts-ignore
import { useAuth } from "@template-ui/auth";

const useGetFileHistory = (
  discriminator: string | undefined,
  entityId: string | undefined,
  fileId: string | undefined
) => {
  const { getJwtToken } = useAuth();

  const {
    isLoading,
    isError,
    error,
    data,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(
    ["files", discriminator, entityId, fileId],
    async ({ pageParam }) => {
      const last = pageParam ? `&last=${pageParam}` : "";

      return axios
        .get(
          `${process.env.FILES_SERVICE_URL}/files/${discriminator}/${entityId}/${fileId}/versions?limit=25${last}`,
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
    isLoading,
    isError,
    error,
    data: data?.pages?.reduce((a: any, p) => [...a, ...p.data], []),
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  };
};

export default useGetFileHistory;
