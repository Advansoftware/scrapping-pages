export declare class CreateUserDto {
    username: string;
    password: string;
    name: string;
    isAdmin?: boolean;
}
export declare class UpdateUserDto {
    name?: string;
    password?: string;
    isActive?: boolean;
    isAdmin?: boolean;
}
export declare class UserResponseDto {
    id: number;
    username: string;
    name: string;
    isActive: boolean;
    isAdmin: boolean;
    createdAt: Date;
    hasAiConfig: boolean;
}
