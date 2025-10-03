// PWA Registration and functionality
class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.init();
  }

  init() {
    this.registerServiceWorker();
    this.setupInstallPrompt();
    this.setupOfflineDetection();
    this.checkForUpdates();
  }

  // Register Service Worker
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', registration);

        // Check for updates every 24 hours
        setInterval(() => {
          registration.update();
        }, 24 * 60 * 60 * 1000);

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Handle install prompt
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
      this.showInstallSuccess();
    });
  }

  // Show install button
  showInstallButton() {
    let installBtn = document.getElementById('install-btn');
    
    if (!installBtn) {
      installBtn = document.createElement('button');
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
  }

  // Hide install button
  hideInstallButton() {
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
      installBtn.remove();
    }
  }

  // Install app
  async installApp() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      this.deferredPrompt = null;
      this.hideInstallButton();
    }
  }

  // Show install success message
  showInstallSuccess() {
    this.showNotification('App installed successfully!', 'success');
  }

  // Offline detection
  setupOfflineDetection() {
    window.addEventListener('online', () => {
      this.showNotification('Connection restored', 'success');
      document.documentElement.classList.remove('offline');
    });

    window.addEventListener('offline', () => {
      this.showNotification('You are currently offline', 'warning');
      document.documentElement.classList.add('offline');
    });

    // Initial check
    if (!navigator.onLine) {
      document.documentElement.classList.add('offline');
    }
  }

  // Show notification
  showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.getElementById('pwa-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.id = 'pwa-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'success' ? '#4CAF50' : type === 'warning' ? '#FF9800' : '#2196F3'};
      color: white;
      border-radius: 5px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 1001;
      font-family: inherit;
      font-size: 14px;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }
    }, 3000);
  }

  // Check for updates
  async checkForUpdates() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      
      // Check for updates every hour
      setInterval(async () => {
        try {
          await registration.update();
          console.log('Checked for updates');
        } catch (error) {
          console.error('Update check failed:', error);
        }
      }, 60 * 60 * 1000);
    }
  }
}

// Initialize PWA when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PWAManager();
});

// Add CSS animations
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
  
  .offline {
    filter: grayscale(30%);
  }
  
  .offline::before {
    content: '⚠️ Offline';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #FF9800;
    color: white;
    text-align: center;
    padding: 5px;
    font-size: 12px;
    z-index: 1002;
  }
`;
document.head.appendChild(style);