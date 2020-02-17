import React, { Component } from 'react';

import { connect } from "react-redux";

import NavigationBar from "../components/NavigationBar";

import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Translator from "../components/Translator";

const mapStateToProps = (state: any) => {
    return { api_url: state.api_url };
};

interface Props {
    api_url: string,
    history: {
        push: any
    },
}

interface State {}

class EmailValidation extends Component<Props, State> {
    componentDidMount(): void {
        const { api_url } = this.props;
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

        fetch(`${api_url}/users/validate?token=${token}`, {
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

export default connect(mapStateToProps)(EmailValidation);
