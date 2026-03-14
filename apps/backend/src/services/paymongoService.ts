import crypto from 'crypto';
import { env } from '../config/env.ts';

const SUPPORTED_PAYMENT_METHODS = new Set([
  'card',
  'gcash',
  'paymaya',
  'maya',
  'grab_pay',
  'billease',
]);

export class PaymongoService {
  private resolvePaymentMethodTypes() {
    const configured = (env.paymongoPaymentMethodTypes || '')
      .split(',')
      .map((method) => method.trim().toLowerCase())
      .filter(Boolean);

    const validConfigured = configured.filter((method) => SUPPORTED_PAYMENT_METHODS.has(method));
    if (validConfigured.length > 0) {
      return validConfigured;
    }

    return ['card', 'gcash'];
  }

  verifyWebhook(signatureHeader: string | string[] | undefined, body: Buffer) {
    if (!env.paymongoWebhookSecret) {
      throw new Error('PAYMONGO_WEBHOOK_SECRET is not set');
    }

    if (!signatureHeader) {
      throw new Error('Missing signature');
    }

    const sigString = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    const parts = sigString.split(',');
    const timestampPart = parts.find((p) => p.startsWith('t='));
    const testSigPart = parts.find((p) => p.startsWith('te='));
    const liveSigPart = parts.find((p) => p.startsWith('li='));

    if (!timestampPart || (!testSigPart && !liveSigPart)) {
      throw new Error('Invalid signature format');
    }

    const timestamp = timestampPart.substring(2);
    const signature =
      env.nodeEnv === 'production' && liveSigPart
        ? liveSigPart.substring(3)
        : testSigPart
          ? testSigPart.substring(3)
          : '';

    if (!signature) {
      throw new Error('Signature not found');
    }

    const payload = `${timestamp}.${body.toString()}`;
    const computedSignature = crypto
      .createHmac('sha256', env.paymongoWebhookSecret)
      .update(payload)
      .digest('hex');

    if (computedSignature !== signature) {
      throw new Error('Invalid signature');
    }

    return JSON.parse(body.toString());
  }

  async createCheckout(originHeader?: string) {
    if (!env.paymongoSecretKey) {
      throw new Error('PAYMONGO_SECRET_KEY is missing');
    }

    const encodedKey = Buffer.from(env.paymongoSecretKey).toString('base64');
    const origin = originHeader || 'https://www.superfcai.tech';
    const paymentMethodTypes = this.resolvePaymentMethodTypes();

    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${encodedKey}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            line_items: [
              {
                currency: 'PHP',
                amount: 9900,
                description: 'Super FC AI Pro Subscription',
                name: 'Pro Plan',
                quantity: 1,
              },
            ],
            payment_method_types: paymentMethodTypes,
            success_url: `${origin}/?success=true`,
            cancel_url: `${origin}/?canceled=true`,
            description: 'Super FC AI Pro Subscription',
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
          },
        },
      }),
    });

    const data = await response.json();
    if (data.errors) {
      throw new Error(data.errors[0].detail);
    }

    return data.data.attributes.checkout_url as string;
  }
}
