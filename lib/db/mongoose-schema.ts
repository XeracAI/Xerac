import mongoose, { Schema } from 'mongoose';

export interface IMessageInsert {
  _id?: mongoose.Types.ObjectId;

  chatId: string; // References PostgreSQL Chat.id

  role: 'system' | 'user' | 'assistant' | 'tool';

  content?: unknown;
  parts?: unknown[];
  images?: unknown[];
  audios?: unknown[];
  videos?: unknown[];
  voice?: unknown;
  attachments: unknown[];

  modelId?: string;

  parent?: mongoose.Types.ObjectId | undefined;
  children: mongoose.Types.ObjectId[];
}

export interface IMessage extends IMessageInsert {
  _id: mongoose.Types.ObjectId;
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
    enum: ['system', 'user', 'assistant', 'tool'],
    required: true,
  },

  content: {
    type: Schema.Types.Mixed,
  },
  parts: {
    type: [Schema.Types.Mixed],
    default: [],
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
  attachments: {
    type: [Schema.Types.Mixed],
    required: true,
    default: [],
  },

  modelId: {
    type: String,
  },

  parent: mongoose.Types.ObjectId,
  children: { type: [mongoose.Types.ObjectId], default: [] },
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
	GPTTokenCount?: number;

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

export interface IMetaInsert {
  id: string;

  [key: string]: any;
}

export interface IMeta extends IMetaInsert {
	_id: mongoose.Types.ObjectId;

	createdAt: Date;
	updatedAt: Date;
}

const metaSchema = new Schema<IMeta>({
  id: String,
}, {
  timestamps: true,
  strict: false,
});

export const MetaModel = mongoose.models.Meta || mongoose.model<IMeta>('Meta', metaSchema);
