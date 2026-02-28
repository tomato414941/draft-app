import { Draft, TargetSns } from "../types";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

interface CreateDraftFromImageOptions {
  imageUri: string;
  mimeType: string;
  targetSns: TargetSns;
}

interface CreateDraftFromTextOptions {
  sourceText: string;
  targetSns: TargetSns;
}

interface CreateDraftFromUrlOptions {
  sourceUrl: string;
  targetSns: TargetSns;
}

export async function createDraftFromImage({
  imageUri,
  mimeType,
  targetSns,
}: CreateDraftFromImageOptions): Promise<Draft> {
  const formData = new FormData();

  const filename = imageUri.split("/").pop() || "image.jpg";

  formData.append("image", {
    uri: imageUri,
    type: mimeType,
    name: filename,
  } as unknown as Blob);
  formData.append("sourceType", "image");
  formData.append("targetSns", targetSns);

  const response = await fetch(`${API_BASE_URL}/api/drafts`, {
    method: "POST",
    body: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create draft");
  }

  const data = await response.json();
  return data.draft;
}

export async function createDraftFromText({
  sourceText,
  targetSns,
}: CreateDraftFromTextOptions): Promise<Draft> {
  const response = await fetch(`${API_BASE_URL}/api/drafts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sourceType: "text",
      sourceText,
      targetSns,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create draft");
  }

  const data = await response.json();
  return data.draft;
}

export async function createDraftFromUrl({
  sourceUrl,
  targetSns,
}: CreateDraftFromUrlOptions): Promise<Draft> {
  const response = await fetch(`${API_BASE_URL}/api/drafts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sourceType: "url",
      sourceUrl,
      targetSns,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create draft");
  }

  const data = await response.json();
  return data.draft;
}

// Backward compatible function
export async function createDraft(
  imageUri: string,
  mimeType: string
): Promise<Draft> {
  return createDraftFromImage({ imageUri, mimeType, targetSns: "x" });
}

export async function getDrafts(): Promise<Draft[]> {
  const response = await fetch(`${API_BASE_URL}/api/drafts`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch drafts");
  }

  const data = await response.json();
  return data.drafts;
}

export async function updateDraft(id: string, content: string): Promise<Draft> {
  const response = await fetch(`${API_BASE_URL}/api/drafts/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update draft");
  }

  const data = await response.json();
  return data.draft;
}

export async function deleteDraft(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/drafts/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete draft");
  }
}
