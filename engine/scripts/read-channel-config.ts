import fs from "node:fs";
import YAML from "yaml";
import { compileSchema } from "./ajv.ts";

const file = process.argv[2];
if (!file) {
  console.error("Usage: tsx engine/scripts/read-channel-config.ts <path-to-yml>");
  process.exit(1);
}
const parsed = YAML.parse(fs.readFileSync(file, "utf8"));
const validate = compileSchema("engine/schemas/channel-profile.schema.json");
if (!validate(parsed)) {
  console.error(`INVALID: ${file}`);
  console.error(JSON.stringify(validate.errors, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(parsed, null, 2));
