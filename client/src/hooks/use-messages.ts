import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useMessages(conversationId: number) {
  return useQuery({
    queryKey: [api.messages.list.path, conversationId],
    queryFn: async () => {
      const url = buildUrl(api.messages.list.path, { id: conversationId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return api.messages.list.responses[200].parse(await res.json());
    },
    enabled: !!conversationId && !isNaN(conversationId),
    refetchInterval: 5000, // Simple polling for updates
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: number; content: string }) => {
      const url = buildUrl(api.messages.create.path, { id: conversationId });
      // Note: We use the simple create message endpoint here which triggers SSE in the background 
      // or returns immediately depending on implementation. 
      // For this app, we'll use the separate chat integration route in the UI components for streaming
      // but this hook is good for standard non-streaming sends if needed.
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to send message");
      return api.messages.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path, conversationId] });
    },
  });
}
