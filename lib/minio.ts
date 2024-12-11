import * as Minio from "minio";

if (!process.env.MINIO_ENDPOINT || !process.env.MINIO_ACCESS_KEY || !process.env.MINIO_SECRET_KEY || !process.env.MINIO_FILES_BUCKET_NAME || !process.env.MINIO_FILE_THUMBNAILS_BUCKET_NAME) {
	throw new Error("Missing MINIO_ENDPOINT, MINIO_ACCESS_KEY, or MINIO_SECRET_KEY environment variables.");
}

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
	["MINIO_FILES_BUCKET_NAME", "MINIO_FILE_THUMBNAILS_BUCKET_NAME"].map(async (bucketConfigName) => {
		const bucketName = process.env[bucketConfigName] as string;
		if (!(await minioClient.bucketExists(bucketName))) {
			await minioClient.makeBucket(bucketName);
		}
	}),
);
process.stdout.write("Done.\n");
