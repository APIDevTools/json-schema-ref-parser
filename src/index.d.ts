declare module 'call-me-maybe' {
  type Falsy = false | null | undefined | '' | 0
  type Callback<T> = (err: any, data: T) => void
  type PromiseValue<T extends Promise<any>> = T extends Promise<infer R>
    ? R
    : never

  function maybe<
    P extends Promise<any>,
    C extends Callback<PromiseValue<P>> | Falsy
  >(cb: C, result: P): C extends Callback<PromiseValue<P>> ? void : P

  export = maybe
}
