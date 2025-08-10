import { api } from 'encore.dev/api';
import fs from 'fs';
import path from 'path';
import { toFile } from 'openai';
import { client } from './open-ai';

interface Params {
  fileName: string;
  content: string;
}

export const upload = api<Params>(
  { method: 'POST', path: '/core/upload' },
  async ({ fileName, content }) => {
    const filepath = path.join('/tmp', fileName);

    fs.writeFileSync(filepath, content, 'utf-8');

    const buffer = fs.readFileSync(filepath);
    const file = await toFile(buffer, fileName);

    const filesList = await client.files.list();
    const existingFiles = filesList.data.filter((f) => f.filename === fileName);

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
