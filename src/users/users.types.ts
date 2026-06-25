export enum UserRole {
  Member = 'member',
  Admin = 'admin',
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
}
