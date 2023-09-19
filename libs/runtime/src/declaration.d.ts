declare type Optional<T> = T | undefined;
declare type Merge<M, N> = Omit<M, Extract<keyof M, keyof N>> & N;
