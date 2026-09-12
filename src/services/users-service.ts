import { compare, hash } from 'bcryptjs';
import { randomUUID } from 'node:crypto';

export type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
};

export type UserRepository = {
  findByEmail: (email: string) => Promise<{ id: number; password: string } | null>;
  create: (user: { name: string; email: string; password: string }) => Promise<void>;
  createSession: (session: { token: string; userId: number }) => Promise<void>;
};

export type UsersService = {
  register: (input: RegisterUserInput) => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<string>;
};

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super('Email sudah terdaftar');
    this.name = 'EmailAlreadyRegisteredError';
  }
}

export class DatabaseUnavailableError extends Error {
  constructor() {
    super('Database belum dikonfigurasi');
    this.name = 'DatabaseUnavailableError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Email atau password salah');
    this.name = 'InvalidCredentialsError';
  }
}

function isDuplicateEmailError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const databaseError = error as { code?: string; errno?: number };
  return databaseError.code === 'ER_DUP_ENTRY' || databaseError.errno === 1062;
}

export function createUsersService(
  repository: UserRepository,
  dependencies: {
    hashPassword?: (password: string) => Promise<string>;
    comparePassword?: (password: string, passwordHash: string) => Promise<boolean>;
    generateToken?: () => string;
  } = {},
): UsersService {
  const hashPassword = dependencies.hashPassword ?? ((password: string) => hash(password, 12));
  const comparePassword = dependencies.comparePassword ?? compare;
  const generateToken = dependencies.generateToken ?? randomUUID;

  return {
    async register(input: RegisterUserInput) {
      const email = input.email.trim().toLowerCase();

      if (await repository.findByEmail(email)) {
        throw new EmailAlreadyRegisteredError();
      }

      const passwordHash = await hashPassword(input.password);

      try {
        await repository.create({
          name: input.name.trim(),
          email,
          password: passwordHash,
        });
      } catch (error) {
        if (isDuplicateEmailError(error)) {
          throw new EmailAlreadyRegisteredError();
        }

        throw error;
      }
    },
    async login(input) {
      const email = input.email.trim().toLowerCase();
      const user = await repository.findByEmail(email);

      if (!user || !(await comparePassword(input.password, user.password))) {
        throw new InvalidCredentialsError();
      }

      const token = generateToken();
      await repository.createSession({ token, userId: user.id });
      return token;
    },
  };
}