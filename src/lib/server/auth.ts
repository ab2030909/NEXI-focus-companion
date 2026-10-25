import crypto from "crypto";
import fs from "fs";
import path from "path";
import { AuthUser, UserProfile, Workspace } from "@/types";

interface StoredUser {
  id: string;
  email: string;
  googleId?: string;
  passwordHash?: string;
  salt?: string;
  profile: UserProfile;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onboardingCompleted: boolean;
  isFirstTimeUser?: boolean;
  createdAt: string;
}

interface StoredSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

const DEFAULT_DEMO_WORKSPACES: Workspace[] = [
  {
    id: "ws-vectorsearch",
    name: "VectorSearch DevRel",
    slug: "vectorsearch-devrel",
    description: "Official developer relations workspace for VectorSearch WASM engine.",
    type: "organization",
    websiteUrl: "https://vectorsearch.dev",
    docUrl: "https://docs.vectorsearch.dev",
    isDemo: true,
    createdAt: "2026-10-01T00:00:00Z",
    members: [
      { name: "Alex Rivera", email: "alex@devrelos.com", role: "Owner" },
      { name: "Sarah Chen", email: "sarah@vectorsearch.dev", role: "Admin" },
    ],
  },
  {
    id: "ws-supabase",
    name: "Supabase Community",
    slug: "supabase-community",
    description: "Open source community engagement and hackathon sprint workspace.",
    type: "organization",
    websiteUrl: "https://supabase.com",
    docUrl: "https://supabase.com/docs",
    isDemo: true,
    createdAt: "2026-10-05T00:00:00Z",
    members: [
      { name: "Alex Rivera", email: "alex@devrelos.com", role: "Editor" },
    ],
  },
];

function getUsers(): StoredUser[] {
  ensureDirectory();
  if (!fs.existsSync(USERS_FILE)) {
    const salt = generateSalt();
    const demoUser: StoredUser = {
      id: "user-demo-1",
      email: "alex@devrelos.com",
      salt,
      passwordHash: hashPassword("password123", salt),
      profile: {
        id: "user-demo-1",
        name: "Alex Rivera",
        email: "alex@devrelos.com",
        role: "Head of Developer Relations",
        organization: "VectorSearch",
        bio: "Systems advocate and technical writer focusing on edge computing, WebAssembly, and AI infrastructure.",
        githubUrl: "https://github.com/alexrivera-dev",
        twitterUrl: "https://x.com/alexrivera_dev",
        linkedinUrl: "https://linkedin.com/in/alexrivera-devrel",
        timezone: "America/Los_Angeles (PST)",
        notificationPreferences: {
          emailAlerts: true,
          discordAlerts: true,
          weeklyDigest: true,
        },
      },
      workspaces: DEFAULT_DEMO_WORKSPACES,
      activeWorkspaceId: "ws-vectorsearch",
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
    };

    fs.writeFileSync(USERS_FILE, JSON.stringify([demoUser], null, 2), "utf-8");
    return [demoUser];
  }

  try {
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  ensureDirectory();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

function getSessions(): StoredSession[] {
  ensureDirectory();
  if (!fs.existsSync(SESSIONS_FILE)) {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify([], null, 2), "utf-8");
    return [];
  }
  try {
    const raw = fs.readFileSync(SESSIONS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveSessions(sessions: StoredSession[]) {
  ensureDirectory();
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), "utf-8");
}

export async function findOrCreateGoogleUser(data: {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}): Promise<{ user: AuthUser; token: string; isNewUser: boolean }> {
  const users = getUsers();
  const normalizedEmail = data.email.trim().toLowerCase();

  let user = users.find(
    (u) => (u.googleId && u.googleId === data.googleId) || u.email.toLowerCase() === normalizedEmail
  );

  let isNewUser = false;

  if (!user) {
    // New user signing up with Google
    isNewUser = true;
    const userId = `usr-${Date.now()}`;
    const workspaceId = `ws-${Date.now()}`;

    // Clean personal workspace for the new user - ZERO sample data
    const personalWorkspace: Workspace = {
      id: workspaceId,
      name: `${data.name || "Personal"}'s Workspace`,
      slug: (data.name || "personal").toLowerCase().replace(/[^a-z0-9]/g, "-"),
      description: "Personal developer workspace.",
      type: "personal",
      isDemo: false,
      createdAt: new Date().toISOString(),
      ownerId: userId,
      members: [{ name: data.name || "Owner", email: normalizedEmail, role: "Owner" }],
    };

    user = {
      id: userId,
      email: normalizedEmail,
      googleId: data.googleId,
      profile: {
        id: userId,
        name: data.name || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        role: "Developer Advocate",
        organization: "Personal Workspace",
        bio: "",
        avatarUrl: data.picture,
        timezone: "UTC",
        notificationPreferences: {
          emailAlerts: true,
          discordAlerts: false,
          weeklyDigest: true,
        },
      },
      workspaces: [personalWorkspace],
      activeWorkspaceId: workspaceId,
      onboardingCompleted: true,
      isFirstTimeUser: true,
      createdAt: new Date().toISOString(),
    };

    users.push(user);
    saveUsers(users);
  } else {
    // Existing user: link Google ID if not already set, update avatar if available
    let updated = false;
    if (!user.googleId) {
      user.googleId = data.googleId;
      updated = true;
    }
    if (data.picture && !user.profile.avatarUrl) {
      user.profile.avatarUrl = data.picture;
      updated = true;
    }
    if (updated) {
      saveUsers(users);
    }
  }

  const token = generateSessionToken();
  const sessions = getSessions();
  sessions.push({
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
  });
  saveSessions(sessions);

  return { user: sanitizeUser(user), token, isNewUser };
}

export function sanitizeUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    profile: user.profile,
    workspaces: user.workspaces,
    activeWorkspaceId: user.activeWorkspaceId,
    onboardingCompleted: user.onboardingCompleted,
    isFirstTimeUser: user.isFirstTimeUser ?? false,
    createdAt: user.createdAt,
  };
}

