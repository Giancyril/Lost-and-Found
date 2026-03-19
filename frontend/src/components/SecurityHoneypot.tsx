import { useEffect } from "react";

// Prevents double-fire in React StrictMode dev
let _warned = false;

// ── Honeypot: traps bots/inspectors who find hidden elements ─────────────────
const SecurityHoneypot = () => {
  useEffect(() => {
    // ── 1. Console warning banner (production only, once per page load) ───────
    if (!_warned && import.meta.env.PROD) {
      _warned = true;
      console.log("%c⚠ STOP!", "color:#ff4444;font-size:48px;font-weight:900;");
      console.log(
        "%cThis is a browser feature intended for developers. If someone told you to paste something here, it is a scam and will give them access to your account.",
        "color:#facc15;font-size:14px;font-weight:600;line-height:1.6"
      );
      console.log(
        "%cNBSC SAS Lost & Found — Unauthorized access attempts are logged.",
        "color:#94a3b8;font-size:12px;"
      );
    }

    // ── 2. Console backdoor command (requires secret key) ────────────────────
    // Usage in console: __nbsc("your-secret-key")
    (window as any).__nbsc = (key: string) => {
      const SECRET = "nbsc-sas-2026";
      if (key === SECRET) {
        console.log("%c✓ Dev access granted.", "color:#22d3ee;font-size:13px;font-weight:700;");
        const token = localStorage.getItem("accessToken");
        if (token) {
          window.location.href = "/dashboard";
        } else {
          console.log("%c No active session found. Please log in normally.", "color:#f87171;font-size:12px;");
        }
      } else {
        console.log(
          "%c✗ Invalid key. This attempt has been noted.",
          "color:#f87171;font-size:13px;font-weight:700;"
        );
        const attempts = JSON.parse(sessionStorage.getItem("__hp_attempts") || "[]");
        attempts.push({ time: new Date().toISOString(), key });
        sessionStorage.setItem("__hp_attempts", JSON.stringify(attempts));
      }
    };

    // ── 3. Fake "adminHacker" bypass trap ────────────────────────────────────
    // Anyone who finds this and tries it gets a fake loading sequence, then an
    // "access denied" — and their attempt is silently logged.
    (window as any).adminHacker = (pass?: string) => {
      console.log("%c⏳ Authenticating...", "color:#facc15;font-size:13px;font-weight:600;");

      setTimeout(() => {
        console.log("%c⏳ Verifying credentials...", "color:#facc15;font-size:13px;font-weight:600;");
      }, 800);

      setTimeout(() => {
        console.log("%c⏳ Checking admin privileges...", "color:#facc15;font-size:13px;font-weight:600;");
      }, 1600);

      setTimeout(() => {
        console.log(
          "%c✗ ACCESS DENIED — Unauthorized bypass attempt detected and logged.",
          "color:#ff4444;font-size:14px;font-weight:900;"
        );
        console.log(
          "%cYour session fingerprint has been recorded. Continued attempts may result in a permanent ban.",
          "color:#94a3b8;font-size:12px;"
        );

        // Silently log the attempt
        const log = JSON.parse(sessionStorage.getItem("__hp_attempts") || "[]");
        log.push({
          time: new Date().toISOString(),
          type: "adminHacker_bypass",
          pass: pass ?? "(none)",
          userAgent: navigator.userAgent,
          path: window.location.pathname,
        });
        sessionStorage.setItem("__hp_attempts", JSON.stringify(log));
      }, 2400);
    };

    // ── 3. Honeypot: detect DevTools open via timing trick ───────────────────
    let devtoolsOpen = false;
    const threshold = 160;
    const check = () => {
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          // Log silently — don't alert, just record
          const log = JSON.parse(sessionStorage.getItem("__hp_devtools") || "[]");
          log.push({ time: new Date().toISOString(), path: window.location.pathname });
          sessionStorage.setItem("__hp_devtools", JSON.stringify(log));
        }
      } else {
        devtoolsOpen = false;
      }
    };
    const interval = setInterval(check, 1000);

    return () => {
      clearInterval(interval);
      delete (window as any).__nbsc;
      delete (window as any).adminHacker;
    };
  }, []);

  // ── 4. Hidden honeypot DOM element — invisible to users, visible in source ─
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "-9999px",
        top: "-9999px",
        width: "1px",
        height: "1px",
        overflow: "hidden",
        opacity: 0,
        pointerEvents: "none",
      }}
    >
      {/* honeypot-field: do not interact */}
      <input
        type="text"
        name="username"
        autoComplete="off"
        tabIndex={-1}
        readOnly
        onChange={() => {
          // A bot or script tried to fill this field
          const log = JSON.parse(sessionStorage.getItem("__hp_bot") || "[]");
          log.push({ time: new Date().toISOString(), type: "field_fill" });
          sessionStorage.setItem("__hp_bot", JSON.stringify(log));
        }}
      />
      <button
        tabIndex={-1}
        onClick={() => {
          const log = JSON.parse(sessionStorage.getItem("__hp_bot") || "[]");
          log.push({ time: new Date().toISOString(), type: "hidden_button_click" });
          sessionStorage.setItem("__hp_bot", JSON.stringify(log));
          console.warn("Honeypot triggered.");
        }}
      >
        admin-login
      </button>
    </div>
  );
};

export default SecurityHoneypot;
