import type { Config } from 'tailwindcss'
export default {content:['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'],theme:{extend:{colors:{brand:'#D96BA5',lilac:'#A879D8',blush:'#FFF2F7',ink:'#252525'},fontFamily:{heading:['var(--font-poppins)'],sans:['var(--font-inter)']},boxShadow:{soft:'0 12px 40px rgba(84,43,72,.10)'}}},plugins:[]} satisfies Config
