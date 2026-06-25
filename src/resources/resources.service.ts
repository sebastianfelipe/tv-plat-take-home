import type { FindQuery } from '../shared/query.types';
import { ResourcesRepository } from './resources.repository';
import type { FindResourcesOpts, ResourceRow } from './resources.types';
import type { ResourcesWhere } from './resources.where.types';

export class ResourcesService {
  private static instance: ResourcesService | undefined;

  private constructor(private readonly repository: ResourcesRepository) {}

  static getInstance(repository?: ResourcesRepository): ResourcesService {
    if (!ResourcesService.instance) {
      ResourcesService.instance = new ResourcesService(
        repository ?? ResourcesRepository.getInstance(),
      );
    }
    return ResourcesService.instance;
  }

  findResources(_query?: FindQuery<ResourcesWhere>): Promise<ResourceRow[]> {
    return this.repository.findResources();
  }

  findRecentResources(): Promise<ResourceRow[]> {
    return this.repository.findResources({
      limit: 10,
      orderBy: 'created_at desc',
    });
  }

  findResourcesByOwner(ownerId: number): Promise<ResourceRow[]> {
    const opts: FindResourcesOpts = { ownerId };
    return this.repository.findResources(opts);
  }
}

export const resourcesService = ResourcesService.getInstance();
