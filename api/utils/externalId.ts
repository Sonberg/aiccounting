import Hashids from 'hashids';

const hashids = new Hashids('sakldj209ud2jd', 8);

export const externalId = {
  encode: (id: number) => hashids.encode(id),
  decode: (encoded: string) => {
    const [value] = hashids.decode(encoded);
    return value;
  },
};
