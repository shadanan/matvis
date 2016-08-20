function arrow(ctx, x1, y1, x2, y2, s) {
  let a = Math.atan2(y2 - y1, x2 - x1);

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2-0.8*s*Math.cos(a), y2-0.8*s*Math.sin(a));
  ctx.lineTo(x2-s*Math.cos(a-Math.PI/7),y2-s*Math.sin(a-Math.PI/7));
  ctx.lineTo(x2, y2);
  ctx.lineTo(x2-s*Math.cos(a+Math.PI/7),y2-s*Math.sin(a+Math.PI/7));
  ctx.lineTo(x2-0.8*s*Math.cos(a), y2-0.8*s*Math.sin(a));
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
}

function crosshair(ctx, x, y, s) {
  ctx.beginPath();
  ctx.arc(x, y, s, 0, 2 * Math.PI, false);
  ctx.moveTo(x, y + (s / 2));
  ctx.lineTo(x, y + (s * 3 / 2));
  ctx.moveTo(x, y - (s / 2));
  ctx.lineTo(x, y - (s * 3 / 2));
  ctx.moveTo(x + (s / 2), y);
  ctx.lineTo(x + (s * 3 / 2), y);
  ctx.moveTo(x - (s / 2), y);
  ctx.lineTo(x - (s * 3 / 2), y);
  ctx.stroke();
}

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
    let self = this;
    let canvas = this.refs.canvas;

    canvas.addEventListener("touchstart", function(touchEvent) {
      let mouseEvent = new MouseEvent("mousedown", {
        clientX: touchEvent.touches[0].clientX,
        clientY: touchEvent.touches[0].clientY,
      });
      self.handleMouseDown(mouseEvent);
    }, false);

    canvas.addEventListener("touchend", function(touchEvent) {
      let mouseEvent = new MouseEvent("mouseup", {});
      self.handleMouseUp(mouseEvent);
    }, false);

    canvas.addEventListener("touchmove", function(touchEvent) {
      let mouseEvent = new MouseEvent("mousemove", {
        clientX: touchEvent.touches[0].clientX,
        clientY: touchEvent.touches[0].clientY,
      });
      self.handleMouseMove(mouseEvent);
    }, false);

    // Prevent scrolling when touching the canvas
    document.body.addEventListener("touchstart", function (e) {
      if (e.target == canvas) {
        e.preventDefault();
      }
    }, false);
    document.body.addEventListener("touchend", function (e) {
      if (e.target == canvas) {
        e.preventDefault();
      }
    }, false);
    document.body.addEventListener("touchmove", function (e) {
      if (e.target == canvas) {
        e.preventDefault();
      }
    }, false);

    this.updateCanvas();
  }

  componentDidUpdate() {
    this.updateCanvas();
  }

  handleMouseDown(event) {
    let mousePosition = this.getMousePos(event);
    let d1 = numeric.norm2(numeric.sub(
      [mousePosition.x, mousePosition.y], [this.state.a, this.state.c]));
    let d2 = numeric.norm2(numeric.sub(
      [mousePosition.x, mousePosition.y], [this.state.b, this.state.d]));
    let d3 = numeric.norm2(numeric.sub(
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

    ctx.lineWidth = 0.02;

    // Minor Grid Lines
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


    ctx.lineWidth = 0.04;

    // Major Grid Lines Transformed
    ctx.strokeStyle = '#1fabc3';

    for (let i = -20; i <= 20; i++) {
      ctx.beginPath();
      ctx.moveTo.apply(ctx, numeric.dot(m, [-20, i]));
      ctx.lineTo.apply(ctx, numeric.dot(m, [20, i]));
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo.apply(ctx, numeric.dot(m, [i, -20]));
      ctx.lineTo.apply(ctx, numeric.dot(m, [i, 20]));
      ctx.stroke();
    }


    // Primary Axis
    ctx.strokeStyle = '#ffffff';

    ctx.beginPath();
    ctx.moveTo.apply(ctx, numeric.dot(m, [-20, 0]));
    ctx.lineTo.apply(ctx, numeric.dot(m, [20, 0]));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo.apply(ctx, numeric.dot(m, [0, -20]));
    ctx.lineTo.apply(ctx, numeric.dot(m, [0, 20]));
    ctx.stroke();


    // iHat Basis vector
    ctx.strokeStyle = '#8cbe63';
    ctx.fillStyle = '#8cbe63';
    let iHat = numeric.dot(m, [1, 0]);
    arrow(ctx, 0, 0, iHat[0], iHat[1], 0.2);

    // jHat Basis vector
    ctx.strokeStyle = '#ff7c5c';
    ctx.fillStyle = '#ff7c5c';
    let jHat = numeric.dot(m, [0, 1]);
    arrow(ctx, 0, 0, jHat[0], jHat[1], 0.2);

    // Input vector
    ctx.strokeStyle = '#fdfe00';
    ctx.fillStyle = '#fdfe00';
    let tov = numeric.dot(m, [this.state.x, this.state.y]);
    arrow(ctx, 0, 0, tov[0], tov[1], 0.2);


    // Transformed iHat crosshair
    ctx.strokeStyle = '#8cbe63';
    ctx.fillStyle = '#8cbe63';
    crosshair(ctx, this.state.a, this.state.c, 0.16);

    // Transformed jHat crosshair
    ctx.strokeStyle = '#ff7c5c';
    ctx.fillStyle = '#ff7c5c';
    crosshair(ctx, this.state.b, this.state.d, 0.16);

    // Transformed input crosshair
    ctx.strokeStyle = '#fdfe00';
    ctx.fillStyle = '#fdfe00';
    crosshair(ctx, this.state.x, this.state.y, 0.16);

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
    let fv = numeric.dot(mf, [this.state.x, this.state.y]);
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
        <ReactBootstrap.ListGroup>
          <ReactBootstrap.ListGroupItem header={"t (" + this.state.t + ")"}>
            <input type="range" min={0} max={1} step={0.01} value={this.state.t}
                   onChange={this.handleChange} />
          </ReactBootstrap.ListGroupItem>
        </ReactBootstrap.ListGroup>
      </div>
    )
  }
}


ReactDOM.render(<App />, document.getElementById('app'));
