import { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import NavBar from "./components/NavBar";
import Footer from "./components/Footer";

import HomeSection from "./pages/HomeSection";
import ReviewsPage from "./pages/Reviews";
import HowItWorks from "./pages/HowItWorks";
import Featured from "./pages/Featured";
import ComparePage from "./pages/ComparePage";

import AllCategories from "./components/AllCategories";
import CategoryPage from "./pages/CategoryPage";

import SignInModal from "./components/SignInModal";
import SignUpModal from "./components/SignUpModal";

// import CameraCapture from "./components/CameraCapture";

import AdminRoute from "./routes/AdminRoute";
import AdminPage from "./pages/admin/AdminPage";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminSettings from "./pages/admin/AdminSettings";

export default function App() {
  const [signInOpen, setSignInOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);

  const location = useLocation();

  // hide navbar/footer on admin page
  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen bg-[#050815]">
      {/* Show navbar only on user pages */}
      {!isAdminPage && (
        <NavBar
          onOpenSignIn={() => setSignInOpen(true)}
          onOpenSignUp={() => setSignUpOpen(true)}
        />
      )}

      <Routes>
        <Route path="/" element={<HomeSection />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/features" element={<Featured />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/categories" element={<AllCategories />} />
        <Route path="/categories/:category" element={<CategoryPage />} />
        {/* <Route path="/camera-search" element={<CameraCapture />} /> */}

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <AdminProducts />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminRoute>
              <AdminSettings />
            </AdminRoute>
          }
        />
      </Routes>

      {/* Show footer only on user pages */}
      {!isAdminPage && <Footer />}

      {/* Show auth modals only on user pages */}
      {!isAdminPage && (
        <>
          <SignInModal
            open={signInOpen}
            onClose={() => setSignInOpen(false)}
            onOpenSignUp={() => setSignUpOpen(true)}
          />

          <SignUpModal
            open={signUpOpen}
            onClose={() => setSignUpOpen(false)}
            onOpenSignIn={() => setSignInOpen(true)}
          />
        </>
      )}
    </div>
  );
}
