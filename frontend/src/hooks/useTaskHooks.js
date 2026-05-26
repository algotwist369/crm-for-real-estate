import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { taskService } from "../api/task.service";

export const useTaskWorkspaces = () => useQuery({
    queryKey: ["task-workspaces"],
    queryFn: taskService.getWorkspaces,
    staleTime: 30_000
});

export const useTaskBoard = (workspaceId, filters = {}) => useQuery({
    queryKey: ["task-board", workspaceId, filters],
    queryFn: () => taskService.getBoard(workspaceId, filters),
    enabled: !!workspaceId,
    staleTime: 15_000
});

export const useTaskAnalytics = () => useQuery({
    queryKey: ["task-analytics"],
    queryFn: taskService.getAnalytics,
    staleTime: 30_000
});

export const useCreateWorkspace = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: taskService.createWorkspace,
        onSuccess: response => {
            queryClient.invalidateQueries(["task-workspaces"]);
            toast.success(response.message || "Workspace created");
        },
        onError: error => toast.error(error.response?.data?.message || "Failed to create workspace")
    });
};

export const useUpdateWorkspace = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => taskService.updateWorkspace(id, data),
        onSuccess: response => {
            queryClient.invalidateQueries(["task-workspaces"]);
            queryClient.invalidateQueries(["task-board"]);
            toast.success(response.message || "Workspace updated");
        },
        onError: error => toast.error(error.response?.data?.message || "Failed to update workspace")
    });
};

export const useDeleteWorkspace = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: taskService.deleteWorkspace,
        onSuccess: response => {
            queryClient.invalidateQueries(["task-workspaces"]);
            queryClient.invalidateQueries(["task-board"]);
            queryClient.invalidateQueries(["task-analytics"]);
            toast.success(response.message || "Workspace deleted");
        },
        onError: error => toast.error(error.response?.data?.message || "Failed to delete workspace")
    });
};

export const useCreateTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ workspaceId, data }) => taskService.createTask(workspaceId, data),
        onSuccess: (response, variables) => {
            queryClient.invalidateQueries(["task-board", variables.workspaceId]);
            queryClient.invalidateQueries(["task-analytics"]);
            toast.success(response.message || "Task created");
        },
        onError: error => toast.error(error.response?.data?.message || "Failed to create task")
    });
};

export const useMoveTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => taskService.moveTask(id, data),
        onSuccess: response => {
            queryClient.invalidateQueries(["task-board"]);
            queryClient.invalidateQueries(["task-analytics"]);
            toast.success(response.message || "Task updated");
        },
        onError: error => toast.error(error.response?.data?.message || "Failed to move task")
    });
};

export const useUpdateTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => taskService.updateTask(id, data),
        onSuccess: response => {
            queryClient.invalidateQueries(["task-board"]);
            queryClient.invalidateQueries(["task-analytics"]);
            toast.success(response.message || "Task updated");
        },
        onError: error => toast.error(error.response?.data?.message || "Failed to update task")
    });
};

export const useAddTaskComment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, text }) => taskService.addComment(id, text),
        onSuccess: response => {
            queryClient.invalidateQueries(["task-board"]);
            toast.success(response.message || "Comment added");
        },
        onError: error => toast.error(error.response?.data?.message || "Failed to add comment")
    });
};

export const useUploadTaskAttachment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => taskService.uploadAttachment(id, data),
        onSuccess: response => {
            queryClient.invalidateQueries(["task-board"]);
            toast.success(response.message || "Attachment uploaded");
        },
        onError: error => toast.error(error.response?.data?.message || "Failed to upload attachment")
    });
};

export const useDeleteTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: taskService.deleteTask,
        onSuccess: response => {
            queryClient.invalidateQueries(["task-board"]);
            queryClient.invalidateQueries(["task-analytics"]);
            toast.success(response.message || "Task deleted");
        },
        onError: error => toast.error(error.response?.data?.message || "Failed to delete task")
    });
};
