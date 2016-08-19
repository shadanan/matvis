import React from 'react';
import ReactDOM from 'react-dom';
import {ListGroup, ListGroupItem} from 'react-bootstrap'
import BootstrapSlider from 'react-bootstrap-native-slider';
import Numeric from 'numeric';


class CanvasComponent extends React.Component {
  constructor() {
    super();
    this.state = {a: 0, c: 1, b: -1, d: 0, x: 1, y: 1, currentCrossHair: 0};
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
  }

  getMousePos(event) {
    let canvas = this.refs.canvas;
    let rect = canvas.getBoundingClientRect();

    let xRatio = this.props.scale * rect.width / canvas.width;
    let yRatio = -this.props.scale * rect.height / canvas.height;

    let x = ((event.clientX - rect.left) - rect.width / 2) / xRatio;
    let y = ((event.clientY - rect.top) - rect.height / 2) / yRatio;
    return {x: x, y: y};
  }

  componentDidMount() {
    this.updateCanvas();
  }

  componentDidUpdate() {
    this.updateCanvas();
  }

  handleMouseDown(event) {
    let mousePosition = this.getMousePos(event);
    let d1 = Numeric.norm2(Numeric.sub(
      [mousePosition.x, mousePosition.y], [this.state.a, this.state.c]));
    let d2 = Numeric.norm2(Numeric.sub(
      [mousePosition.x, mousePosition.y], [this.state.b, this.state.d]));
    let d3 = Numeric.norm2(Numeric.sub(
      [mousePosition.x, mousePosition.y], [this.state.x, this.state.y]));

    if (Math.min(d1, d2, d3) == d1) {
      this.state.currentCrossHair = 1;
    } else if (Math.min(d1, d2, d3) == d2) {
      this.state.currentCrossHair = 2;
    } else if (Math.min(d1, d2, d3) == d3) {
      this.state.currentCrossHair = 3;
    }

    this.handleMouseMove(event);
  }

  handleMouseUp(event) {
    this.state.currentCrossHair = 0;
  }

  handleMouseMove(event) {
    if (this.state.currentCrossHair != 0) {
      let mousePosition = this.getMousePos(event);

      if (this.state.currentCrossHair == 1) {
        this.state.a = mousePosition.x;
        this.state.c = mousePosition.y;
      } else if (this.state.currentCrossHair == 2) {
        this.state.b = mousePosition.x;
        this.state.d = mousePosition.y;
      } else if (this.state.currentCrossHair == 3) {
        this.state.x = mousePosition.x;
        this.state.y = mousePosition.y;
      }

      this.updateCanvas();
    }
  }

