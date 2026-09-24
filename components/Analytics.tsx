import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";

/**
 * Loads GTM and/or GA4 when the corresponding public env vars are set.
 *
 * Prefer one path for pageviews:
 * - Use GTM and configure GA4 inside Tag Manager, OR
 * - Use GA4 directly here
 * Loading both with GA4 also configured in GTM will double-count.
 */
export function Analytics() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

  return (
    <>
      {gtmId ? <GoogleTagManager gtmId={gtmId} /> : null}
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
    </>
  );
}
