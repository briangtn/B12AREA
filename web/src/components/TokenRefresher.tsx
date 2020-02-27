import React, { Component } from 'react';

import { connect } from 'react-redux';

import { setToken } from "../actions/api.action";

import jwt_decode from 'jwt-decode';
import Cookies from "universal-cookie";

const cookies = new Cookies();

const mapStateToProps = (state: any) => {
    return { api_url: state.api_url, token: state.token };
};

function mapDispatchToProps(dispatch: any) {
    return { setToken: (token: object) => dispatch(setToken(token)) };
}

interface Props {
    api_url: string,
    token: string,
    setToken: any
};

interface State {}

interface JWTDecoded {
    email: string,
    exp: number,
    iat: number,
    require2fa: boolean,
    validated2fa: boolean
};

class TokenRefresher extends Component<Props, State> {
    private intervalID: any;
    private refreshDifferentMS: number;

    constructor(props: Props) {
        super(props);

        this.intervalID = 0;
        this.refreshDifferentMS = 1000;
    }

    refreshToken = () => {
        const { token, api_url } = this.props;

        if (token === "undefined") {
            cookies.set('token', '');
            this.props.setToken('');
        } else if (token) {
            const decode: JWTDecoded = jwt_decode(token);
            const currentDate: number = new Date().getTime() / 1000;

            if (currentDate + this.refreshDifferentMS > decode.exp) {
                // Refresh
                fetch(`${api_url}/users/refreshToken`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(res => res.json())
                .then((data) => {
                    cookies.set('token', data.token);
                    this.props.setToken(data.token);
                })
            }
        }
    }

    componentDidMount() {
        this.intervalID = setInterval(() => {
            this.refreshToken();
        }, 1000);
    }

    componentWillUnmount() {
        clearInterval(this.intervalID);
    }

    render() {
        return (
            <div></div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(TokenRefresher);