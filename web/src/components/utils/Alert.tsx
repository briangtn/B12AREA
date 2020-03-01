import React from 'react';

import MuiAlert from "@material-ui/lab/Alert/Alert";

export default function Alert(props: any) {
    return <MuiAlert id='alert' elevation={6} variant="filled" {...props} />;
}