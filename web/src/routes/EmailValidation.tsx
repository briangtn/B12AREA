import React, { Component } from 'react';

import { connect } from "react-redux";

import NavigationBar from "../components/NavigationBar";

import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Translator from "../components/Translator";

import { changeApiUrl } from "../actions/api.action";

import Cookies from "universal-cookie";

const cookies = new Cookies();

const mapStateToProps = (state: any) => {
    return { api_url: state.api_url, token: state.token };
};

function mapDispatchToProps(dispatch: any) {
    return { changeApiUrl: (token: object) => dispatch(changeApiUrl(token)) };
}

interface Props {
    api_url: string,
    history: {
        push: any
    },
    token: string,
    changeApiUrl: any
}

interface State {}

class EmailValidation extends Component<Props, State> {
    componentDidMount(): void {
        if (this.props.token)
            return;
        const getUrlParameter = (name : string) : string | null => {
            const url = window.location.href;
            name = name.replace(/[\]]/g, '\\$&');
            let regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
                results = regex.exec(url);
            if (!results) return null;
            if (!results[2]) return '';
            return decodeURIComponent(results[2].replace(/\+/g, ' '));
        };
        let token : string | null = getUrlParameter('token');
        const newApiUrl: string | null = getUrlParameter('api_url');
        this.props.changeApiUrl(newApiUrl);
        cookies.set('api_url', newApiUrl);
        fetch(`${newApiUrl}/users/validate?token=${token}`, {
            method: 'PATCH',
        }).then((res) => {
            return res.json();
        }).then((data) => {
            console.log(data);
        });
    }

    render() {
        return (
            <div>
                <NavigationBar history={this.props.history} />
                <Grid
                    container
                    spacing={0}
                    direction='column'
                    alignItems='center'
                    justify='center'
                    style={{ marginTop: '-50px', minHeight: '100vh', textAlign: 'center' }}
                >
                    <Grid item xs={6}>
                        <Typography variant="h4" gutterBottom>
                            <Translator sentence="emailValidated" />
                        </Typography>
                    </Grid>
                </Grid>
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(EmailValidation);
