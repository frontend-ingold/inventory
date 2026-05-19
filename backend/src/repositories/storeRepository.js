import fs from "fs/promises";

export class StoreRepository {
  constructor(dataFileUrl) {
    this.dataFileUrl = dataFileUrl;
  }

  async read() {
    const content = await fs.readFile(this.dataFileUrl, "utf-8");
    return JSON.parse(content);
  }

  async write(data) {
    await fs.writeFile(this.dataFileUrl, JSON.stringify(data, null, 2));
    return data;
  }
}
