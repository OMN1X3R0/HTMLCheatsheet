// Enhanced PWA registration
class PWAManager {
  constructor() {
    this.init();
  }

  async init() {
    await this.cleanRegistration();
    await this.registerSW();
    this.setupInstallPrompt();
  }

  async cleanRegistration() {
    if ('serviceWorker' in navigator) {
      try {
        // Unregister any existing service workers
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        console.log('Cleaned existing service workers');
      } catch (error) {
        console.log('No existing service workers to clean');
      }
    }
  }

  async registerSW() {
    if ('serviceWorker' in navigator) {
      try {
        // Wait a moment before registering new SW
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });

        console.log('SW registered:', registration);

        registration.addEventListener('updatefound', () => {
          console.log('New SW version found');
        });

      } catch (error) {
        console.error('SW registration failed:', error);
      }
    }
  }

  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });
  }

  showInstallButton() {
    // Your existing install button code
  }
}

// Initialize with error handling
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await new PWAManager();
  } catch (error) {
    console.error('PWA initialization failed:', error);
  }
});
