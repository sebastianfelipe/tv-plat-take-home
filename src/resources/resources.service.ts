import { ResourcesRepository } from './resources.repository';
import type { FindResourcesOpts, ResourceRow } from './resources.types';

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

  findResources(opts: FindResourcesOpts = {}): Promise<ResourceRow[]> {
    return this.repository.findResources(opts);
  }
}

export const resourcesService = ResourcesService.getInstance();
