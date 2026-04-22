import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { pmamDrill } from "../drizzle/schema";

describe("Drill CRUD Operations", () => {
  let testDrillId: number;

  beforeAll(async () => {
    // Clean up test data before running tests
    await db.deleteDrill(testDrillId).catch(() => {});
  });

  afterAll(async () => {
    // Clean up test data after running tests
    if (testDrillId) {
      await db.deleteDrill(testDrillId).catch(() => {});
    }
  });

  it("should create a new drill", async () => {
    const drillData = {
      title: "Test Drill - Formação Básica",
      subtitle: "Teste de Formação",
      description: "Descrição de teste",
      category: "Formação",
      difficulty: "basico" as const,
      duration: 30,
      videoUrl: "https://example.com/video.mp4",
      pdfUrl: "https://example.com/material.pdf",
      imageUrl: "https://example.com/image.jpg",
      content: "Conteúdo de teste",
      instructor: "Instrutor Teste",
      prerequisites: "Nenhum",
      learningOutcomes: "Aprender o básico",
      authorId: 1,
    };

    const result = await db.createDrill(drillData);
    expect(result).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    testDrillId = result.id;
  });

  it("should retrieve a drill by ID", async () => {
    if (!testDrillId) {
      throw new Error("No test drill ID available");
    }

    const drill = await db.getDrillById(testDrillId);
    expect(drill).toBeDefined();
    expect(drill?.title).toBe("Test Drill - Formação Básica");
    expect(drill?.category).toBe("Formação");
  });

  it("should update a drill", async () => {
    if (!testDrillId) {
      throw new Error("No test drill ID available");
    }

    const updateData = {
      title: "Test Drill - Updated",
      difficulty: "intermediario" as const,
      duration: 45,
    };

    await db.updateDrill(testDrillId, updateData);
    const updatedDrill = await db.getDrillById(testDrillId);
    
    expect(updatedDrill?.title).toBe("Test Drill - Updated");
    expect(updatedDrill?.difficulty).toBe("intermediario");
    expect(updatedDrill?.duration).toBe(45);
  });

  it("should get all active drills", async () => {
    const drills = await db.getActiveDrill();
    expect(Array.isArray(drills)).toBe(true);
    // At least the test drill should be there
    const testDrill = drills.find((d: any) => d.id === testDrillId);
    expect(testDrill).toBeDefined();
  });

  it("should get drills by category", async () => {
    const drills = await db.getDrillByCategory("Formação");
    expect(Array.isArray(drills)).toBe(true);
    // The test drill should be in the results
    const testDrill = drills.find((d: any) => d.id === testDrillId);
    expect(testDrill).toBeDefined();
  });

  it("should delete a drill", async () => {
    if (!testDrillId) {
      throw new Error("No test drill ID available");
    }

    await db.deleteDrill(testDrillId);
    const deletedDrill = await db.getDrillById(testDrillId);
    
    // Drill should be soft-deleted (isActive = false) or removed
    expect(deletedDrill?.isActive).toBe(false);
  });
});
