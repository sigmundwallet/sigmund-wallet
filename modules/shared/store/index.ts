import { init, RematchDispatch, RematchRootState } from "@rematch/core";
import persistPlugin from "@rematch/persist";
import {
  TypedUseSelectorHook,
  useDispatch as useDispatchOriginal,
  useSelector as useSelectorOriginal,
} from "react-redux";
import storage from "redux-persist/lib/storage";
import { models, RootModel } from "./models";

export const store = init<RootModel>({
  models,
  plugins: [
    persistPlugin({
      key: "root",
      storage,
    }),
  ],
});

export type Store = typeof store;
export type Dispatch = RematchDispatch<RootModel>;
export type RootState = RematchRootState<RootModel>;

export const useSelector: TypedUseSelectorHook<RootState> = useSelectorOriginal;
export const useDispatch = () => useDispatchOriginal<Dispatch>();
