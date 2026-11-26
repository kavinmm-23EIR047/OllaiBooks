import { Injectable } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, resolve, sep } from 'path';

@Injectable()
export class PrivateFileStorageService {
  private readonly root = resolve(process.env.PRIVATE_STORAGE_PATH || './private-storage');

  async put(key: string, content: Buffer | string) {
    const path = this.resolveKey(key);
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    await writeFile(path, content, { mode: 0o600 });
    return key;
  }

  async get(key: string) {
    return readFile(this.resolveKey(key));
  }

  private resolveKey(key: string) {
    if (!key || key.includes('..') || key.includes('\\') || key.startsWith('/')) throw new Error('Invalid private storage key');
    const path = resolve(this.root, key);
    if (!path.startsWith(`${this.root}${sep}`)) throw new Error('Invalid private storage key');
    return path;
  }
}
