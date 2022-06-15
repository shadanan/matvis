const EPSILON = 0.05;

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
    this.state = {a: 3, c: 0, b: 1, d: 2, x: 1, y: 1, currentCrossHair: 0};
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

  /**
   * Notes on implementation:
   *
   * State object holds:
   * - matrix values (a-d)
   * - vector to be transformed (x, y)
   * - currentCrossHair: Values 0-3
   *    0: No current cross hair, this is reset, whenever mouseUp is called
   *    1: Current cross hair is target for the first base vector [1, 0] (green)
   *    2: Current cross hair is target for the second base vector [0, 1] (red)
   *    3: Current cross hair is origin for the custom in/out vector (yellow)
   *
   *
   */
  handleMouseDown(event) {
    // Find distance to each target from mouse click
    let mousePosition = this.getMousePos(event);
    let d1 = numeric.norm2(numeric.sub(
      [mousePosition.x, mousePosition.y], [this.state.a, this.state.c]));
    let d2 = numeric.norm2(numeric.sub(
      [mousePosition.x, mousePosition.y], [this.state.b, this.state.d]));
    let d3 = this.props.inoutVector ? numeric.norm2(numeric.sub(
      [mousePosition.x, mousePosition.y], [this.state.x, this.state.y])) : Number.MAX_VALUE;

    // Pick the closest target to the mouse click
    if (Math.min(d1, d2, d3) === d1) {
      this.state.currentCrossHair = 1;
    } else if (Math.min(d1, d2, d3) === d2) {
      this.state.currentCrossHair = 2;
    } else if (Math.min(d1, d2, d3) === d3) {
      this.state.currentCrossHair = 3;
    }

    this.handleMouseMove(event);
  }

  handleMouseUp(event) {
    this.state.currentCrossHair = 0;
  }

  handleMouseMove(event) {
    if (this.state.currentCrossHair !== 0) {
      let mousePosition = this.getMousePos(event);

      if (this.props.snapToGrid) {
        let xSnap = Math.round(mousePosition.x * 2) / 2;
        let ySnap = Math.round(mousePosition.y * 2) / 2;

        if (Math.abs(xSnap - mousePosition.x) < EPSILON) {
          mousePosition.x = xSnap;
        }

        if (Math.abs(ySnap - mousePosition.y) < EPSILON) {
          mousePosition.y = ySnap;
        }
      }

      if (this.state.currentCrossHair === 1) {
        this.state.a = mousePosition.x;
        this.state.c = mousePosition.y;
      } else if (this.state.currentCrossHair === 2) {
        this.state.b = mousePosition.x;
        this.state.d = mousePosition.y;
      } else if (this.state.currentCrossHair === 3) {
        this.state.x = mousePosition.x;
        this.state.y = mousePosition.y;
      }

      this.updateCanvas();
    }
  }

  updateCanvas() {
    let canvas = this.refs.canvas;
    let det = this.state.a * this.state.d - this.state.c * this.state.b;
    let detText = det.toFixed(2);
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


    // Determinant
    if (this.props.determinant) {
      if (numeric.det(m) < 0) {
        ctx.strokeStyle = '#fd00fe';
        ctx.fillStyle = 'rgba(253, 0, 254, 0.5)';
      } else {
        ctx.strokeStyle = '#fdfe00';
        ctx.fillStyle = 'rgba(253, 254, 0, 0.5)';
      }
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo.apply(ctx, numeric.dot(m, [1, 0]));
      ctx.lineTo.apply(ctx, numeric.dot(m, [1, 1]));
      ctx.lineTo.apply(ctx, numeric.dot(m, [0, 1]));
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    }


    // Eigen vectors
    if (this.props.eigenvectors && this.props.t > 0) {
      let evs = numeric.eig(m);

      // Only show real eigenvectors
      if (evs.E.y == undefined) {
        let ev1 = [evs.lambda.x[0] * evs.E.x[0][0], evs.lambda.x[0] * evs.E.x[1][0]];
        let ev2 = [evs.lambda.x[1] * evs.E.x[0][1], evs.lambda.x[1] * evs.E.x[1][1]];

        let oldLineWidth = ctx.lineWidth;
        ctx.lineWidth = 0.01;

        ctx.strokeStyle = '#ffc181';
        ctx.fillStyle = '#ffc181';
        for (let i = -20; i <= 20; i++) {
          if (i == 0) continue;
          arrow(ctx, 0, 0, i * ev1[0], i * ev1[1], 0.2);
          arrow(ctx, 0, 0, i * ev2[0], i * ev2[1], 0.2);
        }

        ctx.lineWidth = oldLineWidth;
      }
    }


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


    // Input/Output vector
    if (this.props.inoutVector) {
      ctx.strokeStyle = '#fdfe00';
      ctx.fillStyle = '#fdfe00';
      let tov = numeric.dot(m, [this.state.x, this.state.y]);
      arrow(ctx, 0, 0, tov[0], tov[1], 0.2);

      // Input Crosshair
      ctx.strokeStyle = '#fdfe00';
      ctx.fillStyle = '#fdfe00';
      crosshair(ctx, this.state.x, this.state.y, 0.16);
    }


    // Transformed iHat crosshair
    ctx.strokeStyle = '#8cbe63';
    ctx.fillStyle = '#8cbe63';
    crosshair(ctx, this.state.a, this.state.c, 0.16);

    // Transformed jHat crosshair
    ctx.strokeStyle = '#ff7c5c';
    ctx.fillStyle = '#ff7c5c';
    crosshair(ctx, this.state.b, this.state.d, 0.16);

    ctx.restore();
    ctx.fillStyle = '#000000';
    let infoBgExtension = this.props.determinant ? 50 : 0;
    ctx.fillRect(0,0,360,90 + infoBgExtension);

    // Output Matrix
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';

    let fv = numeric.dot(mf, [this.state.x, this.state.y]);

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

    let fv1Text = fv[0].toFixed(2);
    let fv2Text = fv[1].toFixed(2);
    let resultWidth = Math.max(fv1Text.length, fv2Text.length);
    let xOffset = resultWidth * 2.5;
    ctx.beginPath();
    ctx.moveTo(340 + xOffset, 10);
    ctx.lineTo(345 + xOffset, 10);
    ctx.lineTo(345 + xOffset, 80);
    ctx.lineTo(340 + xOffset, 80);
    ctx.stroke();

    ctx.font = "20pt serif";

    ctx.fillStyle = '#fdfe00';
    if (this.props.determinant) ctx.fillText("Determinant: " + detText, 20, 120);

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
    ctx.fillText(fv1Text, 285, 35);
    ctx.fillText(fv2Text, 285, 75);
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

    this.state = {
      t: 0,
      inoutVector: false,
      determinant: false,
      eigenvectors: false,
      snapToGrid: false
    };

    this.handleChange = this.handleChange.bind(this);
    this.toggleInoutVector = this.toggleInoutVector.bind(this);
    this.toggleDeterminant = this.toggleDeterminant.bind(this);
    this.toggleEigenvectors = this.toggleEigenvectors.bind(this);
    this.toggleSnapToGrid = this.toggleSnapToGrid.bind(this);
  }

  handleChange(event) {
    this.setState({t: event.target.value});
  }

  toggleInoutVector(event) {
    this.setState({inoutVector: event.target.checked});
  }

  toggleDeterminant(event) {
    this.setState({determinant: event.target.checked});
  }

  toggleEigenvectors(event) {
    this.setState({eigenvectors: event.target.checked});
  }

  toggleSnapToGrid(event) {
    this.setState({snapToGrid: event.target.checked});
  }

  render() {
    return (
      <div id="mainContainer" className="container">
        <h4>
          <a href="https://youtu.be/kYB8IZa5AuE">
            Linear Transformation Visualizer - Inspired by 3Blue1Brown
          </a>
        </h4>

        <ReactBootstrap.Panel>
          <CanvasComponent
            t={this.state.t}
            inoutVector={this.state.inoutVector}
            determinant={this.state.determinant}
            eigenvectors={this.state.eigenvectors}
            snapToGrid={this.state.snapToGrid}
            scale={60} />

          <ReactBootstrap.Form horizontal>
            <ReactBootstrap.Col componentClass={ReactBootstrap.ControlLabel} sm={1}>
              t: ({this.state.t})
            </ReactBootstrap.Col>
            <ReactBootstrap.Col sm={11}>
              <ReactBootstrap.FormControl type="range" min={0} max={1} step={0.01}
                value={this.state.t} onChange={this.handleChange} />
            </ReactBootstrap.Col>

            <ReactBootstrap.Col sm={3}>
              <ReactBootstrap.Checkbox checked={this.state.inoutVector}
                onChange={this.toggleInoutVector}> Show In/Out Vector</ReactBootstrap.Checkbox>
            </ReactBootstrap.Col>
            <ReactBootstrap.Col sm={2}>
              <ReactBootstrap.Checkbox checked={this.state.determinant}
                onChange={this.toggleDeterminant}> Show Determinant</ReactBootstrap.Checkbox>
            </ReactBootstrap.Col>
            <ReactBootstrap.Col sm={2}>
              <ReactBootstrap.Checkbox checked={this.state.eigenvectors}
                onChange={this.toggleEigenvectors}> Show Eigenvectors</ReactBootstrap.Checkbox>
            </ReactBootstrap.Col>
            <ReactBootstrap.Col sm={2}>
              <ReactBootstrap.Checkbox checked={this.state.snapToGrid}
                onChange={this.toggleSnapToGrid}> Snap to Grid</ReactBootstrap.Checkbox>
            </ReactBootstrap.Col>
          </ReactBootstrap.Form>
        </ReactBootstrap.Panel>

        <h4>Instructions</h4>
        <ul>
          <li>Drag the green and red targets to set in the transformed basis vectors.</li>
          <li>Drag the t slider to visualize the transformation.</li>
          <li>Enable the In/Out Vector to show a vector and its corresponding visualization.</li>
          <li>Enable the Determinant to show the determinant in the visualization.</li>
          <li>Enable the Eigenvectors to show the eigenvectors in the visualization.</li>
        </ul>
      </div>
    )
  }
}


ReactDOM.render(<App />, document.getElementById('app'));
