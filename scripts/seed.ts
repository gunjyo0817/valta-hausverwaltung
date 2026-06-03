import { reloadDemoData } from "../src/server/demoData";

reloadDemoData()
  .then((result) => {
    console.log("Seeded Neon with current Valta demo data.");
    console.log("Mutable rows:", result.after.mutableTotal);
    console.log("Identity rows:", result.after.identityTotal);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
