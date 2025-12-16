import { Token } from "@domain/entities/token.entity";



export interface ITokenRepository {
  create(token: Token): Promise<Token>;
  findOneByToken(token: string): Promise<Token>;
  delete(id: string): Promise<void>;
  deleteByUserId(userId: number): Promise<void>;
}