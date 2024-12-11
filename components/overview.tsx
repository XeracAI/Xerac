import { motion } from 'framer-motion';

import { MessageIcon } from './icons';
import { XeracLogo } from "@/components/ui/xerac-logo";
import Image from "next/image";
import { models } from "@/lib/ai/models";

export const Overview = ({selectedModelId}: {selectedModelId: string}) => {
  const model = models.find((model) => model.id === selectedModelId)

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
            model ?
              <>
                <Image src={model.icon.light} alt={model.label} width={48} height={48} className="dark:hidden" />
                <Image src={model.icon.dark} alt={model.label} width={48} height={48} className="hidden dark:block" />
              </> :
              <MessageIcon size={48} />
          }
          <span>+</span>
          <XeracLogo className="size-12" />
        </p>
        <p>
          {model?.description}
        </p>
      </div>
    </motion.div>
  );
};
