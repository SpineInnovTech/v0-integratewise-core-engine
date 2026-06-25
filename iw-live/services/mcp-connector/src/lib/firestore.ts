export interface FirestoreDocument {
  name?: string;
  fields: Record<string, any>;
  createTime?: string;
  updateTime?: string;
}

export function toFirestoreValue(value: any): any {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return { doubleValue: value };
  if (typeof value === "string") return { stringValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (typeof value === "object") {
    if (value instanceof Date) return { timestampValue: value.toISOString() };
    return {
      mapValue: {
        fields: Object.entries(value).reduce(
          (acc, [k, v]) => ({ ...acc, [k]: toFirestoreValue(v) }),
          {}
        ),
      },
    };
  }
  return { stringValue: String(value) };
}

export async function writeFirestoreDocument(
  projectId: string,
  collectionPath: string,
  documentId: string,
  data: Record<string, any>
): Promise<void> {
  const fields = Object.entries(data).reduce(
    (acc, [k, v]) => {
      acc[k] = toFirestoreValue(v);
      return acc;
    },
    {} as Record<string, any>
  );

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionPath}?documentId=${documentId}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Firestore write failed: ${response.status} ${response.statusText} - ${errorBody}`
    );
  }
}

// For updates (PATCH)
export async function updateFirestoreDocument(
  projectId: string,
  documentPath: string,
  data: Record<string, any>,
  updateMask?: string[]
): Promise<void> {
  const fields = Object.entries(data).reduce(
    (acc, [k, v]) => {
      acc[k] = toFirestoreValue(v);
      return acc;
    },
    {} as Record<string, any>
  );

  let url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${documentPath}`;
  if (updateMask && updateMask.length > 0) {
    url += `?updateMask.fieldPaths=${updateMask.join("&updateMask.fieldPaths=")}`;
  }

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Firestore update failed: ${response.status} ${response.statusText} - ${errorBody}`
    );
  }
}
