import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWA() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (standalone) return;
    setIsIOS(ios);
    if (ios) setShow(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    const installedHandler = () => {
      setPrompt(null);
      setShow(false);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  async function handleInstall() {
    if (!prompt) return;
    await prompt.prompt();
    const result = await prompt.userChoice;
    setPrompt(null);
    if (result.outcome === 'accepted') {
      setShow(false);
    }
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-primary text-white rounded-xl shadow-xl p-4 z-50 flex items-start gap-3">
      <div className="p-2 bg-accent rounded-lg flex-shrink-0">
        <Download className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">{isIOS ? 'Add Dashboard to Home Screen' : 'Install Dashboard App'}</p>
        <p className="text-xs text-slate-300 mt-0.5">
          {isIOS
            ? 'Tap Share, then Add to Home Screen for quick access.'
            : 'Add to your home screen for quick access.'}
        </p>
        <div className="flex gap-2 mt-3">
          {prompt && (
            <button
              onClick={handleInstall}
              className="bg-accent text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Install
            </button>
          )}
          <button
            onClick={() => setShow(false)}
            className="text-slate-400 text-xs px-3 py-1.5 rounded-lg hover:text-white transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
      <button onClick={() => setShow(false)} className="text-slate-400 hover:text-white flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
