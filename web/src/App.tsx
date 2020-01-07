import React, { Component } from 'react';

import './App.css';

import Button from '@material-ui/core/Button';

class App extends Component {
  render() {
    return (
        <div className="App">
            Bienvenue les noobs
            <br />
            <Button variant="contained">Default</Button>
        </div>
    );
  }
}

export default App;
