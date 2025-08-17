import axios from 'axios';
import fs from 'fs';
import https from 'https';

export async function startBankIdAuth(personalNumber: string) {
  const BANKID_API =
    process.env.BANKID_API || 'https://appapi2.test.bankid.com/rp/v5';
  const CERT_PATH = process.env.BANKID_CERT_PATH!;
  const KEY_PATH = process.env.BANKID_KEY_PATH!;

  const httpsAgent = new https.Agent({
    cert: fs.readFileSync(CERT_PATH),
    key: fs.readFileSync(KEY_PATH),
  });

  const resp = await axios.post(
    `${BANKID_API}/auth`,
    { personalNumber, endUserIp: '127.0.0.1' }, // replace with real client IP
    { httpsAgent }
  );
  return resp.data; // contains orderRef and autoStartToken
}

export async function collectBankIdStatus(orderRef: string) {
  const BANKID_API =
    process.env.BANKID_API || 'https://appapi2.test.bankid.com/rp/v5';
  const CERT_PATH = process.env.BANKID_CERT_PATH!;
  const KEY_PATH = process.env.BANKID_KEY_PATH!;

  const httpsAgent = new https.Agent({
    cert: fs.readFileSync(CERT_PATH),
    key: fs.readFileSync(KEY_PATH),
  });
  const resp = await axios.post(
    `${BANKID_API}/collect`,
    { orderRef },
    { httpsAgent }
  );
  return resp.data;
}
