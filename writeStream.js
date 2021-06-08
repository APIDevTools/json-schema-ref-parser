const $RefParser = require("./lib");
const path = require("path");
const fs = require("fs");

async function getFile(filePath) {
  const resolvedPath = path.resolve(process.cwd(), filePath);

  const parser = new $RefParser();
  return await parser.dereference(resolvedPath);
}

// const schemaPath = "test/specs/external-external/external-from-external.yaml";
const schemaPath = "testSchema.json";

async function writeFile(schema) {
  const writeStream = fs.createWriteStream("schema.json");
  await writeStream.write(JSON.stringify(schema), "utf8");
  writeStream.end();
}

async function doStuff() {
  const schema = await getFile(schemaPath);
  await writeFile(schema);
  console.log("Schema written!");
}

doStuff();
