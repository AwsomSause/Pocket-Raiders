// Browser file helpers for save export and import.

import { fitSize } from '../core/tools/fanArt';

export function downloadText(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function pickTextFile(onText: (text: string) => void, accept = '.json,application/json'): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
  input.onchange = () => {
    const file = input.files?.[0];
    if (file) void file.text().then(onText);
  };
  input.click();
}

/** Fan Art Frame: asks for an image file, shrinks it to a small JPEG (core/tools/fanArt.ts) and hands back the data URL. */
export function pickPosterImage(onImage: (dataUrl: string, name: string) => void, onError: (message: string) => void): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/png,image/jpeg,image/webp,image/gif';
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    void createImageBitmap(file)
      .then((bmp) => {
        const { w, h } = fitSize(bmp.width, bmp.height);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const g = canvas.getContext('2d');
        if (!g) return onError('This browser cannot shrink images.');
        g.fillStyle = '#ffffff';
        g.fillRect(0, 0, w, h);
        g.drawImage(bmp, 0, 0, w, h);
        onImage(canvas.toDataURL('image/jpeg', 0.8), file.name.replace(/\.[^.]+$/, ''));
      })
      .catch(() => onError('That file is not an image this browser can read.'));
  };
  input.click();
}
