import React, { Component } from 'react';

interface Props {}

interface State {}

class ClientAPK extends Component<Props, State> {
    componentDidMount(): void {
        const download = document.getElementById("download");

        if (download)
            download.click();
    }

    render() {
        return (
            <div>
                <a id="download" href="apk/area.apk" download="area.apk" />
            </div>
        );
    }
}

export default ClientAPK;
