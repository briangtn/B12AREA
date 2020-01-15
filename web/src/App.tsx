import React, { Component } from 'react';

import { withStyles, createStyles, Theme } from "@material-ui/core";
import { Link } from 'react-router-dom';

import Typist from 'react-typist';

import './App.css';

import NavigationBar from "./components/NavigationBar";
import OrDivider from "./components/OrDivider";

// Material UI components
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

import GoogleIcon from './components/icons/GoogleIcon';
import TwitterIcon from '@material-ui/icons/Twitter';
import YoutubeIcon from '@material-ui/icons/YouTube';
import GitHubIcon from '@material-ui/icons/GitHub';
import SpotifyIcon from "./components/icons/SpotifyIcon";
import TeamsIcon from "./components/icons/TeamsIcon";
import OutlookIcon from "./components/icons/OutlookIcon";
import AirtableIcon from "./components/icons/AirtableIcon";
import InputBase from "@material-ui/core/InputBase";
import Divider from "@material-ui/core/Divider";
import Paper from "@material-ui/core/Paper";

interface Props {
    classes: {
        gridContent: string,
        quickForm: string
        imageButton: string,
        hero: string,
        heroContent: string,
        root: string,
        input: string,
        iconButton: string,
        divider: string
    }
}

interface State {
    email: string
}

interface Services {
    name: string,
    icon: any,
    xs: boolean | 6 | 4 | "auto" | 10 | 1 | 2 | 3 | 5 | 7 | 8 | 9 | 11 | 12 | undefined
}

const styles = (theme: Theme) => createStyles({
    gridContent: {
        padding: theme.spacing(10),
        minHeight: '120px'
    },
    quickForm: {
        backgroundColor: '#F5F5F5',
        borderRadius: '25px',
        maxHeight: '170px',
        maxWidth: '500px',
        marginTop: theme.spacing(10),
        marginLeft: theme.spacing(15)
    },
    imageButton: {
        backgroundColor: '#FFFFFF',
        minWidth: '230px'
    },
    hero: {
        backgroundColor: '#FFBE76',
        width: '100%',
        minHeight: '300px',
        marginTop: theme.spacing(10),
        position: 'absolute'
    },
    heroContent: {
        textAlign: 'center',
        marginTop: '50px'
    },
    root: {
        marginTop: '10px',
        padding: '2px 4px',
        display: 'flex',
        alignItems: 'center',
    },
    input: {
        marginLeft: theme.spacing(1),
        flex: 1,
    },
    iconButton: {
        padding: 10,
    },
    divider: {
        height: 40
    },
});

class App extends Component<Props, State> {
    state: State = {
        email: ''
    };

    onEmailEnter: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        this.setState({ email: e.currentTarget.value });
    };

    render() {
        const { classes } = this.props;

        const services : Array<Services> = [
            { name: 'Twitter', icon: <TwitterIcon />, xs: 3 },
            { name: 'Youtube', icon: <YoutubeIcon />, xs: 3 },
            { name: 'Spotify', icon: <SpotifyIcon />, xs: 3 },
            { name: 'Github', icon: <GitHubIcon />, xs: 3 },
            { name: 'Teams', icon: TeamsIcon, xs: 4 },
            { name: 'Outlook', icon: <OutlookIcon />, xs: 4 },
            { name: 'Airtable', icon: AirtableIcon, xs: 4 },
        ];

        return (
            <div>
                <NavigationBar />
                <Grid container spacing={3} style={{ width: '100%', margin: '0px'}}>
                    <Grid item xs={6}>
                        <Typist>
                            <Typography className={classes.gridContent} variant="h3" gutterBottom>
                                Connect all your services together
                            </Typography>
                        </Typist>
                    </Grid>
                    <Grid className={classes.quickForm} item xs={6}>
                        <Paper component="form" className={classes.root} elevation={0}>
                            <InputBase
                                className={classes.input}
                                placeholder="Enter your email"
                                inputProps={{ 'aria-label': 'enter your email' }}
                                value={this.state.email}
                                onChange={this.onEmailEnter}
                            />
                            <Divider className={classes.divider} orientation="vertical" />
                            <Link
                                to={{pathname: '/join', state: { email: this.state.email }}}
                                style={{ textDecoration: 'none', color: '#FFFFFF' }}>
                                <Button color="primary">Get Started</Button>
                            </Link>
                        </Paper>
                        <OrDivider />
                        <Grid container spacing={3}>
                            <Grid item xs={6}>
                                <Button
                                    variant="contained"
                                    className={classes.imageButton}
                                    startIcon={<GoogleIcon />}
                                    disableElevation={true}
                                >
                                    Connect with Google
                                </Button>
                            </Grid>
                            <Grid item xs={6}>
                                <Button
                                    variant="contained"
                                    className={classes.imageButton}
                                    startIcon={<TwitterIcon />}
                                    disableElevation={true}
                                >
                                    Connect with Twitter
                                </Button>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
                <div className={classes.hero}>
                    <Grid container spacing={0}>
                        {services.map(elem => (
                            <Grid className={classes.heroContent} item xs={elem.xs} key={elem.name}>
                                { elem.icon }
                                <Typography gutterBottom>
                                    { elem.name }
                                </Typography>
                            </Grid>
                        ))}
                    </Grid>
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(App);
