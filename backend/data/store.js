// Simple in-memory store for scheduler input data
export const store = {
  halls: [],
  modules: [],
  lics: [],
  instructors: [],
};

export function add(collection, item) {
  if (!store[collection]) throw new Error('Invalid collection');
  store[collection].push(item);
  return item;
}

export function get(collection) {
  if (!store[collection]) throw new Error('Invalid collection');
  return store[collection];
}

export function clear() {
  store.halls = [];
  store.modules = [];
  store.lics = [];
  store.instructors = [];
}
