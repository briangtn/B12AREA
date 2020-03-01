class Utilities {
    public getQueryParameter(url: string, name: string): string | null {
        name = name.replace(/[\]]/g, '\\$&');
        let regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }

    public isLightColor(color: string): boolean {
        const hex = color.replace('#', '');
        const c_r = parseInt(hex.substr(0, 2), 16);
        const c_g = parseInt(hex.substr(2, 2), 16);
        const c_b = parseInt(hex.substr(4, 2), 16);
        const brightness = ((c_r * 299) + (c_g * 587) + (c_b * 114)) / 1000;
        return brightness > 155;
    }

    public capitalizeString(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    public lightenDarkenColor(col: string, amt: number) {
        let usePound = false;

        if (col[0] === "#") {
            col = col.slice(1);
            usePound = true;
        }

        let num = parseInt(col,16);

        let r = (num >> 16) + amt;

        if (r > 255) r = 255;
        else if  (r < 0) r = 0;

        let b = ((num >> 8) & 0x00FF) + amt;

        if (b > 255) b = 255;
        else if  (b < 0) b = 0;

        let g = (num & 0x0000FF) + amt;

        if (g > 255) g = 255;
        else if (g < 0) g = 0;

        if (r <= 0)
            return (usePound?"#00":"") + (g | (b << 8) | (r << 16)).toString(16);
        return (usePound?"#":"") + (g | (b << 8) | (r << 16)).toString(16);
    }
}

export default new Utilities();
