import { auth } from "@/app/(auth)/auth";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { minioClient } from "@/lib/minio";
import { FileModel } from "@/lib/db/mongoose-schema";
import { getPagination, getPagingData } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let page: number = 0;

  const searchParams = request.nextUrl.searchParams
  const queryPage = searchParams.get('page');
  if (typeof queryPage === "string") {
    page = parseInt(queryPage);
  }

  const { limit, offset } = getPagination(page);

  const items = await FileModel
    .find({ user: session.user.id }).select('fileName type pageCount isProcessed thumbnail GPTTokenCount createdAt')
    .sort({ createdAt: "desc" }).skip(offset).limit(limit).lean().exec();
  const totalItems = await FileModel.countDocuments({ user: session.user.id }).exec();

  const data = getPagingData(items, totalItems, page, limit);

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (request.body === null) {
    return new Response('Request body is empty', { status: 400 });
  }

  try {
    const { fileName, type, size, thumbnail } = await request.json();

    if (!fileName || !type || !size) {
      return NextResponse.json({ error: 'Fields cannot be empty' }, { status: 400 });
    }

    const _id = new mongoose.Types.ObjectId();
		const format = fileName.split('.').pop();
		const path = `${session.user.id}/${_id.toString()}.${format}`;

    const [, url] = await Promise.all([
			FileModel.create({ _id, user: session.user.id, fileName, type, size, thumbnail, path }),
			minioClient.presignedPutObject(process.env.MINIO_FILES_BUCKET_NAME || "xerac-files", path, parseInt(process.env.MINIO_PRESIGNED_URL_EXPIRE_TIME || "86400"))
		]);

    return NextResponse.json({ _id, url });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 },
    );
  }
}
