import crypto from "crypto";

const ALLOWED_FORMATS = "jpg,jpeg,png,webp,heic,avif";

function getConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  return { cloudName, apiKey, apiSecret };
}

function sign(params: Record<string, string>, apiSecret: string) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(payload + apiSecret)
    .digest("hex");
}

export function uploadsEnabled() {
  return getConfig() !== null;
}

export function closetFolder(closetId: number) {
  return `mothball/closet-${closetId}`;
}

export function createUploadSignature(closetId: number) {
  const config = getConfig();

  if (!config) {
    return null;
  }

  const params = {
    allowed_formats: ALLOWED_FORMATS,
    folder: closetFolder(closetId),
    timestamp: String(Math.floor(Date.now() / 1000)),
  };

  return {
    ...params,
    signature: sign(params, config.apiSecret),
    apiKey: config.apiKey,
    cloudName: config.cloudName,
  };
}

export function isClosetImage(
  closetId: number,
  imageUrl: string,
  imagePublicId: string,
) {
  const config = getConfig();

  if (!config) {
    return false;
  }

  const folder = `${closetFolder(closetId)}/`;
  const urlPrefix = `https://res.cloudinary.com/${config.cloudName}/image/upload/`;

  return (
    imageUrl.startsWith(urlPrefix) &&
    imagePublicId.startsWith(folder) &&
    /^[\w/-]+$/.test(imagePublicId) &&
    imageUrl.includes(`/${imagePublicId}.`)
  );
}

export async function deleteImage(publicId: string | null | undefined) {
  const config = getConfig();

  if (!config || !publicId) {
    return;
  }

  const params = {
    public_id: publicId,
    timestamp: String(Math.floor(Date.now() / 1000)),
  };

  const body = new URLSearchParams({
    ...params,
    api_key: config.apiKey,
    signature: sign(params, config.apiSecret),
  });

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`,
      { method: "POST", body },
    );

    if (!res.ok) {
      console.error("Cloudinary delete failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Cloudinary delete failed:", err);
  }
}

export function deleteImages(publicIds: (string | null | undefined)[]) {
  for (const id of publicIds) {
    void deleteImage(id);
  }
}
