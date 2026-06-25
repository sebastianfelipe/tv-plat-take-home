import { ResourcesService } from '../resources/resources.service';
import type { ResourceRow } from '../resources/resources.types';
import { UsersRepository } from './users.repository';
import { UserRole } from './users.types';

export class ForbiddenError extends Error {
  constructor() {
    super('Forbidden');
  }
}

export class UsersService {
  private static instance: UsersService | undefined;

  private constructor(
    private readonly resourcesService: ResourcesService,
    private readonly usersRepository: UsersRepository,
  ) {}

  static getInstance(
    resourcesSvc?: ResourcesService,
    usersRepo?: UsersRepository,
  ): UsersService {
    if (!UsersService.instance) {
      UsersService.instance = new UsersService(
        resourcesSvc ?? ResourcesService.getInstance(),
        usersRepo ?? UsersRepository.getInstance(),
      );
    }
    return UsersService.instance;
  }

  async authorizeOwner(userId: string, ownerId: string): Promise<void> {
    const role = await this.usersRepository.findRoleById(userId);
    if (role === undefined) {
      throw new ForbiddenError();
    }

    if (role === UserRole.Admin) {
      return;
    }

    if (role === UserRole.Member && userId === ownerId) {
      return;
    }

    throw new ForbiddenError();
  }

  findUserResources(ownerId: string): Promise<ResourceRow[]> {
    return this.resourcesService.findResourcesByOwner(ownerId);
  }
}

export const usersService = UsersService.getInstance();
