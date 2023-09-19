import { libB } from 'lib-b';

export function libA(): string {
  console.log('hej', libB());
  return 'lib-a';
}
