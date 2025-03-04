import * as Minio from "minio";

if (!process.env.MINIO_ENDPOINT || !process.env.MINIO_ACCESS_KEY || !process.env.MINIO_SECRET_KEY) {
	throw new Error("Missing MINIO_ENDPOINT, MINIO_ACCESS_KEY, or MINIO_SECRET_KEY environment variables.");
}

// Default bucket names from .env.example
const DEFAULT_FILES_BUCKET = "xerac-files";
const DEFAULT_FILE_THUMBNAILS_BUCKET = "xerac-files-thumbnails";

export const minioClient = new Minio.Client({
	endPoint: process.env.MINIO_ENDPOINT,
	port: 443,
	useSSL: true,
	accessKey: process.env.MINIO_ACCESS_KEY,
	secretKey: process.env.MINIO_SECRET_KEY,
});

// Make sure Minio files buckets exist
process.stdout.write("Making sure Minio files buckets exist... ");
await Promise.all(
	[
		{ env: "MINIO_FILES_BUCKET_NAME", default: DEFAULT_FILES_BUCKET },
		{ env: "MINIO_FILE_THUMBNAILS_BUCKET_NAME", default: DEFAULT_FILE_THUMBNAILS_BUCKET }
	].map(async ({ env, default: defaultValue }) => {
		const bucketName = process.env[env] || defaultValue;
		if (!(await minioClient.bucketExists(bucketName))) {
			await minioClient.makeBucket(bucketName);
		}
	}),
);
process.stdout.write("Done.\n");
