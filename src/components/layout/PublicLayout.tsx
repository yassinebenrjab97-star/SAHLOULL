import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { GrainOverlay } from "@/components/GrainOverlay";
import { PageFallback } from "@/components/PageFallback";
import { AiAssistant } from "@/components/ai/AiAssistant";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

/** Public shell: header, page content, footer, grain and the AI assistant. */
export function PublicLayout() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col">
      <GrainOverlay />
      <Header />
      <main id="contenu" className="relative z-[2] flex-1">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <AiAssistant />
    </div>
  );
}
