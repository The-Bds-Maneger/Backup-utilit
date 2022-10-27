import path from "node:path";
import { randomInt } from "node:crypto";
import { createBlankFile } from "../src/extendsFs";
import main from "../src/index";

describe("Backup", function() {
  this.timeout(Infinity);
  it("Sync", async () => {
    await createBlankFile(path.join(__dirname, "testCwd/test"), (randomInt(8024))*1e4);
    await (await main(path.join(__dirname, "testBackup"), path.join(__dirname, "testCwd"))).syncFolder()
  });
  it("Sync 2", async () => {
    await createBlankFile(path.join(__dirname, "testCwd/test"), (randomInt(8024))*1e2);
    await (await main(path.join(__dirname, "testBackup"), path.join(__dirname, "testCwd"))).syncFolder();
  });
  it("Export tar", async () => {
    const stream = await (await main(path.join(__dirname, "testBackup"), path.join(__dirname, "testCwd"))).exportStream("tar");
    stream.on("data", () => {});
    await new Promise(done => stream.once("end", done));
  });
  it("Export zip", async () => {
    const stream = await (await main(path.join(__dirname, "testBackup"), path.join(__dirname, "testCwd"))).exportStream("zip");
    stream.on("data", () => {});
    await new Promise(done => stream.once("end", done));
  });
});