
import { RouteConfig } from 'vue-router'
import Home from '../views/Home.vue'
import OptionsComponent from '../views/OptionsComponent.vue'
const routes: Array<RouteConfig> = [
    {
        path: '/home',
        name: 'home',
        component: Home,
        children: [
            {
                path: 'options',
                component: OptionsComponent
            }
        ]
    },
]
console.log(JSON.stringify(routes))
export default routes