  updateCanvas() {
    let canvas = this.refs.canvas;
    canvas.style.backgroundColor = 'rgba(0, 0, 0, 1)';

    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(this.props.scale, -this.props.scale);

    let mf = [[this.state.a, this.state.b], [this.state.c, this.state.d]];
    let m =
      [
        [
          (1 - this.props.t) + this.props.t * this.state.a,
          this.props.t * this.state.b
        ],
        [
          this.props.t * this.state.c,
          (1 - this.props.t) + this.props.t * this.state.d
        ]
      ];

    // Minor Grid Lines
    ctx.lineWidth = 0.02;
    ctx.strokeStyle = '#212121';

    for (let i = -19.5; i <= 19.5; i++) {
      ctx.beginPath();
      ctx.moveTo(-20, i);
      ctx.lineTo(20, i);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(i, -20);
      ctx.lineTo(i, 20);
      ctx.stroke();
    }


    // Major Grid Lines
    ctx.lineWidth = 0.02;
    ctx.strokeStyle = '#606060';

    for (let i = -20; i <= 20; i++) {
      ctx.beginPath();
      ctx.moveTo(-20, i);
      ctx.lineTo(20, i);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(i, -20);
      ctx.lineTo(i, 20);
      ctx.stroke();
    }


    // Major Grid Lines Transformed
    ctx.lineWidth = 0.04;
    ctx.strokeStyle = '#1fabc3';

    for (let i = -20; i <= 20; i++) {
      ctx.beginPath();
      ctx.moveTo.apply(ctx, Numeric.dot(m, [-20, i]));
      ctx.lineTo.apply(ctx, Numeric.dot(m, [20, i]));
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo.apply(ctx, Numeric.dot(m, [i, -20]));
      ctx.lineTo.apply(ctx, Numeric.dot(m, [i, 20]));
      ctx.stroke();
    }


    // Primary Axis
    ctx.lineWidth = 0.04;
    ctx.strokeStyle = '#ffffff';

    ctx.beginPath();
    ctx.moveTo.apply(ctx, Numeric.dot(m, [-20, 0]));
    ctx.lineTo.apply(ctx, Numeric.dot(m, [20, 0]));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo.apply(ctx, Numeric.dot(m, [0, -20]));
    ctx.lineTo.apply(ctx, Numeric.dot(m, [0, 20]));
    ctx.stroke();


    // iHat Basis vector
    ctx.lineWidth = 0.04;
    ctx.strokeStyle = '#8cbe63';
    ctx.fillStyle = '#8cbe63';

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo.apply(ctx, Numeric.dot(m, [0.8, 0]));
    ctx.lineTo.apply(ctx, Numeric.dot(m, [0.8, 0.1]));
    ctx.lineTo.apply(ctx, Numeric.dot(m, [1, 0]));
    ctx.lineTo.apply(ctx, Numeric.dot(m, [0.8, -0.1]));
    ctx.lineTo.apply(ctx, Numeric.dot(m, [0.8, 0]));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();


    // jHat Basis vector
    ctx.lineWidth = 0.04;
    ctx.strokeStyle = '#ff7c5c';
    ctx.fillStyle = '#ff7c5c';

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo.apply(ctx, Numeric.dot(m, [0, 0.8]));
    ctx.lineTo.apply(ctx, Numeric.dot(m, [0.1, 0.8]));
    ctx.lineTo.apply(ctx, Numeric.dot(m, [0, 1]));
    ctx.lineTo.apply(ctx, Numeric.dot(m, [-0.1, 0.8]));
    ctx.lineTo.apply(ctx, Numeric.dot(m, [0, 0.8]));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();


    // Input vector
    ctx.lineWidth = 0.04;
    ctx.strokeStyle = '#fdfe00';
    ctx.fillStyle = '#fdfe00';

    let tov = Numeric.dot(m, [this.state.x, this.state.y]);
    let tox = tov[0];
    let toy = tov[1];

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(tox, toy);
    ctx.stroke();

    let headlen = 0.2;
    let angle = Math.atan2(toy, tox);

    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox-headlen*Math.cos(angle-Math.PI/7),toy-headlen*Math.sin(angle-Math.PI/7));
    ctx.lineTo(tox-headlen*Math.cos(angle+Math.PI/7),toy-headlen*Math.sin(angle+Math.PI/7));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();


    let crossHairSize = 0.16;
    ctx.lineWidth = 0.04;

    // Transformed iHat crosshair
    ctx.strokeStyle = '#8cbe63';
    ctx.fillStyle = '#8cbe63';

    ctx.beginPath();
    ctx.arc(this.state.a, this.state.c, crossHairSize, 0, 2 * Math.PI, false);
    ctx.moveTo(this.state.a, this.state.c + (crossHairSize / 2));
    ctx.lineTo(this.state.a, this.state.c + (crossHairSize * 3 / 2));
    ctx.moveTo(this.state.a, this.state.c - (crossHairSize / 2));
    ctx.lineTo(this.state.a, this.state.c - (crossHairSize * 3 / 2));
    ctx.moveTo(this.state.a + (crossHairSize / 2), this.state.c);
    ctx.lineTo(this.state.a + (crossHairSize * 3 / 2), this.state.c);
    ctx.moveTo(this.state.a - (crossHairSize / 2), this.state.c);
    ctx.lineTo(this.state.a - (crossHairSize * 3 / 2), this.state.c);
    ctx.stroke();


    // Transformed jHat crosshair
    ctx.strokeStyle = '#ff7c5c';
    ctx.fillStyle = '#ff7c5c';

    ctx.beginPath();
    ctx.arc(this.state.b, this.state.d, crossHairSize, 0, 2 * Math.PI, false);
    ctx.moveTo(this.state.b, this.state.d + (crossHairSize / 2));
    ctx.lineTo(this.state.b, this.state.d + (crossHairSize * 3 / 2));
    ctx.moveTo(this.state.b, this.state.d - (crossHairSize / 2));
    ctx.lineTo(this.state.b, this.state.d - (crossHairSize * 3 / 2));
    ctx.moveTo(this.state.b + (crossHairSize / 2), this.state.d);
    ctx.lineTo(this.state.b + (crossHairSize * 3 / 2), this.state.d);
    ctx.moveTo(this.state.b - (crossHairSize / 2), this.state.d);
    ctx.lineTo(this.state.b - (crossHairSize * 3 / 2), this.state.d);
    ctx.stroke();


