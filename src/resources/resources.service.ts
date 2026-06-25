import type { UsersService } from '../users/users.service';
import { UserRole } from '../users/users.types';
import { buildFindResourcesParams } from './resources.params';
import { ResourcesRepository } from './resources.repository';
import type {
  FindResourcesWhere,
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
      // Deferred to avoid circular import at module load time.
      const { UsersService: UsersServiceClass } =
        require('../users/users.service') as typeof import('../users/users.service');
      this.usersServiceRef = UsersServiceClass.getInstance();
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

  async buildRestrictedWhere(userId: string): Promise<FindResourcesWhere> {
    const user = await this.usersService.findById(userId);
    if (user?.role === UserRole.Admin) {
      return {};
    }

    return { ownerId: userId };
  }

  findResources(filter?: ResourcesFilter): Promise<ResourceRow[]> {
    return this.repository.findResources(buildFindResourcesParams(filter));
  }

  findRecentResources(): Promise<ResourceRow[]> {
    const params: FindResourcesParams = {
      limit: 10,
      order: { field: 'created_at', direction: 'desc' },
    };
    return this.repository.findResources(params);
  }

  findResourcesByOwner(ownerId: string): Promise<ResourceRow[]> {
    return this.repository.findResources({ where: { ownerId } });
  }
}
