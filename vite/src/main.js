import { createApp, h } from "vue";

// const App =  {
//     render(){
//         return h('div',null, [ h('div', null,  String('用Vue渲染的123') ) ])
//     }
// }
import App from './App.vue'
import './index.css'

createApp(App).mount('#app')