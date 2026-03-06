import React from "react";
import AppLayout from "../component/layout/AppLayout";
import { useLocation } from "react-router-dom";

const PlaceholderPage = () => {
    const location = useLocation();
    const pageName = location.pathname.substring(1).charAt(0).toUpperCase() + location.pathname.substring(2);

    return (
        <AppLayout>
            <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-500">
                <h1 className="text-4xl font-bold mb-4 text-zinc-100">{pageName || "Generic"} Page</h1>
                <p className="text-lg italic">This page is currently under development.</p>
                <div className="mt-8 p-6 border border-zinc-800 rounded-2xl bg-zinc-950/50 backdrop-blur-sm">
                    <p className="text-sm">Stay tuned for updates on implementation!</p>
                </div>
            </div>
        </AppLayout>
    );
};

export default PlaceholderPage;
