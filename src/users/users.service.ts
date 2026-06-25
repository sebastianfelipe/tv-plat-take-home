import { ResourcesService } from '../resources/resources.service';
import type { ResourceRow } from '../resources/resources.types';

export class UsersService {
  private static instance: UsersService | undefined;

  private constructor(private readonly resourcesService: ResourcesService) {}

  static getInstance(resourcesSvc?: ResourcesService): UsersService {
    if (!UsersService.instance) {
      UsersService.instance = new UsersService(resourcesSvc ?? ResourcesService.getInstance());
    }
    return UsersService.instance;
  }

  findUserResources(ownerId: number): Promise<ResourceRow[]> {
    return this.resourcesService.findResourcesByOwner(ownerId);
  }
}

export const usersService = UsersService.getInstance();
