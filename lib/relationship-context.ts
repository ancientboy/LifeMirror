import { createClientId } from "./client-id";
import { markAccountDataChanged } from "./account-data";

/**
 * A private, user-authored view of a real person.  It deliberately does not
 * model the other person's inner life as a product fact.
 */
export type PrivatePerson = {
  id: string;
  displayName: string;
  relationshipType?: string;
  userDescription?: string;
  communicationNotes?: string;
  createdAt: string;
  updatedAt: string;
};

const SETTINGS_KEY = "life-mirror:memory-settings:v1";

function readSettings(): Record<string, unknown> {
  try {
    const value = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  } catch { return {}; }
}

function write(people: PrivatePerson[]) {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...readSettings(), privatePeople: people.slice(0, 40), privatePeopleUpdatedAt: new Date().toISOString() }));
  markAccountDataChanged();
}

export function getPrivatePeople(): PrivatePerson[] {
  const value = readSettings().privatePeople;
  return Array.isArray(value) ? value.filter((item): item is PrivatePerson => Boolean(item && typeof item === "object" && typeof (item as PrivatePerson).id === "string" && typeof (item as PrivatePerson).displayName === "string")) : [];
}

export function savePrivatePerson(input: Pick<PrivatePerson, "displayName" | "relationshipType" | "userDescription" | "communicationNotes"> & { id?: string }) {
  const displayName = input.displayName.trim().slice(0, 40);
  if (!displayName) return null;
  const current = getPrivatePeople();
  const existing = input.id ? current.find((person) => person.id === input.id) : undefined;
  const now = new Date().toISOString();
  const person: PrivatePerson = {
    id: existing?.id ?? createClientId(), displayName,
    relationshipType: input.relationshipType?.trim().slice(0, 40) || undefined,
    userDescription: input.userDescription?.trim().slice(0, 300) || undefined,
    communicationNotes: input.communicationNotes?.trim().slice(0, 300) || undefined,
    createdAt: existing?.createdAt ?? now, updatedAt: now,
  };
  write([person, ...current.filter((item) => item.id !== person.id)]);
  return person;
}

export function deletePrivatePerson(id: string) {
  write(getPrivatePeople().filter((person) => person.id !== id));
}
