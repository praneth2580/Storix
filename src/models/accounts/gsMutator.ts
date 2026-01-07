let seq = 0;

/**
 * Update the gs-worker iframe src with accounts database script ID
 */
export function updateGsWorkerIframe(scriptId?: string): void {
  const iframe = document.getElementById("gs-worker") as HTMLIFrameElement;
  if (iframe) {
    const accountsScriptId = import.meta.env.ACCOUNTS_SCRIPT_ID;
    if (accountsScriptId) {
      iframe.src = `https://script.google.com/macros/s/${accountsScriptId}/exec`;
    }
  }
}

function sendMutation(payload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const iframe = document.getElementById("gs-worker") as HTMLIFrameElement;
    if (!iframe?.contentWindow) {
      // Try to initialize iframe if not ready
      updateGsWorkerIframe();
      reject("Worker iframe not ready. Please configure Accounts Database Script ID in Settings.");
      return;
    }

    const id = ++seq;

    function handler(e: MessageEvent) {
      if (e.data?.id !== id) return;
      window.removeEventListener("message", handler);

      if (e.data.ok) resolve(e.data.result);
      else reject(e.data.error);
    }

    window.addEventListener("message", handler);

    iframe.contentWindow.postMessage(
      { type: "MUTATE", payload, id },
      "https://script.google.com"
    );

    setTimeout(() => {
      window.removeEventListener("message", handler);
      reject("Mutation timeout");
    }, 6000);
  });
}

export const gsMutator = {
  sendMutation,
};