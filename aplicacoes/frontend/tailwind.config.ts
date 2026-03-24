import type { Config } from 'tailwindcss';

const configuracaoTailwind: Config = {
  content: [
    './src/paginas/**/*.{js,ts,jsx,tsx,mdx}',
    './src/componentes/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {}
  },
  plugins: []
};

export default configuracaoTailwind;
