import { useContext } from "react";
import { Navigate } from "react-router";
import { Context } from "./Context";
import Spinner from "../components/Spinner";

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useContext(Context);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    if (!user) return <Navigate to="/" replace />;

    return children;
};

export default ProtectedRoute;
