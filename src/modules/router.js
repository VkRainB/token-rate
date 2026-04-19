import routes from '~pages'
import { createRouter, createWebHashHistory } from 'vue-router'

export const router = createRouter({
	routes,
	history: createWebHashHistory()
})

export default app => app.use(router)
