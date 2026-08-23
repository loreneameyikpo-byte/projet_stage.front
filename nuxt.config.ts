// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },
  telemetry: false,
  modules: ["@nuxtjs/tailwindcss", "@pinia/nuxt"],
css: [
  "sweetalert2/dist/sweetalert2.min.css",
  "~/assets/css/main.css",
  "intl-tel-input/styles"
],
  vite: {
    optimizeDeps: {
      include: ["@vue/devtools-core", "@vue/devtools-kit",'lucide-vue-next',],
    },
  },
  app: {
    head: {
      title: "Projetis - Gestion de Projets de fin de formation",
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap",
        },
        { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css' },
      ],
      script: [
        {
          innerHTML: `
            (function () {
              try {
                var stored = localStorage.getItem('theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (stored === 'dark' || (!stored && prefersDark)) {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            })();
          `,
          type: 'text/javascript',
        },
      ],
    },
  },
  runtimeConfig: {
    public: {
      // Nuxt fait automatiquement correspondre cette clé à la variable
      // d'environnement NUXT_PUBLIC_API_BASE_URL si elle existe (sur
      // Vercel notamment) — pas besoin d'écrire process.env ici, cette
      // valeur ne sert que de repli en développement local.
      apiBaseUrl: "http://localhost:8000/api",
    },
  },
})