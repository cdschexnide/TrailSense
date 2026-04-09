import { DeviceFingerprint } from '@types';

interface FingerprintRepository {
  findOne(query: {
    fingerprintHash: string;
  }): Promise<DeviceFingerprint | null>;
  upsert(fingerprint: DeviceFingerprint): Promise<void>;
  find(): Promise<DeviceFingerprint[]>;
}

const inMemoryFingerprints = new Map<string, DeviceFingerprint>();

function createInMemoryRepository(): FingerprintRepository {
  return {
    async findOne(query) {
      return inMemoryFingerprints.get(query.fingerprintHash) ?? null;
    },
    async upsert(fingerprint) {
      inMemoryFingerprints.set(fingerprint.fingerprintHash, fingerprint);
    },
    async find() {
      return Array.from(inMemoryFingerprints.values());
    },
  };
}

export function getFingerprintRepository(): FingerprintRepository {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const databaseModule = require('@database') as {
      database?: { fingerprints?: FingerprintRepository };
    };

    if (databaseModule.database?.fingerprints) {
      return databaseModule.database.fingerprints;
    }
  } catch {
    // Fall through to in-memory storage when the optional database layer is absent.
  }

  return createInMemoryRepository();
}
