import Image from 'next/image';

import { motion } from 'framer-motion';

import { XeracLogo } from '@/components/ui/xerac-logo';
import type { Model } from '@/lib/ai/types';

import { MessageIcon } from './icons';

export const Overview = ({selectedModel}: {selectedModel?: Model | null}) => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-32"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl">
        <p className="flex flex-row justify-center gap-4 items-center">
          {
            selectedModel ?
              <>
                <Image src={selectedModel.icon.light} alt={selectedModel.label} width={48} height={48} className="dark:hidden" />
                <Image src={selectedModel.icon.dark} alt={selectedModel.label} width={48} height={48} className="hidden dark:block" />
              </> :
              <MessageIcon size={48} />
          }
          <span>+</span>
          <XeracLogo className="size-12" />
        </p>
        <p>
          {selectedModel?.description}
        </p>
      </div>
    </motion.div>
  );
};
