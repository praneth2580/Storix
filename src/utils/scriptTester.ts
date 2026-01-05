/**
 * Utility to test Google Apps Script connection
 * Useful for debugging mobile connection issues
 */

export interface ScriptTestResult {
  success: boolean;
  error?: string;
  details?: {
    scriptId: string;
    url: string;
    responseTime?: number;
    status?: string;
  };
}

export async function testScriptConnection(scriptId: string): Promise<ScriptTestResult> {
  const url = `https://script.google.com/macros/s/${scriptId}/exec?sheet=Settings&action=get&key=test`;
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    // Check if online
    if (!navigator.onLine) {
      resolve({
        success: false,
        error: 'Device is offline',
        details: {
          scriptId,
          url,
        },
      });
      return;
    }

    // Try to load script with timeout
    const timeout = setTimeout(() => {
      resolve({
        success: false,
        error: 'Connection timeout after 15 seconds',
        details: {
          scriptId,
          url,
          responseTime: Date.now() - startTime,
        },
      });
    }, 15000);

    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    
    script.onerror = () => {
      clearTimeout(timeout);
      resolve({
        success: false,
        error: 'Script failed to load. Possible causes: Invalid Script ID, CORS/CSP restrictions, or network blocking.',
        details: {
          scriptId,
          url,
          responseTime: Date.now() - startTime,
          status: 'SCRIPT_LOAD_ERROR',
        },
      });
    };

    // Set up callback
    (window as any).__storixTestCallback = (response: any) => {
      clearTimeout(timeout);
      const responseTime = Date.now() - startTime;
      delete (window as any).__storixTestCallback;
      
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      
      resolve({
        success: true,
        details: {
          scriptId,
          url,
          responseTime,
          status: 'SUCCESS',
        },
      });
    };

    document.body.appendChild(script);
  });
}

