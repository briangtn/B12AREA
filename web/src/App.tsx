import React, { Component } from 'react';

import { withStyles, createStyles, Theme } from "@material-ui/core";

import './App.css';

import NavigationBar from "./components/NavigationBar";
import ButtonTextField from "./components/ButtonTextField";

// Material UI components
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

interface Props {
    classes: {
        gridContent: string,
        quickForm: string
    }
}

interface State {}

const styles = (theme: Theme) => createStyles({
    gridContent: {
        padding: theme.spacing(10)
    },
    quickForm: {
        backgroundColor: '#F5F5F5',
        borderRadius: '25px',
        maxHeight: '200px',
        maxWidth: '500px',
        marginTop: theme.spacing(5),
        marginLeft: theme.spacing(15)
    }
});

class App extends Component<Props, State> {
  render() {
      const { classes } = this.props;

      return (
          <div className="App">
              <NavigationBar />
              <Grid container spacing={3}>
                  <Grid item xs={6}>
                      <Typography className={classes.gridContent} variant="h3" gutterBottom>
                          Connect all your services together
                      </Typography>
                  </Grid>
                  <Grid className={classes.quickForm} item xs={6}>
                      <ButtonTextField />
                  </Grid>
              </Grid>
          </div>
      );
  }
}

export default withStyles(styles)(App);
