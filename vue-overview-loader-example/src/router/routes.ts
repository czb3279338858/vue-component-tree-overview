
import { RouteConfig } from 'vue-router'
import ClassComponent from '../views/ClassComponent.vue'
import OptionComponent from '../views/OptionComponent.vue'
const routes: Array<RouteConfig> = [
    {
        path: '/options-component',
        component: OptionComponent,
        children: [
            {
                path: 'class-component',
                name: 'ClassComponent',
                component: ClassComponent,
            }
        ]
    },
    {
        path: '/setup-component',
        component: () => import(/* webpackChunkName: "setup-component" */ '../views/SetupComponent.vue')
    }
]
export default routes