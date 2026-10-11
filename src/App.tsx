import { Suspense } from "react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Route, Routes, useLocation } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageFallback } from "@/components/PageFallback";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

const Home = lazyWithRetry(() => import("@/pages/Home"));
const Reclamation = lazyWithRetry(() => import("@/pages/Reclamation"));
const Suivi = lazyWithRetry(() => import("@/pages/Suivi"));
const MaterielReforme = lazyWithRetry(() => import("@/pages/MaterielReforme"));
const NotFound = lazyWithRetry(() => import("@/pages/NotFound"));

const AdminLayout = lazyWithRetry(() =>
  import("@/pages/admin/AdminLayout").then((m) => ({ default: m.AdminLayout })),
);
const AdminDashboard = lazyWithRetry(() => import("@/pages/admin/AdminDashboard"));
const AdminRequestDetail = lazyWithRetry(() => import("@/pages/admin/AdminRequestDetail"));
const AdminReformed = lazyWithRetry(() => import("@/pages/admin/AdminReformed"));
const AdminServices = lazyWithRetry(() => import("@/pages/admin/AdminServices"));
const AdminBrands = lazyWithRetry(() => import("@/pages/admin/AdminBrands"));
const AdminSettings = lazyWithRetry(() => import("@/pages/admin/AdminSettings"));

/** Restores scroll to the top on navigation (except when a hash is targeted). */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  React.useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname, hash]);
  return null;
}

/** Keeps <title> and the meta description in sync with the active language. */
function DocumentMeta() {
  const { t } = useTranslation();
  React.useEffect(() => {
    document.title = t("meta.title");
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("meta.description"));
  }, [t]);
  return null;
}

export function App() {
  const { pathname } = useLocation();
  return (
    <>
      <ScrollToTop />
      <DocumentMeta />
      <ErrorBoundary key={pathname}>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="/reclamation" element={<Reclamation />} />
              <Route path="/suivi" element={<Suivi />} />
              <Route path="/materiel-reforme" element={<MaterielReforme />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="requests/:id" element={<AdminRequestDetail />} />
              <Route path="reformed" element={<AdminReformed />} />
              <Route path="services" element={<AdminServices />} />
              <Route path="brands" element={<AdminBrands />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
