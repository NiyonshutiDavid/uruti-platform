import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '../ui/button';

interface TermsOfServiceProps {
  onBack: () => void;
}

export function TermsOfService({ onBack }: TermsOfServiceProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Print Styles */}
      <style>{`
        @media print {
          /* Hide non-document elements */
          header button,
          footer {
            display: none !important;
          }
          
          /* Reset colors for print */
          body {
            background: white !important;
            color: black !important;
          }
          
          /* Ensure all text is black for print */
          * {
            color: black !important;
            background: white !important;
            border-color: #e5e5e5 !important;
          }
          
          /* Preserve heading hierarchy */
          h1 {
            font-size: 32pt !important;
            margin-bottom: 12pt !important;
            page-break-after: avoid !important;
          }
          
          h2 {
            font-size: 18pt !important;
            margin-top: 16pt !important;
            margin-bottom: 8pt !important;
            page-break-after: avoid !important;
          }
          
          h3 {
            font-size: 14pt !important;
            margin-top: 12pt !important;
            margin-bottom: 6pt !important;
            page-break-after: avoid !important;
          }
          
          p, li {
            font-size: 11pt !important;
            line-height: 1.5 !important;
          }
          
          /* Prevent page breaks inside sections */
          section {
            page-break-inside: avoid !important;
          }
          
          /* Ensure proper spacing */
          ul, ol {
            margin-left: 20pt !important;
          }
          
          /* Contact info box and special boxes */
          .contact-box,
          .bg-gray-50,
          .bg-amber-50 {
            border: 1px solid #000 !important;
            padding: 12pt !important;
            margin: 12pt 0 !important;
          }
          
          /* Links should be underlined */
          a {
            text-decoration: underline !important;
          }
          
          /* Remove shadows and effects */
          * {
            box-shadow: none !important;
            backdrop-filter: none !important;
          }
          
          /* Header title area */
          header {
            border-bottom: 2px solid #000 !important;
            padding-bottom: 12pt !important;
            margin-bottom: 16pt !important;
          }
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-black/5 dark:border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2 hover:text-[#76B947]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <Button
              variant="ghost"
              onClick={handlePrint}
              className="flex items-center gap-2 hover:text-[#76B947]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl sm:text-5xl mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Terms of Service
          </h1>
          <p className="text-muted-foreground mb-8" style={{ fontFamily: 'var(--font-body)' }}>
            Last Updated: February 24, 2026
          </p>

          <div className="space-y-8" style={{ fontFamily: 'var(--font-body)' }}>
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                1. Agreement to Terms
              </h2>
              <p className="text-muted-foreground mb-4">
                Welcome to Uruti Digital Ecosystem. These Terms of Service ("Terms") govern your access to and use of our platform, website, and services (collectively, the "Services"). By accessing or using our Services, you agree to be bound by these Terms.
              </p>
              <p className="text-muted-foreground">
                If you do not agree to these Terms, you may not access or use our Services. We reserve the right to modify these Terms at any time, and your continued use of the Services constitutes acceptance of any changes.
              </p>
            </section>

            {/* Eligibility */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                2. Eligibility
              </h2>
              <p className="text-muted-foreground mb-4">
                To use our Services, you must:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Be at least 18 years of age</li>
                <li>Have the legal capacity to enter into binding contracts</li>
                <li>Not be prohibited from using our Services under applicable laws</li>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
              </ul>
            </section>

            {/* Account Registration */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                3. Account Registration and Security
              </h2>
              
              <h3 className="text-xl font-semibold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                3.1 Account Creation
              </h3>
              <p className="text-muted-foreground mb-4">
                When creating an account, you agree to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Provide true, accurate, current, and complete information</li>
                <li>Maintain and promptly update your account information</li>
                <li>Not impersonate any person or entity</li>
                <li>Not create multiple accounts for fraudulent purposes</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                3.2 Account Security
              </h3>
              <p className="text-muted-foreground mb-4">
                You are responsible for:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Maintaining the confidentiality of your password</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized access</li>
                <li>Using strong, unique passwords for your account</li>
              </ul>
            </section>

            {/* User Roles */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                4. User Roles and Responsibilities
              </h2>
              
              <h3 className="text-xl font-semibold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                4.1 Founders
              </h3>
              <p className="text-muted-foreground mb-4">
                As a founder, you agree to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Provide accurate information about your startup and ventures</li>
                <li>Not misrepresent your business metrics or achievements</li>
                <li>Respect intellectual property rights of others</li>
                <li>Engage professionally with investors and mentors</li>
                <li>Comply with all applicable securities and investment laws</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                4.2 Investors
              </h3>
              <p className="text-muted-foreground mb-4">
                As an investor, you agree to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Conduct your own due diligence on investment opportunities</li>
                <li>Not share confidential information obtained through the platform</li>
                <li>Respect founders' intellectual property and trade secrets</li>
                <li>Engage professionally and ethically with founders</li>
                <li>Comply with all applicable investment regulations</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                4.3 Mentors
              </h3>
              <p className="text-muted-foreground mb-4">
                As a mentor, you agree to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide guidance based on your genuine expertise</li>
                <li>Maintain confidentiality of founders' information</li>
                <li>Not exploit your position for personal gain</li>
                <li>Disclose any conflicts of interest</li>
                <li>Engage professionally with founders</li>
              </ul>
            </section>

            {/* Prohibited Activities */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                5. Prohibited Activities
              </h2>
              <p className="text-muted-foreground mb-4">
                You agree not to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Use the Services for any illegal purpose</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights of others</li>
                <li>Upload viruses, malware, or malicious code</li>
                <li>Attempt to gain unauthorized access to the platform</li>
                <li>Scrape or harvest data from the platform without permission</li>
                <li>Spam, harass, or abuse other users</li>
                <li>Engage in fraudulent or deceptive practices</li>
                <li>Manipulate the Uruti Score or other platform metrics</li>
                <li>Reverse engineer or copy any part of the Services</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                6. Intellectual Property Rights
              </h2>
              
              <h3 className="text-xl font-semibold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                6.1 Our Content
              </h3>
              <p className="text-muted-foreground mb-4">
                The Services and their entire contents, features, and functionality (including but not limited to information, software, text, displays, images, video, and audio, and the design, selection, and arrangement thereof) are owned by Uruti, its licensors, or other providers and are protected by copyright, trademark, and other intellectual property laws.
              </p>

              <h3 className="text-xl font-semibold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                6.2 Your Content
              </h3>
              <p className="text-muted-foreground mb-4">
                You retain all rights to the content you submit to the platform. By submitting content, you grant Uruti a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display your content for the purpose of providing and improving the Services.
              </p>
            </section>

            {/* AI and Uruti Score */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                7. AI Services and Uruti Score
              </h2>
              
              <h3 className="text-xl font-semibold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                7.1 AI Advisory and Analysis
              </h3>
              <p className="text-muted-foreground mb-4">
                Our AI-powered features, including advisory tracks and analysis, are provided for informational purposes only. They do not constitute professional advice (financial, legal, or otherwise). You should consult with appropriate professionals before making any business decisions.
              </p>

              <h3 className="text-xl font-semibold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                7.2 Uruti Score
              </h3>
              <p className="text-muted-foreground mb-4">
                The Uruti Score is an algorithmic assessment and should not be the sole basis for investment decisions. It is calculated based on various factors and may not reflect all aspects of a venture's potential. We do not guarantee the accuracy or reliability of the Uruti Score.
              </p>
            </section>

            {/* Investment Disclaimer */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                8. Investment Disclaimer
              </h2>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-6 rounded-lg mb-4">
                <p className="text-muted-foreground mb-4">
                  <strong>IMPORTANT:</strong> Uruti Digital Ecosystem is a platform for connecting founders with investors and providing entrepreneurship resources. We are NOT:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>A registered investment advisor or broker-dealer</li>
                  <li>Providing investment advice or recommendations</li>
                  <li>Guaranteeing investment returns or startup success</li>
                  <li>A party to any investment transactions</li>
                  <li>Conducting due diligence on behalf of investors</li>
                </ul>
              </div>
              <p className="text-muted-foreground">
                All investment decisions are made at your own risk. You should conduct thorough due diligence and consult with financial, legal, and tax professionals before making any investment.
              </p>
            </section>

            {/* Privacy and Data */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                9. Privacy and Data Protection
              </h2>
              <p className="text-muted-foreground">
                Your use of the Services is also governed by our Privacy Policy. By using our Services, you consent to the collection, use, and sharing of your information as described in our Privacy Policy.
              </p>
            </section>

            {/* Disclaimers */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                10. Disclaimers and Limitations of Liability
              </h2>
              
              <h3 className="text-xl font-semibold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                10.1 Service "As Is"
              </h3>
              <p className="text-muted-foreground mb-4">
                The Services are provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. We do not warrant that the Services will be uninterrupted, error-free, or free of viruses or other harmful components.
              </p>

              <h3 className="text-xl font-semibold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                10.2 Limitation of Liability
              </h3>
              <p className="text-muted-foreground mb-4">
                To the fullest extent permitted by law, Uruti Digital Ecosystem shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
              </p>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                11. Indemnification
              </h2>
              <p className="text-muted-foreground">
                You agree to indemnify, defend, and hold harmless Uruti Digital Ecosystem and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees, arising out of or in any way connected with your access to or use of the Services, your violation of these Terms, or your violation of any rights of another.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                12. Termination
              </h2>
              
              <h3 className="text-xl font-semibold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                12.1 By You
              </h3>
              <p className="text-muted-foreground mb-4">
                You may terminate your account at any time by contacting us or using the account deletion feature in your settings.
              </p>

              <h3 className="text-xl font-semibold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                12.2 By Us
              </h3>
              <p className="text-muted-foreground mb-4">
                We reserve the right to suspend or terminate your access to the Services at any time, with or without notice, for:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Violation of these Terms</li>
                <li>Fraudulent, abusive, or illegal activity</li>
                <li>Extended periods of inactivity</li>
                <li>Any other reason at our sole discretion</li>
              </ul>
            </section>

            {/* Dispute Resolution */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                13. Dispute Resolution and Governing Law
              </h2>
              
              <h3 className="text-xl font-semibold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                13.1 Governing Law
              </h3>
              <p className="text-muted-foreground mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the Republic of Rwanda, without regard to its conflict of law provisions.
              </p>

              <h3 className="text-xl font-semibold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                13.2 Dispute Resolution
              </h3>
              <p className="text-muted-foreground mb-4">
                Any disputes arising out of or relating to these Terms or the Services shall be resolved through:
              </p>
              <ol className="list-decimal pl-6 text-muted-foreground space-y-2">
                <li>Good faith negotiations between the parties</li>
                <li>Mediation in Kigali, Rwanda, if negotiations fail</li>
                <li>Arbitration in accordance with Rwandan arbitration laws, if mediation fails</li>
                <li>The courts of Kigali, Rwanda, as a last resort</li>
              </ol>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                14. Changes to Terms
              </h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through a notice on our platform. Your continued use of the Services after such modifications constitutes your acceptance of the updated Terms.
              </p>
            </section>

            {/* Severability */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                15. Severability
              </h2>
              <p className="text-muted-foreground">
                If any provision of these Terms is held to be invalid or unenforceable, such provision shall be struck and the remaining provisions shall be enforced to the fullest extent under law.
              </p>
            </section>

            {/* Entire Agreement */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                16. Entire Agreement
              </h2>
              <p className="text-muted-foreground">
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and Uruti Digital Ecosystem regarding your use of the Services and supersede all prior agreements and understandings.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                17. Contact Information
              </h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg border border-black/5 dark:border-white/10 contact-box">
                <p className="text-muted-foreground mb-2">
                  <strong>Uruti Digital Ecosystem</strong>
                </p>
                <p className="text-muted-foreground mb-2">
                  KN 78 St, Kigali, Rwanda
                </p>
                <p className="text-muted-foreground mb-2">
                  Email: <a href="mailto:legal@uruti.rw" className="text-[#76B947] hover:underline">legal@uruti.rw</a>
                </p>
                <p className="text-muted-foreground">
                  Phone: <a href="tel:+250790636128" className="text-[#76B947] hover:underline">+250 790 636 128</a>
                </p>
              </div>
            </section>

            {/* Acknowledgment */}
            <section className="bg-[#76B947]/10 border border-[#76B947]/20 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Acknowledgment
              </h2>
              <p className="text-muted-foreground">
                By using Uruti Digital Ecosystem, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/5 dark:border-white/10 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
            © {new Date().getFullYear()} Uruti Digital Ecosystem. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}