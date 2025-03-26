import { Message as VercelMessage } from "@ai-sdk/ui-utils";

declare module "ai" {
  interface Message extends VercelMessage {
    serverId?: string;

    parent?: string;
    children?: string[];
    siblings?: string[];
  }
}
