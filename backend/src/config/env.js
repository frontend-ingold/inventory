export const env = {
  port: process.env.PORT || 5000,
  dataFile: process.env.DATA_FILE || new URL("../data/store.json", import.meta.url)
};
