import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function PWAUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setShowInstallPrompt(false);
  };

  // App update notification
  if (needRefresh) {
    return (
      <div className="fixed bottom-4 right-4 left-4 md:left-auto md:max-w-md bg-gradient-to-r from-emerald-600 to-lime-600 text-white rounded-2xl shadow-2xl p-4 flex items-start gap-3 z-50 animate-slide-up">
        <Download className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold mb-1">New version available!</p>
          <p className="text-sm opacity-90 mb-3">
            Reload to get the latest features and improvements.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => updateServiceWorker(true)}
              className="px-4 py-2 bg-white text-emerald-700 rounded-lg font-medium text-sm hover:bg-emerald-50 transition-colors"
            >
              Reload Now
            </button>
            <button
              onClick={close}
              className="px-4 py-2 bg-emerald-700 bg-opacity-30 rounded-lg font-medium text-sm hover:bg-opacity-40 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        <button onClick={close} className="flex-shrink-0">
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // Offline ready notification
  if (offlineReady) {
    return (
      <div className="fixed bottom-4 right-4 left-4 md:left-auto md:max-w-md bg-emerald-600 text-white rounded-2xl shadow-2xl p-4 flex items-start gap-3 z-50 animate-slide-up">
        <div className="flex-1">
          <p className="font-semibold mb-1">App ready for offline use!</p>
          <p className="text-sm opacity-90">
            You can now use StorySeed even without an internet connection.
          </p>
        </div>
        <button onClick={close} className="flex-shrink-0">
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // Install app prompt
  if (showInstallPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-4 right-4 left-4 md:left-auto md:max-w-md bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl shadow-2xl p-4 flex items-start gap-3 z-50 animate-slide-up">
        <Download className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold mb-1">Install StorySeed</p>
          <p className="text-sm opacity-90 mb-3">
            Add to your home screen for quick access and a native app experience!
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-white text-indigo-700 rounded-lg font-medium text-sm hover:bg-indigo-50 transition-colors"
            >
              Install
            </button>
            <button
              onClick={close}
              className="px-4 py-2 bg-indigo-700 bg-opacity-30 rounded-lg font-medium text-sm hover:bg-opacity-40 transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>
        <button onClick={close} className="flex-shrink-0">
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return null;
}
