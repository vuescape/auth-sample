import { RouteConfig } from 'vue-router'

const route: RouteConfig = {
  path: '/',
  name: 'hello world',
  meta: { requiresAuth: true },
  component: () => import(/* webpackChunkName: 'hello-world' */ '.').then(m => m.default),
}

export default route
