
import { RouteConfig } from 'vue-router'
import ClassComponent from '../views/ClassComponent.vue'
import OptionComponent from '../views/OptionComponent.vue'
import SetupComponent from '../views/SetupComponent.vue'
const routes: Array<RouteConfig> = [
    {
        path: '/options-component',
        component: OptionComponent,
        // children: [
        //     {
        //         path: 'class-component',
        //         name: 'ClassComponent',
        //         component: ClassComponent,
        //     }
        // ]
    },
    // {
    //     path: '/setup-component',
    //     component: SetupComponent
    // }
]
console.log(JSON.stringify(routes))
export default routes