    // Transformed input crosshair
    ctx.strokeStyle = '#fdfe00';
    ctx.fillStyle = '#fdfe00';

    ctx.beginPath();
    ctx.arc(this.state.x, this.state.y, crossHairSize, 0, 2 * Math.PI, false);
    ctx.moveTo(this.state.x, this.state.y + (crossHairSize / 2));
    ctx.lineTo(this.state.x, this.state.y + (crossHairSize * 3 / 2));
    ctx.moveTo(this.state.x, this.state.y - (crossHairSize / 2));
    ctx.lineTo(this.state.x, this.state.y - (crossHairSize * 3 / 2));
    ctx.moveTo(this.state.x + (crossHairSize / 2), this.state.y);
    ctx.lineTo(this.state.x + (crossHairSize * 3 / 2), this.state.y);
    ctx.moveTo(this.state.x - (crossHairSize / 2), this.state.y);
    ctx.lineTo(this.state.x - (crossHairSize * 3 / 2), this.state.y);
    ctx.stroke();

    ctx.restore();

    // Output Matrix
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';

    ctx.beginPath();
    ctx.moveTo(15, 10);
    ctx.lineTo(10, 10);
    ctx.lineTo(10, 80);
    ctx.lineTo(15, 80);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(155, 10);
    ctx.lineTo(160, 10);
    ctx.lineTo(160, 80);
    ctx.lineTo(155, 80);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(175, 10);
    ctx.lineTo(170, 10);
    ctx.lineTo(170, 80);
    ctx.lineTo(175, 80);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(235, 10);
    ctx.lineTo(240, 10);
    ctx.lineTo(240, 80);
    ctx.lineTo(235, 80);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(280, 10);
    ctx.lineTo(275, 10);
    ctx.lineTo(275, 80);
    ctx.lineTo(280, 80);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(340, 10);
    ctx.lineTo(345, 10);
    ctx.lineTo(345, 80);
    ctx.lineTo(340, 80);
    ctx.stroke();

    ctx.font = "20pt serif";

    ctx.fillStyle = '#8cbe63';
    ctx.fillText(this.state.a.toFixed(2), 20, 35);
    ctx.fillText(this.state.c.toFixed(2), 20, 75);

    ctx.fillStyle = '#ff7c5c';
    ctx.fillText(this.state.b.toFixed(2), 90, 35);
    ctx.fillText(this.state.d.toFixed(2), 90, 75);

    ctx.fillStyle = '#fdfe00';
    ctx.fillText(this.state.x.toFixed(2), 180, 35);
    ctx.fillText(this.state.y.toFixed(2), 180, 75);

    ctx.fillStyle = '#ffffff';
    ctx.fillText("=", 250, 50);
    let fv = Numeric.dot(mf, [this.state.x, this.state.y]);
    ctx.fillText(fv[0].toFixed(2), 285, 35);
    ctx.fillText(fv[1].toFixed(2), 285, 75);
  }

  render() {
    return <canvas id="matvis" ref="canvas" width={1140} height={640}
                   style={{width: '100%'}}
                   onMouseDown={this.handleMouseDown}
                   onMouseMove={this.handleMouseMove}
                   onMouseUp={this.handleMouseUp} />;
  }
}


class App extends React.Component {
  constructor() {
    super();
    this.state = {t: 0};
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    this.setState({t: event.target.value});
  }

  render() {
    return (
      <div id="mainContainer" className="container">
        <h1>
          <a href="https://youtu.be/kYB8IZa5AuE">
            Linear Transformation Visualizer - Inspired by 3Blue1Brown
          </a>
        </h1>
        <ul>
          <li>Drag the green and red targets to set in the transformed basis vectors.</li>
          <li>Drag the yellow target to set the input vector.</li>
          <li>Drag the t slider to visualize the transformation.</li>
        </ul>
        <CanvasComponent t={this.state.t} scale={60} />
        <ListGroup>
          <ListGroupItem header={"t (" + this.state.t + ")"}>
            <BootstrapSlider min={0} max={1} step={0.01} value={this.state.t}
                             handleChange={this.handleChange} />
          </ListGroupItem>
        </ListGroup>
      </div>
    )
  }
}


ReactDOM.render(<App />, document.getElementById('app'));
