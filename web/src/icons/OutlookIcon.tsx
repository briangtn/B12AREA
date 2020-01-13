import React from 'react';

import WrapSvgPath from "./WrapSvgPath";

const outlookPath = (
    <path d="M 15 0 L 0 2.875 L 0 23.125 L 15 26 Z M 16 3 L 16 6.84375 L 18.78125 9.125 L 25 4.3125 L 25 3 Z M 25 6.09375 L 18.78125 10.90625 L 16 8.625 L 16 16 L 18.625 16 C 19.445313 14.730469 20.875 13.875 22.5 13.875 C 23.421875 13.875 24.277344 14.15625 25 14.625 Z M 7.5 7.875 C 8.789063 7.875 9.828125 8.328125 10.625 9.25 C 11.421875 10.175781 11.8125 11.394531 11.8125 12.90625 C 11.8125 14.460938 11.417969 15.707031 10.59375 16.65625 C 9.769531 17.605469 8.671875 18.09375 7.34375 18.09375 C 6.050781 18.09375 5 17.640625 4.1875 16.71875 C 3.375 15.796875 2.96875 14.574219 2.96875 13.09375 C 2.96875 11.53125 3.390625 10.277344 4.21875 9.3125 C 5.046875 8.347656 6.136719 7.875 7.5 7.875 Z M 7.4375 9.78125 C 6.722656 9.78125 6.171875 10.070313 5.75 10.65625 C 5.328125 11.242188 5.125 12.035156 5.125 13 C 5.125 13.980469 5.328125 14.742188 5.75 15.3125 C 6.171875 15.882813 6.726563 16.15625 7.40625 16.15625 C 8.105469 16.15625 8.652344 15.898438 9.0625 15.34375 C 9.472656 14.789063 9.6875 14.015625 9.6875 13.03125 C 9.6875 12.007813 9.492188 11.226563 9.09375 10.65625 C 8.695313 10.085938 8.128906 9.78125 7.4375 9.78125 Z M 22.5 15 C 20.566406 15 19 16.566406 19 18.5 C 19 20.433594 20.566406 22 22.5 22 C 24.433594 22 26 20.433594 26 18.5 C 26 16.566406 24.433594 15 22.5 15 Z M 22 16 L 23 16 L 23 18 L 25 18 L 25 19 L 22 19 Z"/>
);

const OutlookIcon = WrapSvgPath(outlookPath);

export default OutlookIcon;


