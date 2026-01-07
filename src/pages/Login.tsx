import React from 'react';
import { Terminal, ShieldCheck, ArrowRight, Mail, Key } from 'lucide-react';
import { jsonpRequest } from '../utils';

interface LoginProps {
  onLogin: () => void;
}

type LoginMethod = 'scriptId' | 'emailPassword';

export function Login({
  onLogin
}: LoginProps) {
  const [loginMethod, setLoginMethod] = React.useState<LoginMethod>('scriptId');
  const [scriptId, setScriptId] = React.useState(() => localStorage.getItem('VITE_GOOGLE_SCRIPT_ID') || '');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleScriptIdLogin = () => {
    if (!scriptId.trim()) {
      setError('Script ID is required');
      return;
    }
    localStorage.setItem('VITE_GOOGLE_SCRIPT_ID', scriptId.trim());
    onLogin();
  };

  const handleEmailPasswordLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Get accounts database script ID (configured separately for accounts)
      // This should be set via environment variable or configured separately
      const accountsScriptId = localStorage.getItem('VITE_ACCOUNTS_SCRIPT_ID') || 
                                import.meta.env.VITE_ACCOUNTS_SCRIPT_ID;
      
      if (!accountsScriptId) {
        setError('Accounts database not configured. Please use Script ID login or configure accounts database.');
        setIsLoading(false);
        return;
      }

      // Temporarily set accounts script ID to query accounts
      const originalScriptId = localStorage.getItem('VITE_GOOGLE_SCRIPT_ID');
      localStorage.setItem('VITE_GOOGLE_SCRIPT_ID', accountsScriptId);
      
      try {
        // Query accounts by email
        const accounts = await jsonpRequest<any[]>('Accounts', {
          action: 'get',
          email: email.toLowerCase().trim()
        });
        
        // Find matching account
        const account = Array.isArray(accounts) ? accounts.find(acc => 
          acc.email && acc.email.toLowerCase() === email.toLowerCase().trim()
        ) : null;
        
        if (!account) {
          setError('Invalid email or password');
          setIsLoading(false);
          return;
        }

        // Verify password (in production, use proper password hashing like bcrypt)
        if (account.masterPassword !== password) {
          setError('Invalid email or password');
          setIsLoading(false);
          return;
        }

        // Store scriptId from account for main application
        if (account.scriptId) {
          localStorage.setItem('VITE_GOOGLE_SCRIPT_ID', account.scriptId);
          onLogin();
        } else {
          setError('Account does not have a script ID configured');
          setIsLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to accounts database. Please check configuration.');
        setIsLoading(false);
      } finally {
        // Restore original script ID if it existed
        if (originalScriptId) {
          localStorage.setItem('VITE_GOOGLE_SCRIPT_ID', originalScriptId);
        } else {
          // Clear temporary script ID if no original existed
          localStorage.removeItem('VITE_GOOGLE_SCRIPT_ID');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to authenticate. Please check your connection.');
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    if (loginMethod === 'scriptId') {
      handleScriptIdLogin();
    } else {
      handleEmailPasswordLogin();
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
            src="/banner.png" 
            alt="Storix Banner" 
            className="h-20 w-auto object-contain"
          />
        </div>
        
        <div className="flex items-center gap-3 mb-8">
          <img 
            src="/logo.png" 
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

          {/* Login Method Toggle */}
          <div className="flex items-center justify-center gap-3 p-2 bg-primary border border-border-primary rounded-sm">
            <button
              onClick={() => {
                setLoginMethod('scriptId');
                setError('');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-mono transition-colors ${
                loginMethod === 'scriptId'
                  ? 'bg-accent-blue text-white'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <ShieldCheck size={14} />
              Script ID
            </button>
            <div className="text-text-muted">|</div>
            <button
              onClick={() => {
                setLoginMethod('emailPassword');
                setError('');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-mono transition-colors ${
                loginMethod === 'emailPassword'
                  ? 'bg-accent-blue text-white'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Mail size={14} />
              Email & Password
            </button>
          </div>

          <div className="space-y-4">
            {loginMethod === 'scriptId' ? (
              <div className="space-y-2">
                <label className="text-xs text-text-muted font-mono uppercase tracking-wider block">
                  Google Script ID <span className="text-accent-red">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={scriptId}
                    onChange={(e) => {
                      setScriptId(e.target.value);
                      setError('');
                    }}
                    placeholder="AKfycbx..."
                    className="w-full bg-primary border border-border-primary text-text-primary text-sm p-3 rounded-sm focus:border-accent-blue focus:outline-none font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && scriptId.trim()) {
                        handleLogin();
                      }
                    }}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                    <ShieldCheck size={14} />
                  </div>
                </div>
                {!scriptId && <p className="text-[10px] text-accent-red">Script ID is required to connect to the database.</p>}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs text-text-muted font-mono uppercase tracking-wider block">
                    Email <span className="text-accent-red">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      placeholder="user@example.com"
                      className="w-full bg-primary border border-border-primary text-text-primary text-sm p-3 rounded-sm focus:border-accent-blue focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && email.trim() && password.trim()) {
                          handleLogin();
                        }
                      }}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                      <Mail size={14} />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-text-muted font-mono uppercase tracking-wider block">
                    Password <span className="text-accent-red">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      placeholder="••••••••"
                      className="w-full bg-primary border border-border-primary text-text-primary text-sm p-3 rounded-sm focus:border-accent-blue focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && email.trim() && password.trim()) {
                          handleLogin();
                        }
                      }}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                      <Key size={14} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="bg-accent-red/10 border border-accent-red/50 text-accent-red text-xs p-2 rounded-sm font-mono">
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              className="w-full bg-text-primary text-tertiary hover:bg-text-secondary text-bg-primary font-bold py-3 px-4 flex items-center justify-center gap-3 transition-colors group rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                isLoading ||
                (loginMethod === 'scriptId' ? !scriptId.trim() : !email.trim() || !password.trim())
              }
            >
              <Terminal size={18} />
              <span>{isLoading ? 'Authenticating...' : 'Initialize System'}</span>
              {!isLoading && (
                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0" />
              )}
            </button>

            <div className="text-center">
              <span className="text-text-muted text-xs">
                Restricted Access. Authorized Personnel Only.
              </span>
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