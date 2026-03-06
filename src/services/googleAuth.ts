/**
 * Google OAuth 2.0 Authentication Service
 * Uses Google Identity Services library for browser-based OAuth
 */

export interface GoogleAuthConfig {
  clientId: string;
  scope?: string;
}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

class GoogleAuthService {
  private clientId: string | null = null;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private scope = 'https://www.googleapis.com/auth/spreadsheets';
  private tokenClient: google.accounts.oauth2.TokenClient | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private pendingResolve: ((token: string) => void) | null = null;
  private pendingReject: ((error: Error) => void) | null = null;

  /**
   * Initialize Google OAuth client
   */
  async initialize(clientId: string): Promise<void> {
    if (this.initPromise && this.clientId === clientId) {
      return this.initPromise;
    }

    this.clientId = clientId;

    this.initPromise = (async () => {
      try {
        // Load Google Identity Services library if not already loaded
        if (typeof window !== 'undefined' && !window.google?.accounts) {
          await this.loadGoogleIdentityServices();
        }

        // Wait for Google Identity Services to be available
        await this.waitForGoogleIdentityServices();

        // Initialize token client
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: this.scope,
          callback: (response: google.accounts.oauth2.TokenResponse) => {
            if (response.error) {
              console.error('OAuth error:', response.error);
              if (this.pendingReject) {
                this.pendingReject(new Error(response.error));
                this.pendingReject = null;
                this.pendingResolve = null;
              }
              return;
            }
            this.accessToken = response.access_token;
            this.tokenExpiry = Date.now() + (response.expires_in * 1000);
            this.saveTokenToStorage();
            if (this.pendingResolve) {
              this.pendingResolve(response.access_token);
              this.pendingResolve = null;
              this.pendingReject = null;
            }
          },
        });

        this.isInitialized = true;
      } catch (error) {
        // Clear the cached promise so subsequent calls can retry
        this.initPromise = null;
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Load Google Identity Services script
   */
  private loadGoogleIdentityServices(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.getElementById('google-identity-services')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-identity-services';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  /**
   * Wait for Google Identity Services to be available
   */
  private waitForGoogleIdentityServices(): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.google?.accounts?.oauth2) {
          reject(new Error('Google Identity Services failed to load'));
        } else {
          resolve();
        }
      }, 10000);
    });
  }

  /**
   * Request access token (triggers OAuth flow if needed)
   */
  async getAccessToken(): Promise<string> {
    // If initialization is in progress, wait for it
    if (this.initPromise) {
      await this.initPromise;
    }

    if (!this.tokenClient) {
      throw new Error('Google Auth not initialized. Pass VITE_GOOGLE_CLIENT_ID to initialize().');
    }

    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Try to load from storage
    this.loadTokenFromStorage();

    // Check again after loading from storage
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Request new token
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error('Token client not initialized'));
        return;
      }

      this.pendingResolve = resolve;
      this.pendingReject = reject;

      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }

  /**
   * Sign in (triggers OAuth consent flow)
   */
  async signIn(): Promise<string> {
    return this.getAccessToken();
  }

  /**
   * Sign out (revokes token)
   */
  async signOut(): Promise<void> {
    if (this.accessToken && window.google?.accounts?.oauth2) {
      try {
        google.accounts.oauth2.revoke(this.accessToken, () => {
          console.log('Token revoked');
        });
      } catch (error) {
        console.error('Error revoking token:', error);
      }
    }

    this.accessToken = null;
    this.tokenExpiry = null;
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expiry');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    this.loadTokenFromStorage();
    return !!(
      this.accessToken &&
      this.tokenExpiry &&
      Date.now() < this.tokenExpiry
    );
  }

  /**
   * Save token to localStorage
   */
  private saveTokenToStorage(): void {
    if (this.accessToken && this.tokenExpiry) {
      localStorage.setItem('google_access_token', this.accessToken);
      localStorage.setItem('google_token_expiry', this.tokenExpiry.toString());
    }
  }

  /**
   * Load token from localStorage
   */
  private loadTokenFromStorage(): void {
    const token = localStorage.getItem('google_access_token');
    const expiry = localStorage.getItem('google_token_expiry');

    if (token && expiry) {
      const expiryTime = parseInt(expiry, 10);
      if (Date.now() < expiryTime) {
        this.accessToken = token;
        this.tokenExpiry = expiryTime;
      } else {
        // Token expired, clear it
        localStorage.removeItem('google_access_token');
        localStorage.removeItem('google_token_expiry');
      }
    }
  }

  /**
   * Get current access token (without triggering OAuth flow)
   */
  getCurrentToken(): string | null {
    this.loadTokenFromStorage();
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }
    return null;
  }
}

// Export singleton instance
export const googleAuth = new GoogleAuthService();
