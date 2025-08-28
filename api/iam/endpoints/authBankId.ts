import jwt from 'jsonwebtoken';
import { collectBankIdStatus, startBankIdAuth } from '../helpers/bankid';
import { db } from '@/database';
import { api } from 'encore.dev/api';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

export type StartBankIdRequest = { personalNumber: string };
export type PollBankIdRequest = { orderRef: string };

// Start BankID login
export const bankIdStart = api(
  { path: '/auth/bankid/start', method: 'POST', expose: true },
  async (req: StartBankIdRequest) => {
    const data = await startBankIdAuth(req.personalNumber);
    return {
      orderRef: data.orderRef,
      autoStartToken: data.autoStartToken,
    };
  }
);

// Poll BankID status
export const bankIdStatus = api(
  { path: '/auth/bankid/status', method: 'POST', expose: true },
  async (req: PollBankIdRequest) => {
    const status = await collectBankIdStatus(req.orderRef);

    if (status.status === 'complete') {
      const personalNumber = status.completionData.user.personalNumber;

      // check if user exists
      const userResult = await db.queryRow<{ id: number }>`
      SELECT u.id
      FROM users u
      JOIN auth_bankid b ON b.user_id = u.id
      WHERE b.personal_number = ${personalNumber}
    `;

      let userId: number;
      if (userResult) {
        userId = userResult.id;
      } else {
        const newUser = await db.queryRow<{ id: number }>`
        INSERT INTO users (display_name)
        VALUES (${personalNumber})
        RETURNING id
      `;
        userId = newUser!.id;

        await db.exec`
        INSERT INTO auth_bankid (user_id, personal_number)
        VALUES (${userId}, ${personalNumber})
      `;
      }

      // issue JWT
      const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '1h' });
      return { success: true, token };
    }

    return { success: false, status: status.status };
  }
);
