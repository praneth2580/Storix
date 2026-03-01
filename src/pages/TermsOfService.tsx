import React from 'react';

export function TermsOfService() {
    return (
        <div className="min-h-screen bg-primary text-text-primary p-8 md:p-12 overflow-y-auto w-full">
            <div className="max-w-4xl mx-auto bg-secondary p-8 rounded-lg shadow-lg border border-border-primary">
                <div className="flex items-center gap-4 mb-8">
                    <img
                        src="/Storix/logo.png"
                        alt="Storix Logo"
                        className="w-12 h-12 object-contain"
                    />
                    <h1 className="text-3xl font-bold">Terms of Service</h1>
                </div>

                <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-text-primary">1. Acceptance of Terms</h2>
                        <p>By accessing or using the Storix Inventory Control System ("Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the Service.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-text-primary">2. Description of Service</h2>
                        <p>Storix is a web-based inventory management application that interfaces with Google Sheets to store and retrieve user data. We provide the software interface; you provide the data storage medium (Google Sheets).</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-text-primary">3. User Responsibilities</h2>
                        <ul className="list-disc pl-6 space-y-1">
                            <li><strong>Account Security:</strong> You are responsible for safeguarding the credentials (e.g., Google OAuth access) you use to access the Service.</li>
                            <li><strong>Data Integrity:</strong> You understand that the Service directly reads from and writes to your designated Google Sheets. You are responsible for ensuring the structure of those sheets remains compatible with the Service.</li>
                            <li><strong>Lawful Use:</strong> You agree not to use the Service for any unlawful or unauthorized purpose.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-text-primary">4. Google API Integration</h2>
                        <p>The Service relies on Google APIs to function. Your use of the Service requires acceptance of Google's Terms of Service and Privacy Policy. We are not responsible for any changes or disruptions to Google services that may impact the functionality of Storix.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-text-primary">5. Disclaimer of Warranties</h2>
                        <p>The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We provide no warranties, express or implied, regarding the reliability, accuracy, or uninterrupted availability of the Service.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-text-primary">6. Limitation of Liability</h2>
                        <p>In no event shall Storix or its developers be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-text-primary">7. Modifications</h2>
                        <p>We reserve the right to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.</p>
                    </section>
                </div>

                <div className="mt-12 pt-6 border-t border-border-primary text-xs text-text-muted text-center font-mono">
                    Last updated: {new Date().toLocaleDateString()}
                </div>
            </div>
        </div>
    );
}
