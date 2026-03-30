import { eq, and, sql, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, hymns, InsertHymn, cfapMissions, InsertCfapMission, siteSettings, comments, likes } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      // Only set admin role for initial insert, NOT for updates
      values.role = 'admin';
      // Do NOT add role to updateSet - preserve existing role in DB
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== HYMNS =====
export async function getAllHymns() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hymns).orderBy(asc(hymns.number));
}

export async function getActiveHymns() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hymns).where(eq(hymns.isActive, true)).orderBy(asc(hymns.number));
}

export async function getHymnById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(hymns).where(eq(hymns.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getHymnByNumber(number: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(hymns).where(eq(hymns.number, number)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getHymnsByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hymns).where(eq(hymns.category, category as any)).orderBy(asc(hymns.number));
}

export async function createHymn(hymn: InsertHymn) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(hymns).values(hymn);
}

export async function updateHymn(id: number, data: Partial<InsertHymn>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(hymns).set(data).where(eq(hymns.id, id));
}

export async function deleteHymn(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(hymns).where(eq(hymns.id, id));
}

// ===== MISSIONS =====
export async function getAllMissions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cfapMissions).orderBy(desc(cfapMissions.createdAt));
}

export async function getActiveMissions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cfapMissions).where(eq(cfapMissions.isActive, true)).orderBy(desc(cfapMissions.createdAt));
}

export async function getMissionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(cfapMissions).where(eq(cfapMissions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createMission(mission: InsertCfapMission) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(cfapMissions).values(mission);
  return result;
}

export async function updateMission(id: number, data: Partial<InsertCfapMission>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(cfapMissions).set(data).where(eq(cfapMissions.id, id));
}

export async function deleteMission(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(cfapMissions).where(eq(cfapMissions.id, id));
}

// ===== SITE SETTINGS =====
export async function getSetting(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, key)).limit(1);
  return result.length > 0 ? result[0]?.settingValue : undefined;
}

export async function upsertSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(siteSettings).values({ settingKey: key, settingValue: value })
    .onDuplicateKeyUpdate({ set: { settingValue: value } });
}

// ===== AUTH EMAIL/SENHA =====
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserWithPassword(data: { name: string; email: string; password: string; role: 'user' | 'admin' | 'master' }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const openId = `email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email,
    password: data.password,
    loginMethod: 'email',
    role: data.role,
  });
  return getUserByEmail(data.email);
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    loginMethod: users.loginMethod,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn,
  }).from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(id: number, role: 'user' | 'admin' | 'master') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, id));
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(users).where(eq(users.id, id));
}

export async function updateUserPassword(id: number, password: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ password }).where(eq(users.id, id));
}

// ===== STATS =====
export async function getStats() {
  const db = await getDb();
  if (!db) return { totalHymns: 0, totalMissions: 0, totalUsers: 0 };
  const [hymnCount] = await db.select({ count: sql<number>`count(*)` }).from(hymns);
  const [missionCount] = await db.select({ count: sql<number>`count(*)` }).from(cfapMissions);
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  return {
    totalHymns: hymnCount?.count ?? 0,
    totalMissions: missionCount?.count ?? 0,
    totalUsers: userCount?.count ?? 0,
  };
}

// ===== LIKES =====
export async function addLike(targetType: 'hymn' | 'mission', targetId: number, visitorId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if already liked
  const existing = await db.select().from(likes)
    .where(and(
      eq(likes.targetType, targetType),
      eq(likes.targetId, targetId),
      eq(likes.visitorId, visitorId)
    )).limit(1);
  
  if (existing.length > 0) {
    return; // Already liked
  }
  
  // Add like and increment counter
  await db.insert(likes).values({ targetType, targetId, visitorId });
  
  if (targetType === 'hymn') {
    await db.update(hymns).set({ likesCount: sql`likesCount + 1` }).where(eq(hymns.id, targetId));
  } else {
    await db.update(cfapMissions).set({ likesCount: sql`likesCount + 1` }).where(eq(cfapMissions.id, targetId));
  }
}

export async function removeLike(targetType: 'hymn' | 'mission', targetId: number, visitorId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(likes).where(and(
    eq(likes.targetType, targetType),
    eq(likes.targetId, targetId),
    eq(likes.visitorId, visitorId)
  ));
  
  if (targetType === 'hymn') {
    await db.update(hymns).set({ likesCount: sql`GREATEST(likesCount - 1, 0)` }).where(eq(hymns.id, targetId));
  } else {
    await db.update(cfapMissions).set({ likesCount: sql`GREATEST(likesCount - 1, 0)` }).where(eq(cfapMissions.id, targetId));
  }
}

export async function hasLiked(targetType: 'hymn' | 'mission', targetId: number, visitorId: string) {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.select().from(likes)
    .where(and(
      eq(likes.targetType, targetType),
      eq(likes.targetId, targetId),
      eq(likes.visitorId, visitorId)
    )).limit(1);
  
  return result.length > 0;
}

// ===== COMMENTS =====
export async function addComment(targetType: 'hymn' | 'mission', targetId: number, authorName: string, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(comments).values({ targetType, targetId, authorName, content });
}

export async function getComments(targetType: 'hymn' | 'mission', targetId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(comments)
    .where(and(
      eq(comments.targetType, targetType),
      eq(comments.targetId, targetId)
    ))
    .orderBy(desc(comments.createdAt));
}

export async function deleteComment(commentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(comments).where(eq(comments.id, commentId));
}

// ===== MISSION STATUS & DATES =====
export async function updateMissionStatus(id: number, status: 'ativa' | 'cumprida' | 'inativa', dueDate?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (dueDate) {
    await db.update(cfapMissions).set({ status, dueDate: dueDate as any }).where(eq(cfapMissions.id, id));
  } else {
    await db.update(cfapMissions).set({ status }).where(eq(cfapMissions.id, id));
  }
}

// ===== VIEWS =====
export async function incrementViews(targetType: 'hymn' | 'mission', targetId: number) {
  const db = await getDb();
  if (!db) return;
  
  if (targetType === 'hymn') {
    await db.update(hymns).set({ viewsCount: sql`viewsCount + 1` }).where(eq(hymns.id, targetId));
  } else {
    await db.update(cfapMissions).set({ viewsCount: sql`viewsCount + 1` }).where(eq(cfapMissions.id, targetId));
  }
}
