import {
  JwtTokensDto,
  UserLoginDto,
  UserRecoveryConfirmDto,
  UserSignUpDto,
  UserSignUpInitDto
} from '@application/dto/user.dto';

import { AuditContext } from '@application/dto/audit-context.dto';

export interface IUserAuthService {
  signUp(user: UserSignUpDto, auditContext?: AuditContext): Promise<JwtTokensDto>;
  signUpInit(user: UserSignUpInitDto, auditContext?: AuditContext): Promise<void>;
  signIn(user: UserLoginDto, auditContext?: AuditContext): Promise<JwtTokensDto>;
  signOut(userId: number, auditContext?: AuditContext): Promise<void>;
  newAccessToken(refreshToken: string): Promise<string>;
  recoveryInit(username: string): Promise<void>;
  recoveryConfirm(user: UserRecoveryConfirmDto, auditContext?: AuditContext): Promise<void>;
}
