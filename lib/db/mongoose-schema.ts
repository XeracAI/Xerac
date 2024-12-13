import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  chatId: string; // References PostgreSQL Chat.id
  role: string;
  content: any;
  images: any[];
  audios: any[];
  videos: any[];
  voice: any;
  modelId?: string;

  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  chatId: {
    type: String,
    required: true,
    index: true,
  },
  role: {
    type: String,
    required: true,
  },
  content: {
    type: Schema.Types.Mixed,
  },
  images: {
    type: [Schema.Types.Mixed],
    default: [],
  },
  audios: {
    type: [Schema.Types.Mixed],
    default: [],
  },
  videos: {
    type: [Schema.Types.Mixed],
    default: [],
  },
  voice: {
    type: Schema.Types.Mixed,
  },
  modelId: {
    type: String,
  },
}, {
    timestamps: true,
});

// Create indexes
messageSchema.index({ createdAt: 'asc' });

// Create and export the model
export const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);
