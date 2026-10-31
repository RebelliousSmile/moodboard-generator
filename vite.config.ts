import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const { version } = JSON.parse(
    readFileSync(new URL('./package.json', import.meta.url), 'utf-8')
) as { version: string }

// https://vite.dev/config/
export default defineConfig({
    define: {
        __APP_VERSION__: JSON.stringify(version),
    },
    plugins: [react(), tailwindcss()],
    build: {
        rolldownOptions: {
            output: {
                // React et zod changent rarement : chacun dans son fichier, ils restent en cache
                // d'une version de l'application à l'autre.
                codeSplitting: {
                    groups: [
                        { name: 'react', test: /node_modules\/(react|react-dom|scheduler)\// },
                        { name: 'zod', test: /node_modules\/zod\// },
                    ],
                },
            },
        },
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    test: {
        environment: 'jsdom',
        include: ['src/**/*.test.{ts,tsx}'],
    },
})
