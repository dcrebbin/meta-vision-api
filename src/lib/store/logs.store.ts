import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Log {
  id: string;
  content: string;
  timestamp: number;
}

const LOGS_QUERY_KEY = "logs";

export function useLogsQuery() {
  return useQuery<Log[]>({
    queryKey: [LOGS_QUERY_KEY],
    queryFn: async () => {
      // Fetch logs from storage/API
      return [];
    },
  });
}

export function useAddLogMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const newLog: Log = {
        id: crypto.randomUUID(),
        content,
        timestamp: Date.now(),
      };
      // Save log to storage/API
      return newLog;
    },
    onSuccess: (newLog) => {
      queryClient.setQueryData<Log[]>([LOGS_QUERY_KEY], (oldLogs = []) => [
        ...oldLogs,
        newLog,
      ]);
    },
  });
}
