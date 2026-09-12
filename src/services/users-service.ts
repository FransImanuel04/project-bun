import { hash } from 'bcryptjs';

export type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
};

export type UserRepository = {
  findByEmail: (email: string) => Promise<boolean>;
  create: (user: { name: string; email: string; password: string }) => Promise<void>;
};

export type UsersService = {
  register: (input: RegisterUserInput) => Promise<void>;
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

function isDuplicateEmailError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const databaseError = error as { code?: string; errno?: number };
  return databaseError.code === 'ER_DUP_ENTRY' || databaseError.errno === 1062;
}

export function createUsersService(
  repository: UserRepository,
  hashPassword: (password: string) => Promise<string> = (password) => hash(password, 12),
): UsersService {
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
  };
}