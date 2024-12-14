import mongoose, { Schema } from 'mongoose';

export interface IMessageInsert {
  _id?: mongoose.Types.ObjectId,

  chatId: string; // References PostgreSQL Chat.id

  role: string;

  content?: any;
  images?: any[];
  audios?: any[];
  videos?: any[];
  voice?: any;

  modelId?: string;
}

export interface IMessage extends IMessageInsert {
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

messageSchema.index({ createdAt: 'asc' });

export const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);

export interface IFile {
	_id: mongoose.Types.ObjectId;
	user: string;

	fileName: string;
	type: string;
	size: number;

	path?: string;

	fileToken?: string;
	pageCount?: number;
	availableMethods?: string;

	isProcessed: boolean;
	convertedText?: string;
	convertedFileURL?: string;
	GPTTokenCount?: number,

	additionalInfo?: mongoose.Schema.Types.Mixed;

	thumbnail?: string;

	createdAt: Date;
	updatedAt: Date;
}

const fileSchema = new Schema<IFile>({
  user: { type: String, required: true },

  fileName: { type: String, required: true },
  type: { type: String, choices: ["image", "pdf"], required: true },
  size: { type: Number, required: true },

  path: { type: String, required: true },

  fileToken: String,
  pageCount: Number,
  availableMethods: String,

  isProcessed: { type: Boolean, default: false },
  convertedText: String,
  convertedFileURL: String,
  GPTTokenCount: Number,

  additionalInfo: mongoose.Schema.Types.Mixed,

  thumbnail: String,
}, {
  timestamps: true,
});

fileSchema.index({ createdAt: -1 });

export const FileModel = mongoose.models.File || mongoose.model<IFile>('File', fileSchema);
