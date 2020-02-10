import React, { Component } from 'react';

import { withStyles, createStyles, Theme } from "@material-ui/core";
import { Link } from 'react-router-dom';

import Typist from 'react-typist';

import { connect } from 'react-redux';

import './App.css';

import NavigationBar from "./components/NavigationBar";
import OrDivider from "./components/OrDivider";
import Translator from "./components/Translator";
import HomeCarousel from "./components/HomeCarousel";

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
    },
    history: {
        push: any
    },
    language: string,
    token: string
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
        minHeight: '350px',
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

const mapStateToProps = (state: any) => {
    return { language: state.language, token : state.token };
};

class App extends Component<Props, State> {
    state: State = {
        email: '',
    };

    onEmailEnter: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        this.setState({ email: e.currentTarget.value });
    };

    componentDidMount(): void {
        const { token } = this.props;

        if (token)
            this.props.history.push('/services');
    }

    render() {
        const { classes } = this.props;

        return (
            <div>
                <NavigationBar history={this.props.history} />
                <Grid container spacing={3} style={{ width: '100%', margin: '0px'}}>
                    <Grid item xs={6}>
                        <Typography className={classes.gridContent} variant="h3" gutterBottom>
                            {
                                (this.props.language === 'fr') ?
                                    <div><Typist>Connecte tes applications ensemble</Typist></div>
                                    :
                                    <Typist>Connect all your services together</Typist>
                            }
                        </Typography>
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
                                <Button color="primary"><Translator sentence="getStarted" /></Button>
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
                                    <Translator sentence="connectGoogle" />
                                </Button>
                            </Grid>
                            <Grid item xs={6}>
                                <Button
                                    variant="contained"
                                    className={classes.imageButton}
                                    startIcon={<TwitterIcon />}
                                    disableElevation={true}
                                >
                                    <Translator sentence="connectTwitter" />
                                </Button>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
                <div className={classes.hero}>
                    <br />
                    <br />
                    <HomeCarousel />
                </div>
            </div>
        );
    }
}

export default connect(mapStateToProps)(withStyles(styles)(App));
