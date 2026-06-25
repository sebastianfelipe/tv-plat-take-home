import { ResourcesRepository } from '../resources/resources.repository';
import { ResourcesService } from '../resources/resources.service';
import type { ResourceRow } from '../resources/resources.types';
import { UsersRepository } from './users.repository';
import type { User } from './users.types';
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

  static getInstance(resourcesSvc?: ResourcesService, usersRepo?: UsersRepository): UsersService {
    if (!UsersService.instance) {
      UsersService.instance = new UsersService(
        resourcesSvc ?? ResourcesService.getInstance(),
        usersRepo ?? UsersRepository.getInstance(),
      );
      if (resourcesSvc === undefined) {
        ResourcesService.getInstance(undefined, UsersService.instance);
      }
    }
    return UsersService.instance;
  }

  findById(userId: string): Promise<User | undefined> {
    return this.usersRepository.findById(userId);
  }

  async authorizeOwner(userId: string, ownerId: string): Promise<void> {
    const user = await this.findById(userId);
    if (user === undefined) {
      throw new ForbiddenError();
    }

    if (user.role === UserRole.Admin) {
      return;
    }

    if (user.role === UserRole.Member && userId === ownerId) {
      return;
    }

    throw new ForbiddenError();
  }

  findUserResources(ownerId: string): Promise<ResourceRow[]> {
    return this.resourcesService.findResourcesByOwner(ownerId);
  }
}
