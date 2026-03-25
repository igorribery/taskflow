import path from 'node:path';
import type { NextConfig } from 'next';

const configuracaoNext: NextConfig = {
  turbopack: {
    root: path.join(__dirname, '../..'),
  },
};

export default configuracaoNext;
