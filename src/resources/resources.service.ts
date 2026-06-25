import { buildFindResourcesParams } from './resources.params';
import { ResourcesRepository } from './resources.repository';
import type { FindResourcesParams, ResourceRow, ResourcesFilter } from './resources.types';

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

export const resourcesService = ResourcesService.getInstance();
