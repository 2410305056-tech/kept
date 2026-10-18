import { useState, useEffect } from "react";
import { getState, setState, subscribe, isStorageError } from "../lib/store.js";

export function useStore() {
  const [state, setLocalState] = useState(getState());

  useEffect(() => {
    return subscribe(setLocalState);
  }, []);

  return [state, setState, isStorageError()];
}
