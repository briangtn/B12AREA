import React, { Component } from 'react';

import { connect } from 'react-redux';
import { withStyles, createStyles, Theme } from "@material-ui/core";

import Typography from "@material-ui/core/Typography";

// Components

import NavigationBar from "../components/NavigationBar";
import AddServices from "../components/services/AddServices";
import Translator from "../components/Translator";
import Service from "../components/services/Service";

interface Props {
    token: string,
    api_url: string,
    history: {
        push: any
    },
    classes: {
        section: string
    }
}

interface State {
    registeredServices: any,
    availableServices: any,
    about: any
}

const mapStateToProps = (state: any) => {
    return { token: state.token, api_url: state.api_url };
};

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
        about: {}
    };

    componentDidMount(): void {
        const { token, api_url } = this.props;

        if (!token)
            this.props.history.push('/');

        fetch(`${api_url}/about.json`)
            .then(res => res.json())
            .then((dataMe) => {
                this.setState({ about: dataMe });

                fetch(`${api_url}/users/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(res => res.json())
                .then((data) => {
                    const { services } = data;
                    const { registeredServices } = this.state;

                    for (let key of Object.keys(services)) {
                        let tmp = {};
                        tmp[key as keyof typeof tmp] = services[key] as never;
                        registeredServices.push(tmp);
                    }

                    const registeredServicesName = Object.keys(services);

                    const availableServicesArray = [];
                    for (let service of dataMe['server']['services']) {
                        if (!registeredServicesName.includes(service.name))
                            availableServicesArray.push(service);
                    }

                    this.setState({ registeredServices: registeredServices, availableServices: availableServicesArray });
                })
            })
    }

    render() {
        const { classes } = this.props;
        return (
            <div>
                <NavigationBar history={this.props.history} />
                <div
                    style={{
                        position: 'absolute',
                        paddingTop: '50px',
                        left: '50%',
                        width: '40em',
                        transform: 'translate(-50%)'
                    }}
                >
                    <Typography variant="h3" className={classes.section} gutterBottom><b><Translator sentence="myServices" /></b></Typography>
                    { this.state.registeredServices.map((elem: any) => (
                        <Service key={Object.keys(elem)[0]} name={Object.keys(elem)[0]} utils={elem[Object.keys(elem)[0]]} about={this.state.about} />
                    ))}
                </div>
                <AddServices availableServices={this.state.availableServices} />
            </div>
        );
    }
}

export default connect(mapStateToProps)(withStyles(styles)(Services));
