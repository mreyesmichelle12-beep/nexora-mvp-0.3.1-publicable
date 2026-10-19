import { AnalyticsLoader } from "@/components/site/analytics-loader";
import { CookieBanner } from "@/components/site/cookie-banner";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { publicConfig } from "@/lib/page-meta";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="contenido" tabIndex={-1}>{children}</main>
      <Footer config={publicConfig} />
      <CookieBanner analyticsAvailable={Boolean(publicConfig.analytics)} />
      {/* La analítica sólo existe si está configurada; aun así, no carga nada sin consentimiento. */}
      {publicConfig.analytics && <AnalyticsLoader domain={publicConfig.analytics.domain} />}
    </>
  );
}