export async function registerUser(email: string, password: string, name?: string): Promise<{ user: AuthUser; token: string }> {
  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const existing = users.find((u) => u.email === normalizedEmail);
  if (existing) {
    throw new Error("An account with this email address already exists.");
  }

  const userId = `usr-${Date.now()}`;
  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);

  const defaultPersonalWorkspace: Workspace = {
    id: `ws-${Date.now()}`,
    name: name ? `${name}'s Workspace` : "Personal Workspace",
    slug: (name || "personal").toLowerCase().replace(/[^a-z0-9]/g, "-"),
    description: "Personal developer workspace.",
    type: "personal",
    isDemo: false,
    createdAt: new Date().toISOString(),
    ownerId: userId,
  };

  const newUser: StoredUser = {
    id: userId,
    email: normalizedEmail,
    passwordHash,
    salt,
    profile: {
      id: userId,
      name: name || normalizedEmail.split("@")[0],
      email: normalizedEmail,
      role: "Developer Advocate",
      organization: "Personal Project",
      bio: "Building developer relations and open-source ecosystems with DevRelOS.",
      timezone: "UTC",
      notificationPreferences: {
        emailAlerts: true,
        discordAlerts: false,
        weeklyDigest: true,
      },
    },
    workspaces: [defaultPersonalWorkspace],
    activeWorkspaceId: defaultPersonalWorkspace.id,
    onboardingCompleted: false,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  const token = generateSessionToken();
  const sessions = getSessions();
  sessions.push({
    token,
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
  });
  saveSessions(sessions);

  return { user: sanitizeUser(newUser), token };
}

