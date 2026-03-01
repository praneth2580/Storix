import React, { useEffect } from 'react';
import { Terminal, ArrowRight } from 'lucide-react';
import { googleAuth } from '../services/googleAuth';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

interface LoginProps {
  onLogin: () => void;
}

export function Login({
  onLogin
}: LoginProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  // Initialize Google Auth on mount when client ID is available
  useEffect(() => {
    if (CLIENT_ID) {
      googleAuth.initialize(CLIENT_ID).catch((err) => {
        console.error('Failed to initialize Google Auth:', err);
        setError('Failed to initialize Google authentication. Check VITE_GOOGLE_CLIENT_ID in .env');
      });
    }
  }, []);

  const handleOAuthLogin = async () => {
    if (!CLIENT_ID.trim()) {
      setError('Google OAuth is not configured. Set VITE_GOOGLE_CLIENT_ID in your .env file.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await googleAuth.initialize(CLIENT_ID);
      const token = await googleAuth.signIn();
      if (token) {
        onLogin();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to authenticate with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return <div className="w-full h-screen bg-primary flex items-center justify-center p-4 relative overflow-hidden text-text-primary">
    {/* Background Grid Effect */}
    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
      backgroundImage: 'linear-gradient(var(--border-primary) 1px, transparent 1px), linear-gradient(90deg, var(--border-primary) 1px, transparent 1px)',
      backgroundSize: '40px 40px'
    }}></div>

    <div className="max-w-md w-full bg-secondary border border-border-primary shadow-2xl relative z-10 rounded-lg overflow-hidden">
      {/* Header Strip */}
      <div className="h-1 w-full bg-accent-blue"></div>

      <div className="p-8">
        {/* Banner Image */}
        <div className="mb-8 flex justify-center">
          <img
            src="/Storix/banner.png"
            alt="Storix Banner"
            className="h-20 w-auto object-contain"
          />
        </div>

        <div className="flex items-center gap-3 mb-8">
          <img
            src="/Storix/logo.png"
            alt="Storix Logo"
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">STORIX</h1>
            <p className="text-xs text-text-muted font-mono uppercase tracking-wider">
              Inventory Control System v2.0
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-primary border border-border-primary p-4 font-mono text-xs text-text-secondary rounded-sm">
            <p className="mb-2 text-accent-blue">$ system_check --auth</p>
            <p className="mb-1">{'>'} Verifying secure connection...</p>
            <p className="mb-1">{'>'} Encryption: AES-256-GCM</p>
            <p className="animate-pulse">{'>'} Awaiting user credentials_</p>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] text-text-muted">
              Sign in with Google to access your spreadsheets. You'll be redirected to authorize access.
            </p>

            {error && (
              <div className="bg-accent-red/10 border border-accent-red/50 text-accent-red text-xs p-2 rounded-sm font-mono">
                {error}
              </div>
            )}

            <button
              onClick={handleOAuthLogin}
              className="w-full bg-text-primary text-tertiary hover:bg-text-secondary text-bg-primary font-bold py-3 px-4 flex items-center justify-center gap-3 transition-colors group rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !CLIENT_ID.trim()}
            >
              <Terminal size={18} />
              <span>{isLoading ? 'Authenticating...' : 'Initialize System'}</span>
              {!isLoading && (
                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0" />
              )}
            </button>

            <div className="text-center mt-6 space-y-2">
              <span className="text-text-muted text-xs block">
                Restricted Access. Authorized Personnel Only.
              </span>
              <div className="flex justify-center gap-4 text-xs font-mono">
                <a href="?page=privacy-policy" className="text-accent-blue hover:text-text-primary transition-colors">Privacy Policy</a>
                <span className="text-text-muted">|</span>
                <a href="?page=terms-of-service" className="text-accent-blue hover:text-text-primary transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Status */}
      <div className="bg-tertiary border-t border-border-primary p-3 flex justify-between items-center text-[10px] text-text-muted font-mono">
        <span>STATUS: ONLINE</span>
        <span>SERVER: US-EAST-1</span>
      </div>
    </div>
  </div>;
}