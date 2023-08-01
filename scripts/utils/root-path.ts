import { join } from 'path';
export const rootDirectory = join(__dirname, '../');

export function getPathFromRoot(path: string) {
  return join(rootDirectory, path);
}
