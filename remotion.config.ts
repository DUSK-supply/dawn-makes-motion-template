// Remotion CLI reads this from the repo root; the app itself lives in engine/remotion/.
import { Config } from "@remotion/cli/config";

Config.setEntryPoint("engine/remotion/index.ts");
Config.setOutputLocation("output/");
