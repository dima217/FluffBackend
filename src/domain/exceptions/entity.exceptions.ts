import { HttpException, HttpStatus } from '@nestjs/common';

export class NotFoundEntityException extends HttpException {
  constructor(entityName: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: `${entityName} not found`,
        error: 'Not Found',
        entityName,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class AlreadyExistEntityException extends HttpException {
  constructor(entityName: string) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message: `${entityName} already exists`,
        error: 'Conflict',
        entityName,
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class EntityValidationException extends HttpException {
  constructor(entityName: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `${entityName} validation failed`,
        error: 'Bad Request',
        entityName,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class EntityDeletedException extends HttpException {
  constructor(entityName: string) {
    super(
      {
        statusCode: HttpStatus.GONE,
        message: `${entityName} is deleted`,
        error: 'Gone',
        entityName,
      },
      HttpStatus.GONE,
    );
  }
}

export class EntityInactiveException extends HttpException {
  constructor(entityName: string) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        message: `${entityName} is inactive`,
        error: 'Forbidden',
        entityName,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
