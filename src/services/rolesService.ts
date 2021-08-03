export class RolesService {
    
    static isRoot = (role: string): boolean => ['root'].includes(role);
    static isRootOrAdmin = (role: string): boolean => ['root', 'admin'].includes(role);

}