import fs from "fs";

let lines = fs.readFileSync("server/studentRouter.ts", "utf8").split("\n");

// We want to remove lines 450 to 480 (index 449 to 479)
// and replace them with "  updateProfile: publicProcedure"

lines.splice(449, 31, "  updateProfile: publicProcedure\r");

fs.writeFileSync("server/studentRouter.ts", lines.join("\n"));
console.log("Fixed!");
