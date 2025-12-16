import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

interface IsEqualToPropertyOptions extends ValidationOptions {
  message?: string;
}

@ValidatorConstraint({ name: 'isEqualToProperty', async: false })
export class IsEqualToPropertyConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const constraints = args.constraints as [string, IsEqualToPropertyOptions?];
    const [relatedPropertyName] = constraints;
    const relatedValue = (args.object as Record<string, unknown>)[relatedPropertyName];
    return value === relatedValue;
  }

  defaultMessage(args: ValidationArguments): string {
    const constraints = args.constraints as [string, IsEqualToPropertyOptions?];
    const [relatedPropertyName] = constraints;
    const options = constraints[1] || {};
    return options.message || `${args.property} must be equal to ${relatedPropertyName}`;
  }
}

export function IsEqualToProperty(
  property: string,
  validationOptions?: IsEqualToPropertyOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isEqualToProperty',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property, validationOptions],
      options: validationOptions,
      validator: IsEqualToPropertyConstraint,
    });
  };
}
