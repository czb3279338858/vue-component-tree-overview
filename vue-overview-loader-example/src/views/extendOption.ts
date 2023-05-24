import SetupComponent from './SetupComponent.vue'
const extendOption = {
  components: { SetupComponent },
  props: [
    // extend中extendPropA
    'extendPropA',
    // extend中propA
    'propA'
  ]
}
export default extendOption