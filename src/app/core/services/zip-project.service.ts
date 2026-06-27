import { Injectable } from '@angular/core';
import JSZip from 'jszip';
import { ProjectFile } from '../models/architecture.models';

const ACCEPTED = ['.ts', '.html', '.scss', '.css', '.json'];
const IGNORED = ['node_modules/', 'dist/', 'coverage/', '.angular/', '.git/'];

@Injectable({ providedIn: 'root' })
export class ZipProjectService {
  async read(file: File, onProgress?: (progress: number) => void): Promise<ProjectFile[]> {
    const zip = await JSZip.loadAsync(file);
    const entries = Object.values(zip.files).filter((entry) => {
      const path = entry.name.replaceAll('\\', '/');
      return !entry.dir && ACCEPTED.some((extension) => path.endsWith(extension)) && !IGNORED.some((segment) => path.includes(segment));
    });
    const files: ProjectFile[] = [];
    for (const [index, entry] of entries.entries()) {
      const content = await entry.async('string');
      files.push({ path: entry.name, name: entry.name.split('/').at(-1) ?? entry.name, extension: `.${entry.name.split('.').at(-1)}`, content, size: new Blob([content]).size });
      onProgress?.(Math.round(((index + 1) / Math.max(entries.length, 1)) * 100));
    }
    return files;
  }
}
