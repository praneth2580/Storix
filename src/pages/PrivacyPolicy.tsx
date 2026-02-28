import React from 'react';

export function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-primary text-text-primary p-8 md:p-12 overflow-y-auto w-full">
            <div className="max-w-4xl mx-auto bg-secondary p-8 rounded-lg shadow-lg border border-border-primary">
                <div className="flex items-center gap-4 mb-8">
                    <img
                        src="/logo.png"
                        alt="Storix Logo"
                        className="w-12 h-12 object-contain"
                    />
                    <h1 className="text-3xl font-bold">Privacy Policy</h1>
                </div>

                <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-text-primary">1. Information We Collect</h2>
                        <p className="mb-2">We collect information that you provide directly to us when using Storix, an Inventory Control System.</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li><strong>Google Account Information:</strong> To authenticate you, we require access to your Google Account. We only collect your basic profile information (email address) required for authentication.</li>
                            <li><strong>Google Sheets Data:</strong> Storix requires access to your Google Spreadsheets to read and write inventory data. This data is strictly used for the core functionality of the application (managing your inventory).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-text-primary">2. How We Use Your Information</h2>
                        <p className="mb-2">We use the information we collect solely for the purpose of providing and improving the Storix service:</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>To securely authenticate your access to the application.</li>
                            <li>To synchronize your inventory data with your designated Google Sheets.</li>
                            <li>To ensure the uninterrupted functionality of the system.</li>
                        </ul>
                        <p className="mt-2 font-medium text-text-primary">We do not sell, rent, or share your personal information or spreadsheet data with third parties.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-text-primary">3. Data Storage and Security</h2>
                        <p>Your authentication tokens are stored securely in your browser's local storage. Your actual inventory data resides within your own Google Sheets. We do not maintain a separate database of your inventory data on our servers. The application acts as a secure interface to your Google Sheets.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-text-primary">4. Google API Services Usage Disclosure</h2>
                        <p>Storix's use and transfer to any other app of information received from Google APIs will adhere to <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-text-primary">5. Changes to This Policy</h2>
                        <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-text-primary">6. Contact Us</h2>
                        <p>If you have any questions about this Privacy Policy, please contact us.</p>
                    </section>
                </div>

                <div className="mt-12 pt-6 border-t border-border-primary text-xs text-text-muted text-center font-mono">
                    Last updated: {new Date().toLocaleDateString()}
                </div>
            </div>
        </div>
    );
}
