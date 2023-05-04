let
  // filterF 定义注释
  filterF,
  // filterB 定义注释
  filterB = (val: string) => val

// export default 注释
export default filterB

// filterC export 注释
export const filterC = (val: string) => val

export {
  // export {filterB}
  filterB,
  filterF
}

export {
  // export {filterB as filterD}
  filterB as filterD
}

export {
  // export {filterE} from './filter-e'
  filterE
} from './filter-e'