export async function loginUser(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const user = users.find((u) => u.email === normalizedEmail);
  if (!user) {
    throw new Error("Invalid email or password.");
  }

  if (!user.salt || !user.passwordHash) {
    throw new Error("Invalid email or password.");
  }

  const testHash = hashPassword(password, user.salt);
  if (testHash !== user.passwordHash) {
    throw new Error("Invalid email or password.");
  }

  const token = generateSessionToken();
  const sessions = getSessions();
  sessions.push({
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
  });
  saveSessions(sessions);

  return { user: sanitizeUser(user), token };
}

export async function getUserBySessionToken(token: string): Promise<AuthUser | null> {
  if (!token) return null;
  const sessions = getSessions();
  const session = sessions.find((s) => s.token === token);
  if (!session) return null;

  if (new Date(session.expiresAt) < new Date()) {
    // Session expired
    return null;
  }

  const users = getUsers();
  const user = users.find((u) => u.id === session.userId);
  if (!user) return null;

  return sanitizeUser(user);
}

export async function logoutSessionToken(token: string) {
  const sessions = getSessions().filter((s) => s.token !== token);
  saveSessions(sessions);
}

export async function updateUserProfile(userId: string, profileUpdate: Partial<UserProfile>): Promise<AuthUser> {
  const users = getUsers();
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) throw new Error("User not found.");

  users[userIndex].profile = {
    ...users[userIndex].profile,
    ...profileUpdate,
  };

  saveUsers(users);
  return sanitizeUser(users[userIndex]);
}

export async function completeOnboarding(
  userId: string,
  data: {
    name: string;
    role: string;
    organization: string;
    goal: string;
    teamSize: string;
    workspaceName: string;
  }
): Promise<AuthUser> {
  const users = getUsers();
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) throw new Error("User not found.");

  const newWorkspaceId = `ws-${Date.now()}`;
  const newWorkspace: Workspace = {
    id: newWorkspaceId,
    name: data.workspaceName || `${data.organization || data.name}'s DevRel`,
    slug: (data.workspaceName || data.organization || data.name).toLowerCase().replace(/[^a-z0-9]/g, "-"),
    description: `Workspace dedicated to ${data.goal || "Developer Relations"}.`,
    type: "organization",
    isDemo: false,
    createdAt: new Date().toISOString(),
    ownerId: userId,
  };

  users[userIndex].profile = {
    ...users[userIndex].profile,
    name: data.name || users[userIndex].profile.name,
    role: data.role || users[userIndex].profile.role,
    organization: data.organization || users[userIndex].profile.organization,
  };
  users[userIndex].workspaces.push(newWorkspace);
  users[userIndex].activeWorkspaceId = newWorkspaceId;
  users[userIndex].onboardingCompleted = true;

  saveUsers(users);
  return sanitizeUser(users[userIndex]);
}

export async function createNewWorkspace(userId: string, workspaceData: Partial<Workspace>): Promise<AuthUser> {
  const users = getUsers();
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) throw new Error("User not found.");

  const newWs: Workspace = {
    id: `ws-${Date.now()}`,
    name: workspaceData.name || "New Workspace",
    slug: (workspaceData.name || "new-workspace").toLowerCase().replace(/[^a-z0-9]/g, "-"),
    description: workspaceData.description || "Developer relations workspace",
    type: workspaceData.type || "organization",
    websiteUrl: workspaceData.websiteUrl || "",
    docUrl: workspaceData.docUrl || "",
    isDemo: false,
    createdAt: new Date().toISOString(),
    ownerId: userId,
  };

  users[userIndex].workspaces.push(newWs);
  users[userIndex].activeWorkspaceId = newWs.id;

  saveUsers(users);
  return sanitizeUser(users[userIndex]);
}

export async function switchActiveWorkspace(userId: string, workspaceId: string): Promise<AuthUser> {
  const users = getUsers();
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) throw new Error("User not found.");

  users[userIndex].activeWorkspaceId = workspaceId;
  saveUsers(users);
  return sanitizeUser(users[userIndex]);
}
