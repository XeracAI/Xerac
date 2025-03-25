import { Attachment, ToolInvocation } from "@ai-sdk/ui-utils";
import { JSONValue } from "@ai-sdk/provider";

declare module "ai" {
  interface Message {
    id: string;
    createdAt?: Date;
    content: string;
    experimental_attachments?: Attachment[];
    role: 'system' | 'user' | 'assistant' | 'data';
    data?: JSONValue;
    annotations?: JSONValue[] | undefined;
    toolInvocations?: ToolInvocation[];

    serverId?: string;

    parent?: string;
    children?: string[];
    siblings?: string[];
  }
}
