/* istanbul ignore file */
import { useState } from "react";

const usePersistentState = (key: string, defaultValue: any) => {
  const [state, set] = useState(getValue(key) || defaultValue);

  const setState = (v: any) => {
    set(v);
    localStorage.setItem(key, JSON.stringify(v));
  };

  return [state, setState];
};

export default usePersistentState;

const getValue = (key: string) => {
  let v = localStorage.getItem(key);
  if (v) {
    v = JSON.parse(v);
  }
  return v;
};
