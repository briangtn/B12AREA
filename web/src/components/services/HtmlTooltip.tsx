import {withStyles} from "@material-ui/core";
import Tooltip from "@material-ui/core/Tooltip";

const HtmlTooltip = withStyles(theme => ({
    tooltip: {
        color: 'white',
        maxWidth: 'none',
        fontSize: theme.typography.pxToRem(12)
    },
}))(Tooltip);

export default HtmlTooltip;
