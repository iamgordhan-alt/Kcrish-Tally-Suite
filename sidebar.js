document.addEventListener("DOMContentLoaded", function() {
  // 1. Sidebar HTML Injector
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
        <a href="ledger.html" class="sidebar-link"><i class="fa-solid fa-book"></i> <span>Ledgers</span></a>
        <a href="masters.html" class="sidebar-link"><i class="fa-solid fa-database"></i> <span>Masters</span></a>
        <a href="restore.html" class="sidebar-link"><i class="fa-solid fa-rotate-left"></i> <span>Restore</span></a>
        <a href="about.html" class="sidebar-link"><i class="fa-solid fa-circle-info"></i> <span>About &amp; Info</span></a>
      </nav>

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

  // Logout handler
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
  });
});