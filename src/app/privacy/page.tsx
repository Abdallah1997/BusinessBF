import { LegalShell } from "@/components/legal-shell";

export const metadata = { title: "Privacy Policy" };

// NOTE: This is a starting-point policy for a reselling bookkeeping SaaS. Have
// it reviewed by counsel before relying on it commercially, and update the
// contact address below to a real inbox you monitor.
export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="June 13, 2026">
      <p>
        BusinessBF (&ldquo;we&rdquo;, &ldquo;us&rdquo;) helps online resellers track inventory, sales,
        expenses, and marketplace listings. This policy explains what we collect, how we use it, and
        the choices you have.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li><strong>Account data</strong> — your name, email, and password (passwords are stored only as a salted hash).</li>
        <li><strong>Business data you enter</strong> — inventory items, listings, sales, expenses, and mileage.</li>
        <li><strong>Bank data (optional)</strong> — if you connect a bank through Plaid, we receive transaction history and account metadata (institution name, last 4 digits). We never see or store your bank login credentials.</li>
        <li><strong>Marketplace data (optional)</strong> — if you connect a marketplace (e.g. eBay), we receive listing and order data through that marketplace&rsquo;s API.</li>
        <li><strong>Receipts and emails you upload</strong> — images or messages you submit for AI extraction.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To provide bookkeeping, inventory, and listing features.</li>
        <li>To classify transactions and extract item details using AI (see below).</li>
        <li>To generate tax-aligned reports and business insights for you.</li>
        <li>To secure the service and prevent abuse.</li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>Third-party services</h2>
      <p>We share data only with the providers needed to run these features:</p>
      <ul>
        <li><strong>Plaid</strong> — bank account linking and transaction retrieval.</li>
        <li><strong>eBay</strong> and other marketplaces you choose to connect — listing import and publishing.</li>
        <li><strong>Anthropic (Claude)</strong> — AI classification and content generation. Inputs you submit for AI features are processed to return results and are not used to train models.</li>
        <li><strong>Vercel</strong> and <strong>Neon</strong> — hosting and database.</li>
      </ul>

      <h2>Security</h2>
      <p>
        Sensitive tokens (bank access tokens, marketplace OAuth tokens) are encrypted at rest with
        AES-256-GCM. Traffic is served over HTTPS. Your data is isolated per account.
      </p>

      <h2>Data retention</h2>
      <p>
        We keep your data while your account is active. You can delete individual records at any
        time, and you can request deletion of your account and associated data by contacting us.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Disconnect a bank or marketplace at any time from the Connections page.</li>
        <li>Edit or delete your inventory, expenses, and other records.</li>
        <li>Request a copy or deletion of your account data.</li>
      </ul>

      <h2>Contact</h2>
      <p>
        Questions about this policy? Email{" "}
        <a href="mailto:support@businessbf.app">support@businessbf.app</a>.
      </p>
    </LegalShell>
  );
}
