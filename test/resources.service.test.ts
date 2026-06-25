import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResourcesRepository } from '../src/resources/resources.repository';
import { ResourcesService } from '../src/resources/resources.service';
import type { UsersService } from '../src/users/users.service';
import { UserRole } from '../src/users/users.types';

function createResourcesService(userRole: UserRole | undefined): ResourcesService {
  const usersService = {
    findById: vi.fn().mockResolvedValue(
      userRole === undefined ? undefined : { id: '1', name: 'Test', role: userRole },
    ),
  } as unknown as UsersService;

  const repository = {
    findResources: vi.fn().mockResolvedValue([]),
  } as unknown as ResourcesRepository;

  return ResourcesService.getInstance(repository, usersService);
}

describe('ResourcesService.buildRestrictedWhere', () => {
  beforeEach(() => {
    (ResourcesService as unknown as { instance: ResourcesService | undefined }).instance =
      undefined;
  });

  it('returns no filter for admin', async () => {
    const service = createResourcesService(UserRole.Admin);
    await expect(service.buildRestrictedWhere('1')).resolves.toEqual({});
  });

  it('returns ownerId filter for member', async () => {
    const service = createResourcesService(UserRole.Member);
    await expect(service.buildRestrictedWhere('2')).resolves.toEqual({ ownerId: '2' });
  });

  it('returns ownerId filter when user is not found', async () => {
    const service = createResourcesService(undefined);
    await expect(service.buildRestrictedWhere('2')).resolves.toEqual({ ownerId: '2' });
  });
});

describe('ResourcesService.findResources', () => {
  beforeEach(() => {
    (ResourcesService as unknown as { instance: ResourcesService | undefined }).instance =
      undefined;
  });

  it('merges restrictedWhere over filter where so access restrictions win', async () => {
    const repository = {
      findResources: vi.fn().mockResolvedValue([]),
    } as unknown as ResourcesRepository;
    const usersService = { findById: vi.fn() } as unknown as UsersService;
    const service = ResourcesService.getInstance(repository, usersService);

    await service.findResources({ where: { type: 'doc' } }, { ownerId: '2' });

    expect(repository.findResources).toHaveBeenCalledWith({
      where: { type: 'doc', ownerId: '2' },
    });
  });

  it('lets restrictedWhere override conflicting keys in filter where', async () => {
    const repository = {
      findResources: vi.fn().mockResolvedValue([]),
    } as unknown as ResourcesRepository;
    const usersService = { findById: vi.fn() } as unknown as UsersService;
    const service = ResourcesService.getInstance(repository, usersService);

    await service.findResources(
      { where: { type: 'doc', ownerId: '3' } as { type: string; ownerId?: string } },
      { ownerId: '2' },
    );

    expect(repository.findResources).toHaveBeenCalledWith({
      where: { type: 'doc', ownerId: '2' },
    });
  });

  it('passes filter through unchanged when restrictedWhere is omitted', async () => {
    const repository = {
      findResources: vi.fn().mockResolvedValue([]),
    } as unknown as ResourcesRepository;
    const usersService = { findById: vi.fn() } as unknown as UsersService;
    const service = ResourcesService.getInstance(repository, usersService);

    await service.findResources({ where: { type: 'doc' }, limit: 5 });

    expect(repository.findResources).toHaveBeenCalledWith({
      where: { type: 'doc' },
      limit: 5,
    });
  });
});

describe('ResourcesService.findRecentResources', () => {
  beforeEach(() => {
    (ResourcesService as unknown as { instance: ResourcesService | undefined }).instance =
      undefined;
  });

  it('applies restrictedWhere to the recent preset', async () => {
    const repository = {
      findResources: vi.fn().mockResolvedValue([]),
    } as unknown as ResourcesRepository;
    const usersService = { findById: vi.fn() } as unknown as UsersService;
    const service = ResourcesService.getInstance(repository, usersService);

    await service.findRecentResources({ ownerId: '2' });

    expect(repository.findResources).toHaveBeenCalledWith({
      limit: 10,
      order: { field: 'created_at', direction: 'desc' },
      where: { ownerId: '2' },
    });
  });
});
