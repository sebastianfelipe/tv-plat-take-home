import type { UsersService } from '../users/users.service';
import { UserRole } from '../users/users.types';
import { buildFindResourcesParams } from './resources.params';
import { ResourcesRepository } from './resources.repository';
import type {
  AccessScope,
  FindResourcesParams,
  ResourceRow,
  ResourcesFilter,
} from './resources.types';

export class ResourcesService {
  private static instance: ResourcesService | undefined;

  private usersServiceRef?: UsersService;

  private constructor(
    private readonly repository: ResourcesRepository,
    usersService?: UsersService,
  ) {
    this.usersServiceRef = usersService;
  }

  private get usersService(): UsersService {
    if (!this.usersServiceRef) {
      throw new Error('UsersService is not wired into ResourcesService');
    }
    return this.usersServiceRef;
  }

  static getInstance(
    repository?: ResourcesRepository,
    usersService?: UsersService,
  ): ResourcesService {
    if (!ResourcesService.instance) {
      ResourcesService.instance = new ResourcesService(
        repository ?? ResourcesRepository.getInstance(),
        usersService,
      );
    } else if (usersService !== undefined) {
      ResourcesService.instance.usersServiceRef = usersService;
    }
    return ResourcesService.instance;
  }

  async buildAccessScope(userId: string): Promise<AccessScope> {
    const user = await this.usersService.findById(userId);
    if (user?.role === UserRole.Admin) {
      return {};
    }

    return { userId };
  }

  findResources(filter?: ResourcesFilter, accessScope: AccessScope = {}): Promise<ResourceRow[]> {
    const params = buildFindResourcesParams(filter);
    const { userId: accessScopeUserId } = accessScope;

    if (accessScopeUserId !== undefined) {
      params.where = { ...params.where, accessScopeUserId };
    }

    return this.repository.findResources(params);
  }

  findRecentResources(accessScope: AccessScope = {}): Promise<ResourceRow[]> {
    const params: FindResourcesParams = {
      limit: 10,
      order: { field: 'created_at', direction: 'desc' },
    };
    const { userId: accessScopeUserId } = accessScope;

    if (accessScopeUserId !== undefined) {
      params.where = { accessScopeUserId };
    }

    return this.repository.findResources(params);
  }

  findResourcesByOwner(ownerId: string): Promise<ResourceRow[]> {
    return this.repository.findResources({ where: { ownerId } });
  }
}
