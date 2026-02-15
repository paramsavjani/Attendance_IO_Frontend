import { Outlet } from "react-router-dom";
import { AppLayout } from "./AppLayout";

export function MainLayout() {
    return (
        <AppLayout>
            <Outlet />
        </AppLayout>
    );
}
