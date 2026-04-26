export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">

        <div className="mb-10">
          <h1 className="text-3xl font-bold text-textPrimary mb-2">Privacy Policy</h1>
          <p className="text-textMuted">Last updated: April 25, 2026</p>
        </div>

        <div className="prose space-y-8">

          <section>
            <h2 className="text-xl font-semibold text-textPrimary mb-3">1. Who we are</h2>
            <p className="text-textMuted leading-relaxed">
              FamilyPantry is a grocery management platform operated from British Columbia, Canada. We help families track pantry inventory, generate AI-powered recipes, and manage grocery spending. Our services are governed by the Personal Information Protection Act (PIPA) of British Columbia and Canada's federal Personal Information Protection and Electronic Documents Act (PIPEDA).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-textPrimary mb-3">2. What information we collect</h2>
            <p className="text-textMuted leading-relaxed mb-3">We collect the following information when you use FamilyPantry:</p>
            <ul className="space-y-2 text-textMuted">
              <li className="flex gap-2"><span className="text-primary font-bold">·</span> Account information — your name, email address, and encrypted password</li>
              <li className="flex gap-2"><span className="text-primary font-bold">·</span> Family member health information — age, weight, height, dietary preferences, and health goals that you voluntarily provide</li>
              <li className="flex gap-2"><span className="text-primary font-bold">·</span> Pantry and grocery data — items you add to your pantry and grocery lists</li>
              <li className="flex gap-2"><span className="text-primary font-bold">·</span> Usage data — how you interact with the app to improve our service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-textPrimary mb-3">3. How we use your information</h2>
            <ul className="space-y-2 text-textMuted">
              <li className="flex gap-2"><span className="text-primary font-bold">·</span> To provide personalized recipe suggestions based on your pantry and health goals</li>
              <li className="flex gap-2"><span className="text-primary font-bold">·</span> To generate grocery lists and expense reports for your family</li>
              <li className="flex gap-2"><span className="text-primary font-bold">·</span> To match Health Canada food recalls against your pantry items</li>
              <li className="flex gap-2"><span className="text-primary font-bold">·</span> To process subscription payments securely through Stripe</li>
              <li className="flex gap-2"><span className="text-primary font-bold">·</span> To send important alerts such as food recall notifications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-textPrimary mb-3">4. AI and third-party services</h2>
            <p className="text-textMuted leading-relaxed mb-3">
              FamilyPantry uses Anthropic's Claude AI to generate recipe suggestions. When you request a recipe, we send anonymized health preference data to Anthropic's API — this includes dietary preferences, health goals, and age ranges, but never your name, email, or any personally identifying information.
            </p>
            <p className="text-textMuted leading-relaxed">
              Anthropic's servers are located in the United States. By using our recipe feature, you consent to this anonymized data being processed in the United States in accordance with Anthropic's privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-textPrimary mb-3">5. Data storage and security</h2>
            <p className="text-textMuted leading-relaxed mb-3">
              Your data is stored on servers located in Canada. Specifically:
            </p>
            <ul className="space-y-2 text-textMuted mb-3">
              <li className="flex gap-2"><span className="text-primary font-bold">·</span> Our database is hosted on Supabase in the Canada Central region</li>
              <li className="flex gap-2"><span className="text-primary font-bold">·</span> Our backend servers are hosted on DigitalOcean in the Toronto, Canada region</li>
              <li className="flex gap-2"><span className="text-primary font-bold">·</span> All data is encrypted in transit using HTTPS/TLS</li>
              <li className="flex gap-2"><span className="text-primary font-bold">·</span> Passwords are hashed using bcrypt and never stored in plain text</li>
              <li className="flex gap-2"><span className="text-primary font-bold">·</span> Database is encrypted at rest using AES-256</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-textPrimary mb-3">6. Your rights under PIPA and PIPEDA</h2>
            <p className="text-textMuted leading-relaxed mb-3">As a Canadian resident you have the right to:</p>
            <ul className="space-y-2 text-textMuted">
              <li className="flex gap-2"><span className="text-primary font-bold">·</span> Access all personal information we hold about you</li>
              <li className="flex gap-2"><span className="text-primary font-bold">·</span> Correct inaccurate information in your profile</li>
              <li className="flex gap-2"><span className="text-primary font-bold">·</span> Request deletion of your account and all associated data</li>
              <li className="flex gap-2"><span className="text-primary font-bold">·</span> Withdraw consent for data processing at any time</li>
              <li className="flex gap-2"><span className="text-primary font-bold">·</span> File a complaint with the Office of the Information and Privacy Commissioner of BC</li>
            </ul>
            <p className="text-textMuted leading-relaxed mt-3">
              To exercise any of these rights, email us at privacy@familypantry.ca
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-textPrimary mb-3">7. Data retention</h2>
            <p className="text-textMuted leading-relaxed">
              We retain your data for as long as your account is active. If you delete your account, all personal data including family member profiles, pantry items, and grocery history will be permanently deleted within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-textPrimary mb-3">8. Children's privacy</h2>
            <p className="text-textMuted leading-relaxed">
              FamilyPantry accounts are created by adults (18+). Health information for children may be added by a parent or guardian as part of a family account. We do not knowingly collect personal information directly from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-textPrimary mb-3">9. Changes to this policy</h2>
            <p className="text-textMuted leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through the app. Continued use of FamilyPantry after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-textPrimary mb-3">10. Contact us</h2>
            <p className="text-textMuted leading-relaxed">
              For privacy questions or concerns, contact us at privacy@familypantry.ca or write to us at FamilyPantry, British Columbia, Canada.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}