import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './vars.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router, siteData }) {
    // app is the Vue 3 app instance from `createApp()`.
    // router is VitePress' custom router. `siteData` is
    // a `ref` of current site-level metadata.
  }
} satisfies Theme
