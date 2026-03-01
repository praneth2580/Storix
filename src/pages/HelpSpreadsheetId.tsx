import React from 'react';
import { ArrowLeft, ExternalLink, Copy, CheckCircle2, HelpCircle, FileSpreadsheet, Link2, Share2, ClipboardCopy } from 'lucide-react';

export function HelpSpreadsheetId() {
    const [copiedExample, setCopiedExample] = React.useState(false);

    const handleCopyExample = () => {
        navigator.clipboard.writeText('1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789');
        setCopiedExample(true);
        setTimeout(() => setCopiedExample(false), 2000);
    };

    const basePath = import.meta.env.BASE_URL || '/';

    return (
        <div className="min-h-screen bg-primary text-text-primary">
            {/* Top navigation bar */}
            <nav className="bg-secondary border-b border-border-primary sticky top-0 z-50 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <a
                        href={`${basePath}`}
                        className="flex items-center gap-2 text-text-muted hover:text-accent-blue transition-colors text-sm font-medium"
                    >
                        <ArrowLeft size={16} />
                        Back to Storix
                    </a>
                    <div className="flex items-center gap-2">
                        <FileSpreadsheet size={20} className="text-accent-green" />
                        <span className="font-bold text-sm">Help Center</span>
                    </div>
                </div>
            </nav>

            {/* Main content */}
            <main className="max-w-4xl mx-auto px-6 py-10">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-accent-blue/10 border border-accent-blue/30 text-accent-blue px-4 py-1.5 rounded-full text-xs font-medium mb-6">
                        <HelpCircle size={14} />
                        Setup Guide
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                        How to Find Your Google Spreadsheet&nbsp;ID
                    </h1>
                    <p className="text-text-muted max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
                        Storix uses a Google Spreadsheet as its database. Follow these simple steps to create a spreadsheet and find its ID.
                    </p>
                </div>

                {/* Steps */}
                <div className="space-y-12">

                    {/* Step 1 */}
                    <section className="bg-secondary border border-border-primary rounded-lg overflow-hidden">
                        <div className="flex items-center gap-3 p-5 border-b border-border-primary bg-tertiary">
                            <div className="w-8 h-8 bg-accent-blue text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">1</div>
                            <h2 className="text-lg font-bold">Create a New Google Spreadsheet</h2>
                        </div>
                        <div className="p-5 sm:p-6 space-y-4">
                            <ol className="list-disc list-inside space-y-2 text-sm text-text-secondary leading-relaxed">
                                <li>
                                    Go to{' '}
                                    <a
                                        href="https://sheets.google.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-accent-blue hover:underline inline-flex items-center gap-1"
                                    >
                                        sheets.google.com
                                        <ExternalLink size={12} />
                                    </a>
                                </li>
                                <li>Sign in with the <strong className="text-text-primary">same Google account</strong> you use for Storix</li>
                                <li>Click the <strong className="text-text-primary">+ Blank</strong> button to create a new spreadsheet</li>
                                <li>You can name it anything you want (e.g. "My Store Database")</li>
                            </ol>
                            <div className="rounded-lg overflow-hidden border border-border-primary mt-4">
                                <img
                                    src={`${basePath}help/step1_create_sheet.png`}
                                    alt="Creating a new Google Spreadsheet"
                                    className="w-full h-auto"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Step 2 */}
                    <section className="bg-secondary border border-border-primary rounded-lg overflow-hidden">
                        <div className="flex items-center gap-3 p-5 border-b border-border-primary bg-tertiary">
                            <div className="w-8 h-8 bg-accent-blue text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">2</div>
                            <h2 className="text-lg font-bold">Copy the Spreadsheet ID from the URL</h2>
                        </div>
                        <div className="p-5 sm:p-6 space-y-4">
                            <p className="text-sm text-text-secondary leading-relaxed">
                                Look at the <strong className="text-text-primary">address bar</strong> of your browser. The URL of your spreadsheet will look like this:
                            </p>

                            <div className="bg-primary border border-border-primary rounded-lg p-4 font-mono text-xs sm:text-sm break-all leading-relaxed">
                                <span className="text-text-muted">https://docs.google.com/spreadsheets/d/</span>
                                <span className="bg-accent-blue/20 text-accent-blue font-bold px-1 rounded">1AbCdEfGhIjKlMnOpQrStUvWxYz</span>
                                <span className="text-text-muted">/edit</span>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-accent-green/10 border border-accent-green/30 rounded-lg">
                                <CheckCircle2 size={18} className="text-accent-green shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="text-text-primary font-medium">The Spreadsheet ID is the long string of letters and numbers between <code className="bg-primary px-1 rounded">/d/</code> and <code className="bg-primary px-1 rounded">/edit</code></p>
                                    <p className="text-text-muted mt-1">It looks like: <code className="bg-primary px-1 rounded text-accent-blue">1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789</code></p>
                                </div>
                            </div>

                            <button
                                onClick={handleCopyExample}
                                className="flex items-center gap-2 text-xs text-text-muted hover:text-accent-blue transition-colors"
                            >
                                {copiedExample ? <CheckCircle2 size={14} className="text-accent-green" /> : <ClipboardCopy size={14} />}
                                {copiedExample ? 'Copied example ID!' : 'Copy example ID to clipboard'}
                            </button>

                            <div className="rounded-lg overflow-hidden border border-border-primary mt-4">
                                <img
                                    src={`${basePath}help/step2_find_url.png`}
                                    alt="Finding the Spreadsheet ID in the URL"
                                    className="w-full h-auto"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Step 3 */}
                    <section className="bg-secondary border border-border-primary rounded-lg overflow-hidden">
                        <div className="flex items-center gap-3 p-5 border-b border-border-primary bg-tertiary">
                            <div className="w-8 h-8 bg-accent-blue text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">3</div>
                            <h2 className="text-lg font-bold">Ensure Correct Sharing Permissions</h2>
                        </div>
                        <div className="p-5 sm:p-6 space-y-4">
                            <p className="text-sm text-text-secondary leading-relaxed">
                                Storix accesses your Google Sheet using <strong className="text-text-primary">your own Google account</strong>.
                                The spreadsheet must be accessible to the same Google account you logged into Storix with.
                            </p>

                            <div className="bg-primary border border-border-primary rounded-lg p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <Share2 size={16} className="text-accent-blue shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="text-text-primary font-medium">For personal use:</p>
                                        <p className="text-text-muted">No sharing needed — if you created the sheet, you already have full access.</p>
                                    </div>
                                </div>
                                <div className="border-t border-border-primary pt-3">
                                    <div className="flex items-start gap-3">
                                        <Share2 size={16} className="text-accent-green shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <p className="text-text-primary font-medium">For team use:</p>
                                            <p className="text-text-muted">Click the <strong className="text-text-primary">"Share"</strong> button in the top-right corner of Google Sheets and add your team members as <strong className="text-text-primary">Editors</strong>.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg overflow-hidden border border-border-primary mt-4">
                                <img
                                    src={`${basePath}help/step3_share_sheet.png`}
                                    alt="Sharing the Google Spreadsheet"
                                    className="w-full h-auto"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Step 4 - Paste into Storix */}
                    <section className="bg-secondary border border-border-primary rounded-lg overflow-hidden">
                        <div className="flex items-center gap-3 p-5 border-b border-border-primary bg-tertiary">
                            <div className="w-8 h-8 bg-accent-green text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">4</div>
                            <h2 className="text-lg font-bold">Paste the ID into Storix</h2>
                        </div>
                        <div className="p-5 sm:p-6 space-y-4">
                            <ol className="list-decimal list-inside space-y-2 text-sm text-text-secondary leading-relaxed">
                                <li>Go to the <strong className="text-text-primary">Storix Settings page</strong> (or the connection popup if this is your first time)</li>
                                <li>Find the <strong className="text-text-primary">"Google Sheets Database"</strong> section</li>
                                <li>Paste the Spreadsheet ID you copied in Step 2 into the input field</li>
                                <li>Click <strong className="text-text-primary">"Add & Verify"</strong> — Storix will automatically check your access and set up the database</li>
                            </ol>

                            <div className="flex items-start gap-3 p-3 bg-accent-blue/10 border border-accent-blue/30 rounded-lg mt-2">
                                <Link2 size={18} className="text-accent-blue shrink-0 mt-0.5" />
                                <div className="text-sm text-text-secondary">
                                    <strong className="text-text-primary">Tip:</strong> If the sheet is brand new and empty, Storix will automatically create all the required database tables for you. If the sheet already has data, you'll be asked whether you want to overwrite it.
                                </div>
                            </div>
                        </div>
                    </section>

                </div>

                {/* FAQ Section */}
                <div className="mt-16 mb-12">
                    <h2 className="text-xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        <details className="bg-secondary border border-border-primary rounded-lg group">
                            <summary className="p-4 cursor-pointer text-sm font-medium hover:text-accent-blue transition-colors flex items-center gap-2">
                                <HelpCircle size={16} className="text-text-muted shrink-0" />
                                Where exactly is the Spreadsheet ID in the URL?
                            </summary>
                            <div className="px-4 pb-4 text-sm text-text-muted leading-relaxed">
                                In the URL <code className="bg-primary px-1 rounded">https://docs.google.com/spreadsheets/d/<strong className="text-accent-blue">YOUR_ID_HERE</strong>/edit</code>, the ID is the long string of characters between <code className="bg-primary px-1 rounded">/d/</code> and <code className="bg-primary px-1 rounded">/edit</code>. It is typically 40-44 characters long and contains letters, numbers, underscores, and hyphens.
                            </div>
                        </details>

                        <details className="bg-secondary border border-border-primary rounded-lg group">
                            <summary className="p-4 cursor-pointer text-sm font-medium hover:text-accent-blue transition-colors flex items-center gap-2">
                                <HelpCircle size={16} className="text-text-muted shrink-0" />
                                I'm getting "Access Denied". What should I do?
                            </summary>
                            <div className="px-4 pb-4 text-sm text-text-muted leading-relaxed">
                                Make sure you are logged into Storix with the <strong className="text-text-primary">same Google account</strong> that owns the spreadsheet. If a different team member created it, ask them to share it with you as an <strong className="text-text-primary">Editor</strong>.
                            </div>
                        </details>

                        <details className="bg-secondary border border-border-primary rounded-lg group">
                            <summary className="p-4 cursor-pointer text-sm font-medium hover:text-accent-blue transition-colors flex items-center gap-2">
                                <HelpCircle size={16} className="text-text-muted shrink-0" />
                                Can I use the same spreadsheet on multiple devices?
                            </summary>
                            <div className="px-4 pb-4 text-sm text-text-muted leading-relaxed">
                                Yes! The spreadsheet ID stays the same. Log into Storix on any device with the same Google account and paste the same ID to connect.
                            </div>
                        </details>

                        <details className="bg-secondary border border-border-primary rounded-lg group">
                            <summary className="p-4 cursor-pointer text-sm font-medium hover:text-accent-blue transition-colors flex items-center gap-2">
                                <HelpCircle size={16} className="text-text-muted shrink-0" />
                                Will Storix read or modify my other Google Sheets?
                            </summary>
                            <div className="px-4 pb-4 text-sm text-text-muted leading-relaxed">
                                <strong className="text-text-primary">No.</strong> Storix only accesses the Spreadsheet ID you explicitly provide. It does not browse, list, or touch any other files in your Google Drive.
                            </div>
                        </details>
                    </div>
                </div>

                {/* Footer link */}
                <div className="text-center py-8 border-t border-border-primary">
                    <a
                        href={`${basePath}?page=dashboard`}
                        className="inline-flex items-center gap-2 bg-accent-blue hover:bg-blue-600 text-white px-6 py-3 rounded-md font-medium text-sm transition-colors"
                    >
                        Go to Storix
                        <ArrowLeft size={16} className="rotate-180" />
                    </a>
                    <p className="text-text-muted text-xs mt-4">
                        Need more help?{' '}
                        <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">
                            Open Google Sheets
                        </a>
                    </p>
                </div>
            </main>
        </div>
    );
}
