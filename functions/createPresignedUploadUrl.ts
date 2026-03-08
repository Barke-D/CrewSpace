import * as functions from 'firebase-functions';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
        // Recommend configuring these safely in your environment variables/secrets manager
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

export const createPresignedUploadUrl = functions.https.onCall(async (data, context) => {
    // 1. Enforce Authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to upload files.');
    }

    const { fileName, contentType, size } = data;

    // 2. Validate standard inputs
    if (!fileName || !contentType || typeof size !== 'number') {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required file metadata (fileName, contentType, size).');
    }

    // 3. Limit size to 50MB
    if (size > 50 * 1024 * 1024) {
        throw new functions.https.HttpsError('out-of-range', 'File size must be 50MB or less.');
    }

    // 4. Content Type Filtering
    const isAllowedType =
        contentType.startsWith('image/') ||
        contentType.startsWith('video/') ||
        contentType.startsWith('audio/') ||
        contentType === 'application/pdf' ||
        contentType === 'application/msword' ||
        contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        contentType === 'text/plain';

    if (!isAllowedType) {
        throw new functions.https.HttpsError('invalid-argument', 'File type not allowed.');
    }

    const bucketName = process.env.S3_BUCKET;
    if (!bucketName) {
        console.error('Missing S3_BUCKET environment variable.');
        throw new functions.https.HttpsError('internal', 'Server configuration error.');
    }

    const uid = context.auth.uid;
    const timestamp = Date.now();
    const rand = Math.random().toString(36).substring(2, 8);
    // Sanitize the file name lightly
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');

    // Construct object key: uploads/{uid}/{timestamp}-{rand}-{fileName}
    const objectKey = `uploads/${uid}/${timestamp}-${rand}-${safeFileName}`;

    try {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: objectKey,
            ContentType: contentType,
        });

        // Generate Presigned URL with 60s expiration
        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

        const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN;
        // If CloudFront is specified, use it for public access. Otherwise fallback to standard S3 Object URL.
        const publicUrl = cloudfrontDomain
            ? `https://${cloudfrontDomain}/${objectKey}`
            : `https://${bucketName}.s3.${process.env.S3_REGION || 'us-east-1'}.amazonaws.com/${objectKey}`;

        return { uploadUrl, publicUrl };
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        throw new functions.https.HttpsError('internal', 'Could not generate upload URL.');
    }
});
