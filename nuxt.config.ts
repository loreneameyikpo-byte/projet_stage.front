// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },
  telemetry: false,
  modules: ["@nuxtjs/tailwindcss", "@pinia/nuxt"],
css: [
  "~/assets/css/main.css",
  "intl-tel-input/styles"
],
  vite: {
    optimizeDeps: {
      include: ["@tabler/icons-vue","@vue/devtools-core", "@vue/devtools-kit"],
    },
  },
  app: {
    head: {
      title: "Projetis — Gestion de Projets de fin de formation",
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap",
        },
        { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css' },
      ],
    },
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: "http://localhost:8000/api",
      //apiBase: "http://localhost:8000",
    },
  },
})