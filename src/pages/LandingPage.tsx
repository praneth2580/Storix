import React from 'react';
import {
    BarChart3,
    Database,
    LayoutDashboard,
    ShieldCheck,
    Zap,
    ArrowRight,
    Github,
    ExternalLink,
    ChevronRight,
    Package,
    Users,
    ShoppingCart,
    FileText
} from 'lucide-react';

// Custom POS icon since lucide doesn't have a specific "POS" name
const POSIcon = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
);

export function LandingPage() {
    const basePath = import.meta.env.BASE_URL || '/';

    return (
        <div className="min-h-screen bg-primary text-text-primary selection:bg-accent-blue/30 overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-[100] bg-primary/80 backdrop-blur-md border-b border-border-primary">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={`${basePath}logo.png`} alt="Storix Logo" className="h-8 w-auto" />
                        <span className="font-bold text-xl tracking-tight hidden sm:block">Storix</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <a href="#features" className="text-sm font-medium text-text-secondary hover:text-accent-blue transition-colors hidden md:block">Features</a>
                        <a href="#how-it-works" className="text-sm font-medium text-text-secondary hover:text-accent-blue transition-colors hidden md:block">How it Works</a>
                        <a
                            href={`${basePath}?page=login`}
                            className="bg-accent-blue hover:bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-accent-blue/20 flex items-center gap-2"
                        >
                            Sign In
                            <ArrowRight size={16} />
                        </a>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 bg-accent-blue/10 border border-accent-blue/20 text-accent-blue px-4 py-1.5 rounded-full text-xs font-bold mb-8 animate-slide-down">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-blue opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-blue"></span>
                        </span>
                        NOW POWERED BY GOOGLE SHEETS
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight max-w-4xl leading-[1.1]">
                        Management that stays in <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-green">Your Hands</span>
                    </h1>

                    <p className="text-lg md:text-xl text-text-secondary max-w-2xl mb-10 leading-relaxed">
                        Storix transforms your Google Spreadsheet into a powerful, real-time inventory and POS system. No database mirrors, no hidden syncs—just your data.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <a
                            href={`${basePath}?page=login`}
                            className="px-8 py-4 bg-accent-blue hover:bg-blue-600 text-white rounded-xl font-bold text-lg transition-all shadow-xl shadow-accent-blue/25 flex items-center justify-center gap-3"
                        >
                            Start Free Today
                            <ArrowRight size={20} />
                        </a>
                        <a
                            href="#how-it-works"
                            className="px-8 py-4 bg-secondary border border-border-primary hover:bg-tertiary text-text-primary rounded-xl font-bold text-lg transition-all"
                        >
                            Watch Video
                        </a>
                    </div>

                    <div className="mt-20 relative max-w-5xl mx-auto w-full group">
                        <div className="absolute inset-0 bg-gradient-to-t from-accent-blue/20 to-transparent blur-3xl opacity-50 -z-10 bg-accent-blue h-1/2 mt-auto"></div>
                        <div className="bg-secondary p-2 rounded-2xl border border-border-primary shadow-2xl overflow-hidden shadow-black/40">
                            <img
                                src={`${basePath}dashboard_preview.png`}
                                alt="Storix Dashboard Preview"
                                className="w-full h-auto rounded-xl grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/praneth2580/Storix/main/public/dashboard_preview.png';
                                }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-secondary/50 border-y border-border-primary">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Everything you need, nothing you don't</h2>
                        <p className="text-text-secondary max-w-xl mx-auto text-sm md:text-base">
                            Lightweight yet enterprise-grade. Built for small to medium businesses who value simplicity and data ownership.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-primary p-6 rounded-2xl border border-border-primary hover:border-accent-blue/50 transition-all group">
                            <div className="w-12 h-12 bg-accent-blue/10 rounded-xl flex items-center justify-center text-accent-blue mb-4 transition-transform group-hover:scale-110">
                                <Database size={24} />
                            </div>
                            <h3 className="font-bold mb-2">Google Sheets DB</h3>
                            <p className="text-text-secondary text-sm leading-relaxed">
                                Your spreadsheet is the primary database. Edit data directly in Sheets or through our beautiful interface.
                            </p>
                        </div>

                        <div className="bg-primary p-6 rounded-2xl border border-border-primary hover:border-accent-blue/50 transition-all group">
                            <div className="w-12 h-12 bg-accent-green/10 rounded-xl flex items-center justify-center text-accent-green mb-4 transition-transform group-hover:scale-110">
                                <POSIcon size={24} />
                            </div>
                            <h3 className="font-bold mb-2">Modern POS</h3>
                            <p className="text-text-secondary text-sm leading-relaxed">
                                Fast, responsive point-of-sale terminal with barcode support, printing, and digital invoices.
                            </p>
                        </div>

                        <div className="bg-primary p-6 rounded-2xl border border-border-primary hover:border-accent-blue/50 transition-all group">
                            <div className="w-12 h-12 bg-accent-amber/10 rounded-xl flex items-center justify-center text-accent-amber mb-4 transition-transform group-hover:scale-110">
                                <LayoutDashboard size={24} />
                            </div>
                            <h3 className="font-bold mb-2">Real-time Analytics</h3>
                            <p className="text-text-secondary text-sm leading-relaxed">
                                Visual metrics of your stock value, sales performance, and low-stock alerts update in real-time.
                            </p>
                        </div>

                        <div className="bg-primary p-6 rounded-2xl border border-border-primary hover:border-accent-blue/50 transition-all group">
                            <div className="w-12 h-12 bg-accent-red/10 rounded-xl flex items-center justify-center text-accent-red mb-4 transition-transform group-hover:scale-110">
                                <ShieldCheck size={24} />
                            </div>
                            <h3 className="font-bold mb-2">Privacy First</h3>
                            <p className="text-text-secondary text-sm leading-relaxed">
                                We don't store your customer data. It stays in your Google account, encrypted and accessible only by you.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Content */}
            <section className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-16 mb-24">
                        <div className="flex-1">
                            <div className="inline-block p-3 bg-accent-blue/10 rounded-lg text-accent-blue mb-6">
                                <Zap size={24} />
                            </div>
                            <h2 className="text-4xl font-bold mb-6">Seamless Inventory Lifecycle</h2>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center shrink-0 text-accent-blue">
                                        <ChevronRight size={14} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg mb-1">Stock Management</h4>
                                        <p className="text-text-secondary text-base">Handle variants (sizes, colors), track low stock, and generate restocking reports.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center shrink-0 text-accent-blue">
                                        <ChevronRight size={14} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg mb-1">Supplier Relationships</h4>
                                        <p className="text-text-secondary text-base">Maintain detailed records of your suppliers and purchase history.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center shrink-0 text-accent-blue">
                                        <ChevronRight size={14} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg mb-1">Invoices & Logs</h4>
                                        <p className="text-text-secondary text-base">Generate beautiful invoices and keep a detailed audit log of every system change.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 w-full grid grid-cols-2 gap-4">
                            <div className="bg-secondary border border-border-primary p-8 rounded-3xl flex flex-col items-center justify-center text-center gap-4">
                                <Package size={40} className="text-accent-blue" />
                                <span className="text-3xl font-bold">50k+</span>
                                <span className="text-text-muted uppercase tracking-wider text-xs font-bold">Items Managed</span>
                            </div>
                            <div className="bg-secondary border border-border-primary p-8 rounded-3xl mt-8 flex flex-col items-center justify-center text-center gap-4">
                                <Users size={40} className="text-accent-green" />
                                <span className="text-3xl font-bold">100%</span>
                                <span className="text-text-muted uppercase tracking-wider text-xs font-bold">Data Privacy</span>
                            </div>
                            <div className="bg-secondary border border-border-primary p-8 rounded-3xl flex flex-col items-center justify-center text-center gap-4">
                                <ShoppingCart size={40} className="text-accent-amber" />
                                <span className="text-3xl font-bold">Instant</span>
                                <span className="text-text-muted uppercase tracking-wider text-xs font-bold">Sales Entry</span>
                            </div>
                            <div className="bg-secondary border border-border-primary p-8 rounded-3xl mt-8 flex flex-col items-center justify-center text-center gap-4">
                                <FileText size={40} className="text-accent-red" />
                                <span className="text-3xl font-bold">Auto</span>
                                <span className="text-text-muted uppercase tracking-wider text-xs font-bold">Report Engine</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section id="how-it-works" className="py-24 bg-tertiary/30 border-t border-border-primary">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-4xl font-bold text-center mb-16">Get started in 3 minutes</h2>

                    <div className="space-y-12">
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="w-16 h-16 rounded-full bg-accent-blue text-white flex items-center justify-center text-2xl font-black shrink-0 shadow-lg shadow-accent-blue/30">1</div>
                            <div>
                                <h3 className="text-2xl font-bold mb-2">Connect Google Sheets</h3>
                                <p className="text-text-secondary text-lg">Create a blank sheet and paste its ID. Storix will automatically initialize the database structure for you.</p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="w-16 h-16 rounded-full bg-accent-green text-white flex items-center justify-center text-2xl font-black shrink-0 shadow-lg shadow-accent-green/30">2</div>
                            <div>
                                <h3 className="text-2xl font-bold mb-2">Add Your Inventory</h3>
                                <p className="text-text-secondary text-lg">Import items or add them manually. Set prices, variants, and barcodes to get your shop ready.</p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="w-16 h-16 rounded-full bg-accent-amber text-white flex items-center justify-center text-2xl font-black shrink-0 shadow-lg shadow-accent-amber/30">3</div>
                            <div>
                                <h3 className="text-2xl font-bold mb-2">Start Selling</h3>
                                <p className="text-text-secondary text-lg">Open the POS terminal and start ringing up orders. Your stock levels update instantly across all sheets.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 text-center">
                        <a
                            href={`${basePath}?page=help-spreadsheet-id`}
                            target="_blank"
                            className="text-accent-blue font-bold inline-flex items-center gap-2 hover:underline"
                        >
                            Need a full setup guide? Click here
                            <ExternalLink size={16} />
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 px-6 border-t border-border-primary bg-secondary/30">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-3 mb-6">
                                <img src={`${basePath}logo.png`} alt="Storix Logo" className="h-6 w-auto" />
                                <span className="font-bold text-lg tracking-tight">Storix</span>
                            </div>
                            <p className="text-text-secondary text-sm max-w-sm mb-6 font-mono leading-relaxed">
                                Open-source inventory management built with privacy and simplicity at its core.
                                Copyright © {new Date().getFullYear()} Storix Project.
                            </p>
                            <div className="flex gap-4">
                                <a href="https://github.com/praneth2580/Storix" target="_blank" className="text-text-muted hover:text-text-primary transition-colors">
                                    <Github size={20} />
                                </a>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-xs uppercase tracking-widest text-text-muted mb-6">Product</h4>
                            <ul className="space-y-4">
                                <li><a href="#features" className="text-sm text-text-secondary hover:text-accent-blue transition-colors">Features</a></li>
                                <li><a href="#how-it-works" className="text-sm text-text-secondary hover:text-accent-blue transition-colors">Setup Guide</a></li>
                                <li><a href={`${basePath}?page=pos`} className="text-sm text-text-secondary hover:text-accent-blue transition-colors">POS Terminal</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-xs uppercase tracking-widest text-text-muted mb-6">Legal</h4>
                            <ul className="space-y-4">
                                <li><a href={`${basePath}?page=privacy-policy`} className="text-sm text-text-secondary hover:text-accent-blue transition-colors">Privacy Policy</a></li>
                                <li><a href={`${basePath}?page=terms-of-service`} className="text-sm text-text-secondary hover:text-accent-blue transition-colors">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-border-primary/50 text-center">
                        <p className="text-text-muted text-xs">
                            Built by <a href="#" className="font-bold text-text-secondary hover:text-accent-blue transition-colors">Praneth</a> with 💙
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
