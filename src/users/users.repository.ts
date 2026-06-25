import type { Pool } from 'pg';
import { pool } from '../db';
import type { UserRole } from './users.types';

export class UsersRepository {
  private static instance: UsersRepository | undefined;

  private constructor(private readonly db: Pool) {}

  static getInstance(db: Pool = pool): UsersRepository {
    if (!UsersRepository.instance) {
      UsersRepository.instance = new UsersRepository(db);
    }
    return UsersRepository.instance;
  }

  async findRoleById(userId: string): Promise<UserRole | undefined> {
    const result = await this.db.query<{ role: UserRole }>(
      'SELECT role FROM users WHERE id = $1',
      [userId],
    );
    return result.rows[0]?.role;
  }
}

export const usersRepository = UsersRepository.getInstance();
