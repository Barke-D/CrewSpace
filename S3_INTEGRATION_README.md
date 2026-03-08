# S3 Upload Integration Guide

This application has been updated to bypass Firebase Storage and upload files directly to an AWS S3 bucket using short-lived Presigned URLs.

## Requirements & Environment Variables

Make sure your Cloud Function running `createPresignedUploadUrl` is supplied with the following environment variables (using Firebase Secrets/Config):
- `AWS_ACCESS_KEY_ID`: Your AWS access key.
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key.
- `S3_BUCKET`: The name of the S3 bucket to store uploads.
- `S3_REGION`: The region your bucket is hosted in (e.g. `us-east-1`).
- `CLOUDFRONT_DOMAIN` (Optional): If you have a CloudFront CDN set up for the bucket, specify it here (e.g. `d1234abcd.cloudfront.net`).


## 1. AWS S3 CORS Configuration
Since the frontend web app needs to `PUT` directly to S3 via fetch/XHR, you must allow CORS on the bucket. 
Go to AWS S3 > Your Bucket > Permissions > CORS configuration and paste this exactly:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "POST", "HEAD"],
    "AllowedOrigins": ["https://YOUR_APP_DOMAIN_HERE"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```
*(Optionally change AllowedOrigins to `*` for local testing `http://localhost:3000`)*

## 2. Minimal IAM Policy for Cloud Function
We recommend creating an IAM user exclusively for this Firebase Cloud Function. It only needs permission to `s3:PutObject` (for creating presigned URLs) and optionally `s3:GetObject` (if you need server-side retrieval later) on the `uploads/*` directory.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": ["arn:aws:s3:::YOUR_BUCKET_NAME/uploads/*"]
    }
  ]
}
```

## 3. Manual Testing Steps
1. Make sure you set the env vars described above and deploy the `createPresignedUploadUrl` Firebase function.
2. Sign in to your Crewspace frontend.
3. Open a Project and go to the **Chat & Files** section.
4. Attach an image or PDF file (under 50MB) and hit upload/send. Ensure the native progress bar moves.
5. In the browser DevTools "Network" tab, verify a clean `200 OK` on the `PUT` request targeting your AWS S3 bucket.
6. Verify the file renders correctly in the chat using the returned S3/CloudFront URL instead of `firebasestorage.googleapis.com`.
7. Repeat the same test by adding a file under the **Tasks** section as a task submission. Ensure the submission appears flawlessly.
