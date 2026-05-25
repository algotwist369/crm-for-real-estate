import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { chatService } from "../api/chat.service";

export const useChatUsers = () => useQuery({
    queryKey: ["chat-users"],
    queryFn: chatService.getUsers,
    staleTime: 30_000
});

export const useChatConversations = () => useQuery({
    queryKey: ["chat-conversations"],
    queryFn: chatService.getConversations,
    staleTime: 15_000
});

export const useChatMessages = (conversationId, params = {}) => useQuery({
    queryKey: ["chat-messages", conversationId, params],
    queryFn: () => chatService.getMessages(conversationId, params),
    enabled: !!conversationId,
    staleTime: 10_000
});

export const useStartDirectConversation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: chatService.startDirectConversation,
        onSuccess: () => queryClient.invalidateQueries(["chat-conversations"]),
        onError: error => toast.error(error.response?.data?.message || "Failed to start chat")
    });
};

export const useCreateChatGroup = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: chatService.createGroup,
        onSuccess: response => {
            queryClient.invalidateQueries(["chat-conversations"]);
            toast.success(response.message || "Group created");
        },
        onError: error => toast.error(error.response?.data?.message || "Failed to create group")
    });
};

export const useSendChatMessage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ conversationId, data, onUploadProgress }) => chatService.sendMessage(conversationId, data, { onUploadProgress }),
        onSuccess: (response, variables) => {
            queryClient.invalidateQueries(["chat-conversations"]);
            queryClient.invalidateQueries(["chat-messages", variables.conversationId]);
        },
        onError: error => toast.error(error.response?.data?.message || "Failed to send message")
    });
};
