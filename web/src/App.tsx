import React, { Component } from 'react';

import { withStyles, createStyles, Theme } from "@material-ui/core";
import { Link } from 'react-router-dom';

import Typist from 'react-typist';

import { connect } from 'react-redux';

import './App.css';

import NavigationBar from "./components/NavigationBar";
import AuthButton from "./components/AuthButton";
import OrDivider from "./components/OrDivider";
import Translator from "./components/Translator";
import HomeCarousel from "./components/HomeCarousel";
import Footer from "./components/Footer";

// Material UI components
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

import GoogleIcon from './components/icons/GoogleIcon';
import TwitterIcon from '@material-ui/icons/Twitter';
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
    token: string,
    api_url: string
}

interface State {
    email: string,
    services: any
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
        marginTop: '75px'
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
    return { language: state.language, token : state.token, api_url: state.api_url };
};

class App extends Component<Props, State> {
    state: State = {
        email: '',
        services: []
    };

    onEmailEnter: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        this.setState({ email: e.currentTarget.value });
    };

    componentDidMount(): void {
        const { token } = this.props;

        if (token && token !== undefined && token !== "undefined") {
            this.props.history.push('/services');
        } else {
            this.fetchServices(this.props.api_url);
        }
    }

    fetchServices(api_url: string): void {
        this.setState({ services: [] });
        fetch(`${api_url}/about.json`)
            .then(res => res.json())
            .then(data => {
                const servicesArray = data['server']['services'];
                const tmp: {name: string, description: string, icon: string, color: string}[] = [];

                for (let service of servicesArray) {
                    const tmpObject: {name: string, description: string, icon: string, color: string} = {
                        name: service['name'],
                        description: service['description'],
                        icon: service['icon'],
                        color: service['color']
                    };
                    tmp.push(tmpObject);
                }
                this.setState({ services: tmp });
            });
    }

    keyPress = (e: any) => {
        if (e.keyCode === 13) {
            const toClick: HTMLElement | null = document.getElementById('getStarted');

            if (toClick)
                toClick.click();
        }
    };

    render() {
        const { classes } = this.props;
        const isMobile: boolean = window.innerWidth <= 500;

        return (
            <div style={{ minHeight: '100%'}}>
                <NavigationBar history={this.props.history} />
                {!isMobile ?
                    (<Grid container spacing={3} style={{width: '100%', margin: '0px'}}>
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
                                    inputProps={{'aria-label': 'enter your email'}}
                                    value={this.state.email}
                                    onChange={this.onEmailEnter}
                                    onKeyDown={this.keyPress}
                                />
                                <Divider className={classes.divider} orientation="vertical"/>
                                <Link
                                    to={{pathname: '/join', state: {email: this.state.email}}}
                                    style={{textDecoration: 'none', color: '#FFFFFF'}}>
                                    <Button id="getStarted" color="primary"><Translator sentence="getStarted"/></Button>
                                </Link>
                            </Paper>
                            <OrDivider/>
                            <Grid container spacing={3} direction="row" alignItems="center" justify="center">
                                <Grid item xs={6} style={{paddingLeft: '15px'}}>
                                    <AuthButton token={null} history={this.props.history} apiUrl={this.props.api_url}
                                                serviceName="Google" serviceIcon={<GoogleIcon/>}/>
                                </Grid>
                                <Grid item xs={6} style={{marginRight: '-30px'}}>
                                    <AuthButton token={null} history={this.props.history} apiUrl={this.props.api_url}
                                                serviceName="Twitter" serviceIcon={<TwitterIcon/>}/>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>)
                    :
                    (<Typography className={classes.gridContent} variant="h3" gutterBottom>
                        {
                            (this.props.language === 'fr') ?
                                <div><Typist>Connecte tes applications ensemble</Typist></div>
                                :
                                <Typist>Connect all your services together</Typist>
                        }
                    </Typography>)
                }
                <div className={classes.hero}>
                    <br />
                    <br />
                    <HomeCarousel services={this.state.services} />
                </div>
                <br />
                <Footer apiUrl={this.props.api_url} reloadFunction={this.fetchServices.bind(this)} isConnected={this.props.token !== null} />
            </div>
        );
    }
}

export default connect(mapStateToProps)(withStyles(styles)(App));
