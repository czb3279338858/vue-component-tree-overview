
import { RouteConfig } from 'vue-router'
import ClassComponent from '../views/ClassComponent.vue'
import OptionsComponent from '../views/OptionsComponent.vue'
import SetupComponent from '../views/SetupComponent.vue'
const routes: Array<RouteConfig> = [
    {
        path: '/classComponent',
        name: 'ClassComponent',
        component: ClassComponent,
        children: [
            {
                path: 'optionsComponent',
                component: OptionsComponent
            }
        ]
    },
    {
        path: '/setupComponent',
        component: SetupComponent
    }
]
console.log(JSON.stringify(routes))
export default routes