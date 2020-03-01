import React, { Component } from 'react';

import { connect } from 'react-redux';
import { withStyles, createStyles, Theme } from "@material-ui/core";

import Typography from "@material-ui/core/Typography";

// Components

import NavigationBar from "../NavigationBar";
import AddServices from "../services/AddServices";
import Translator from "../utils/Translator";
import Service from "../services/Service";

import { setServices } from "../../actions/services.action";

// Interface

import { IService } from '../../interfaces/IService.interface';
import IAbout from "../../interfaces/IAbout.interface";
import {setToken} from "../../actions/api.action";
import Cookies from "universal-cookie";

const cookies = new Cookies();

interface Props {
    token: string,
    api_url: string,
    history: {
        push: any
    },
    classes: {
        section: string
    },
    setServices: any,
    services: any,
    setToken: any
}

interface State {
    registeredServices: IService[],
    availableServices: IService[],
    about: IAbout | null
}

const mapStateToProps = (state: any) => {
    return { token: state.token, api_url: state.api_url, services: state.services };
};

function mapDispatchToProps(dispatch: any) {
    return { setServices: (token: object) => dispatch(setServices(token)), setToken: (token: object) => dispatch(setToken(token)) };
}

const styles = (theme: Theme) => createStyles({
    section: {
        padding: '20px',
        borderBottom: '3px solid #f5f5f5',
    },
});

class Services extends Component<Props, State> {
    state: State = {
        registeredServices: [],
        availableServices: [],
        about: null
    };

    /**
     * Function where the about.json is fetched and a list of
     * services where the user is not registered is created,
     * and a list of registered services.
     */
    componentDidMount(): void {
        const { token, api_url } = this.props;

        if (!token) {
            this.props.history.push('/');
            return;
        }

        fetch(`${api_url}/about.json`)
            .then(res => res.json())
            .then((dataAbout) => {
                this.setState({ about: dataAbout });

                fetch(`${api_url}/users/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then((res) => res.json())
                .then((data) => {
                    const { error } = data;

                    if (error) {
                        const { statusCode } = error;

                        if (statusCode === 401) {
                            cookies.set('token',  '');
                            this.props.setToken('');
                            this.props.history.push('/');
                            return;
                        }
                    } else {
                        const {servicesList} = data;
                        const aboutServices = dataAbout['server']['services'];

                        const registeredServices: IService[] = [];
                        const availableServices: IService[] = [];

                        for (let aboutService of aboutServices) {
                            if (servicesList.includes(aboutService.name))
                                registeredServices.push(aboutService);
                            else
                                availableServices.push(aboutService);
                        }

                        this.props.setServices(registeredServices);
                        this.setState({registeredServices: registeredServices, availableServices: availableServices});
                    }
                })
            })
    }

    render() {
        const { classes, services } = this.props;

        return (
            <div>
                <NavigationBar history={this.props.history} />
                <div
                    style={{
                        position: 'absolute',
                        paddingTop: '50px',
                        left: '50%',
                        transform: 'translate(-50%)'
                    }}
                >
                    <Typography variant="h3" className={classes.section} gutterBottom><b><Translator sentence="myServices" /></b></Typography>
                    { services.map((elem: any) => (
                        (elem.actions && elem.actions.length > 0) ?
                            <Service key={services.indexOf(elem)} info={elem} history={this.props.history} />
                            :
                            <div key={services.indexOf(elem)} />
                    ))}
                </div>
                <AddServices availableServices={this.state.availableServices} />
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Services));
