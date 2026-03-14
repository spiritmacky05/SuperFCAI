import { Request, Response } from 'express';
import { PaymongoService } from '../services/paymongoService.ts';

export class PaymongoController {
  constructor(private readonly paymongo: PaymongoService) {}

  webhook = (req: Request, res: Response) => {
    try {
      const event = this.paymongo.verifyWebhook(req.headers['paymongo-signature'], req.body as Buffer);
      const eventType = event?.data?.attributes?.type;

      console.log(`Received PayMongo Event: ${eventType}`);

      if (eventType === 'checkout_session.payment.paid') {
        const checkoutSessionId = event.data.attributes.data.id;
        console.log(`Payment successful for session: ${checkoutSessionId}`);
      }

      res.status(200).send('Webhook received');
    } catch (error: any) {
      const message = error.message || 'Webhook Error';
      const status = message === 'Missing signature' || message.startsWith('Invalid') ? 400 : 500;
      res.status(status).send(`Webhook Error: ${message}`);
    }
  };

  createCheckout = async (req: Request, res: Response) => {
    try {
      const url = await this.paymongo.createCheckout(req.headers.origin);
      res.json({ url });
    } catch (error: any) {
      const message = error.message || 'Failed to create PayMongo checkout session';
      const status = message.includes('missing') || message.includes('PAYMONGO') ? 500 : 400;
      res.status(status).json({ error: message });
    }
  };
}
