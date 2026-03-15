import { UserModel } from '../models/userModel.ts';
import { hashPassword, isPasswordHash, verifyPassword } from '../utils/password.ts';

export class UserService {
  constructor(private readonly users: UserModel) {}

  async listUsers() {
    const users = await this.users.getAll();
    return users.map((user: any) => {
      const sanitized = { ...user };
      delete sanitized.password;
      return sanitized;
    });
  }

  async upsertUser(body: any) {
    const payload = { ...body };
    if (payload.password && typeof payload.password === 'string') {
      payload.password = await hashPassword(payload.password);
    }
    return this.users.upsert(payload);
  }

  async login(email: string, password: string) {
    const matches = await this.users.getByEmail(email);
    if (matches.length === 0) return { status: 401, payload: { error: 'Invalid credentials' } };

    const matchedUser = matches[0];
    const isValidPassword = await verifyPassword(password, matchedUser.password);
    if (!isValidPassword) return { status: 401, payload: { error: 'Invalid credentials' } };

    if (!isPasswordHash(matchedUser.password)) {
      const upgradedHash = await hashPassword(password);
      await this.users.updatePassword(email, upgradedHash);
      matchedUser.password = upgradedHash;
    }

    const user = { ...matchedUser };
    if (user.status === 'pending') {
      return { status: 403, payload: { error: 'Your account is pending approval by an administrator.' } };
    }

    delete user.password;
    return { status: 200, payload: user };
  }

  updateUserRoleStatus(email: string, role?: string, status?: string) {
    return this.users.updateRoleStatus(email, role, status);
  }

  async uploadProofOfPayment(email: string, filePath: string) {
    console.log(`Uploading proof for ${email}: ${filePath}`);
    try {
      const result = await this.users.updatePaymentStatus(email, 'pending', filePath);
      console.log(`Update proof result:`, result);
      return result;
    } catch (err: any) {
      console.error(`FAILED to update payment status in DB:`, err);
      throw err;
    }
  }

  deleteUser(email: string) {
    return this.users.deleteByEmail(email);
  }
}
