const
  // filterF 定义注释
  filterF = (val: string) => val,
  // filterB 定义注释
  filterB = (val: string) => val

// export default 注释
export default filterB

// filter export 注释
export const
  //filterC注释
  filterC = (val: string) => val,
  // filterG注释
  filterG = (val: string) => val

export {
  // export {'filterB'}
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

