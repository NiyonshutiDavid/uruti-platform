import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '../ui/button';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
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
          
          /* Contact info box */
          .contact-box {
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
            Privacy Policy
          </h1>
          <p className="text-muted-foreground mb-8" style={{ fontFamily: 'var(--font-body)' }}>
            Last Updated: February 24, 2026
          </p>

          <div className="space-y-8" style={{ fontFamily: 'var(--font-body)' }}>
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                1. Introduction
              </h2>
              <p className="text-muted-foreground mb-4">
                Welcome to Uruti Digital Ecosystem ("Uruti," "we," "us," or "our"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
              </p>
              <p className="text-muted-foreground">
                By accessing or using the Uruti Digital Ecosystem, you agree to the terms of this Privacy Policy. If you do not agree with our policies and practices, please do not use our platform.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                2. Information We Collect
              </h2>
              
              <h3 className="text-xl font-semibold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                2.1 Personal Information
              </h3>
              <p className="text-muted-foreground mb-4">
                We collect personal information that you provide to us, including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Name, email address, and contact information</li>
                <li>Email and password</li>
                <li>Profile information (company name, role, bio, location)</li>
                <li>Professional information (expertise, investment preferences)</li>
                <li>Business information (startup details, financial projections)</li>
                <li>Communication data (messages, meeting notes)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                2.2 Automatically Collected Information
              </h3>
              <p className="text-muted-foreground mb-4">
                When you use our platform, we automatically collect:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage data (pages visited, features used, time spent)</li>
                <li>Cookies and tracking technologies</li>
                <li>Log data (access times, errors, performance metrics)</li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                3. How We Use Your Information
              </h2>
              <p className="text-muted-foreground mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide, operate, and maintain our platform</li>
                <li>Create and manage your account</li>
                <li>Connect founders with investors and mentors</li>
                <li>Generate AI-powered insights and recommendations</li>
                <li>Calculate Uruti Scores for startups</li>
                <li>Facilitate communication between users</li>
                <li>Send administrative information and updates</li>
                <li>Improve our services and user experience</li>
                <li>Detect and prevent fraud or security issues</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                4. Information Sharing and Disclosure
              </h2>
              
              <h3 className="text-xl font-semibold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                4.1 Within the Platform
              </h3>
              <p className="text-muted-foreground mb-4">
                Certain information is visible to other users based on their role:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li><strong>Founders:</strong> Your startup information and profile are visible to investors and mentors</li>
                <li><strong>Investors:</strong> Your profile and investment preferences may be visible to founders</li>
                <li><strong>Mentors:</strong> Your expertise and availability are visible to founders</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                4.2 Third-Party Service Providers
              </h3>
              <p className="text-muted-foreground mb-4">
                We may share your information with trusted third parties who assist us in operating our platform, including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Cloud hosting providers</li>
                <li>Analytics services</li>
                <li>Email communication services</li>
                <li>Payment processors</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                4.3 Legal Requirements
              </h3>
              <p className="text-muted-foreground mb-4">
                We may disclose your information if required by law or in response to valid requests by public authorities.
              </p>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                5. Data Security
              </h2>
              <p className="text-muted-foreground mb-4">
                We implement appropriate technical and organizational security measures to protect your personal information, including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure password hashing</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
                <li>Monitoring for suspicious activity</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                However, no method of transmission over the Internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                6. Your Privacy Rights
              </h2>
              <p className="text-muted-foreground mb-4">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Portability:</strong> Receive your data in a portable format</li>
                <li><strong>Objection:</strong> Object to certain data processing activities</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                To exercise these rights, please contact us at <a href="mailto:privacy@uruti.rw" className="text-[#76B947] hover:underline">privacy@uruti.rw</a>
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                7. Data Retention
              </h2>
              <p className="text-muted-foreground">
                We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy. When you delete your account, we will delete or anonymize your information within 90 days, except where we are required to retain it for legal or compliance purposes.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                8. Children's Privacy
              </h2>
              <p className="text-muted-foreground">
                Our platform is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
              </p>
            </section>

            {/* International Transfers */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                9. International Data Transfers
              </h2>
              <p className="text-muted-foreground">
                Your information may be transferred to and maintained on servers located outside of Rwanda. By using our platform, you consent to the transfer of your information to countries that may have different data protection laws than Rwanda. We ensure appropriate safeguards are in place for such transfers.
              </p>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                10. Cookies and Tracking Technologies
              </h2>
              <p className="text-muted-foreground mb-4">
                We use cookies and similar tracking technologies to track activity on our platform and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, some features may not function properly without cookies.
              </p>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                11. Changes to This Privacy Policy
              </h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. We encourage you to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                12. Contact Us
              </h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg border border-black/5 dark:border-white/10 contact-box">
                <p className="text-muted-foreground mb-2">
                  <strong>Uruti Digital Ecosystem</strong>
                </p>
                <p className="text-muted-foreground mb-2">
                  KN 78 St, Kigali, Rwanda
                </p>
                <p className="text-muted-foreground mb-2">
                  Email: <a href="mailto:privacy@uruti.rw" className="text-[#76B947] hover:underline">privacy@uruti.rw</a>
                </p>
                <p className="text-muted-foreground">
                  Phone: <a href="tel:+250790636128" className="text-[#76B947] hover:underline">+250 790 636 128</a>
                </p>
              </div>
            </section>

            {/* Rwanda Data Protection */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                13. Rwanda Data Protection Compliance
              </h2>
              <p className="text-muted-foreground">
                We comply with Rwanda's data protection laws and regulations. Our data processing activities are conducted in accordance with the Law N° 058/2021 of 13/10/2021 on the protection of personal data and privacy in Rwanda.
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