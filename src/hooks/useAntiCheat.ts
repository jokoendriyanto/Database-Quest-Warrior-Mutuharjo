import { useEffect, useCallback } from "react";

/**
 * Disables right-click context menu and dev-tool shortcuts (Ctrl+J, Ctrl+U, Ctrl+Shift+I, F12, Ctrl+S)
 * Shows a fun popup "Mau apa bang? :v" when triggered.
 */
export function useAntiCheat() {
  const showPopup = useCallback(() => {
    // Remove any existing popup
    const existing = document.getElementById("dq-anti-cheat-popup");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "dq-anti-cheat-popup";
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(6px);
      animation: dq-fadeIn 0.2s ease;
    `;

    const card = document.createElement("div");
    card.style.cssText = `
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      border: 2px solid #e94560;
      border-radius: 16px;
      padding: 32px 40px;
      text-align: center;
      box-shadow: 0 0 40px rgba(233,69,96,0.3), 0 20px 60px rgba(0,0,0,0.5);
      animation: dq-scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      max-width: 380px;
      width: 90%;
    `;

    card.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 12px;">🛡️</div>
      <div style="
        font-size: 22px;
        font-weight: 800;
        color: #e94560;
        font-family: 'Inter', sans-serif;
        margin-bottom: 8px;
        letter-spacing: -0.5px;
      ">Mau apa bang? :v</div>
      <div style="
        font-size: 13px;
        color: #94a3b8;
        font-family: 'Inter', sans-serif;
        line-height: 1.5;
        margin-bottom: 20px;
      ">Fitur ini dinonaktifkan selama sesi pembelajaran dan ujian.</div>
      <button id="dq-popup-close" style="
        background: linear-gradient(135deg, #e94560, #c23152);
        color: white;
        border: none;
        padding: 10px 32px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        font-family: 'Inter', sans-serif;
        transition: transform 0.15s, box-shadow 0.15s;
        box-shadow: 0 4px 15px rgba(233,69,96,0.4);
      ">Oke bang 🙏</button>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Close handlers
    const close = () => {
      overlay.style.opacity = "0";
      overlay.style.transition = "opacity 0.2s";
      setTimeout(() => overlay.remove(), 200);
    };

    card.querySelector("#dq-popup-close")?.addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    // Auto-close after 3 seconds
    setTimeout(close, 3000);
  }, []);

  useEffect(() => {
    // Inject keyframes
    const style = document.createElement("style");
    style.textContent = `
      @keyframes dq-fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes dq-scaleIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    `;
    document.head.appendChild(style);

    const handler = (e: Event) => {
      const ke = e as KeyboardEvent;
      const key = ke.key?.toLowerCase();

      // Right-click (context menu)
      if (e.type === "contextmenu") {
        e.preventDefault();
        showPopup();
        return;
      }

      // Keyboard shortcuts to block
      const isCtrl = ke.ctrlKey || ke.metaKey;

      // Ctrl+J (view source / downloads)
      if (isCtrl && key === "j") {
        e.preventDefault();
        showPopup();
        return;
      }

      // Ctrl+U (view source)
      if (isCtrl && key === "u") {
        e.preventDefault();
        showPopup();
        return;
      }

      // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (dev tools)
      if (isCtrl && ke.shiftKey && (key === "i" || key === "j" || key === "c")) {
        e.preventDefault();
        showPopup();
        return;
      }

      // F12 (dev tools)
      if (key === "f12") {
        e.preventDefault();
        showPopup();
        return;
      }

      // Ctrl+S (save page)
      if (isCtrl && key === "s") {
        e.preventDefault();
        showPopup();
        return;
      }

      // Ctrl+P (print)
      if (isCtrl && key === "p") {
        e.preventDefault();
        showPopup();
        return;
      }
    };

    // Disable right-click
    document.addEventListener("contextmenu", handler);
    // Disable keyboard shortcuts
    document.addEventListener("keydown", handler);

    return () => {
      document.removeEventListener("contextmenu", handler);
      document.removeEventListener("keydown", handler);
      style.remove();
    };
  }, [showPopup]);
}
