import React, { useState } from 'react';
import { render } from 'react-dom';
import { Stage, Layer, Rect, Circle, Text } from 'react-konva';
import Konva from 'konva';

const ColoredRect = () => {
    const [color, setColor] = useState('green');

    const handleClick = () => {
        setColor(Konva.Util.getRandomColor());
    };

    return (
        <Rect
            x={20}
            y={20}
            width={50}
            height={50}
            fill={color}
            shadowBlur={5}
            onClick={handleClick}
        />
    );
};

const ColoredCircle = () => {
    const [color, setColor] = useState('red');

    const handleClick = () => {
        setColor(Konva.Util.getRandomColor());
    };

    return (
        <Circle
            x={120}
            y={120}
            radius={100}
            fill={color}
            shadowBlur={5}
            onClick={handleClick}
        />
    );
};

export const App = () => {
    return (
        <Stage width={window.innerWidth} height={window.innerHeight}>
            <Layer>
                <Text text="Try click on rect" />
                <ColoredRect />
                <ColoredCircle />
            </Layer>
        </Stage>
    );
};