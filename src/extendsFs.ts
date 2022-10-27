import fs from "node:fs/promises";
import path from "node:path";

/**
 * Same if existSync in promise function
 * @param filePath - relative or full file or folder path
 */
export async function exists(filePath: string): Promise<boolean> {
  return fs.access(path.resolve(filePath)).then(() => true).catch(() => false);
}

export type fileRecursive = {
  path: string,
  fullPath: string,
  realPath: string
  info?: {type: "file"|"directory"|"link"|"another"}
};

export async function readdir(folderPath: string, options?: {returnStats?: boolean}) {
  const files: fileRecursive[] = [];
  async function readdirAndResolve(folder: string, extraPath?: string): Promise<any> {
    return Promise.all((await fs.readdir(folder)).map(async ff => {
      const correctPath = path.resolve(folderPath, folder, ff);
      const relative = path.join(extraPath||"", ff);
      const realPath = await fs.realpath(correctPath, "utf8");
      return fs.lstat(correctPath).then(async info => {
        const data: fileRecursive = {fullPath: correctPath, path: relative, realPath};
        if (options?.returnStats) data.info = {type: info.isFile()?"file":info.isDirectory()?"directory":info.isSymbolicLink()?"link":"another"};
        files.push(data);
        if (info.isDirectory()) return readdirAndResolve(correctPath, relative).catch(() => {});
        return null;
      }).catch(() => {});
    }));
  }
  return readdirAndResolve(path.resolve(folderPath)).catch(() => {}).then(() => files);
}

/**
 * Create blanks files same if `dd count=${size:-1024} if=/dev/zero of=${file:-/tmp/blankFile}`
 * @param filePath - File path
 * @param size - File in bites. default: 1
 */
export async function createBlankFile(filePath: string, size: number = 1) {
  return fs.open(filePath, "w").then(fh => fh.write("ok", Math.max(0, size - 2)).then(() => fh.close()));
}