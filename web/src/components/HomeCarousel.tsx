import React, { Component } from 'react';
import "react-multi-carousel/lib/styles.css";

import { connect } from "react-redux";

import { withStyles, createStyles, Theme } from "@material-ui/core";

import Carousel from "react-multi-carousel";

import Typography from "@material-ui/core/Typography";

interface State {
}

interface Props {
    classes: {
        root: string,
        element: string
    },
    api_url: string,
    services: any[]
}

const styles = (theme: Theme) => createStyles({
    root: {
        maxWidth: 345,
    },
    element: {
        textAlign: 'center',
        paddingBottom: theme.spacing(5)
    }
});

const responsive = {
    desktop: {
        breakpoint: {
            max: 3000,
            min: 1024
        },
        items: 3,
        partialVisibilityGutter: 40
    },
    mobile: {
        breakpoint: {
            max: 464,
            min: 0
        },
        items: 1,
        partialVisibilityGutter: 30
    },
    tablet: {
        breakpoint: {
            max: 1024,
            min: 464
        },
        items: 2,
        partialVisibilityGutter: 30
    }
};

const mapStateToProps = (state: any) => {
    return { api_url: state.api_url };
};

class HomeCarousel extends Component<Props, State> {
    render() {
        const { classes, services } = this.props;

        return (
            <Carousel
                additionalTransfrom={0}
                arrows={false}
                autoPlay
                autoPlaySpeed={2000}
                centerMode={false}
                className=""
                containerClass="container-with-dots"
                customTransition="all 2s"
                dotListClass=""
                draggable={false}
                focusOnSelect={false}
                infinite
                itemClass=""
                keyBoardControl
                minimumTouchDrag={80}
                renderButtonGroupOutside={false}
                renderDotsOutside={false}
                responsive={{
                    desktop: {
                        breakpoint: {
                            max: 3000,
                            min: 1024
                        },
                        items: 3,
                        partialVisibilityGutter: 40
                    },
                    mobile: {
                        breakpoint: {
                            max: 464,
                            min: 0
                        },
                        items: 1,
                        partialVisibilityGutter: 30
                    },
                    tablet: {
                        breakpoint: {
                            max: 1024,
                            min: 464
                        },
                        items: 2,
                        partialVisibilityGutter: 30
                    }
                }}
                showDots={false}
                sliderClass=""
                slidesToSlide={1}
                swipeable
                transitionDuration={2000}
            >
                {services.map((elem: any, index: number) => (
                    <div key={index} className={classes.element}>
                        <img alt={elem['name']} style={{width: '100px', height: 'auto'}} src={elem['icon']} />
                        <Typography variant='h6' style={{color: 'white'}}>{elem['name']}</Typography>
                    </div>
                ))}
            </Carousel>
        );
    }
}

export default connect(mapStateToProps)(withStyles(styles)(HomeCarousel));
