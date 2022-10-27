import fs from "node:fs/promises";
import { createReadStream, createWriteStream } from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import tar from "tar";
import admZip from "adm-zip";
import { exists, readdir } from "./extendsFs";

export default async function Maneger(pathRoot: string, cwd: string) {
  if (!await exists(pathRoot)) await fs.mkdir(path.resolve(pathRoot), {recursive: true});
  if (!await exists(cwd)) await fs.mkdir(path.resolve(cwd), {recursive: true});
  return new diffManeger(cwd, pathRoot);
}

export class diffManeger {
  private rootFolder: string;

  async exportStream(fileType: "zip"|"tar" = "tar", id: string = "default") {
    const tmpFile = path.join(os.tmpdir(), "backupUtil_"+crypto.randomBytes(16).toString("hex"));
    if (!await exists(path.join(this.rootFolder, id||"default"))) throw new Error("ID not exists, you are init folder?");
    const files = await readdir(path.join(this.rootFolder, id||"default"), {returnStats: true});
    if (fileType === "zip") {
      const zip = new admZip();
      files.map(file => file.info.type === "file"?zip.addLocalFile(file.fullPath, file.path):zip.addLocalFolder(file.fullPath, file.path));
      await zip.writeZipPromise(tmpFile, {overwrite: true});
    } else {
      const tarCompress = tar.create({noDirRecurse: true, cwd: path.join(this.rootFolder, id||"default")}, files.filter(({info}) => info?.type === "file").map(({realPath}) => realPath));
      const tarFile = createWriteStream(tmpFile);
      tarCompress.pipe(tarFile);
      await new Promise<void>((done, reject) => {
        tarCompress.on("error", reject);
        tarFile.on("error", reject);
        tarCompress.once("end", () => tarFile.once("finish", done));
      });
    }
    return createReadStream(tmpFile);
  }

  private cwd: string;
  async syncFolder(){
    const defaultFolder = path.join(this.rootFolder, "default"), id = crypto.randomBytes(16).toString("hex");
    if (await exists(defaultFolder)) await fs.unlink(defaultFolder);
    const folder = path.join(this.rootFolder, id);
    await fs.mkdir(folder, {recursive: true});
    await fs.symlink(id, defaultFolder);
    await Promise.all((await readdir(this.cwd, {returnStats: true})).filter(({info}) => info.type === "file").map(async data => fs.copyFile(data.realPath, path.join(folder, data.path))));
    return id;
  }

  constructor(cwd: string, root: string) {this.cwd = cwd;this.rootFolder = root;}
}