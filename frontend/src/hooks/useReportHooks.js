import { useQuery } from "@tanstack/react-query";
import { reportService } from "../api/report.service";
import toast from "react-hot-toast";

export const useReportStats = () => {
    return useQuery({
        queryKey: ["reports", "stats"],
        queryFn: () => reportService.getStats(),
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false
    });
};

export const useReportOverview = () => {
    return useQuery({
        queryKey: ["reports", "overview"],
        queryFn: () => reportService.getOverview(),
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false
    });
};

export const useAgentPerformanceReport = (params = {}) => {
    return useQuery({
        queryKey: ["reports", "agent-performance", params],
        queryFn: () => reportService.getAgentPerformance(params),
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false
    });
};

export const useLeadInsightsReport = () => {
    return useQuery({
        queryKey: ["reports", "lead-insights"],
        queryFn: () => reportService.getLeadInsights(),
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false
    });
};

export const useExportReport = () => {
    const handleExport = async (type = "excel") => {
        try {
            const response = await reportService.exportReport(type);
            const blob = new Blob([response.data], {
                type: type === "pdf"
                    ? "application/pdf"
                    : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `report-${new Date().toISOString().split("T")[0]}.${type === "pdf" ? "pdf" : "xlsx"}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch {
            toast.error("Failed to export report");
        }
    };
    return { handleExport };
};
