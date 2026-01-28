import { useEffect, useContext } from "react";
import { Outlet, useNavigate } from "react-router";
import Header from "./Header";
import { Toaster } from "react-hot-toast";
import { Context } from "../utils/Context";

const Layout = () => {
    const navigate = useNavigate();
    const { setUser, setLoading } = useContext(Context);
    useEffect(() => {
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");
        if (token && user) {
            navigate(user.role === "superadmin" ? "/departments" : "/dashboard");
            setUser(JSON.parse(user));
        } else {
            navigate("/");
            setUser(null);
        }
        setLoading(false);
    }, []);
    return (
        <div className="h-screen flex flex-col w-full">
            <Header />
            <main className="h-full">
                <Outlet />
            </main>
            <Toaster position="top-right" />
        </div>
    );
};

export default Layout;
