import fs from "fs";

let lines = fs.readFileSync("server/studentRouter.ts", "utf8").split("\n");

// delete lines 448 to 507 (indices 447 to 506)
lines.splice(447, 60);

fs.writeFileSync("server/studentRouter.ts", lines.join("\n"));
console.log("Deleted duplicated updateProfile!");
