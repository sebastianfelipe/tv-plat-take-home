import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResourcesRepository } from '../src/resources/resources.repository';
import { ResourcesService } from '../src/resources/resources.service';
import type { UsersService } from '../src/users/users.service';
import { UserRole } from '../src/users/users.types';

function createResourcesService(userRole: UserRole | undefined): ResourcesService {
  const usersService = {
    findById: vi
      .fn()
      .mockResolvedValue(
        userRole === undefined ? undefined : { id: '1', name: 'Test', role: userRole },
      ),
  } as unknown as UsersService;

  const repository = {
    findResources: vi.fn().mockResolvedValue([]),
  } as unknown as ResourcesRepository;

  return ResourcesService.getInstance(repository, usersService);
}

describe('ResourcesService.buildAccessScope', () => {
  beforeEach(() => {
    (ResourcesService as unknown as { instance: ResourcesService | undefined }).instance =
      undefined;
  });

  it('returns empty scope for admin', async () => {
    const service = createResourcesService(UserRole.Admin);
    await expect(service.buildAccessScope('1')).resolves.toEqual({});
  });

  it('returns userId for member', async () => {
    const service = createResourcesService(UserRole.Member);
    await expect(service.buildAccessScope('2')).resolves.toEqual({ userId: '2' });
  });

  it('returns userId when user is not found', async () => {
    const service = createResourcesService(undefined);
    await expect(service.buildAccessScope('2')).resolves.toEqual({ userId: '2' });
  });
});

describe('ResourcesService.findResources', () => {
  beforeEach(() => {
    (ResourcesService as unknown as { instance: ResourcesService | undefined }).instance =
      undefined;
  });

  it('applies accessScopeUserId alongside filter where', async () => {
    const repository = {
      findResources: vi.fn().mockResolvedValue([]),
    } as unknown as ResourcesRepository;
    const usersService = { findById: vi.fn() } as unknown as UsersService;
    const service = ResourcesService.getInstance(repository, usersService);

    await service.findResources({ where: { type: 'doc' } }, { userId: '2' });

    expect(repository.findResources).toHaveBeenCalledWith({
      where: { type: 'doc', accessScopeUserId: '2' },
    });
  });

  it('passes filter through unchanged when access scope is omitted', async () => {
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

  it('applies access scope to the recent preset', async () => {
    const repository = {
      findResources: vi.fn().mockResolvedValue([]),
    } as unknown as ResourcesRepository;
    const usersService = { findById: vi.fn() } as unknown as UsersService;
    const service = ResourcesService.getInstance(repository, usersService);

    await service.findRecentResources({ userId: '2' });

    expect(repository.findResources).toHaveBeenCalledWith({
      limit: 10,
      order: { field: 'created_at', direction: 'desc' },
      where: { accessScopeUserId: '2' },
    });
  });
});
