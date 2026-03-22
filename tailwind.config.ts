import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:   '#012d1d',
        secondary: '#775a19',
        cream:     '#fdf9ee',
        surface:   '#f1eee3',
        // Extended tokens for admin design
        'primary-fixed':             '#c1ecd4',
        'primary-fixed-dim':         '#a5d0b9',
        'primary-container':         '#1b4332',
        'secondary-container':       '#fed488',
        'secondary-fixed':           '#ffdea5',
        'on-secondary-container':    '#785a1a',
        'surface-container':         '#f1eee3',
        'surface-container-low':     '#f7f3e8',
        'surface-container-high':    '#ece8dd',
        'surface-container-highest': '#e6e2d8',
        'surface-container-lowest':  '#ffffff',
        'on-surface':                '#1c1c15',
        'on-surface-variant':        '#414844',
        'error':                     '#ba1a1a',
        'error-container':           '#ffdad6',
        'outline':                   '#717973',
        'outline-variant':           '#c1c8c2',
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans:  ['Manrope', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
