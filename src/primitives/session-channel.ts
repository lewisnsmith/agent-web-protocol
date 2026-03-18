import { v4 as uuid } from 'uuid';
import EventEmitter from 'eventemitter3';
import { sign } from '../crypto/signing.js';

export type MessageType = 'bid' | 'accept' | 'reject' | 'status-update' | 'milestone' | 'artifact' | 'cancel';

export interface SignedMessage {
  id: string;
  senderDID: string;
  type: MessageType;
  payload: Record<string, unknown>;
  timestamp: string;
  signature: string;
}

export interface SessionChannel {
  id: string;
  intentContractId: string;
  participants: string[];
  status: 'negotiating' | 'active' | 'completed' | 'cancelled';
  messages: SignedMessage[];
  createdAt: string;
}

export class SessionChannelManager extends EventEmitter {
  private channels: Map<string, SessionChannel> = new Map();

  open(intentContractId: string, participants: string[]): SessionChannel {
    const channel: SessionChannel = {
      id: `session-${uuid().split('-')[0]}`,
      intentContractId,
      participants,
      status: 'negotiating',
      messages: [],
      createdAt: new Date().toISOString(),
    };
    this.channels.set(channel.id, channel);
    this.emit('channel:opened', channel);
    return channel;
  }

  sendMessage(
    channelId: string,
    senderDID: string,
    type: MessageType,
    payload: Record<string, unknown>,
    secretKey: Uint8Array
  ): SignedMessage {
    const channel = this.channels.get(channelId);
    if (!channel) throw new Error(`Channel ${channelId} not found`);

    const msg: SignedMessage = {
      id: `msg-${uuid().split('-')[0]}`,
      senderDID,
      type,
      payload,
      timestamp: new Date().toISOString(),
      signature: '',
    };

    const content = JSON.stringify({ ...msg, signature: undefined });
    msg.signature = sign(content, secretKey);
    channel.messages.push(msg);
    this.emit('message', { channelId, message: msg });
    return msg;
  }

  activate(channelId: string): void {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.status = 'active';
      this.emit('channel:activated', channel);
    }
  }

  complete(channelId: string): void {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.status = 'completed';
      this.emit('channel:completed', channel);
    }
  }

  getChannel(channelId: string): SessionChannel | undefined {
    return this.channels.get(channelId);
  }

  getMessages(channelId: string): SignedMessage[] {
    return this.channels.get(channelId)?.messages ?? [];
  }
}
