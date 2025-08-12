import { api } from 'encore.dev/api';
import fs from 'fs';
import path from 'path';
import { toFile } from 'openai';
import { client } from './open-ai';
import PDFDocument from 'pdfkit';

interface Params {
  fileName: string;
  content: string;
}

export const upload = api<Params>(
  { method: 'POST', path: '/core/upload' },
  async ({ fileName, content }) => {
    const filepath = path.join('/tmp', `${fileName}.pdf`);

    await new Promise<void>((resolve, reject) => {
      const stream = fs.createWriteStream(filepath);
      stream.on('finish', resolve);
      stream.on('error', reject);

      const doc = new PDFDocument({ margin: 30 });
      doc.pipe(stream);
      doc.font('Courier').fontSize(10);
      doc.text(content, { width: 550, align: 'left' });
      doc.end();
    });

    const buffer = fs.readFileSync(filepath);
    const file = await toFile(buffer, `${fileName}.pdf`);

    const filesList = await client.files.list();
    const existingFiles = filesList.data.filter((f) =>
      f.filename.startsWith(fileName)
    );

    for (const file of existingFiles) {
      await client.files.delete(file.id);
    }

    await client.files.create({
      file: file,
      purpose: 'assistants',
    });

    fs.unlinkSync(filepath);
  }
);
