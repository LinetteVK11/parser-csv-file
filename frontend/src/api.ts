const API_URL = "http://localhost:3000/api";

export async function getRecords(page: number, search: string) {
  const params = new URLSearchParams({
    page: String(page),
    limit: "20",
    search
  });

  const response = await fetch(`${API_URL}/records?${params}`);

  if (!response.ok) {
    throw new Error("Failed to load records");
  }

  return response.json();
}

export function uploadCsv(file: File, onProgress: (progress: number) => void) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/upload`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          reject(new Error(data.message || "Upload failed"));
        }
      } catch {
        reject(new Error("Invalid server response"));
      }
    };

    xhr.onerror = () => reject(new Error("Network error"));

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}

export async function resolveConflict(
  id: number,
  resolution: "keep-old" | "keep-new",
  record: CsvRecord
) {
  const response = await fetch(`${API_URL}/conflicts/${id}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resolution, record })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to resolve conflict");
  }

  return response.json();
}