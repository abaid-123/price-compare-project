import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }: any) {
  const userData = localStorage.getItem("user");

  // not logged in
  if (!userData) {
    return <Navigate to="/" replace />;
  }

  let user;
  try {
    user = JSON.parse(userData);
  } catch {
    return <Navigate to="/" replace />;
  }

  //  not admin
  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  //  admin only
  return children;
}