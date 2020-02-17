import { createStore } from 'redux';

import rootReducer from "../reducers/rootReducer.reducer";

const rootStore = createStore(rootReducer);

export default rootStore;
