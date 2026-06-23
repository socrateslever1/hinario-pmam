import dotenv from "dotenv";
dotenv.config();

async function test() {
  try {
    const studentDb = await import("../server/studentDb.ts");
    
    // Test a student with custom password (4122)
    console.log("Testing student 4122 with 'novasenhateste123'...");
    const isCustomValid = await studentDb.verifyStudentPassword("4122", "novasenhateste123");
    console.log("Student 4122 Custom Login:", isCustomValid ? "SUCCESS" : "FAILED");

    // Test a student with default 'temp' password (1101)
    console.log("Testing student 1101 with 'temp'...");
    const isTempValid = await studentDb.verifyStudentPassword("1101", "temp");
    console.log("Student 1101 Temp Login:", isTempValid ? "SUCCESS" : "FAILED");
    
  } catch (error) {
    console.error("Error during test:", error);
  } finally {
    process.exit(0);
  }
}

test();
