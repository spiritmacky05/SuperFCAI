import { UserModel } from '../models/userModel.ts';
import { hashPassword, isPasswordHash, verifyPassword } from '../utils/password.ts';
import { EmailService } from './emailService.ts';

export class UserService {
  constructor(
    private readonly users: UserModel,
    private readonly emailService: EmailService
  ) {}

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
    if (payload.email) {
      payload.email = payload.email.toLowerCase().trim();
    }
    
    // Normalize legacy camelCase fields to snake_case for the model
    if (payload.paymentStatus) {
      payload.payment_status = payload.paymentStatus;
      delete payload.paymentStatus;
    }
    if (payload.proofOfPaymentUrl) {
      payload.proof_of_payment_url = payload.proofOfPaymentUrl;
      delete payload.proofOfPaymentUrl;
    }

    if (payload.password && typeof payload.password === 'string') {
      payload.password = await hashPassword(payload.password);
    }
    return this.users.upsert(payload);
  }

  async login(emailStr: string, passwordStr: string) {
    const email = (emailStr || '').toLowerCase().trim();
    const password = (passwordStr || '').trim();

    console.log(`[AUTH] Login attempt for: "${email}" (Password length: ${password.length})`);

    const matches = await this.users.getByEmail(email);
    if (matches.length === 0) {
      console.log(`[AUTH] ERROR: email "${email}" not found in database.`);
      return { status: 401, payload: { error: 'Invalid credentials' } };
    }

    const matchedUser = matches[0];
    console.log(`[AUTH] User found. Stored password starts with: "${matchedUser.password?.substring(0, 10)}..."`);

    const isValidPassword = await verifyPassword(password, matchedUser.password);
    console.log(`[AUTH] Password verification result: ${isValidPassword}`);

    if (!isValidPassword) {
      return { status: 401, payload: { error: 'Invalid credentials' } };
    }

    if (!isPasswordHash(matchedUser.password)) {
      console.log(`[AUTH] Migrating legacy plaintext password to hash for: ${email}`);
      const upgradedHash = await hashPassword(password);
      await this.users.updatePassword(email, upgradedHash);
      matchedUser.password = upgradedHash;
    }

    const user = { ...matchedUser };
    
    // Generate new session ID to invalidate previous sessions (single device enforcement)
    // We use crypto.randomUUID() which is available in Node.js
    const sessionId = crypto.randomUUID();
    await this.users.upsert({ email, session_id: sessionId });
    user.session_id = sessionId;

    // Check subscription expiry
    if (user.role === 'pro') {
      if (user.subscription_expiry) {
        const expiry = new Date(user.subscription_expiry);
        if (expiry < new Date()) {
          const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, "$1***$3");
          console.log(`User ${maskedEmail} subscription expired. Downgrading to free.`);
          await this.users.upsert({ email, role: 'free' });
          user.role = 'free';
        }
      } else {
        // PRO user missing expiry (likely migrated or manual entry), set default 1 month
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 1);
        const expiryStr = expiry.toISOString();
        const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, "$1***$3");
        console.log(`User ${maskedEmail} is PRO but missing expiry. Setting to ${expiryStr}`);
        await this.users.upsert({ email, subscription_expiry: expiryStr });
        user.subscription_expiry = expiryStr;
      }
    }

    if (user.status === 'pending') {
      return { status: 403, payload: { error: 'Your account is pending approval by an administrator.' } };
    }

    delete user.password;
    return { status: 200, payload: user };
  }

  async updateUserRoleStatus(email: string, role?: string, status?: string) {
    // If upgrading to pro and status is approved, set expiry
    if (role === 'pro' && status === 'approved') {
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + 1);
      
      await this.users.upsert({ 
        email, 
        role, 
        status, 
        subscription_expiry: expiry.toISOString(),
        last_payment_date: new Date().toISOString()
      });

      // Record a payment entry
      await this.users.createPayment({
        user_email: email,
        amount: 99, // Fixed amount for Pro
        status: 'approved',
        reference_number: `PRO-${Date.now()}`
      });

      return;
    }

    return this.users.updateRoleStatus(email, role, status);
  }

  async getPayments(email: string) {
    return this.users.getPaymentsByEmail(email);
  }

  async uploadProofOfPayment(email: string, filePath: string) {
    const normalizedEmail = (email || '').toLowerCase().trim();
    const maskedEmail = normalizedEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3");
    console.log(`Uploading proof for ${maskedEmail}: ${filePath}`);
    try {
      const result = await this.users.updatePaymentStatus(normalizedEmail, 'pending', filePath);
      console.log(`Update proof result for ${maskedEmail} success`);
      return result;
    } catch (err: any) {
      console.error(`FAILED to update payment status in DB:`, err);
      throw err;
    }
  }

  async verifySession(email: string, sessionId: string): Promise<boolean> {
    const { isValid } = await this.verifySessionWithReason(email, sessionId);
    return isValid;
  }

  async verifySessionWithReason(email: string, sessionId: string): Promise<{ isValid: boolean; reason?: 'USER_NOT_FOUND' | 'SESSION_MISMATCH' }> {
    const normalizedEmail = (email || '').toLowerCase().trim();
    const matches = await this.users.getByEmail(normalizedEmail);
    
    console.log(`[AUTH-DEBUG] Verifying session for ${normalizedEmail}. DB matches: ${matches.length}`);
    
    if (matches.length === 0) {
      return { isValid: false, reason: 'USER_NOT_FOUND' };
    }
    const user = matches[0];
    const match = user.session_id === sessionId;
    console.log(`[AUTH-DEBUG] Session comparison: stored="${user.session_id?.substring(0,8)}...", received="${sessionId?.substring(0,8)}...", match=${match}`);
    
    if (user.session_id !== sessionId) {
      return { isValid: false, reason: 'SESSION_MISMATCH' };
    }
    return { isValid: true };
  }

  deleteUser(email: string) {
    return this.users.deleteByEmail(email);
  }

  async forgotPassword(emailStr: string) {
    const email = (emailStr || '').toLowerCase().trim();
    const user = await this.users.getByEmail(email);
    if (!user || user.length === 0) {
      // Don't reveal if user exists for security, just return success
      return;
    }

    const token = crypto.randomUUID();
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1); // 1 hour expiry

    await this.users.updateResetToken(email, token, expiry.toISOString());
    await this.emailService.sendPasswordReset(email, token);
  }

  async resetPassword(token: string, newPasswordStr: string) {
    const newPassword = (newPasswordStr || '').trim();
    if (!newPassword) throw new Error('Password is required.');

    const users = await this.users.getByResetToken(token);
    if (!users || users.length === 0) {
      throw new Error('Invalid or expired reset token.');
    }

    const user = users[0];
    const expiry = new Date(user.reset_password_token_expiry);
    if (expiry < new Date()) {
      throw new Error('Invalid or expired reset token.');
    }

    const hashedPassword = await hashPassword(newPassword);
    await this.users.updatePassword(user.email, hashedPassword);
    await this.users.updateResetToken(user.email, null, null); // Clear token
  }
}
