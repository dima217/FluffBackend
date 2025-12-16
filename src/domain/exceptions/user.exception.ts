import { HttpException, HttpStatus } from "@nestjs/common";



export class EmailAlreadyExistsException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message: 'Email already exists',
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class PhoneAlreadyExistsException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message: 'Phone already exists',
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class InvalidCodeException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid code',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}