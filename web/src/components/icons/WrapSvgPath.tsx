import React from 'react';

import { SvgIcon } from "@material-ui/core";

const WrapSvgPath = (path: any, viewBox='0 0 24 24') => (props: any) => (
    <SvgIcon {...props} viewBox={viewBox}>{path}</SvgIcon>
);

export default WrapSvgPath;
