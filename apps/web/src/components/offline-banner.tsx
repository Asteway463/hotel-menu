'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useOnline } from '@/hooks/use-online';
import { useUI } from '@/store/ui';

export default function OfflineBanner() {
  const online = useOnline();
  const { t, language } = useUI();

  return (
    <AnimatePresence>
      {!online ? (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-0 inset-x-0 z-[60] bg-secondary/95 text-cream backdrop-blur"
        >
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
            <WifiOff className="h-5 w-5 text-primary" />
            <p className="text-sm font-medium">
              {language === 'am' ? t.offline.title : t.offline.message}
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
