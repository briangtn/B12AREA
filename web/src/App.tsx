import React, { Component } from 'react';

import './App.css';

import NavigationBar from "./components/NavigationBar";

interface Props {}

interface State {}

class App extends Component<Props, State> {
  render() {
        return (
            <div className="App">
                <NavigationBar />
            </div>
        );
  }
}

export default App;
