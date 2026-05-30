import { checkServerEnv } from "../src/server/env";

const result = checkServerEnv();

if (!result.ok) {
  console.error("Environment check failed:");
  for (const error of result.errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log("Environment check passed:");
  for (const [key, value] of Object.entries(result.values)) {
    console.log(`- ${key}: ${value}`);
  }
}
