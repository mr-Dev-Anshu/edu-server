import { getUserById } from '../../src/services/user.service.js';

describe('User Service', () => {
  it('should return user with given id', () => {
    const user = getUserById(1);

    expect(user).toHaveProperty('id', 1);
  });
});
