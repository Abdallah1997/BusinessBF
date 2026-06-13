import { LegalShell } from "@/components/legal-shell";

export const metadata = { title: "Terms of Service" };

// NOTE: Starting-point terms for a reselling bookkeeping SaaS. Have counsel
// review before relying on these commercially.
export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="June 13, 2026">
      <p>
        These terms govern your use of BusinessBF. By creating an account or using the service, you
        agree to them.
      </p>

      <h2>The service</h2>
      <p>
        BusinessBF provides bookkeeping, inventory, and marketplace-listing tools for resellers. We
        may add, change, or remove features over time.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You are responsible for keeping your login credentials secure.</li>
        <li>You must provide accurate information and be at least 18 years old.</li>
        <li>You are responsible for activity that occurs under your account.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>You agree not to misuse the service, including by attempting to access other users&rsquo; data, reverse-engineering the platform, or using it for unlawful activity.</p>

      <h2>Connected accounts</h2>
      <p>
        When you connect a bank (via Plaid) or a marketplace (e.g. eBay), you authorize us to access
        the relevant data to provide features. Your use of those third parties is also governed by
        their own terms.
      </p>

      <h2>Financial and tax disclaimer</h2>
      <p>
        BusinessBF helps you organize records and generates reports for convenience. It is not
        accounting, legal, or tax advice. Verify figures and consult a qualified professional before
        filing taxes or making financial decisions.
      </p>

      <h2>Availability and data</h2>
      <p>
        The service is provided &ldquo;as is.&rdquo; We aim for high availability but do not guarantee
        uninterrupted service. Keep your own backups of critical records where possible.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the extent permitted by law, BusinessBF is not liable for indirect or consequential
        damages, or for losses arising from inaccurate data, third-party services, or your reliance
        on generated reports.
      </p>

      <h2>Changes</h2>
      <p>We may update these terms; continued use after changes means you accept the updated terms.</p>

      <h2>Contact</h2>
      <p>
        Questions? Email <a href="mailto:support@businessbf.app">support@businessbf.app</a>.
      </p>
    </LegalShell>
  );
}
