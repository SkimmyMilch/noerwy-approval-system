import { DocumentData } from '../types';

const BACKEND = 'https://script.google.com/macros/s/AKfycbwGE-zt8IyvuT4Z_tUbEf2pwogn3lolHYrBbTvuflbCSB6u4QBLrtOK8tcD48Wf-C0QMQ/exec';

export async function loadDocuments(): Promise<DocumentData[]> {
  try {
    const res = await fetch(`${BACKEND}?action=loadDocuments`, { redirect: 'follow' });
    const text = await res.text();
    const data = JSON.parse(text);
    if (data.error) throw new Error(data.error);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('Failed to load documents:', e);
    return [];
  }
}

export async function submitDocument(payload: Partial<DocumentData>): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const res = await fetch(BACKEND, {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify({ action: 'submitDocument', ...payload }),
    });
    const text = await res.text();
    const data = JSON.parse(text);
    if (data.error) throw new Error(data.error);
    return data;
  } catch (e: any) {
    console.error('Failed to submit:', e);
    return { success: false, error: e.message };
  }
}

export async function decide(docId: string, approverKey: 'a1' | 'a2', decision: 'approved' | 'rejected', comment: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(BACKEND, {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify({ action: 'decide', docId, approverKey, decision, comment }),
    });
    const text = await res.text();
    const data = JSON.parse(text);
    if (data.error) throw new Error(data.error);
    return data;
  } catch (e: any) {
    console.error('Failed to decide:', e);
    return { success: false, error: e.message };
  }
}

export async function sendReminder(docId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(BACKEND, {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify({ action: 'sendReminder', docId }),
    });
    const text = await res.text();
    const data = JSON.parse(text);
    if (data.error) throw new Error(data.error);
    return data;
  } catch (e: any) {
    console.error('Failed to send reminder:', e);
    return { success: false, error: e.message };
  }
}

export async function uploadFile(file: File): Promise<{ driveId: string | null; filename: string }> {
  try {
    const mimeType = file.type || 'application/octet-stream';
    const filename = file.name;

    // Get upload token
    const tokenRes = await fetch(BACKEND, {
      method: 'POST',
      body: JSON.stringify({ action: 'getUploadToken', filename, mimeType }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error);

    const { token, folderId } = tokenData;

    // Direct upload to Drive API
    const metadata = JSON.stringify({
      name: filename,
      mimeType,
      parents: [folderId],
    });

    const boundary = 'naf_upload_boundary';
    const fileBuffer = await file.arrayBuffer();

    const metaPart = `--${boundary}\r\nContent-Type: application/json\r\n\r\n${metadata}\r\n`;
    const filePartHeader = `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`;
    const endPart = `\r\n--${boundary}--`;

    const body = new Blob([
      metaPart,
      filePartHeader,
      fileBuffer,
      endPart
    ]);

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Drive API error: ${uploadRes.status} - ${errText}`);
    }

    const uploadData = await uploadRes.json();
    const fileId = uploadData.id;

    // Finalize upload
    const finalRes = await fetch(BACKEND, {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify({ action: 'finalizeUpload', fileId, filename }),
    });
    const finalData = await finalRes.json();
    if (finalData.error) throw new Error(finalData.error);

    return { driveId: finalData.driveId, filename: finalData.filename };
  } catch (e: any) {
    console.warn('Upload failed:', e.message);
    // Base64 fallback for small files
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        try {
          const res = await fetch(BACKEND, {
            method: 'POST',
            redirect: 'follow',
            body: JSON.stringify({
              action: 'uploadFile',
              base64,
              filename: file.name,
              mimeType: file.type || 'application/octet-stream'
            }),
          });
          const d = await res.json();
          if (d.error) throw new Error(d.error);
          resolve({ driveId: d.driveId, filename: d.filename });
        } catch (err) {
          resolve({ driveId: null, filename: file.name });
        }
      };
      reader.readAsDataURL(file);
    });
  }
}
