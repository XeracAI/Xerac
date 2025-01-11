import { Message } from 'ai'
import {IMessage} from './db/mongoose-schema'

export function constructDefaultBranch(messages: Array<IMessage>): Array<IMessage> {
  if (messages.length === 0) return [];

  let currentMessage = messages[0] // TODO get the first parent-less message instead of first index
  const defaultBranch = [currentMessage]

  while (currentMessage.children.length > 0) {
    const nextMessageId = currentMessage.children[0]
    const nextMessage = messages.find((message) => message._id === nextMessageId)
    if (!nextMessage) {
      break
    }

    defaultBranch.push(nextMessage)
    currentMessage = nextMessage
  }

  return defaultBranch
}

export function constructDefaultBranchFromAIMessages(messages: Array<Message>): Array<Message> {
  if (messages.length === 0) return [];

  let currentMessage = messages[0] // TODO get the first parent-less message instead of first index
  let children = currentMessage.children
  const defaultBranch = [currentMessage]

  while (children && children.length > 0) {
    const nextMessageId = children[0]
    const nextMessage = messages.find((message) => (message.serverId ?? message.id) === nextMessageId)
    if (!nextMessage) {
      break
    }

    defaultBranch.push(nextMessage)
    currentMessage = nextMessage
    children = currentMessage.children
  }

  return defaultBranch
}

export function constructBranchUntilDBMessage(leaf: IMessage, messages: Array<IMessage>): Array<IMessage> {
  if (messages.length === 0) return [];

  const branch: Array<IMessage> = [];

  const leafParent = messages.find((m) => m._id.equals(leaf.parent));
  if (leafParent) {
    branch.push(leafParent);

    let currentNode = leafParent;
    while (currentNode.parent) {
      // @ts-expect-error currentNode is okay to be undefined here
      currentNode = messages.find((m) => m._id.equals(currentNode.parent));
      if (!currentNode) {
        break;
      }
      branch.push(currentNode);
    }

    branch.reverse();
  }
  return branch;
}

export function constructBranchFromDBMessages(leaf: IMessage, messages: Array<IMessage>): Array<IMessage> {
  const branch = constructBranchUntilDBMessage(leaf, messages);
  branch.push(leaf);
  return branch;
}

export function constructBranchFromAIMessage(nodeId: string, messages: Array<Message>): Array<Message> {
  if (messages.length === 0) return [];

  const branch: Array<Message> = []
  
  const node = messages.find((m) => m.id === nodeId)
  if (!node) {
    throw Error("Invalid branch node!")
  }
  branch.push(node)

  let currentNode: Message | undefined = node
  const parent = currentNode.parent
  while (parent) {
    const previousNodeId = currentNode.id
    currentNode = messages.find((m) => m.id === parent)
    if (!currentNode) {
      console.warn(`Node ${previousNodeId} has invalid parent node ${parent}! Cutting branch...`)
      break
    }
    branch.push(currentNode)
  }
  branch.reverse()

  currentNode = node
  let children = currentNode.children

  while (children && children.length > 0) {
    const nextMessageId = children[0]
    const nextMessage = messages.find((message) => (message.serverId ?? message.id) === nextMessageId)
    if (!nextMessage) {
      break
    }

    branch.push(nextMessage)
    currentNode = nextMessage
    children = currentNode.children
  }

  return branch
}

export function updateBranchUntilMessage(node: Message, currentBranch: Array<Message>, allMessages: Array<Message>): Array<Message> {
  if (allMessages.length === 0) return [];

  const parent = node.parent
  const nodeParent = allMessages.find((m) => m.id === parent)
  if (!nodeParent) {
    throw Error("Invalid branch node!")
  }
  const parentIndex = currentBranch.findIndex((m) => m.id === nodeParent.id)

  return currentBranch.slice(0, parentIndex + 1)
}

export function cutBranchUntilNode(nodeId: string, currentBranch: Array<Message>): Array<Message> {
  if (currentBranch.length === 0) throw Error("Branch is empty!");
  const nodeIndex = currentBranch.findIndex((m) => (m.serverId ?? m.id) === nodeId)

  return currentBranch.slice(0, nodeIndex)
}

export function constructBranchAfterNode(currentBranch: Array<Message>, allMessages: Array<Message>): Array<Message> {
  if (currentBranch.length === 0) throw Error("Branch is empty!");

  const branch = [...currentBranch];
  let currentNode = currentBranch[currentBranch.length - 1];
  let children = currentNode.children

  while (children && children.length > 0) {
    const nextMessageId = children[0]
    const nextMessage = allMessages.find((message) => (message.serverId ?? message.id) === nextMessageId)
    if (!nextMessage) {
      break
    }

    branch.push(nextMessage)
    currentNode = nextMessage
    children = currentNode.children
  }

  return branch
}
