import { useContext, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router";

import { setNavigate, setUserContext } from "./navigate";
import { Context } from "./Context";

import Layout from "../components/Layout";
import Signin from "../pages/Signin";
import ProtectedRoute from "./ProtectedRoute";
import HomeLayout from "../components/HomeLayout";
import Dashboard from "../pages/Dashboard";
import DashboardSuper from "../pages/DashboardSuper";
import Spares from "../pages/Spares";
import Departments from "../pages/Departments";
import Users from "../pages/Users";
import Approvals from "../pages/Approvals";
import History from "../pages/History";
import LP from "../pages/LP";
import Tools from "../pages/Tools";
import Pending from "../pages/PendingSurvey";
import Search from "../pages/Search";
import Handheld from "../pages/Handheld";
import PendingTYLoan from "../pages/PendingTYLoan";
import CompletedTYLoan from "../pages/CompletedTYLoan";
import PendingTempLoan from "../pages/PendingTempLoan";
import CompletedTempLoan from "../pages/CompletedTempLoan";
import PendingIssue from "../pages/PendingIssue";
import PendingStock from "../pages/PendingStock";
import PendingProcurement from "../pages/PendingProcurement";
import CompletedServays from "../pages/CompletedServays";
import PendingSpecial from "../pages/PendingSpecial";
import DocumentsCorner from "../pages/DocumentsCorner";
import DocumentIssue from "../pages/DocumentsIssue";
import TemporaryIssue from "../pages/TemporaryIssue";
import PendingDemand from "../pages/PendingDemand";
import LogsSurvey from "../pages/LogsSurvey";

const Router = () => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(Context);

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);
  useEffect(() => {
    setUserContext(setUser);
  }, [setUser]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Signin />} />
      </Route>
      <Route element={<HomeLayout />}>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {user?.role != "superadmin" ? <Dashboard /> : <DashboardSuper />}
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<HomeLayout />}>
        <Route
          path="/spares"
          element={
            <ProtectedRoute>
              <Spares key="2" />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<HomeLayout />}>
        <Route
          path="/spares/critical"
          element={
            <ProtectedRoute>
              <Spares type="critical" key="1" />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<HomeLayout />}>
        <Route
          path="/departments"
          element={
            <ProtectedRoute>
              <Departments />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<HomeLayout />}>
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<HomeLayout />}>
        <Route
          path="/approvals"
          element={
            <ProtectedRoute>
              <Approvals />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<HomeLayout />}>
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<HomeLayout />}>
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <DocumentsCorner />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<HomeLayout />}>
        <Route
          path="/documents/issue"
          element={
            <ProtectedRoute>
              <DocumentIssue />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<HomeLayout />}>
        <Route
          path="/lp"
          element={
            <ProtectedRoute>
              <LP />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<HomeLayout />}>
        <Route
          path="/tools"
          element={
            <ProtectedRoute>
              <Tools key="3" />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<HomeLayout />}>
        <Route
          path="/tools/critical"
          element={
            <ProtectedRoute>
              <Tools type="critical" key="4" />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<HomeLayout />}>
        <Route
          path="/temporary/temporary-issue"
          element={
            <ProtectedRoute>
              <TemporaryIssue />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<HomeLayout />}>
        <Route
          path="/permanent/pending-survey"
          element={
            <ProtectedRoute>
              <Pending />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<HomeLayout />}>
        <Route
          path="/permanent/pending-demand"
          element={
            <ProtectedRoute>
              <PendingDemand />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<HomeLayout />}>
        <Route
          path="/permanent/pending-issue"
          element={
            <ProtectedRoute>
              <PendingIssue />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<HomeLayout />}>
        <Route
          path="/permanent/stock-update"
          element={
            <ProtectedRoute>
              <PendingStock />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<HomeLayout />}>
        <Route
          path="/permanent/procurement"
          element={
            <ProtectedRoute>
              <PendingProcurement />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<HomeLayout />}>
        <Route
          path="/permanent/special-demand"
          element={
            <ProtectedRoute>
              <PendingSpecial />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<HomeLayout />}>
        <Route
          path="/permanent/complete"
          element={
            <ProtectedRoute>
              <CompletedServays />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<HomeLayout />}>
        <Route
          path="/logs/pending-survey"
          element={
            <ProtectedRoute>
              <LogsSurvey />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<HomeLayout />}>
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <Search />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<HomeLayout />}>
        <Route
          path="/handheld"
          element={
            <ProtectedRoute>
              <Handheld />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<HomeLayout />}>
        <Route
          path="/loan/pending"
          element={
            <ProtectedRoute>
              <PendingTYLoan />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<HomeLayout />}>
        <Route
          path="/loan/complete"
          element={
            <ProtectedRoute>
              <CompletedTYLoan />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<HomeLayout />}>
        <Route
          path="/temp-loan/pending"
          element={
            <ProtectedRoute>
              {/* <PendingTempLoan /> */}
              <CompletedTempLoan />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<HomeLayout />}>
        <Route
          path="/temp-loan/complete"
          element={
            <ProtectedRoute>
              <CompletedTempLoan />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
};

export default Router;
