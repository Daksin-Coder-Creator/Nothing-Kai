import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, displayName?: string, photoURL?: string) {
  try {
    if (!db) {
      return { uid, email, displayName, photoURL, createdAt: new Date() };
    }
    const result = await db.insert(users)
      .values({
        uid,
        email,
        displayName,
        photoURL,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName,
          photoURL,
        },
      })
      .returning();

    return result[0];
  } catch (error: any) {
    console.warn("Cloud SQL / Drizzle unavailable or sync failed, using fallback user profile:", error?.message || error);
    return { uid, email, displayName, photoURL, createdAt: new Date() };
  }
}
