import React from 'react';
import { Terminal, ShieldCheck, ArrowRight } from 'lucide-react';
interface LoginProps {
  onLogin: () => void;
}
export function Login({
  onLogin
}: LoginProps) {
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
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-accent-blue rounded flex items-center justify-center text-white">
              <Terminal size={20} />
            </div>
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
              <button onClick={onLogin} className="w-full bg-text-primary hover:bg-text-secondary text-bg-primary font-bold py-3 px-4 flex items-center justify-center gap-3 transition-colors group rounded-sm">
                <ShieldCheck size={18} />
                <span>Authenticate with Google</span>
                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0" />
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