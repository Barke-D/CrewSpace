/**
 * Downloads a file from any URL (including cross-origin Cloudinary URLs)
 * by fetching it as a blob and triggering a local save dialog.
 */
export async function downloadFile(url: string, fileName: string): Promise<void> {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const anchor = document.createElement('a');
        anchor.href = blobUrl;
        anchor.download = fileName || 'download';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);

        // Release the blob URL after a short delay
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
    } catch (err) {
        console.error('❌ Download failed:', err);
        // Fallback: open in new tab so the user can save manually
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}
