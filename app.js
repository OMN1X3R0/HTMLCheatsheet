// PWA Manager - Minimal Icons
class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.init();
  }

  async init() {
    await this.cleanExistingSW();
    await this.registerServiceWorker();
    this.setupInstallPrompt();
    this.setupOfflineDetection();
  }

  // Clean any existing service workers
  async cleanExistingSW() {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        console.log('Cleaned existing service workers');
        
        // Clear all caches
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(key => caches.delete(key)));
      } catch (error) {
        console.log('No existing SW to clean');
      }
    }
  }

  // Register service worker
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const registration = await navigator.serviceWorker.register('./sw.js', {
          scope: './',
          updateViaCache: 'none'
        });

        console.log('SW registered successfully');

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          console.log('New SW version found');
        });

      } catch (error) {
        console.error('SW registration failed:', error);
      }
    }
  }

  // Install prompt
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      this.deferredPrompt = null;
      this.hideInstallButton();
      this.showNotification('App installed successfully!', 'success');
    });
  }

  // Show install button
  showInstallButton() {
    if (document.getElementById('install-btn')) return;

    const installBtn = document.createElement('button');
    installBtn.id = 'install-btn';
    installBtn.innerHTML = '📱 Install App';
    installBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 20px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 1000;
      font-family: inherit;
      font-size: 14px;
      transition: all 0.3s ease;
    `;

    installBtn.addEventListener('mouseenter', () => {
      installBtn.style.transform = 'translateY(-2px)';
      installBtn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
    });
    
    installBtn.addEventListener('mouseleave', () => {
      installBtn.style.transform = 'translateY(0)';
      installBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    });

    installBtn.addEventListener('click', () => this.installApp());
    document.body.appendChild(installBtn);
  }

  hideInstallButton() {
    const installBtn = document.getElementById('install-btn');
    if (installBtn) installBtn.remove();
  }

  async installApp() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log('User response to install prompt:', outcome);
      this.deferredPrompt = null;
      this.hideInstallButton();
    }
  }

  // Offline detection
  setupOfflineDetection() {
    const updateOnlineStatus = () => {
      if (navigator.onLine) {
        document.documentElement.classList.remove('offline');
        this.showNotification('Back online', 'success');
      } else {
        document.documentElement.classList.add('offline');
        this.showNotification('You are offline - content cached for use', 'warning');
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus(); // Initial check
  }

  // Notification system
  showNotification(message, type = 'info') {
    const existing = document.getElementById('pwa-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.id = 'pwa-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${this.getNotificationColor(type)};
      color: white;
      border-radius: 5px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 1001;
      font-family: inherit;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }
    }, 3000);
  }

  getNotificationColor(type) {
    const colors = {
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
      info: '#2196F3'
    };
    return colors[type] || colors.info;
  }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  
  .offline::before {
    content: '⚠️ Offline Mode - Using Cached Content';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #FF9800;
    color: white;
    text-align: center;
    padding: 8px;
    font-size: 14px;
    z-index: 1002;
    font-weight: bold;
  }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new PWAManager());
} else {
  new PWAManager();
}

