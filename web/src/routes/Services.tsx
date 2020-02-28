import React, { Component } from 'react';

import { connect } from 'react-redux';
import { withStyles, createStyles, Theme } from "@material-ui/core";

import Typography from "@material-ui/core/Typography";

// Components

import NavigationBar from "../components/NavigationBar";
import AddServices from "../components/services/AddServices";
import Translator from "../components/Translator";
import Service from "../components/services/Service";

import { setServices } from "../actions/services.action";

// Interface

import { IService } from '../interfaces/IService.interface';
import IAbout from "../interfaces/IAbout.interface";

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
    services: any
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
    return { setServices: (token: object) => dispatch(setServices(token)) };
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
                .then(res => res.json())
                .then((data) => {
                    const { servicesList } = data;
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
                    this.setState({ registeredServices: registeredServices, availableServices: availableServices });
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
                        <Service key={services.indexOf(elem)} info={elem} history={this.props.history} />
                    ))}
                </div>
                <AddServices availableServices={this.state.availableServices} />
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Services));
