import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { useInstallStore } from '../../store/installStore';

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isInStandaloneMode =
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true;

export default function InstallButton() {
  const { prompt, installed, setPrompt } = useInstallStore();
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  // Hide only if already installed and no prompt available
  if (installed || isInStandaloneMode) return null;

  async function handleClick() {
    if (prompt) {
      await prompt.prompt();
      const result = await prompt.userChoice;
      if (result.outcome === 'accepted') setPrompt(null);
    } else if (isIOS) {
      setShowIOSHelp(true);
    } else {
      // Browser hasn't offered install yet (or already installed)
      setShowIOSHelp(true);
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        aria-label="Install app"
        title="Install app"
      >
        <Download className="w-5 h-5" />
      </button>

      {showIOSHelp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-sm">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-slate-800">Install this app</h3>
              <button onClick={() => setShowIOSHelp(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {isIOS ? (
              <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
                <li>Tap the <strong>Share</strong> button in Safari</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
                <li>Tap <strong>Add</strong></li>
              </ol>
            ) : (
              <p className="text-sm text-slate-600">
                Open your browser menu and choose <strong>Install app</strong> or{' '}
                <strong>Add to Home Screen</strong>.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
