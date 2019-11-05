import { RouteConfig } from 'vue-router'

const route: RouteConfig = {
  path: '/sign-in',
  name: 'sign-in',
  meta: { requiresAuth: false },
  component: () =>
    import(/* webpackChunkName: 'sign-in' */
    '.').then(m => m.default),
}
export default route
