import * as fs from 'fs/promises';

export async function safeReadJson<T = unknown>(
  file: string,
): Promise<T | undefined> {
  try {
    const val = await fs.readFile(file);
    return JSON.parse(val.toString('utf-8')) as T;
  } catch (ex) {
    console.error('Cannot read JSON file', file);
  }
}
