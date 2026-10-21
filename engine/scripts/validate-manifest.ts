import fs from "node:fs";
import { compileSchema } from "./ajv.ts";

const [schemaPath, dataPath] = process.argv.slice(2);
if (!schemaPath || !dataPath) {
  console.error("Usage: tsx engine/scripts/validate-manifest.ts <schema> <data>");
  process.exit(1);
}
const validate = compileSchema(schemaPath);
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
if (validate(data)) {
  console.log(`VALID: ${dataPath}`);
} else {
  console.error(`INVALID: ${dataPath}`);
  console.error(JSON.stringify(validate.errors, null, 2));
  process.exit(1);
}
