import { boot } from 'quasar/wrappers'
import VueJsTour from '@globalhive/vuejs-tour'
import '@globalhive/vuejs-tour/dist/style.css'
import '../css/zclTour.scss'

export default boot(async ({ app }) => {
  app.use(VueJsTour)
})
