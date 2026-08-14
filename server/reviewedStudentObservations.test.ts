import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const serviceScaleDbMock = vi.hoisted(() => ({
  getXerifeAssignment: vi.fn(),
  getDefaultScope: vi.fn(),
  listReviewedStudentObservations: vi.fn(),
}));

vi.mock("./serviceScaleDb", () => serviceScaleDbMock);

const { appRouter } = await import("./routers");

function createMasterContext(): TrpcContext {
  return {
    user: {
      id: 99,
      openId: "master-socrates",
      email: "socrates.lever@gmail.com",
      name: "Sócrates",
      password: "hash:123456",
      loginMethod: "email",
      role: "master",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {}, cookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("serviceScale.reviewedStudentObservations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceScaleDbMock.getXerifeAssignment.mockResolvedValue(null);
    serviceScaleDbMock.getDefaultScope.mockReturnValue({ unrestricted: true });
  });

  it("retorna registros homologados e rejeitados no escopo do comando geral", async () => {
    const reviewed = [
      { id: 15, validation_status: "approved", numerica: "4122", nome_guerra: "ALFA" },
      { id: 14, validation_status: "rejected", numerica: "4152", nome_guerra: "BRAVO" },
    ];
    serviceScaleDbMock.listReviewedStudentObservations.mockResolvedValue(reviewed);

    const caller = appRouter.createCaller(createMasterContext());
    await expect(caller.serviceScale.reviewedStudentObservations({})).resolves.toEqual(reviewed);
    expect(serviceScaleDbMock.listReviewedStudentObservations).toHaveBeenCalledWith({ companhia: undefined, peloton: undefined });
  });
});
