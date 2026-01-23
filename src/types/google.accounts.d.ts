/**
 * Type definitions for Google Identity Services
 * These types are used for OAuth 2.0 authentication
 */

declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenResponse {
        access_token: string;
        expires_in: number;
        scope: string;
        token_type: string;
        error?: string;
        error_description?: string;
      }

      interface TokenClient {
        requestAccessToken: (overrideConfig?: {
          prompt?: string;
          hint?: string;
          state?: string;
        }) => void;
        callback: (response: TokenResponse) => void;
      }

      interface InitTokenClientConfig {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
        error_callback?: (error: { type: string; message: string }) => void;
        state?: string;
        enable_granular_consent?: boolean;
        hosted_domain?: string;
        ux_mode?: 'popup' | 'redirect';
      }

      function initTokenClient(config: InitTokenClientConfig): TokenClient;
      function revoke(token: string, callback: () => void): void;
      function hasGrantedAllScopes(tokenResponse: TokenResponse, ...scopes: string[]): boolean;
      function hasGrantedAnyScope(tokenResponse: TokenResponse, ...scopes: string[]): boolean;
    }
  }
}

// Global declaration for window.google
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: typeof google.accounts.oauth2;
      };
    };
  }
}
