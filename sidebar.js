document.addEventListener("DOMContentLoaded", function() {
  // 1. Sidebar HTML Injector with Token Counter (Ledgers link removed)
  const sidebarHTML = `
    <aside class="sidebar">
      <div class="brand-area">
        <div class="brand-logo">KA</div>
        <div>
          <div class="brand-title">Kcrish Suite</div>
          <div class="brand-subtitle">Automation v4.2</div>
        </div>
      </div>

      <button class="sidebar-user-btn" id="openProfileModal" title="Account Settings">
        <div class="user-info-left">
          <div class="user-avatar-icon"><i class="fa-solid fa-user"></i></div>
          <span class="user-name-text" id="headerUsernameText">Account</span>
        </div>
        <i class="fa-solid fa-chevron-down" style="font-size: 10px; opacity: 0.7;"></i>
      </button>

      <div class="menu-section-title">Navigation Menu</div>
      <nav class="sidebar-nav">
        <a href="dashboard.html" class="sidebar-link"><i class="fa-solid fa-chart-line"></i> <span>Dashboard</span></a>
        <a href="purchase.html" class="sidebar-link"><i class="fa-solid fa-cart-shopping"></i> <span>Purchase</span></a>
        <a href="converter.html" class="sidebar-link"><i class="fa-solid fa-file-excel"></i> <span>Converter</span></a>
        <a href="masters.html" class="sidebar-link"><i class="fa-solid fa-database"></i> <span>Masters</span></a>
        <a href="restore.html" class="sidebar-link"><i class="fa-solid fa-rotate-left"></i> <span>Restore</span></a>
        <a href="about.html" class="sidebar-link"><i class="fa-solid fa-circle-info"></i> <span>About &amp; Info</span></a>
      </nav>

      <!-- Token / Free Quota Display Widget -->
      <div style="margin: 12px 0; padding: 10px 12px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px;">
        <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; font-weight: 700; margin-bottom: 4px;">Free Quota Limit</div>
        <div style="font-size: 12px; font-weight: 600; color: #34d399; display: flex; align-items: center; justify-content: space-between;">
          <span id="sidebarTokenText">0 / 1200 Used</span>
          <i class="fa-solid fa-bolt" style="font-size: 11px; color: #fbbf24;"></i>
        </div>
      </div>

      <div style="margin-top: auto; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08);">
        <button class="sidebar-link" id="logoutBtn" style="width: 100%; background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.25); color: #fca5a5; cursor: pointer; text-align: left; border-radius: 10px;">
          <i class="fa-solid fa-right-from-bracket" style="color: #f87171;"></i>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  `;

  // Insert sidebar at the very beginning of body
  document.body.insertAdjacentHTML('afterbegin', sidebarHTML);

  // Set active link based on current filename
  const currentFileName = window.location.pathname.split("/").pop() || "dashboard.html";
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    if (link.getAttribute('href') === currentFileName) {
      link.classList.add('active');
    }
  });

  // Load username
  const username = localStorage.getItem('client_username');
  if (username) {
    const userText = document.getElementById('headerUsernameText');
    if (userText) userText.textContent = username;
  }

  // Update Token Usage Display
  updateSidebarTokenCount();

  // Logout handler
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
  });
});

function updateSidebarTokenCount() {
  const fileCount = localStorage.getItem("kcrish_file_count") || "0";
  const tokenTextEl = document.getElementById('sidebarTokenText');
  if (tokenTextEl) {
    tokenTextEl.textContent = `${fileCount} / 1200 Used`;
  }
}

// 30 Minutes Inactivity Auto-Logout System
(function() {
  let inactivityTimer;

  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(performAutoLogout, 30 * 60 * 1000);
  }

  function performAutoLogout() {
    const username = localStorage.getItem('client_username');
    if (username) {
      localStorage.removeItem('client_username');
      localStorage.removeItem('active_user_folder');
      alert("Session expired due to 30 minutes of inactivity. Please sign in again.");
      window.location.href = 'index.html';
    }
  }

  const activityEvents = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart', 'click'];
  activityEvents.forEach(event => {
    window.addEventListener(event, resetInactivityTimer, true);
  });

  resetInactivityTimer();
})();
