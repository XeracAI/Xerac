import { motion } from 'framer-motion';
// import Link from 'next/link';

import { MessageIcon } from './icons';
import { XeracLogo } from "@/components/ui/xerac-logo";

export const Overview = () => {
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
          <XeracLogo className="size-12" />
          <span>+</span>
          <MessageIcon size={48} />
        </p>
        {/*<p>*/}
        {/*  This is an{' '}*/}
        {/*  <Link*/}
        {/*    className="font-medium underline underline-offset-4"*/}
        {/*    href="https://github.com/vercel/ai-chatbot"*/}
        {/*    target="_blank"*/}
        {/*  >*/}
        {/*    open source*/}
        {/*  </Link>{' '}*/}
        {/*  chatbot template built with Next.js and the AI SDK by Vercel. It uses*/}
        {/*  the{' '}*/}
        {/*  <code className="rounded-md bg-muted px-1 py-0.5">streamText</code>{' '}*/}
        {/*  function in the server and the{' '}*/}
        {/*  <code className="rounded-md bg-muted px-1 py-0.5">useChat</code> hook*/}
        {/*  on the client to create a seamless chat experience.*/}
        {/*</p>*/}
        {/*<p>*/}
        {/*  You can learn more about the AI SDK by visiting the{' '}*/}
        {/*  <Link*/}
        {/*    className="font-medium underline underline-offset-4"*/}
        {/*    href="https://sdk.vercel.ai/docs"*/}
        {/*    target="_blank"*/}
        {/*  >*/}
        {/*    docs*/}
        {/*  </Link>*/}
        {/*  .*/}
        {/*</p>*/}
      </div>
    </motion.div>
  );
};
