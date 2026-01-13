/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'navy-deep': '#0a192f',
                // Add other custom colors here as needed
            },
        },
    },
    plugins: [],
}
