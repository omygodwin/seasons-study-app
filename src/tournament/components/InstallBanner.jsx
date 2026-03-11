import { useState, useEffect } from 'react';

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
}

const DISMISSED_KEY = 'tournament-install-dismissed';

export default function InstallBanner() {
  const [show, setShow] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    if (!isMobileDevice() || isStandalone()) return;
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;
    setShow(true);

    function handleBeforeInstall(e) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setShow(false);
  }

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setShow(false);
    }
  }

  if (!show) return null;

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-800 border-t border-orange-600 p-4 safe-area-bottom">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">Add to Home Screen</p>
            <p className="text-gray-400 text-xs">Get quick access and game notifications</p>
          </div>
          <button
            onClick={() => setShowInfo(true)}
            className="text-orange-400 hover:text-orange-300 text-xs underline shrink-0"
          >
            How?
          </button>
          {deferredPrompt ? (
            <button
              onClick={handleInstall}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded-lg text-sm shrink-0"
            >
              Install
            </button>
          ) : (
            <button
              onClick={() => setShowInfo(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded-lg text-sm shrink-0"
            >
              Add App
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="text-gray-500 hover:text-gray-300 text-lg leading-none"
          >
            &times;
          </button>
        </div>
      </div>

      {showInfo && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-end sm:items-center justify-center p-4" onClick={() => setShowInfo(false)}>
          <div
            className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-orange-400">Add to Home Screen</h3>
              <button onClick={() => setShowInfo(false)} className="text-gray-400 hover:text-white text-xl">&times;</button>
            </div>

            <div className="text-gray-300 text-sm space-y-3">
              <p className="font-semibold text-white">Why add this app?</p>
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li>Creates an icon on your home screen for quick access</li>
                <li>Opens in full screen like a real app</li>
                <li>Enable notifications to get live game results and score updates</li>
              </ul>

              <hr className="border-gray-700" />

              {isIOS ? (
                <>
                  <p className="font-semibold text-white">How to install (iPhone/iPad):</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-400">
                    <li>Tap the <strong className="text-white">Share</strong> button at the bottom of Safari (the square with arrow)</li>
                    <li>Scroll down and tap <strong className="text-white">Add to Home Screen</strong></li>
                    <li>Tap <strong className="text-white">Add</strong> in the top right</li>
                  </ol>
                  <hr className="border-gray-700" />
                  <p className="font-semibold text-white">Enable notifications:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-400">
                    <li>Open the app from your home screen</li>
                    <li>When prompted, tap <strong className="text-white">Allow Notifications</strong></li>
                    <li>If you missed the prompt, go to <strong className="text-white">Settings &gt; Notifications</strong> and find the app</li>
                  </ol>
                </>
              ) : (
                <>
                  <p className="font-semibold text-white">How to install (Android):</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-400">
                    <li>Tap the <strong className="text-white">menu</strong> (three dots) in Chrome</li>
                    <li>Tap <strong className="text-white">Add to Home screen</strong> or <strong className="text-white">Install app</strong></li>
                    <li>Tap <strong className="text-white">Install</strong></li>
                  </ol>
                  <hr className="border-gray-700" />
                  <p className="font-semibold text-white">Enable notifications:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-400">
                    <li>Open the app from your home screen</li>
                    <li>When prompted, tap <strong className="text-white">Allow</strong> for notifications</li>
                    <li>You'll receive live score updates during games</li>
                  </ol>
                </>
              )}
            </div>

            <button
              onClick={() => setShowInfo(false)}
              className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded-lg"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
